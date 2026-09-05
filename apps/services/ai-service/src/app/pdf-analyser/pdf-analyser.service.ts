import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { AiExtractedPolicyConfigurationRecord } from "../../../../service-lib/src/lib/entities/ai-extracted-policy-configuration-record.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyConfiguration } from "../../../../service-lib/src/lib/entities/policy-configuration.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { OpportunityPlacementSlipGeneration } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-generation.entity";
import { OpportunityActivityMap } from "../../../../service-lib/src/lib/entities/opportunity-activity-map.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";
import {
  AnalyzeResult,
  DocumentPage,
  DocumentTable,
  InsuranceDocumentData,
  SearchDocument,
} from "./interfaces/pdf-analyser.interface";
import DocumentIntelligence, {
  isUnexpected,
  getLongRunningPoller,
} from "@azure-rest/ai-document-intelligence";
import {
  SearchIndexClient,
  SearchIndex,
  SearchField,
  SearchClient,
  AzureKeyCredential,
} from "@azure/search-documents";
import path from "path";
import { AzureOpenAI } from "openai";
import * as AWS from "aws-sdk";
import { AZURE_SEARCH_INDEX_FIELDS } from "./constants/searchIndexFeilds";
import {
  ACTIVITY_NAMES,
  AZURE_CONSTANTS,
  EXTRACTION_STATUS,
  LOOKUP_KEYS,
  ORG_KEYS,
  POLICY_CONFIG_REMARKS,
  S3_PREFIXES,
} from "./constants/pdf-analyser.constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { DataType, PDFQuestionRequest, Question, QuestionAnswer, QuestionType } from "./interfaces/cover.interface";

export const ORG_FIELD_CONFIGS: Record<string, { fieldKeys: string[]; nullDefault: Record<string, null> }> = {
  [ORG_KEYS.IIRM_INDIA]: {
    fieldKeys: ['policy_number', 'sum_insured', 'basic_premium', 'net_premium', 'gst_percentage', 'gst_amount', 'fee', 'other_amount', 'total_premium'],
    nullDefault: { policy_number: null, sum_insured: null, basic_premium: null, net_premium: null, gst_percentage: null, gst_amount: null, fee: null, other_amount: null, total_premium: null },
  },
  [ORG_KEYS.IIRM_KENYA]: {
    fieldKeys: ['policy_number', 'sum_insured', 'basic_premium', 'net_premium', 'gst_percentage', 'gst_amount', 'fee', 'other_amount', 'total_premium'],
    nullDefault: { policy_number: null, sum_insured: null, basic_premium: null, net_premium: null, gst_percentage: null, gst_amount: null, fee: null, other_amount: null, total_premium: null },
  },
  [ORG_KEYS.IIRM_SRILANKA]: {
    fieldKeys: ['policy_number', 'basic_premium', 'srcc_amount', 'net_premium', 'admin_charges', 'other_amount', 'cess_amount', 'fee', 'gst_percentage', 'gst_amount', 'total_premium'],
    nullDefault: { policy_number: null, basic_premium: null, srcc_amount: null, net_premium: null, admin_charges: null, other_amount: null, cess_amount: null, fee: null, gst_percentage: null, gst_amount: null, total_premium: null },
  },
};


