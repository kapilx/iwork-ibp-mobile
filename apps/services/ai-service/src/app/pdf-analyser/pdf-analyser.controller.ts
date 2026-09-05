import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { PdfAnalyserService } from "./pdf-analyser.service";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import {
  AzureKeyCredential,
  SearchClient,
  SearchIndexClient,
} from "@azure/search-documents";
import { SearchDocument } from "./interfaces/pdf-analyser.interface";
import { v4 as uuidv4 } from "uuid";
import { ConfigService } from "@nestjs/config";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { plainToInstance } from "class-transformer";
import { PDFQuestionRequestDto } from "./dtos/cover.dto";
import { validate } from "class-validator";
import { extractValidationErrors } from "../common/utils/class-validator";
import {
  uploadPdfDocumentSwaggerMetadata,
  answerQuestionsFromPdfSwaggerMetadata,
  extractPolicyConfiguratorSwaggerMetadata,
  extractPolicyDetailsSwaggerMetadata,
} from '../ai-service.swagger';
import { ORG_FIELD_CONFIGS } from './pdf-analyser.service';
import { AZURE_CONSTANTS, ORG_KEYS, S3_PREFIXES } from './constants/pdf-analyser.constants';
@Controller("pdf-analyser")
export class PdfAnalyserController {
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    private readonly pdfAnalyserService: PdfAnalyserService,
    private readonly configService: ConfigService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
  }

  @uploadPdfDocumentSwaggerMetadata()
  @Post("/upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query("company") company: string,
    @Query("policyDetails") policyDetails: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PdfAnalyserController',
        method: 'uploadDocument',
        messageData: 'method invoked',
      }),
    });

    const searchEndPoint = this.configService.get<string>("openAi.searchEndPoint");
    const searchKey = this.configService.get<string>("openAi.searchKey");
    const indexClient = new SearchIndexClient(
      searchEndPoint || "",
      new AzureKeyCredential(searchKey as string))
    const searchIndexName = this.configService.get<string>("openAi.searchIndexName");
    await indexClient.deleteIndex(AZURE_CONSTANTS.STALE_INDEX_NAME);

    const searchClient = new SearchClient<SearchDocument>(
      searchEndPoint as string,
      searchIndexName as string,
      new AzureKeyCredential(searchKey as string)
    );
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'PdfAnalyserController',
          method: 'uploadDocument',
          payload: { file: file?.originalname },
          messageData: 'processing',
        }),
      });

      if (!file) {
        this.logger.error("No file uploaded");
        throw new BadRequestException("No file uploaded");
      }

      this.logger.debug("Uploaded file details: ", {
        originalName: file.originalname,
        path: file.path,
        size: file.size,
      });

      try {
        const originalFileName = file.originalname;
        const documentId = uuidv4();

        this.logger.debug("Generated document ID: ", documentId);

        const analyzeResult =
          await this.pdfAnalyserService.processDocumentWithDocumentIntelligence(
            file.path
          );

        this.logger.debug("Document analysis result: ", analyzeResult);

        // Ensure search index exists
        await this.pdfAnalyserService.createSearchIndexIfNotExists(
          indexClient,
          this.configService.get<string>("openAi.searchIndexName") as string
        );

        this.logger.debug("Search index ensured.");

        // Index document
        await this.pdfAnalyserService.indexDocumentIntelligenceResults(
          searchClient,
          analyzeResult,
          originalFileName,
          file.path,
          documentId
        );

        this.logger.debug("Document indexed successfully.");

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const extractionOptions = {
          company: company === "true",
          policyDetails: policyDetails === "true",
        };

        this.logger.debug("Extraction options: ", extractionOptions);

        const insuranceData =
          await this.pdfAnalyserService.extractInsuranceData(
            documentId,
            searchClient,
            extractionOptions
          );

        this.logger.debug("Extracted insurance data: ", insuranceData);

        const responseData: any = {
          success: true,
          data: {}
        };
        const documentInfo = {
          id: documentId,
          fileName: originalFileName,
          pageCount: analyzeResult.pages?.length || 0,
          contentPreview: analyzeResult.content
            ? analyzeResult.content.substring(0, 200) + "..."
            : "No content extracted",
        };
        responseData.data.documentInfo = documentInfo

        if (extractionOptions.company) {
          responseData.data.companyInfo = {
            insurerDetails: insuranceData.insurerDetails,
            insuredDetails: insuranceData.insuredDetails,
          };
        } else if (extractionOptions.policyDetails) {
          responseData.data.policyDetails = insuranceData.policyDetails;
          responseData.data.beneficiaryDetails = insuranceData.beneficiaryDetails;
        } else {
          responseData.data.insuranceData = insuranceData;
        }

        this.logger.debug("Response data before deletion: ", responseData.data);

        await this.pdfAnalyserService.deleteDocumentById(documentId);
        responseData.data.documentDeleted = true;

        this.logger.debug("Document deleted successfully.");

        res.status(200).json(responseData);
      } catch (error) {
        this.logger.error({
          level: 'error',
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: 'failure',
            location: 'PdfAnalyserController',
            method: 'uploadDocument',
            messageData: error,
          }),
        });
        res.status(500).json({
          success: false,
          error: "Error processing upload",
        });
      }
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'PdfAnalyserController',
          method: 'uploadDocument',
          messageData: error,
        }),
      });
      res.status(500).json({
        success: false,
        error: "Error processing upload",
      });
    }
  }

  @answerQuestionsFromPdfSwaggerMetadata()
  @Post("/cover")
  @UseInterceptors(FileInterceptor("file"))
  async answerQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Body('data') data: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    console.log("Received data:", data, typeof data);
    const parsedData = JSON.parse(data);
    console.log("Parsed data:", parsedData, typeof parsedData);
    const pdfQuestionsReq = plainToInstance(PDFQuestionRequestDto, parsedData);

    const errors = await validate(pdfQuestionsReq, {
      enableDebugMessages: true,
    });

    if (errors.length > 0) {
      this.logger.error("Validation errors: ", errors);
      res.status(400).json({
        message: "Validation failed",
        errors: extractValidationErrors(errors),
      });
      return;
    }

    const searchEndPoint = this.configService.get<string>(
      "openAi.searchEndPoint"
    );
    const searchKey = this.configService.get<string>("openAi.searchKey");
    const indexClient = new SearchIndexClient(
      searchEndPoint || "",
      new AzureKeyCredential(searchKey as string)
    );
    const searchIndexName = this.configService.get<string>(
      "openAi.searchIndexName"
    );
    await indexClient.deleteIndex(AZURE_CONSTANTS.STALE_INDEX_NAME);

    const searchClient = new SearchClient<SearchDocument>(
      searchEndPoint as string,
      searchIndexName as string,
      new AzureKeyCredential(searchKey as string)
    );
    try {
      this.logger.debug("Request Headers: ", req.headers);
      this.logger.debug("Request Body: ", req.body);
      this.logger.debug("Uploaded File: ", file);
      this.logger.debug("Starting uploadDocument execution...");

      if (!file) {
        this.logger.error("No file uploaded");
        console.log("No file uploaded");
        throw new BadRequestException("No file uploaded");
      }

      this.logger.debug("Uploaded file details: ", {
        originalName: file.originalname,
        path: file.path,
        size: file.size,
      });

      const originalFileName = file.originalname;
      const documentId = uuidv4();
      const userId = parseInt(req?.headers?.userid);
      // Use S3 key as documentPath for indexing
      const s3Key = `${S3_PREFIXES.COVERS}${userId || 'unknown'}_${Date.now()}_${originalFileName}`;

      this.logger.debug("Generated document ID: ", documentId);
      const analyzeResult =
        await this.pdfAnalyserService.processDocumentWithDocumentIntelligence(
          file,
          userId
        );

      this.logger.debug("Document analysis result: ", analyzeResult);
      // Ensure search index exists
      await this.pdfAnalyserService.createSearchIndexIfNotExists(
        indexClient,
        this.configService.get<string>("openAi.searchIndexName") as string
      );

      this.logger.debug("Search index ensured.");

      // Index document
      await this.pdfAnalyserService.indexDocumentIntelligenceResults(
        searchClient,
        analyzeResult,
        originalFileName,
        s3Key, // Use S3 key as documentPath
        documentId
      );

      this.logger.debug("Document indexed successfully.");
      console.log("Document indexed successfully.");

      // No local file to delete, so skip fs.unlink

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call the new service method to answer questions
      console.log("Calling answerQuestionsFromDocument with:", {
        documentId,
        questions: pdfQuestionsReq.questions,
      });
      var answers = await this.pdfAnalyserService.answerQuestionsFromDocument(
        documentId,
        searchClient,
        pdfQuestionsReq.questions
      );
      console.log("Answers received:", answers);

      // Optionally delete the indexed document after answering
      await this.pdfAnalyserService.deleteDocumentById(documentId);
      console.log("Document deleted from index:", documentId);

      res.status(200).json({
        success: true,
        data: { answers: answers, documentDeleted: true },
      });
      console.log("Response sent with answers");
    } catch (error: any) {
      this.logger.error("Error in answerQuestions:", error);
      console.log("Error in answerQuestions:", error);
      res.status(500).json({
        success: false,
        error: error && error.message ? error.message : "Internal server error",
      });
    }
  }

  @extractPolicyConfiguratorSwaggerMetadata()
  @Post("/policy-configurator")
  @UseInterceptors(FileInterceptor("file"))
  async extractPolicyConfigurator(
    @UploadedFile() file: Express.Multer.File,
    @Query("policyId") policyIdParam: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const policyId = policyIdParam ? parseInt(policyIdParam, 10) : NaN;
    if (isNaN(policyId)) {
      res.status(400).json({ success: false, error: "policyId query param is required and must be a valid number" });
      return;
    }

    const searchEndPoint = this.configService.get<string>("openAi.searchEndPoint");
    const searchKey = this.configService.get<string>("openAi.searchKey");
    const searchIndexName = this.configService.get<string>("openAi.searchIndexName");

    const indexClient = new SearchIndexClient(
      searchEndPoint || "",
      new AzureKeyCredential(searchKey as string)
    );
    const searchClient = new SearchClient<SearchDocument>(
      searchEndPoint as string,
      searchIndexName as string,
      new AzureKeyCredential(searchKey as string)
    );

    try {
      const originalFileName = file.originalname;
      const documentId = uuidv4();
      const userId = parseInt((req as any).headers?.userid || '0');

      const analyzeResult = await this.pdfAnalyserService.processDocumentWithDocumentIntelligence(file, userId);

      await this.pdfAnalyserService.createSearchIndexIfNotExists(indexClient, searchIndexName as string);

      const s3Key = `${S3_PREFIXES.POLICY_CONFIGURATOR}${userId || "unknown"}_${Date.now()}_${originalFileName}`;
      await this.pdfAnalyserService.indexDocumentIntelligenceResults(
        searchClient,
        analyzeResult,
        originalFileName,
        s3Key,
        documentId
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await this.pdfAnalyserService.extractPolicyConfigurationFromDocument(
        documentId,
        searchClient,
        userId,
        originalFileName,
        policyId,
      );

      await this.pdfAnalyserService.deleteDocumentById(documentId);

      if (result.extractionStatus !== 'FAILED' && Object.keys(result.policyConfiguration).length > 0) {
        await this.pdfAnalyserService.upsertPolicyConfiguration(policyId, result.policyConfiguration, {
          documentId,
          fileName: originalFileName,
          userId,
        });
      }

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      this.logger.error("Error in extractPolicyConfigurator:", error);
      res.status(500).json({
        success: false,
        error: error && error.message ? error.message : "Internal server error",
      });
    }
  }

  @extractPolicyDetailsSwaggerMetadata()
  @Post("/policy-details")
  @UseInterceptors(FileInterceptor("file"))
  async extractPolicyDetails(
    @UploadedFile() file: Express.Multer.File,
    @Query("opportunityActivityId") opportunityActivityIdParam: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const opportunityActivityId = opportunityActivityIdParam ? parseInt(opportunityActivityIdParam, 10) : NaN;
    if (isNaN(opportunityActivityId)) {
      res.status(400).json({ success: false, error: "opportunityActivityId query param is required and must be a valid number" });
      return;
    }

    const searchEndPoint = this.configService.get<string>("openAi.searchEndPoint");
    const searchKey = this.configService.get<string>("openAi.searchKey");
    const searchIndexName = this.configService.get<string>("openAi.searchIndexName");

    const indexClient = new SearchIndexClient(
      searchEndPoint || "",
      new AzureKeyCredential(searchKey as string)
    );
    const searchClient = new SearchClient<SearchDocument>(
      searchEndPoint as string,
      searchIndexName as string,
      new AzureKeyCredential(searchKey as string)
    );

    try {
      const originalFileName = file.originalname;
      const documentId = uuidv4();
      const userId = parseInt((req as any).headers?.userid || '0');

      const analyzeResult = await this.pdfAnalyserService.processDocumentWithDocumentIntelligence(file, userId);

      await this.pdfAnalyserService.createSearchIndexIfNotExists(indexClient, searchIndexName as string);

      const s3Key = `${S3_PREFIXES.POLICY_DETAILS}${userId || "unknown"}_${Date.now()}_${originalFileName}`;
      await this.pdfAnalyserService.indexDocumentIntelligenceResults(
        searchClient,
        analyzeResult,
        originalFileName,
        s3Key,
        documentId
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const organisationKey = await this.pdfAnalyserService.resolveOrganisationKey(opportunityActivityId);

      const extracted = await this.pdfAnalyserService.extractPolicyDetailsFromDocument(documentId, searchClient, organisationKey);

      await this.pdfAnalyserService.deleteDocumentById(documentId);

      const placementSlipActivityId = await this.pdfAnalyserService.resolvePlacementSlipActivityId(opportunityActivityId);
      const dbRecord = placementSlipActivityId
        ? await this.pdfAnalyserService.getPlacementSlipFieldsForComparison(placementSlipActivityId, organisationKey)
        : null;

      const FIELD_KEYS = ORG_FIELD_CONFIGS[organisationKey]?.fieldKeys
        ?? ORG_FIELD_CONFIGS[ORG_KEYS.IIRM_INDIA].fieldKeys;

      const fields: Record<string, { extracted: any; db_value: any; is_matched: boolean }> = {};
      const mismatches: string[] = [];

      for (const key of FIELD_KEYS) {
        if (key === 'policy_number') {
          fields[key] = { extracted: extracted[key] ?? null, db_value: null, is_matched: true };
          continue;
        }

        const extractedVal = extracted[key] ?? 0;
        const dbVal = dbRecord ? (dbRecord[key] ?? null) : null;

        const numA = parseFloat(String(extractedVal));
        const numB = parseFloat(String(dbVal));
        let isMatched: boolean;
        if (!isNaN(numA) && !isNaN(numB)) {
          isMatched = Math.abs(numA - numB) < 0.01;
        } else {
          isMatched = String(extractedVal).trim().toLowerCase() === String(dbVal ?? '').trim().toLowerCase();
        }

        fields[key] = { extracted: extractedVal, db_value: dbVal, is_matched: isMatched };
        if (!isMatched) mismatches.push(key);
      }

      const message = mismatches.length > 0
        ? `Mismatch found in: ${mismatches.join(', ')}`
        : '';

      res.status(200).json({ success: true, data: { fields, message } });
    } catch (error: any) {
      this.logger.error("Error in extractPolicyDetails:", error);
      res.status(500).json({
        success: false,
        error: error && error.message ? error.message : "Internal server error",
      });
    }
  }
}