@Injectable()
export class PdfAnalyserService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";

  constructor(
    private readonly configService: ConfigService,
    private readonly traceIdService: TraceIdService,
    @InjectRepository(AiExtractedPolicyConfigurationRecord)
    private readonly extractionAuditRepository: Repository<AiExtractedPolicyConfigurationRecord>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyConfiguration)
    private readonly policyConfigurationRepository: Repository<PolicyConfiguration>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(OpportunityPlacementSlipGeneration)
    private readonly placementSlipRepository: Repository<OpportunityPlacementSlipGeneration>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
    AWS.config.update({
          accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
          region: process.env.S3_AWS_REGION,
        });
        this.s3 = new AWS.S3();
  }

  async processDocumentWithDocumentIntelligence(
    filePath: Express.Multer.File,
    userId: number,
  ): Promise<AnalyzeResult> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PdfAnalyserService',
        method: 'processDocumentWithDocumentIntelligence',
        payload: { },
        messageData: 'method invoked',
      }),
    });
    try {
      this.logger.log('Creating Document Intelligence client...');

      const intelligenceEndpoint = this.configService.get<string>(
        "openAi.intelligenceEndpoint"
      ) || "";
      const intelligenceKey = this.configService.get<string>(
        "openAi.intelligenceKey"
      ) || "";

      if (!intelligenceEndpoint || !intelligenceKey) {
        throw new Error(
          "Document Intelligence credentials are missing in environment variables"
        );
      }

      this.logger.log(`Using endpoint: ${intelligenceEndpoint}`);
      const client = DocumentIntelligence(intelligenceEndpoint, {
        key: intelligenceKey,
      });

      this.logger.log(`Processing document: ${filePath}`);

      // Read the file content as Base64
      this.logger.log("Reading file as base64...");
      const fileName = `${userId}_${Date.now()}_${filePath.originalname}`;
      const key = `${S3_PREFIXES.COVERS}${fileName}`;
      const uploadResult = await this.s3
  .putObject({ Bucket: this.bucket, Key: key, Body: filePath.buffer })
  .promise();
console.log("File uploaded to S3:", uploadResult);
if (!uploadResult || uploadResult.$response.error) {
  throw new Error("File upload to S3 failed.");
}
const base64Source = filePath.buffer.toString("base64");
      this.logger.log(`File encoded to base64 (${base64Source.length} characters)`);

      // Process the document using Document Intelligence API
      this.logger.log("Sending request to Document Intelligence API...");
      const initialResponse = await client
        .path("/documentModels/{modelId}:analyze", AZURE_CONSTANTS.DOCUMENT_MODEL_ID)
        .post({
          contentType: "application/json",
          body: {
            base64Source: base64Source,
          },
        });

      this.logger.log("Initial response received:", initialResponse.status);

      if (isUnexpected(initialResponse)) {
        this.logger.error(
          "Unexpected response:",
          JSON.stringify(initialResponse.body)
        );
        throw new Error(
          `API returned unexpected response: ${initialResponse.status}`
        );
      }

      this.logger.log("Starting polling for result...");
      const poller = getLongRunningPoller(client, initialResponse);
      this.logger.log("Waiting for document analysis to complete...");
      const result = await poller.pollUntilDone();

      this.logger.log("Document processing completed successfully");
      // Type assertion for the result
      const analyzeResult = result.body as any;
      return analyzeResult.analyzeResult as AnalyzeResult;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'PdfAnalyserService',
          method: 'processDocumentWithDocumentIntelligence',
          messageData: err,
        }),
      });
      throw err;
    }
  }

  async createSearchIndexIfNotExists(
    indexClient: SearchIndexClient,
    indexName: string
  ): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PdfAnalyserService',
        method: 'createSearchIndexIfNotExists',
        payload: { indexName },
        messageData: 'method invoked',
      }),
    });
    try {
      // Check if index exists
      const indexNames: string[] = [];
      for await (const index of indexClient.listIndexes()) {
        indexNames.push(index.name);
      }

      if (indexNames.includes(indexName)) {
        // await indexClient.deleteIndex(indexName);
        this.logger.log(`Index '${indexName}' already exists`);
        return;
      }

      // Create the index with fields for Document Intelligence data
      const index: SearchIndex = {
        name: indexName,
        fields: AZURE_SEARCH_INDEX_FIELDS as SearchField[],
      };

      await indexClient.createIndex(index);
      this.logger.log(`Created index '${indexName}'`);
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'PdfAnalyserService',
          method: 'createSearchIndexIfNotExists',
          messageData: err,
        }),
      });
      throw err;
    }
  }

  tableToString(table: DocumentTable, content: string): string {
    try {
      // Create a 2D array to represent the table
      const rowCount = table.rowCount;
      const columnCount = table.columnCount;
      const grid: string[][] = Array(rowCount)
        .fill(null)
        .map(() => Array(columnCount).fill(""));

      // Fill in cell content
      for (const cell of table.cells) {
        const rowIndex = cell.rowIndex;
        const columnIndex = cell.columnIndex;

        // Check if spans array exists and has elements before accessing
        let cellContent = "";

        // First priority: Get content from spans if available
        if (
          cell.spans &&
          cell.spans.length > 0 &&
          cell.spans[0].offset !== undefined &&
          cell.spans[0].length !== undefined
        ) {
          cellContent = content.substring(
            cell.spans[0].offset,
            cell.spans[0].offset + cell.spans[0].length
          );
        }
        // Second priority: Use cell.content directly if available
        else if (cell.content) {
          cellContent = cell.content;
        }
        // If neither is available, leave as empty string

        if (rowIndex < rowCount && columnIndex < columnCount) {
          grid[rowIndex][columnIndex] = cellContent.trim();
        }
      }

      // Convert to string representation
      let tableString = "";
      for (const row of grid) {
        tableString += "| " + row.join(" | ") + " |\n";
      }

      return tableString;
    } catch (error) {
      this.logger.error("Error converting table to string:", error);
      return "[Table conversion error - content preserved in original document]";
    }
  }

  async indexDocumentIntelligenceResults(
    searchClient: SearchClient<SearchDocument>,
    analyzeResult: AnalyzeResult,
    fileName: string,
    documentPath: string,
    documentId: string
  ): Promise<{ success: boolean; indexedPages: number }> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PdfAnalyserService',
        method: 'indexDocumentIntelligenceResults',
        payload: { fileName },
        messageData: 'method invoked',
      }),
    });
    try {
      this.logger.log(`Indexing document: ${fileName}`);

      // Extract content
      const content = analyzeResult.content || "";
      const pages = analyzeResult.pages || [];
      const languages = analyzeResult.languages || [];
      const tables = analyzeResult.tables || [];

      // Determine main language
      const mainLanguage =
        languages.length > 0 ? languages[0].locale : "unknown";

      // Process tables to string format for indexing
      const tableStrings = tables.map((table: DocumentTable) =>
        this.tableToString(table, content)
      );

      // Create document batches for indexing - one document per page for better search granularity
      const documentsToIndex: SearchDocument[] = [];

      // Add overall document
      documentsToIndex.push({
        id: documentId,
        documentId: documentId,
        fileName: fileName,
        content: content,
        pageCount: pages.length,
        pageNumber: 0, // 0 indicates it's the full document
        pageContent: content,
        paragraphs: [],
        documentPath: documentPath,
        uploadDate: new Date().toISOString(),
        language: mainLanguage,
        documentType: path.extname(fileName).replace(".", "").toUpperCase(),
        tables: tableStrings,
      });

      // Create a map of tables by page number
      const tablesByPage: Record<number, string[]> = {};
      for (const table of tables) {
        // Get the page number from the table's bounding regions
        const pageNumber = table.boundingRegions?.[0]?.pageNumber || 1;

        if (!tablesByPage[pageNumber]) {
          tablesByPage[pageNumber] = [];
        }

        tablesByPage[pageNumber].push(this.tableToString(table, content));
      }

      // Add each page as a separate document for better search
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as DocumentPage;
        const pageNumber = page.pageNumber;

        // Extract page content from paragraphs
        const paragraphs = page.paragraphs || [];
        const paragraphContents = paragraphs.map((p) => p.content || "");
        const pageContent = paragraphContents.join(" ");

        // Get tables for this page
        const pageTables = tablesByPage[pageNumber] || [];

        // Create a unique ID for the page
        const pageId = `${documentId}-page-${pageNumber}`;

        documentsToIndex.push({
          id: pageId,
          documentId: documentId,
          fileName: fileName,
          content: "", // Leave empty as we're focusing on page-specific content
          pageCount: pages.length,
          pageNumber: pageNumber,
          pageContent: pageContent,
          paragraphs: paragraphContents,
          documentPath: documentPath,
          uploadDate: new Date().toISOString(),
          language: mainLanguage,
          documentType: path.extname(fileName).replace(".", "").toUpperCase(),
          tables: pageTables,
        });
      }

      // Upload documents to the search index
      const batchSize = 10; // Process in small batches to avoid hitting limits
      let indexedPages = 0;

      for (let i = 0; i < documentsToIndex.length; i += batchSize) {
        const batch = documentsToIndex.slice(i, i + batchSize);
        const result = await searchClient.uploadDocuments(batch);

        this.logger.log(`Indexed batch of ${result.results.length} documents`);
        indexedPages += result.results.length;
      }

      this.logger.log(`Successfully indexed document with ${indexedPages} pages`);
      return {
        success: true,
        indexedPages: indexedPages,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'PdfAnalyserService',
          method: 'indexDocumentIntelligenceResults',
          messageData: err,
        }),
      });
      throw err;
    }
  }

  async deleteDocumentById(documentId: string): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PdfAnalyserService',
        method: 'deleteDocumentById',
        payload: { documentId },
        messageData: 'method invoked',
      }),
    });
    const searchEndPoint = this.configService.get<string>(
      "openAi.searchEndPoint");
    const searchIndexName = this.configService.get<string>(
      "openAi.searchIndexName");
    const searchKey = this.configService.get<string>(
      "openAi.searchKey");

    const searchClient = new SearchClient<SearchDocument>(
      searchEndPoint || "",
      searchIndexName || "",
      new AzureKeyCredential(searchKey || "")
    );
    this.logger.log(`Deleting document with ID: ${documentId}`);

    // First, delete the main document with exact ID match
    const mainDocToDelete: Array<Pick<SearchDocument, "id">> = [
      { id: documentId },
    ];

    try {
      await searchClient.deleteDocuments(
        mainDocToDelete as unknown as SearchDocument[]
      );
      this.logger.log(`Deleted main document with ID: ${documentId}`);
    } catch (mainDocError) {
      this.logger.warn(
        `Main document with ID ${documentId} not found or could not be deleted`
      );
    }

    // Find and delete page documents
    const allDocsSearchOptions = {
      top: 1000,
      select: ["id"] as const,
    };

    const allDocsResults = await searchClient.search("*", allDocsSearchOptions);

    const pageIdsToDelete: Array<Pick<SearchDocument, "id">> = [];
    const pagePrefix = `${documentId}-page-`;

    for await (const result of allDocsResults.results) {
      const id = result.document.id;
      if (typeof id === "string" && id.startsWith(pagePrefix)) {
        pageIdsToDelete.push({ id });
      }
    }

    if (pageIdsToDelete.length > 0) {
      await searchClient.deleteDocuments(
        pageIdsToDelete as unknown as SearchDocument[]
      );
      this.logger.log(
        `Deleted ${pageIdsToDelete.length} page documents related to document ID: ${documentId}`
      );
    }
  }

  containsCompanyInfo(content: string): boolean {
    const companyKeywords = [
      "insurer",
      "company",
      "provider",
      "insured",
      "address",
      "contact",
      "email",
      "phone",
      "website",
      "street",
      "city",
      "state",
      "zip",
    ];

    return companyKeywords.some((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  containsPolicyInfo(content: string): boolean {
    const policyKeywords = [
      "policy",
      "coverage",
      "premium",
      "deductible",
      "beneficiary",
      "benefits",
      "exclusion",
      "effective date",
      "expiration",
      "claim",
      "rider",
      "sum insured",
      "total sum",
      "coverage limit",
      "policy limit",
      "maximum benefit",
      "policy maximum",
    ];

    return policyKeywords.some((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  async extractInsuranceData(
    documentId: string,
    searchClient: SearchClient<SearchDocument>,
    extractionOptions?: { company?: boolean; policyDetails?: boolean }
  ): Promise<InsuranceDocumentData> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PdfAnalyserService',
        method: 'extractInsuranceData',
        payload: { documentId, extractionOptions },
        messageData: 'method invoked',
      }),
    });

    // Determine what data to extract based on options
    const extractCompanyInfo =
      !extractionOptions || extractionOptions?.company || false;
    const extractPolicyInfo =
      !extractionOptions || extractionOptions?.policyDetails || false;

    // Build a targeted search query based on what we need to extract
    let searchQuery = "";
    if (extractCompanyInfo && extractPolicyInfo) {
      searchQuery = "*"; // Get everything if both are needed
    } else if (extractCompanyInfo) {
      searchQuery =
        "insurer OR company OR provider OR organization OR name OR insured OR address OR contact"; // Focus on company-related terms
    } else if (extractPolicyInfo) {
      searchQuery =
        'policy OR coverage OR premium OR deductible OR "sum insured" OR limit OR "coverage limit" OR benefit'; // Focus on policy-related terms
    } else {
      searchQuery = "*"; // Fallback to get everything if no options specified
    }

    // Build a focused extraction prompt based on what we need
    let extractionPromptStructure = `
    interface InsuranceDocumentData {`;

    if (extractCompanyInfo) {
      extractionPromptStructure += `
      insurerDetails: {
        companyName: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
        contactInfo?: {
          phoneNumber?: string;
          personalEmail?: string;
          workEmail?: string;
          website?: string;
        };
      };
      insuredDetails: {
        companyName: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
        contactInfo?: {
          phoneNumber?: string;
          personalEmail?: string;
          workEmail?: string;
        };
      };`;
    } else {
      // Include empty objects for schema compatibility
      extractionPromptStructure += `
      insurerDetails: {};
      insuredDetails: {};`;
    }

    if (extractPolicyInfo) {
      extractionPromptStructure += `
      policyDetails: {
        policyNumber?: string;
        effectiveDate?: string;
        expirationDate?: string;
        totalSumInsured?: {
          amount?: string;
          currency?: string;
        };
        premium?: {
          amount?: string;
          frequency?: string;
        };
        coverageDetails?: string[];
        benefits?: string[];
        deductibles?: {
          description?: string;
          amount?: string;
        }[];
        exclusions?: string[];
        conditions?: string[];
        claimsProcess?: string;
      };
      beneficiaryDetails?: {
        name?: string;
        relationship?: string;
        contactInfo?: string;
      }[];`;
    } else {
      // Include empty objects for schema compatibility
      extractionPromptStructure += `
      policyDetails: {};
      beneficiaryDetails?: [];`;
    }

    // Close the interface
    extractionPromptStructure += `
    }`;

    // Create the final prompt with specific extraction instructions
    const extractionPrompt = `
    Analyze this insurance document and extract the following information in a structured format exactly matching this TypeScript interface:
    
    ${extractionPromptStructure}

    ${extractCompanyInfo
        ? "Focus on extracting detailed company and insured information."
        : ""
      }
    ${extractPolicyInfo
        ? 'Focus on extracting detailed policy coverage, benefits, total sum insured, and beneficiary information. The total sum insured represents the maximum coverage amount for the policy and may be listed as "sum insured", "coverage limit", "policy limit", "maximum benefit", or similar terms. Benefits are specific advantages or services provided by the policy.'
        : ""
      }
    ${!extractCompanyInfo && !extractPolicyInfo
        ? "Extract all available insurance information."
        : ""
      }

    IMPORTANT: Return ONLY a valid JSON object with no additional text, markdown formatting, or code blocks.
    The response should strictly conform to the interface above. Use null or empty arrays for missing information.
    I need to directly parse your response with JSON.parse(), so it must be valid JSON only.
  `;

    // Search for the document content with more targeted filters
    const searchOptions = {
      includeTotalCount: true,
      top: 10,
      filter: `id eq '${documentId}' or documentId eq '${documentId}'`,
      // Remove searchFields parameter as it's causing the error
    };

    const searchResults = await searchClient.search(searchQuery, searchOptions);

    // Collect relevant document content
    let documentContent = "";
    for await (const result of searchResults.results) {
      const doc = result.document;

      if (doc.pageNumber === 0) {
        documentContent += (doc.content || "") + "\n\n";
      } else {
        documentContent += (doc.pageContent || "") + "\n\n";
      }

      // Only include table content if relevant to our extraction needs
      if (doc.tables && doc.tables.length > 0) {
        const tableContent = doc.tables.join("\n\n");
        if (
          (extractCompanyInfo && this.containsCompanyInfo(tableContent)) ||
          (extractPolicyInfo && this.containsPolicyInfo(tableContent)) ||
          (!extractCompanyInfo && !extractPolicyInfo)
        ) {
          documentContent += "Tables in document:\n" + tableContent + "\n\n";
        }
      }
    }

    if (!documentContent) {
      throw new Error("No document content found");
    }

    // Query Azure OpenAI with the extraction prompt
    const messages = [
      {
        role: "system" as const,
        content: `You are a specialized insurance document analyzer that extracts structured information from insurance documents. ${extractCompanyInfo
            ? "You excel at identifying company and insured party details."
            : ""
          } ${extractPolicyInfo
            ? "You excel at identifying policy terms, coverage details, total sum insured, and beneficiary information."
            : ""
          } You only respond with valid JSON objects. Never use markdown code blocks, backticks, or any other formatting. Your entire response must be a valid JSON object and nothing else.
        Never use '', "unknown", "null", "N/A", etc as values. Use null for missing values.`
      },
      {
        role: "user" as const,
        content: `Here is an insurance document content:\n\n${documentContent}\n\n${extractionPrompt}`,
      },
    ];
    const modelEndpoint = this.configService.get<string>(
      "openAi.endpoint");
    const apiKey = this.configService.get<string>(
      "openAi.apiKey");
    const apiVersion = this.configService.get<string>(
      "openAi.apiVersion");
    const deploymentName = this.configService.get<string>(
      "openAi.deploymentName"
    );

    const client = new AzureOpenAI({
      endpoint: modelEndpoint || "",
      apiKey: apiKey || "",
      apiVersion: apiVersion || "",
    });

    const response = await client.chat.completions.create({
      messages,
      max_tokens: 8000,
      temperature: 0.2,
      top_p: 1,
      model: deploymentName || "",
    });

    // Parse and validate the JSON response
    try {
      // Get the response content
      let responseContent = response.choices[0].message.content || "{}";

      // Clean the response from markdown code blocks or other formatting
      if (responseContent.includes("```")) {
        const match = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          responseContent = match[1].trim();
        } else {
          responseContent = responseContent.replace(/```/g, "");
        }
      }

      responseContent = responseContent.trim();

      const jsonResponse = JSON.parse(responseContent);
      console.log("beneficiaryDetails %o <<<<.beneficiaryDetails>>>>>>", jsonResponse.beneficiaryDetails);
      // Create a base response object with default empty values
      const baseResponse: InsuranceDocumentData = {
        insurerDetails: {
          companyName: null,
          address: {},
          contactInfo: {},
        },
        insuredDetails: {
          companyName: null,
          address: {},
          contactInfo: {},
        },
        policyDetails: {},
        beneficiaryDetails: [],
      };

      // Selectively validate and populate parts of the response based on extraction options
      if (extractCompanyInfo) {
        baseResponse.insurerDetails = {
          companyName: jsonResponse.insurerDetails?.companyName || null,
          address: {
            street:
              jsonResponse.insurerDetails?.address?.street || null,
            city: jsonResponse.insurerDetails?.address?.city || null,
            state: jsonResponse.insurerDetails?.address?.state || null,
            postalCode:
              jsonResponse.insurerDetails?.address?.postalCode || null,
            country: jsonResponse.insurerDetails?.address?.country || null,
          },
          contactInfo: {
            phoneNumber: jsonResponse.insurerDetails?.contactInfo?.phoneNumber || null,
            workEmail: jsonResponse.insurerDetails?.contactInfo?.workEmail || null,
            personalEmail: jsonResponse.insurerDetails?.contactInfo?.personalEmail || null,
            website: jsonResponse.insurerDetails?.contactInfo?.website || null,
          },
        };

        baseResponse.insuredDetails = {
          companyName: jsonResponse.insuredDetails?.companyName || null,
          address: {
            street:
              jsonResponse.insuredDetails?.address?.street || null,
            city: jsonResponse.insuredDetails?.address?.city || null,
            state: jsonResponse.insuredDetails?.address?.state || null,
            postalCode:
              jsonResponse.insuredDetails?.address?.postalCode || null,
            country: jsonResponse.insuredDetails?.address?.country || null,
          },
          contactInfo: {
            phoneNumber: jsonResponse.insuredDetails?.contactInfo?.phoneNumber || null,
            personalEmail: jsonResponse.insuredDetails?.contactInfo?.personalEmail || null,
            workEmail: jsonResponse.insuredDetails?.contactInfo?.workEmail || null,
          },
        };
      }

      if (extractPolicyInfo) {
        baseResponse.policyDetails = {
          policyNumber: jsonResponse.policyDetails?.policyNumber || null,
          effectiveDate: jsonResponse.policyDetails?.effectiveDate || null,
          expirationDate: jsonResponse.policyDetails?.expirationDate || null,
          totalSumInsured: {
            amount: jsonResponse.policyDetails?.totalSumInsured?.amount || null,
            currency:
              jsonResponse.policyDetails?.totalSumInsured?.currency || null,
          },
          premium: {
            amount: jsonResponse.policyDetails?.premium?.amount || null,
            frequency: jsonResponse.policyDetails?.premium?.frequency || null,
          },
          coverageDetails: Array.isArray(
            jsonResponse.policyDetails?.coverageDetails
          )
            ? jsonResponse.policyDetails.coverageDetails
            : [],
          benefits: Array.isArray(jsonResponse.policyDetails?.benefits)
            ? jsonResponse.policyDetails.benefits
            : [],
          deductibles: Array.isArray(jsonResponse.policyDetails?.deductibles)
            ? jsonResponse.policyDetails.deductibles.map((d: any) => ({
              description: d?.description || null,
              amount: d?.amount || null,
            }))
            : [],
          exclusions: Array.isArray(jsonResponse.policyDetails?.exclusions)
            ? jsonResponse.policyDetails.exclusions
            : [],
          conditions: Array.isArray(jsonResponse.policyDetails?.conditions)
            ? jsonResponse.policyDetails.conditions
            : [],
          claimsProcess: jsonResponse.policyDetails?.claimsProcess || null,
        };
        baseResponse.beneficiaryDetails = Array.isArray(
          jsonResponse.beneficiaryDetails
        )
          ? jsonResponse.beneficiaryDetails.map((b: any) => ({
            name: b?.name || null,
            relationship: b?.relationship || null,
            contactInfo: b?.contactInfo || null,
          }))
          : [];
      }

      this.logger.log(
        "Successfully extracted and validated structured insurance data"
      );
      return baseResponse;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'PdfAnalyserService',
          method: 'extractInsuranceData',
          messageData: error,
        }),
      });
      this.logger.error("Raw response:", response.choices[0].message.content);
      throw new Error("Failed to parse structured insurance data");
    }
  }


  /**
   * Analyze the indexed document and answer the provided questions using Azure OpenAI.
   */
  async answerQuestionsFromDocument(
    documentId: string,
    searchClient: SearchClient<SearchDocument>,
    questions: PDFQuestionRequest["questions"]
  ): Promise<object | { error: string }> {
    this.logger.log(
      `Answering questions for document ${documentId} with ${questions.length} questions`
    );
    // Search for the document content
    const searchOptions = {
      includeTotalCount: true,
      top: 10,
      filter: `id eq '${documentId}' or documentId eq '${documentId}'`,
    };

    const searchResults = await searchClient.search("*", searchOptions);

    // Collect relevant document content
    let documentContent = "";
    for await (const result of searchResults.results) {
      const doc = result.document;
      if (doc.pageNumber === 0) {
        documentContent += (doc.content || "") + "\n\n";
      } else {
        documentContent += (doc.pageContent || "") + "\n\n";
      }
      if (doc.tables && doc.tables.length > 0) {
        documentContent +=
          "Tables in document:\n" + doc.tables.join("\n\n") + "\n\n";
      }
    }
    if (!documentContent) {
      throw new Error("No document content found for answering questions");
    }

    // Batch processing: send only 10 questions per OpenAI request, using Promise.allSettled for concurrency
    const batchSize = 10;
    const questionBatches: Question[][] = [];
    for (let i = 0; i < questions.length; i += batchSize) {
      questionBatches.push(questions.slice(i, i + batchSize));
    }
    const modelEndpoint = this.configService.get<string>("openAi.endpoint");
    const apiKey = this.configService.get<string>("openAi.apiKey");
    const apiVersion = this.configService.get<string>("openAi.apiVersion");
    const deploymentName = this.configService.get<string>(
      "openAi.deploymentName"
    );

    const client = new AzureOpenAI({
      endpoint: modelEndpoint || "",
      apiKey: apiKey || "",
      apiVersion: apiVersion || "",
    });

    const batchPromises = questionBatches.map((batchQuestions, batchIdx) => {
      // Build a detailed prompt for each question in the batch
      const questionsPrompt = batchQuestions
        .map((q, idx) => {
          let optionsText = "";
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            optionsText = `\nOptions: [${q.options.join(", ")}]`;
          }

          const questionPrompt = `**Question ${idx + 1}**:
                - questionKey: "${q.key}"
                - type: "${q.type}"
                - question: "${q.label}"
                ${optionsText}

                `;

          return questionPrompt;
        })
        .join("\n\n");

      const prompt = `
      You are an expert at reading insurance documents and answering questions based on their content. 
      Given the following document content and questions, answer each question as accurately as possible using only the information in the document. 
      If the answer is not present, return null.

      **Document Content**:
      ${documentContent}
      
      **Questions**:
        ${questionsPrompt}
      Questons are in the following format:
        - questionKey : Each question has a UNIQUE KEY for identification, use the same key in your answer.
        - question : The question to be answered.
        - type : The type of question mcq or text or number or date(DD/MM/YYYY).
        - options (Optional - for mcq): The options for the question, if applicable.
    
      If the question is a mcq, make sure the answer is one of the options provided. Don't return true/false if options are ["Yes","No"], return "Yes" or "No" instead.
      If the question is a text, number or date, return the answer in the same format as the question.
      If the answer is not present in the document, return null.

      **IMPORTANT**: 
        - Return your answers as a valid JSON array of objects, each object with the following structure:
          {
            "questionKey": string (This is the unique key for the question),
            "answer": string | boolean | number | string[] | Date | null
          }
        - Do not include any extra text, markdown, or code blocks. Only return the valid JSON.
        - Never return '', "undefined", "unknown", "N/A", "null", etc.. as answer. Use null instead.
      `;

      const messages = [
        {
          role: "system" as const,
          content: `You are an insurance document analyser. Respond with valid JSON as instructed.
            Never use markdown code blocks, backticks, or any other formatting. Your entire response must be a valid JSON object and nothing else.`,
        },
        {
          role: "user" as const,
          content: prompt,
        },
      ];

      console.log(
        `[questions] Sending batch ${batchIdx + 1}/
        } to OpenAI with ${batchQuestions.length} questions  ${batchQuestions}`
      );

      console.log(`[Batch] ${batchIdx + 1} [Prompt] ${prompt}`);
      return client.chat.completions
        .create({
          messages,
          max_tokens: 4000,
          temperature: 0.2,
          top_p: 1,
          model: deploymentName || "",
        })
        .then((response) => {
          let responseContent = response.choices[0].message.content || "[]";
          if (responseContent.includes("```")) {
            const match = responseContent.match(
              /```(?:json)?\s*([\s\S]*?)\s*```/
            );
            if (match && match[1]) {
              responseContent = match[1].trim();
            } else {
              responseContent = responseContent.replace(/```/g, "");
            }
          }
          responseContent = responseContent.trim();
          console.log(
            "[answers] Batch %s OpenAI response:",
            batchIdx + 1,
            responseContent.slice(0, 200)
          );
          const answers = JSON.parse(responseContent);
          return Array.isArray(answers) ? answers : [];
        })
        .catch((error) => {
          this.logger.error("Error parsing answers JSON:", error);
          console.error(
            "[answerQuestionsFromDocument] Error in batch %s:",
            batchIdx + 1,
            error
          );
          return {
            success: false,
            error: "Failed to parse answers JSON",
          };
        });
    });

    const settledResults = await Promise.allSettled(batchPromises);


    const allAnswers: any[] = [];
    for (const result of settledResults) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allAnswers.push(...result.value);
      }
    }
    // Ensure each answer matches the QuestionAnswer interface
    // For each answer, find the corresponding question from the original questions array by questionKey
    const formattedAnswers: QuestionAnswer[] = allAnswers.map((ans) => {
      const matchedQuestion: Question | undefined = questions.find(
        (q) => q.key === ans?.questionKey
      );
      if (!matchedQuestion) {
        this.logger.warn(
          `No matching question found for answer with key: ${ans?.questionKey}`
        );
      }
      const answer = matchedQuestion ? this.validateAnswerByType(matchedQuestion, ans.answer) : null;
      return {
        [ans.questionKey]: answer ?? null,
      } as QuestionAnswer;
    });

    const mergedAnswers: Record<string, any> = {};
    for (const ans of formattedAnswers) {
      Object.assign(mergedAnswers, ans);
    }
    return mergedAnswers;
  }

  /**
   * Validate the answer based on the question type.
   */
  validateAnswerByType(question: Question, answer: any): any {
    if (answer === null || answer === undefined) return null;

    switch (question.type) {
      case QuestionType.SELECT:
        if (!Array.isArray(question.options) || question.options.length === 0)
          return null;

        const normalize = (val: any): string => {
          if (val instanceof Date) return val.toISOString().toLowerCase();
          return String(val).trim().toLowerCase();
        };
        if (
          typeof answer === "string" ||
          typeof answer === "boolean" ||
          typeof answer === "number" ||
          answer instanceof Date
        ) {
          const normAns = normalize(answer);
          const matched = question.options.find(
            (opt) => normalize(opt) === normAns
          );
          return matched !== undefined ? matched : null;
        }
        return null;

      case QuestionType.NUMBER:
        if (typeof answer === DataType.NUMBER && !isNaN(answer)) return answer;

        if (typeof answer === DataType.STRING) {
          // Remove commas and non-digit except dot
          const numStr = answer.replace(/[^0-9.]/g, "");
          const parsed = Number(numStr);
          return !isNaN(parsed) ? parsed : null;
        }
        return null;
      case QuestionType.TEXT:
      case QuestionType.TEXT_AREA:
        if (typeof answer === DataType.STRING && answer.trim().length > 0)
          return answer.trim();
        if (typeof answer === DataType.NUMBER) return answer.toString();
        return null;
      default:
        return null;
    }
  }

  // ========== Policy Configurator AI Extraction ==========

  async extractPolicyConfigurationFromDocument(
    documentId: string,
    searchClient: SearchClient<SearchDocument>,
    userId?: number,
    fileName?: string,
    policyId?: number,
  ): Promise<{ policyConfiguration: object; warnings: string[]; extractionStatus: string; message?: string }> {
    // Fetch document content from Azure Search
    const searchOptions = {
      includeTotalCount: true,
      top: 10,
      filter: `id eq '${documentId}' or documentId eq '${documentId}'`,
    };
    const searchResults = await searchClient.search('*', searchOptions);
    let documentContent = '';
    for await (const result of searchResults.results) {
      const doc = result.document;
      if (doc.pageNumber === 0) {
        documentContent += (doc.content || '') + '\n\n';
      } else {
        documentContent += (doc.pageContent || '') + '\n\n';
      }
      if (doc.tables && doc.tables.length > 0) {
        documentContent += 'Tables in document:\n' + doc.tables.join('\n\n') + '\n\n';
      }
    }

    if (!documentContent) {
      await this.saveExtractionAuditRecord({
        documentId,
        fileName: fileName || '',
        userId,
        policyId,
        extractionStatus: EXTRACTION_STATUS.FAILED,
        extractedConfiguration: {},
        stageResults: {},
        failureReason: 'No document content found in search index',
        warnings: [],
      });
      return {
        policyConfiguration: {},
        warnings: [],
        extractionStatus: EXTRACTION_STATUS.FAILED,
        message: 'Could not extract a valid policy configuration from the provided document. The document may not contain sufficient policy structure. Please configure manually.',
      };
    }

    const client = new AzureOpenAI({
      endpoint: this.configService.get<string>('openAi.endpoint') || '',
      apiKey: this.configService.get<string>('openAi.apiKey') || '',
      apiVersion: this.configService.get<string>('openAi.apiVersion') || '',
    });
    const deploymentName = this.configService.get<string>('openAi.deploymentName') || '';

    // Run stages 1, 2, 4, 6 in parallel; stage 3 needs stage 1 result
    const [s1, s2, s4, s6] = await Promise.allSettled([
      this.extractStage1Components(documentContent, client, deploymentName),
      this.extractStage2Relationships(documentContent, client, deploymentName),
      this.extractStage4Parameters(documentContent, client, deploymentName),
      this.extractStage6Constraints(documentContent, client, deploymentName),
    ]);

    const components: any[] = s1.status === 'fulfilled' ? s1.value.result : [];
    const relationships: any = s2.status === 'fulfilled'
      ? s2.value.result
      : { enabledPolicyRelations: [], familyMaxPolicyLevel: '0' };
    const parameters: any[] = s4.status === 'fulfilled' ? s4.value.result : [];
    const constraints: any = s6.status === 'fulfilled' ? s6.value.result : this.defaultConstraints();

    const s1Failed = s1.status === 'rejected' || (s1.status === 'fulfilled' && s1.value.failed);
    const s2Failed = s2.status === 'rejected' || (s2.status === 'fulfilled' && s2.value.failed);
    const s4Failed = s4.status === 'rejected' || (s4.status === 'fulfilled' && s4.value.failed);
    const s6Failed = s6.status === 'rejected' || (s6.status === 'fulfilled' && s6.value.failed);

    const s3Result = await this.extractStage3Template(documentContent, client, deploymentName, components).catch(() => ({
      result: { basePolicy: { mainPolicyId: components.find((c: any) => c.type === 'base')?.id || '', addonIds: [] } },
      failed: true,
    }));
    const policyTemplate: any = s3Result.result;
    const s3Failed = s3Result.failed;

    const skeletonOptions = this.generateStage5Skeleton(components, parameters);
    const s5Result = await this.extractStage5Premiums(documentContent, client, deploymentName, skeletonOptions, components).catch(() => ({
      result: skeletonOptions,
      failed: true,
    }));
    const policyOptions: any[] = s5Result.result;
    const s5Failed = s5Result.failed;

    const stageResults = {
      stage1: s1Failed ? 'failed' : 'ok',
      stage2: s2Failed ? 'failed' : 'ok',
      stage3: s3Failed ? 'failed' : 'ok',
      stage4: s4Failed ? 'failed' : 'ok',
      stage5: s5Failed ? 'failed' : 'ok',
      stage6: s6Failed ? 'failed' : 'ok',
    };

    const warnings: string[] = [];
    if (s1Failed) warnings.push('Stage 1 (Components) could not be fully extracted — defaults applied.');
    if (s2Failed) warnings.push('Stage 2 (Relationships) could not be extracted — defaults applied.');
    if (s3Failed) warnings.push('Stage 3 (Template) could not be extracted — defaults applied.');
    if (s4Failed) warnings.push('Stage 4 (Parameters) could not be extracted — defaults applied.');
    if (s5Failed) warnings.push('Stage 5 (Choices) premiums defaulted to 0 — fill manually in Stage 5.');
    if (s6Failed) warnings.push('Stage 6 (Constraints) could not be extracted — defaults applied.');

    const isValid =
      components.length > 0 &&
      components.some((c: any) => c.type === 'base' && Array.isArray(c.sumInsuredOptions) && c.sumInsuredOptions.length > 0);

    if (!isValid) {
      await this.saveExtractionAuditRecord({
        documentId,
        fileName: fileName || '',
        userId,
        policyId,
        extractionStatus: EXTRACTION_STATUS.FAILED,
        extractedConfiguration: {},
        stageResults,
        failureReason: 'No valid base component with sum insured options found',
        warnings,
      });
      return {
        policyConfiguration: {},
        warnings,
        extractionStatus: EXTRACTION_STATUS.FAILED,
        message: 'Could not extract a valid policy configuration from the provided document. The document may not contain sufficient policy structure. Please configure manually.',
      };
    }

    const policyConfiguration = { components, relationships, policyTemplate, parameters, policyOptions, constraints, selectedLocationIds: []};
    const extractionStatus = warnings.length === 0 ? EXTRACTION_STATUS.SUCCESS : EXTRACTION_STATUS.PARTIAL;

    await this.saveExtractionAuditRecord({
      documentId,
      fileName: fileName || '',
      userId,
      policyId,
      extractionStatus,
      extractedConfiguration: policyConfiguration,
      stageResults,
      warnings,
    });

    return { policyConfiguration, warnings, extractionStatus };
  }

  private async saveExtractionAuditRecord(data: {
    documentId: string;
    fileName: string;
    userId?: number;
    policyId?: number;
    extractionStatus: string;
    extractedConfiguration: object;
    stageResults: object;
    failureReason?: string;
    warnings?: string[];
  }): Promise<void> {
    try {
      const record = this.extractionAuditRepository.create({
        documentId: data.documentId,
        fileName: data.fileName,
        userId: data.userId,
        policyId: data.policyId,
        extractionStatus: data.extractionStatus,
        extractedConfiguration: data.extractedConfiguration,
        stageResults: data.stageResults,
        failureReason: data.failureReason,
        warnings: data.warnings,
      });
      await this.extractionAuditRepository.save(record);
    } catch (err) {
      this.logger.error('Failed to save extraction audit record:', err);
    }
  }

  async upsertPolicyConfiguration(
    policyId: number,
    policyConfiguration: object,
    auditContext: { documentId: string; fileName: string; userId?: number },
  ): Promise<void> {
    const policy = await this.policyRepository.findOne({ where: { id: policyId } as any });
    if (!policy) {
      throw new Error(`Policy with id ${policyId} not found`);
    }

    const draftStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: LOOKUP_KEYS.POLICY_CONFIGURATION_STATUS_DRAFT } as any,
    });
    if (!draftStatus) {
      throw new Error('Lookup POLICY_CONFIGURATION_STATUS_DRAFT not found');
    }

    const existing = await this.policyConfigurationRepository.findOne({
      where: { policyId } as any,
    });

    if (existing) {
      existing.policyConfiguration = policyConfiguration;
      existing.policyStep = 6;
      await this.policyConfigurationRepository.save(existing);
    } else {
      const record = this.policyConfigurationRepository.create({
        companyId: policy.companyId,
        policyTypeLid: policy.policyTypeLid,
        policyId,
        policyConfiguartionStatusLid: draftStatus.id,
        policyStep: 1,
        policyConfiguration,
        remarks: POLICY_CONFIG_REMARKS.AI_EXTRACTED,
        version: 1,
      });
      await this.policyConfigurationRepository.save(record);
    }

    await this.saveExtractionAuditRecord({
      documentId: auditContext.documentId,
      fileName: auditContext.fileName,
      userId: auditContext.userId,
      policyId,
      extractionStatus: EXTRACTION_STATUS.SAVED_TO_POLICY,
      extractedConfiguration: policyConfiguration,
      stageResults: {},
      warnings: [],
    });
  }

  private stripMarkdownFromJson(content: string): string {
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) return match[1].trim();
      return content.replace(/```/g, '').trim();
    }
    return content.trim();
  }

  private async callOpenAI(
    client: AzureOpenAI,
    deploymentName: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });
    return this.stripMarkdownFromJson(response.choices[0].message.content || '[]');
  }

  private async extractStage1Components(
    documentContent: string,
    client: AzureOpenAI,
    deploymentName: string
  ): Promise<{ result: any[]; failed: boolean }> {
    const systemPrompt = 'You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks.';
    const userPrompt = `Analyse the following insurance policy document and extract the policy components.

Component types: "base" (primary coverage, exactly 1), "parental" (parental coverage, max 1), "optional" (add-ons, 0 or more).

Return a JSON array with this shape per element:
[{
  "id": "comp-1",
  "type": "base",
  "label": "Group Medical Cover",
  "sumInsuredModel": "FLAT",
  "siMultipleLabel": "CTC",
  "siMultipleMin": 0,
  "siMultipleMax": 0,
  "sumInsuredOptions": [{"id": 1, "value": "500000"}, {"id": 2, "value": "1000000"}],
  "nextSumInsuredId": 3,
  "showCompanyContribution": true,
  "premiumPerLife": false,
  "proRationEnabled": true,
  "isBenefitComponent": false,
  "acceptRelationsFromParent": false
}]

Rules:
- sumInsuredModel: "FLAT" for fixed amounts, "MULTIPLE" for salary multiples
- isBenefitComponent: true only for waiver/benefit add-ons with SI = 0 (e.g. co-pay waiver)
- sumInsuredOptions values: numeric strings without commas (e.g. "500000")
- id: unique strings like "comp-1"; nextSumInsuredId = last SI id + 1
- Return ONLY the JSON array.

Document:
${documentContent}`;

    try {
      const raw = await this.callOpenAI(client, deploymentName, systemPrompt, userPrompt);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return { result: [], failed: true };
      return { result: parsed, failed: false };
    } catch {
      return { result: [], failed: true };
    }
  }

  private async extractStage2Relationships(
    documentContent: string,
    client: AzureOpenAI,
    deploymentName: string
  ): Promise<{ result: any; failed: boolean }> {
    const systemPrompt = 'You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks.';
    const userPrompt = `Analyse the insurance policy document and extract relationship/dependent eligibility rules.

Return a JSON object:
{
  "enabledPolicyRelations": [
    {
      "type": "Self",
      "enabled": true,
      "maxCount": "1",
      "configuredOptions": [{ "name": "Self", "enabled": true, "minAge": "18", "maxAge": "65" }]
    }
  ],
  "familyMaxPolicyLevel": "6"
}

Relation categories: Self, Spouse/Partner, Children, Parents, Siblings.
Sub-categories: Self→["Self"], Spouse/Partner→["Husband","Wife","Spouse","Partner","Same-sex Spouse","Same-sex Partner"],
Children→["Son","Daughter","Child"], Parents→["Father","Mother","Mother-in-law","Father-in-law","Parent"],
Siblings→["Brother","Sister","Sibling"].

Rules:
- maxCount MUST always be a numeric string (e.g. "1", "2", "4"). NEVER use "unlimited", "N/A", or any non-numeric value. If no limit is stated, use "99".
- minAge MUST always be a numeric string. If not found in the document, use "0".
- maxAge MUST always be a numeric string. If not found in the document, use "99".

Include only relation types explicitly covered. Return ONLY the JSON object.

Document:
${documentContent}`;

    try {
      const raw = await this.callOpenAI(client, deploymentName, systemPrompt, userPrompt);
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.enabledPolicyRelations)) {
        return { result: { enabledPolicyRelations: [], familyMaxPolicyLevel: '0' }, failed: true };
      }

      // Sanitize maxCount and minAge/maxAge to ensure no "unlimited" or non-numeric values
      parsed.enabledPolicyRelations = parsed.enabledPolicyRelations.map((rel: any) => {
        const sanitizeCount = (val: any, fallback: string) => {
          const str = String(val ?? '').trim();
          return /^\d+$/.test(str) ? str : fallback;
        };
        const sanitizeAge = (val: any, fallback: string) => {
          const str = String(val ?? '').trim();
          return /^\d+$/.test(str) ? str : fallback;
        };
        return {
          ...rel,
          maxCount: sanitizeCount(rel.maxCount, '99'),
          configuredOptions: Array.isArray(rel.configuredOptions)
            ? rel.configuredOptions.map((opt: any) => ({
                ...opt,
                minAge: sanitizeAge(opt.minAge, '0'),
                maxAge: sanitizeAge(opt.maxAge, '99'),
              }))
            : rel.configuredOptions,
        };
      });

      return { result: parsed, failed: false };
    } catch {
      return { result: { enabledPolicyRelations: [], familyMaxPolicyLevel: '0' }, failed: true };
    }
  }

  private async extractStage3Template(
    documentContent: string,
    client: AzureOpenAI,
    deploymentName: string,
    components: any[]
  ): Promise<{ result: any; failed: boolean }> {
    const baseComp = components.find((c: any) => c.type === 'base');
    const parentalComp = components.find((c: any) => c.type === 'parental');
    const componentSummary = JSON.stringify(
      components.map((c: any) => ({ id: c.id, label: c.label, type: c.type }))
    );

    const systemPrompt = 'You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks.';
    const userPrompt = `Given the components and document, determine the policy template mapping.

Components: ${componentSummary}

Return a JSON object:
{
  "basePolicy": {
    "mainPolicyId": "${baseComp?.id || 'comp-1'}",
    "provisionPolicyNumber": "",
    "insurerPolicyNumber": "",
    "iirmPolicyNumber": "",
    "eligibleRelations": ["Self","Spouse/Partner","Children"],
    "clubSumInsured": false,
    "addonIds": [
      {
        "optionId": "<optional-comp-id>",
        "sequence": 1,
        "provisionPolicyNumber": "",
        "insurerPolicyNumber": "",
        "iirmPolicyNumber": "",
        "eligibleRelations": ["Self","Spouse/Partner","Children"]
      }
    ]
  }${parentalComp ? `,
  "parentalPolicy": {
    "mainPolicyId": "${parentalComp.id}",
    "provisionPolicyNumber": "",
    "insurerPolicyNumber": "",
    "iirmPolicyNumber": "",
    "eligibleRelations": ["Parents"],
    "clubSumInsured": false,
    "addonIds": []
  }` : ''}
}

Rules:
- Eligible relations for parentalPolicy must only include parent-category types
- Extract policy numbers if present; otherwise leave as ""
- Return ONLY the JSON object.

Document:
${documentContent}`;

    try {
      const raw = await this.callOpenAI(client, deploymentName, systemPrompt, userPrompt);
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.basePolicy) {
        return {
          result: { basePolicy: { mainPolicyId: baseComp?.id || '', addonIds: [] } },
          failed: true,
        };
      }
      return { result: parsed, failed: false };
    } catch {
      return {
        result: { basePolicy: { mainPolicyId: baseComp?.id || '', addonIds: [] } },
        failed: true,
      };
    }
  }

  private async extractStage4Parameters(
    documentContent: string,
    client: AzureOpenAI,
    deploymentName: string
  ): Promise<{ result: any[]; failed: boolean }> {
    const systemPrompt = 'You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks.';
    const userPrompt = `Analyse the insurance policy document and extract parameters that drive premium variation.

Supported types: Age (range), Gender (list), Grade (range), "Marital Status" (list), Designation (list),
"Relationship Group" (relation), "Custom List" (list), "Custom Range" (range), "Dependent Count" (dependent-count).

Example shapes:
Range: { "id":"param-1","parameterMasterName":"Age","type":"range","displayName":"Employee Age","applyToDependents":false,"rangeDetails":[{"id":"r-1","rangeDisplayName":"Band 1","min":"0","max":"35"}],"nextRangeDetailId":2,"lovDetails":[],"nextLovDetailId":1,"relationGroupDetails":[],"nextRelationGroupDetailId":1 }
List: { "id":"param-2","parameterMasterName":"Gender","type":"list","displayName":"Gender","applyToDependents":false,"rangeDetails":[],"nextRangeDetailId":1,"lovDetails":[{"id":"lov-1","value":"Male","isDefault":true},{"id":"lov-2","value":"Female","isDefault":false}],"nextLovDetailId":3,"relationGroupDetails":[],"nextRelationGroupDetailId":1 }
Relation: { "id":"param-3","parameterMasterName":"Relationship Group","type":"relation","displayName":"Family Composition","applyToDependents":false,"rangeDetails":[],"nextRangeDetailId":1,"lovDetails":[],"nextLovDetailId":1,"relationGroupDetails":[{"id":"rg-1","groupDisplayName":"Self Only","selectedRelations":[{"name":"Self","selected":true,"maxCount":"1"}],"familyMaxCount":"1","familyMaxManuallySet":false}],"nextRelationGroupDetailId":2 }
DependentCount: { "id":"param-4","parameterMasterName":"Dependent Count","type":"dependent-count","displayName":"Parental Count","applyToDependents":false,"rangeDetails":[],"nextRangeDetailId":1,"lovDetails":[],"nextLovDetailId":1,"relationGroupDetails":[],"nextRelationGroupDetailId":1,"dependentCountConfig":{"targetRelationCategory":"Parents","countBands":[{"id":"cb-1","displayName":"No Parents","minCount":"0","maxCount":"0","siEnhancement":"0"},{"id":"cb-2","displayName":"1-2 Parents","minCount":"1","maxCount":"2","siEnhancement":"500000"}],"nextCountBandId":3} }

Return [] if no parameters found. Return ONLY the JSON array.

Document:
${documentContent}`;

    try {
      const raw = await this.callOpenAI(client, deploymentName, systemPrompt, userPrompt);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { result: [], failed: true };
      return { result: parsed, failed: false };
    } catch {
      return { result: [], failed: true };
    }
  }

  private generateStage5Skeleton(components: any[], parameters: any[]): any[] {
    const paramOptions: { parameterId: string; optionIds: string[]; labelMap: Record<string, string>; displayName: string }[] = parameters.map((p: any) => {
      let optionIds: string[] = [];
      const labelMap: Record<string, string> = {};

      if (p.type === 'range') {
        for (const r of (p.rangeDetails || [])) {
          optionIds.push(r.id);
          labelMap[r.id] = r.rangeDisplayName || r.id;
        }
      } else if (p.type === 'list') {
        for (const l of (p.lovDetails || [])) {
          optionIds.push(l.id);
          labelMap[l.id] = l.value || l.id;
        }
      } else if (p.type === 'relation') {
        for (const rg of (p.relationGroupDetails || [])) {
          optionIds.push(rg.id);
          labelMap[rg.id] = rg.groupDisplayName || rg.id;
        }
      } else if (p.type === 'dependent-count') {
        for (const cb of (p.dependentCountConfig?.countBands || [])) {
          optionIds.push(cb.id);
          labelMap[cb.id] = cb.displayName || cb.id;
        }
      }
      return { parameterId: p.id, displayName: p.displayName || p.parameterMasterName || p.id, optionIds, labelMap };
    });

    // Cartesian product of all parameter options
    let combinations: { parameterId: string; parameterOptionId: string; label: string }[][] = [[]];
    for (const po of paramOptions) {
      if (!po.optionIds.length) continue;
      const expanded: { parameterId: string; parameterOptionId: string; label: string }[][] = [];
      for (const existing of combinations) {
        for (const optId of po.optionIds) {
          expanded.push([
            ...existing,
            { parameterId: po.parameterId, parameterOptionId: optId, label: `${po.displayName}: ${po.labelMap[optId] || optId}` },
          ]);
        }
      }
      combinations = expanded;
    }

    const baseComp = components.find((c: any) => c.type === 'base');
    const parentalComp = components.find((c: any) => c.type === 'parental');
    const optionalComps = components.filter((c: any) => c.type === 'optional');

    const buildChoiceMeta = (comp: any) => ({
      policyId: comp.id,
      configured: false,
      choices: (comp.sumInsuredOptions || []).map((si: any, idx: number) => ({
        sumInsuredId: si.id,
        isAvailable: true,
        isDefault: idx === 0,
        companyContribution: 0,
        employeeContribution: 0,
      })),
    });

    return combinations.map((meta, idx) => ({
      optionId: `option-${idx + 1}`,
      optionLabel: meta.length ? meta.map((m) => m.label).join(' | ') : 'Universal Option',
      optionMeta: meta.map(({ parameterId, parameterOptionId }) => ({ parameterId, parameterOptionId })),
      basePolicyChoices: {
        mainPolicyChoices: baseComp ? buildChoiceMeta(baseComp) : { policyId: '', configured: false, choices: [] },
        addonChoices: optionalComps.map(buildChoiceMeta),
      },
      ...(parentalComp && {
        parentalPolicyChoices: {
          mainPolicyChoices: buildChoiceMeta(parentalComp),
          addonChoices: [],
        },
      }),
    }));
  }

  private async extractStage5Premiums(
    documentContent: string,
    client: AzureOpenAI,
    deploymentName: string,
    skeletonOptions: any[],
    _components: any[]
  ): Promise<{ result: any[]; failed: boolean }> {
    if (!skeletonOptions.length) return { result: [], failed: false };

    const systemPrompt = 'You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks.';
    const previewOptions = skeletonOptions.slice(0, 10);
    const userPrompt = `Given this policy option skeleton and the document, fill companyContribution and employeeContribution by matching option labels to premium tables.

Skeleton (first ${previewOptions.length} of ${skeletonOptions.length} options shown as reference):
${JSON.stringify(previewOptions, null, 2)}

Rules:
- Fill numeric premium values (₹ for FLAT model, per-mille rate for MULTIPLE model)
- Leave as 0 if not found in the document
- Do NOT change optionId, optionLabel, optionMeta, sumInsuredId, isAvailable, or isDefault
- Return ALL ${skeletonOptions.length} options in the same order
- Return ONLY the JSON array.

Document:
${documentContent}`;

    try {
      const raw = await this.callOpenAI(client, deploymentName, systemPrompt, userPrompt);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return { result: skeletonOptions, failed: true };

      // Mark all policy choice metas as configured so the form accepts the pre-filled values
      const configured = parsed.map((option: any) => ({
        ...option,
        basePolicyChoices: {
          ...option.basePolicyChoices,
          mainPolicyChoices: { ...(option.basePolicyChoices?.mainPolicyChoices || {}), configured: true },
          addonChoices: (option.basePolicyChoices?.addonChoices || []).map((a: any) => ({ ...a, configured: true })),
        },
        ...(option.parentalPolicyChoices ? {
          parentalPolicyChoices: {
            ...option.parentalPolicyChoices,
            mainPolicyChoices: { ...(option.parentalPolicyChoices.mainPolicyChoices || {}), configured: true },
            addonChoices: (option.parentalPolicyChoices.addonChoices || []).map((a: any) => ({ ...a, configured: true })),
          },
        } : {}),
      }));

      return { result: configured, failed: false };
    } catch {
      return { result: skeletonOptions, failed: true };
    }
  }

  private async extractStage6Constraints(
    documentContent: string,
    client: AzureOpenAI,
    deploymentName: string
  ): Promise<{ result: any; failed: boolean }> {
    const defaults = this.defaultConstraints();
    const systemPrompt = 'You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks.';
    const userPrompt = `Analyse the insurance policy document and extract enrollment and coverage constraint values.

Return a JSON object with ALL of these keys (use the default shown if not found in the document):
${JSON.stringify(defaults, null, 2)}

Extraction hints:
- crossParentsAllowed: true if parents AND parents-in-law can both be covered simultaneously
- ageGapBetweenParentAndEmployee / ageGapBetweenChildrenAndEmployee: minimum age gap in years (default 18)
- studyingSonAgeExtension / unmarriedDaughterAgeExtension: extra years beyond standard age limit (default 0)
- gstApplicable: true if GST is applicable on premiums
- payrollInstallments: number of pay cycles for premium deduction (default 1)
- customDisclaimerBeforeSubmission: verbatim disclaimer text if present, else ""

Return ONLY the JSON object with all keys present.

Document:
${documentContent}`;

    try {
      const raw = await this.callOpenAI(client, deploymentName, systemPrompt, userPrompt);
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) return { result: defaults, failed: true };
      return { result: { ...defaults, ...parsed }, failed: false };
    } catch {
      return { result: defaults, failed: true };
    }
  }

  private defaultConstraints(): object {
    return {
      sezApplicable: false,
      payrollInstallments: 1,
      showEmployeeContribution: true,
      crossParentsAllowed: false,
      sameGenderParentsAllowed: false,
      twinsSecondChildAllowed: true,
      unmarriedDaughterAgeExtension: 0,
      studyingSonAgeExtension: 0,
      enrollmentConfirmationRequired: true,
      autoLockEnrollmentAfterConfirmation: true,
      lockEnrollmentAfterCutoff: true,
      allowResubmissionBeforeLock: true,
      confirmationStatusVisibleToHR: true,
      documentUploadForAdditionsRequired: true,
      documentUploadForDeletionsRequired: true,
      customDisclaimerBeforeSubmission: '',
      femaleEmployeesCoverParents: true,
      maleEmployeesCoverParents: true,
      femaleEmployeesCoverInLaws: true,
      maleEmployeesCoverInLaws: true,
      ageGapBetweenChildrenAndEmployee: 18,
      ageGapBetweenParentAndEmployee: 18,
    };
  }

  async resolveOrganisationKey(opportunityActivityId: number): Promise<string> {
    try {
      const activity = await this.opportunityActivityMapRepository.findOne({
        where: { id: opportunityActivityId },
        select: ['opportunityId'],
      });
      if (!activity) return ORG_KEYS.IIRM_INDIA;

      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId: activity.opportunityId } as any,
        select: ['organisationId'] as any,
      });
      if (!opportunity?.organisationId) return ORG_KEYS.IIRM_INDIA;

      const organisation = await this.organisationRepository.findOne({
        where: { id: opportunity.organisationId },
        select: ['organisationKey'],
      });
      if (!organisation?.organisationKey) return ORG_KEYS.IIRM_INDIA;

      return ORG_FIELD_CONFIGS[organisation.organisationKey]
        ? organisation.organisationKey
        : ORG_KEYS.IIRM_INDIA;
    } catch {
      return ORG_KEYS.IIRM_INDIA;
    }
  }

  async extractPolicyDetailsFromDocument(
    documentId: string,
    searchClient: SearchClient<SearchDocument>,
    organisationKey: string = ORG_KEYS.IIRM_INDIA,
  ): Promise<Record<string, string | number | null>> {
    const searchResults = await searchClient.search('*', {
      filter: `documentId eq '${documentId}'`,
      select: ['content'],
      top: 50,
    });

    const chunks: string[] = [];
    for await (const result of searchResults.results) {
      if ((result.document as any).content) {
        chunks.push((result.document as any).content);
      }
    }

    const documentContent = chunks.join('\n\n').substring(0, 12000);

    const orgConfig = ORG_FIELD_CONFIGS[organisationKey] ?? ORG_FIELD_CONFIGS[ORG_KEYS.IIRM_INDIA];

    const fieldDescriptions: Record<string, string> = organisationKey === ORG_KEYS.IIRM_SRILANKA
      ? {
          policy_number: 'policy number or insurer policy number (string)',
          basic_premium: 'basic premium (number)',
          srcc_amount: 'SRCC premium amount (number)',
          net_premium: 'total net premium (number)',
          admin_charges: 'admin charges (number)',
          other_amount: 'stamp duty / other charges (number)',
          cess_amount: 'cess / cess amount (number)',
          fee: 'policy fee (number)',
          gst_percentage: 'VAT percentage / service tax percentage (number, e.g. 8)',
          gst_amount: 'VAT amount / service tax amount (number)',
          total_premium: 'total gross premium including tax and other charges (number)',
        }
      : organisationKey === ORG_KEYS.IIRM_KENYA
      ? {
          policy_number: 'policy number or insurer policy number (string)',
          sum_insured: 'sum insured / coverage amount (number)',
          basic_premium: 'basic premium (number)',
          net_premium: 'net premium (number)',
          gst_percentage: 'Levies percentage (number, e.g. 10)',
          gst_amount: 'Levies amount (number)',
          fee: 'broker / service fee (number)',
          other_amount: 'stamp duty / other charges (number)',
          total_premium: 'total premium (number)',
        }
      : {
          policy_number: 'policy number or insurer policy number (string)',
          sum_insured: 'sum insured / coverage amount (number)',
          basic_premium: 'basic premium (number)',
          net_premium: 'net premium (number)',
          gst_percentage: 'GST percentage (number, e.g. 18)',
          gst_amount: 'GST amount — not the percentage (number)',
          fee: 'broker / service fee (number)',
          other_amount: 'other charges (number)',
          total_premium: 'total premium (number)',
        };

    const fieldLines = orgConfig.fieldKeys.map((k) => `- ${k}: ${fieldDescriptions[k]}`).join('\n');
    const emptyJson = JSON.stringify(orgConfig.nullDefault);

    const systemPrompt = `You are an insurance document analyst. Extract the following fields from the policy document. Return ONLY a valid JSON object with exactly these keys. Use null when a value is not found.

Fields:
${fieldLines}

Return format (no markdown, no explanation):
${emptyJson}`;

    const modelEndpoint = this.configService.get<string>('openAi.endpoint');
    const apiKey = this.configService.get<string>('openAi.apiKey');
    const apiVersion = this.configService.get<string>('openAi.apiVersion');
    const deploymentName = this.configService.get<string>('openAi.deploymentName');

    const client = new AzureOpenAI({
      endpoint: modelEndpoint || '',
      apiKey: apiKey || '',
      apiVersion: apiVersion || '',
    });

    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Document content:\n\n${documentContent}` },
      ],
      max_tokens: 2000,
      temperature: 0.1,
      top_p: 1,
      model: deploymentName || '',
    });

    let responseContent = response.choices[0].message.content || '{}';
    if (responseContent.includes('```')) {
      const match = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      responseContent = match?.[1]?.trim() ?? responseContent.replace(/```/g, '');
    }

    try {
      return JSON.parse(responseContent.trim());
    } catch {
      return { ...orgConfig.nullDefault };
    }
  }

  async resolvePlacementSlipActivityId(policyHardCopyActivityId: number): Promise<number | null> {
    try {
      const activity = await this.opportunityActivityMapRepository.findOne({
        where: { id: policyHardCopyActivityId },
        select: ['opportunityId'],
      });
      if (!activity?.opportunityId) return null;

      const placementSlipActivity = await this.opportunityActivityMapRepository.findOne({
        where: {
          opportunityId: activity.opportunityId,
          activityName: ACTIVITY_NAMES.PLACEMENT_SLIP_GENERATION,
        } as any,
        select: ['id'],
      });

      return placementSlipActivity?.id ?? null;
    } catch {
      return null;
    }
  }

  async getPlacementSlipFieldsForComparison(
    opportunityActivityId: number,
    organisationKey: string = ORG_KEYS.IIRM_INDIA,
  ): Promise<Record<string, string | number | null> | null> {
    const placement = await this.placementSlipRepository.findOne({
      where: { opportunityActivityId },
    });

    if (!placement) return null;

    if (organisationKey === ORG_KEYS.IIRM_SRILANKA) {
      return {
        policy_number: null,
        basic_premium: placement.basicPremium ?? null,
        srcc_amount: placement.srccAmount ?? null,
        net_premium: placement.netPremium ?? null,
        admin_charges: placement.adminCharges ?? null,
        other_amount: placement.other ?? null,
        cess_amount: placement.cessAmount ?? null,
        fee: placement.fee ?? null,
        gst_percentage: placement.gstPercentage ?? null,
        gst_amount: placement.gstAmount ?? null,
        total_premium: placement.grossPremium ?? null,
      };
    }

    return {
      policy_number: null,
      sum_insured: placement.sumInsured ?? null,
      basic_premium: placement.basicPremium ?? null,
      net_premium: placement.netPremium ?? null,
      gst_percentage: placement.gstPercentage ?? null,
      gst_amount: placement.gstAmount ?? null,
      fee: placement.fee ?? null,
      other_amount: placement.other ?? null,
      total_premium: placement.grossPremium ?? null,
    };
  }
}
