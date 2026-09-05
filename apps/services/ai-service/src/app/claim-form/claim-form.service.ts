import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { OpenAiService } from '../open-ai/open-ai.service';
import {
  ClaimFormExtractionResult,
  ClaimFormDtoFields,
  ClaimFormValidation,
} from './interfaces/claim-form.interface';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class ClaimFormService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly textract: AWS.Textract;
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || '';

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
    AWS.config.update({
      accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
      region: process.env.S3_AWS_REGION,
    });
    this.textract = new AWS.Textract();
    this.s3 = new AWS.S3();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // API 1: Azure DI — kept as stub so controller compiles; frontend calls Textract only
  // ─────────────────────────────────────────────────────────────────────────────

  async extractWithGpt(file: Express.Multer.File): Promise<ClaimFormExtractionResult> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormService',
        method: 'extractWithGpt',
        payload: { fileName: file.originalname },
        messageData: '[Azure DI] Endpoint is disabled — use Textract endpoint',
      }),
    });

    const ocrText = await this.extractTextViaAzureDI(file.buffer);
    const result = await this.openAiService.extractClaimFormData(ocrText);
    const validation = this.validateDtoFields(result.dtoFields);

    return {
      approach: 'gpt-vision',
      dtoFields: result.dtoFields,
      validation,
      fullData: result.fullData,
    };
  }

  private async extractTextViaAzureDI(buffer: Buffer): Promise<string> {
    const endpoint = (process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '').replace(/\/$/, '');
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new Error('Azure Document Intelligence is not configured');
    }

    const analyzeUrl = `${endpoint}/formrecognizer/documentModels/prebuilt-read:analyze?api-version=2023-07-31`;

    const submitRes = await axios.post(analyzeUrl, buffer, {
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/pdf' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const operationUrl = submitRes.headers['operation-location'] as string;
    if (!operationUrl) throw new Error('Azure DI did not return operation-location header');

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await axios.get(operationUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': key },
      });

      const status = pollRes.data.status as string;
      if (status === 'succeeded') {
        const pages: any[] = pollRes.data.analyzeResult?.pages || [];
        const lines: string[] = [];
        for (const page of pages) {
          for (const line of page.lines || []) lines.push(line.content as string);
        }
        return lines.join('\n');
      }
      if (status === 'failed') {
        throw new Error(`Azure DI analysis failed: ${JSON.stringify(pollRes.data.error)}`);
      }
    }

    throw new Error('Azure Document Intelligence analysis timed out');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // API 2: AWS Textract OCR → GPT
  // ─────────────────────────────────────────────────────────────────────────────

  async extractWithTextract(file: Express.Multer.File): Promise<ClaimFormExtractionResult> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormService',
        method: 'extractWithTextract',
        payload: { fileName: file.originalname, fileSizeBytes: file.size, bucket: this.bucket },
        messageData: '[STEP 1/5] Received file — uploading to S3',
      }),
    });

    const s3Key = `ai-uploads/claim-form/${Date.now()}_${file.originalname}`;
    await this.s3.putObject({ Bucket: this.bucket, Key: s3Key, Body: file.buffer }).promise();

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormService',
        method: 'extractWithTextract',
        payload: { s3Key, bucket: this.bucket },
        messageData: '[STEP 2/5] S3 upload complete — starting Textract document analysis',
      }),
    });

    const startResult = await this.textract
      .startDocumentAnalysis({
        DocumentLocation: { S3Object: { Bucket: this.bucket, Name: s3Key } },
        FeatureTypes: ['FORMS', 'TABLES'],
      })
      .promise();

    const jobId = startResult.JobId;
    if (!jobId) throw new Error('Textract did not return a JobId');

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormService',
        method: 'extractWithTextract',
        payload: { jobId },
        messageData: `[STEP 3/5] Textract job started — jobId: ${jobId}`,
      }),
    });

    const blocks = await this.pollTextractJob(jobId);

    const blockTypeCounts = blocks.reduce<Record<string, number>>((acc, b) => {
      const t = b.BlockType || 'UNKNOWN';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormService',
        method: 'extractWithTextract',
        payload: { totalBlocks: blocks.length, blockTypeCounts },
        messageData: '[STEP 4/5] Textract polling complete — normalizing blocks',
      }),
    });

    // ── RAW OCR: LINE block texts straight from Textract, no processing ──
    const rawLineTexts = blocks
      .filter((b) => b.BlockType === 'LINE')
      .sort((a, b) => {
        const pa = a.Page ?? 0,
          pb = b.Page ?? 0;
        if (pa !== pb) return pa - pb;
        return (a.Geometry?.BoundingBox?.Top ?? 0) - (b.Geometry?.BoundingBox?.Top ?? 0);
      })
      .map((b) => b.Text ?? '')
      .join('\n');
    console.log('[ClaimForm][Textract] === RAW LINE TEXT ===\n', rawLineTexts);

    // ── NORMALIZED: after checkbox detection + mergeCharBoxText + tables ──
    const normalizedText = this.normalizeTextractBlocks(blocks);
    console.log('[ClaimForm][Textract] === NORMALIZED TEXT (sent to GPT) ===\n', normalizedText);

    const result = await this.openAiService.extractClaimFormData(normalizedText);

    const validation = this.validateDtoFields(result.dtoFields);
    this.logger.log({
      level: validation.isValid ? 'info' : 'warn',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: validation.isValid ? 'success' : 'failure',
        location: 'ClaimFormService',
        method: 'extractWithTextract',
        payload: { isValid: validation.isValid, errors: validation.errors },
        messageData: `[VALIDATION] dtoFields validation ${validation.isValid ? 'passed' : 'failed with ' + validation.errors.length + ' error(s)'}`,
      }),
    });

    return {
      approach: 'textract-gpt',
      dtoFields: result.dtoFields,
      validation,
      fullData: {
        ...result.fullData,
        textractMeta: { jobId, blockCount: blocks.length, blockTypeCounts, s3Key },
      },
    };
  }

  private async pollTextractJob(jobId: string): Promise<AWS.Textract.Block[]> {
    const maxAttempts = 30;
    const pollIntervalMs = 2000;
    let nextToken: string | undefined;
    let pagesFetched = 0;
    const allBlocks: AWS.Textract.Block[] = [];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));

      const response = await this.textract
        .getDocumentAnalysis({ JobId: jobId, ...(nextToken ? { NextToken: nextToken } : {}) })
        .promise();

      const status = response.JobStatus;

      if (status === 'SUCCEEDED' || status === 'PARTIAL_SUCCESS') {
        const pageBlocks = response.Blocks || [];
        allBlocks.push(...pageBlocks);
        pagesFetched++;

        if (response.NextToken) {
          nextToken = response.NextToken;
          attempt = -1;
          continue;
        }

        this.logger.log({
          level: 'info',
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: 'success',
            location: 'ClaimFormService',
            method: 'pollTextractJob',
            payload: { totalBlocks: allBlocks.length, paginationPages: pagesFetched },
            messageData: `[Textract Poll] All pages fetched — total ${allBlocks.length} blocks across ${pagesFetched} pagination page(s)`,
          }),
        });
        return allBlocks;
      }

      if (status === 'FAILED') {
        throw new Error(`Textract job failed: ${response.StatusMessage ?? 'unknown reason'}`);
      }
    }

    throw new Error('Textract job timed out after 60 seconds');
  }

  private normalizeTextractBlocks(blocks: AWS.Textract.Block[]): string {
    const blockMap = new Map(
      blocks.filter((b) => b.Id != null).map((b) => [b.Id as string, b]),
    );
    const output: string[] = [];

    // ── Section 1: LINE blocks sorted top-to-bottom per page ──
    const lineBlocks = blocks
      .filter((b) => b.BlockType === 'LINE')
      .sort((a, b) => {
        const pa = a.Page ?? 0,
          pb = b.Page ?? 0;
        if (pa !== pb) return pa - pb;
        return (a.Geometry?.BoundingBox?.Top ?? 0) - (b.Geometry?.BoundingBox?.Top ?? 0);
      });

    output.push('=== RAW OCR TEXT (reading order) ===');
    for (const lineBlock of lineBlocks) {
      const text = lineBlock.Text?.trim() || '';
      if (!text) continue;

      // getCheckedLabelFromLine returns one label per ticked checkbox on this line.
      // Emit a separate [CHECKED] line for each so GPT sees them as independent facts.
      const checkedLabels = this.getCheckedLabelFromLine(lineBlock, blockMap);
      if (checkedLabels.length > 0) {
        for (const label of checkedLabels) {
          output.push(`[CHECKED] ${label}`);
        }
      } else {
        output.push(this.mergeCharBoxText(text));
      }
    }

    // ── Section 2: Form key-value pairs ──
    const keyBlocks = blocks.filter(
      (b) => b.BlockType === 'KEY_VALUE_SET' && b.EntityTypes?.includes('KEY'),
    );

    if (keyBlocks.length > 0) {
      output.push('\n=== FORM FIELD KEY-VALUE PAIRS ===');
      for (const keyBlock of keyBlocks) {
        const keyText = this.getChildText(keyBlock, blockMap);
        const valueBlockId = keyBlock.Relationships?.find((r) => r.Type === 'VALUE')?.Ids?.[0];
        const valueBlock = valueBlockId ? blockMap.get(valueBlockId) : undefined;
        const rawValue = valueBlock ? this.getChildText(valueBlock, blockMap) : '';
        const valueText = this.mergeCharBoxText(rawValue);
        if (keyText) output.push(`${keyText}: ${valueText}`);
      }
    }

    // ── Section 3: Table data ──
    const tableBlocks = blocks.filter((b) => b.BlockType === 'TABLE');
    if (tableBlocks.length > 0) {
      output.push('\n=== TABLE DATA ===');
      for (const table of tableBlocks) {
        const cellIds = table.Relationships?.find((r) => r.Type === 'CHILD')?.Ids || [];
        const cells: { row: number; col: number; text: string }[] = [];
        for (const cellId of cellIds) {
          const cell = blockMap.get(cellId);
          if (!cell || cell.BlockType !== 'CELL') continue;
          cells.push({
            row: cell.RowIndex ?? 0,
            col: cell.ColumnIndex ?? 0,
            text: this.mergeCharBoxText(this.getChildText(cell, blockMap)),
          });
        }
        cells.sort((a, b) => a.row - b.row || a.col - b.col);
        const rows: Record<number, string[]> = {};
        for (const { row, col, text } of cells) {
          if (!rows[row]) rows[row] = [];
          rows[row][col] = text;
        }
        for (const row of Object.values(rows)) {
          output.push(row.filter(Boolean).join(' | '));
        }
      }
    }

    return output.join('\n');
  }

  /**
   * Returns the label(s) of every SELECTED checkbox on a LINE as a string[].
   * Returns [] if no checkbox is selected on this line.
   *
   * Pattern is determined PER CHECKBOX (not per line) by checking which side
   * of the checkbox has contiguous WORDs before another SELECTION_ELEMENT:
   *   □ Label  (words only on the RIGHT)  → Pattern 1: label comes after
   *   Label □  (words only on the LEFT)   → Pattern 2: label comes before
   *   Label □ Label  (words on both)      → prefer the side with more words
   *
   * Returning string[] (one entry per selected checkbox) lets the normalizer
   * emit a separate [CHECKED] line for each, which GPT's prompt expects.
   */
  private getCheckedLabelFromLine(
    lineBlock: AWS.Textract.Block,
    blockMap: Map<string, AWS.Textract.Block>,
  ): string[] {
    const childIds =
      lineBlock.Relationships?.find((r) => r.Type === 'CHILD')?.Ids || [];

    const children = childIds
      .map((id) => blockMap.get(id))
      .filter(
        (b): b is AWS.Textract.Block =>
          !!(b && (b.BlockType === 'WORD' || b.BlockType === 'SELECTION_ELEMENT')),
      )
      .sort(
        (a, b) =>
          (a.Geometry?.BoundingBox?.Left ?? 0) - (b.Geometry?.BoundingBox?.Left ?? 0),
      );

    if (children.length === 0) return [];

    const selectedIndexes = children
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) =>
          c.BlockType === 'SELECTION_ELEMENT' && c.SelectionStatus === 'SELECTED',
      )
      .map(({ i }) => i);

    if (selectedIndexes.length === 0) return [];

    const selectedLabels: string[] = [];

    for (const selIdx of selectedIndexes) {
      // Words immediately AFTER this checkbox (stop at next SELECTION_ELEMENT)
      const wordsAfter: string[] = [];
      for (let j = selIdx + 1; j < children.length; j++) {
        if (children[j].BlockType === 'SELECTION_ELEMENT') break;
        if (children[j].Text) wordsAfter.push(children[j].Text as string);
      }

      // Words immediately BEFORE this checkbox (stop at previous SELECTION_ELEMENT)
      const wordsBefore: string[] = [];
      for (let j = selIdx - 1; j >= 0; j--) {
        if (children[j].BlockType === 'SELECTION_ELEMENT') break;
        if (children[j].Text) wordsBefore.unshift(children[j].Text as string);
      }

      let label: string | null = null;
      if (wordsBefore.length > 0 && wordsAfter.length === 0) {
        // Pattern 2: Label □
        label = wordsBefore.join(' ');
      } else if (wordsAfter.length > 0 && wordsBefore.length === 0) {
        // Pattern 1: □ Label
        label = wordsAfter.join(' ');
      } else if (wordsBefore.length > 0 && wordsAfter.length > 0) {
        // Ambiguous: label is typically on the longer side
        label =
          wordsBefore.length >= wordsAfter.length
            ? wordsBefore.join(' ')
            : wordsAfter.join(' ');
      }

      if (label) selectedLabels.push(label);
    }

    return selectedLabels;
  }

  /**
   * Merges spaced character-box text: "P A T I B A N D L A" → "PATIBANDLA".
   * Minimum 2 spaced chars (covers "1 2", "0 6" date/age boxes).
   * Extended to [A-Za-z0-9] for mixed-case OCR output.
   */
  private mergeCharBoxText(text: string): string {
    return text.replace(
      /(?:[A-Za-z0-9\/\-] ){2,}[A-Za-z0-9\/\-]/g,
      (match) => match.replace(/ /g, ''),
    );
  }

  private getChildText(
    block: AWS.Textract.Block,
    blockMap: Map<string, AWS.Textract.Block>,
  ): string {
    const childIds = block.Relationships?.find((r) => r.Type === 'CHILD')?.Ids || [];
    const parts: string[] = [];
    for (const id of childIds) {
      const child = blockMap.get(id);
      if (!child) continue;
      if (child.BlockType === 'WORD' && child.Text) {
        parts.push(child.Text);
      } else if (
        child.BlockType === 'SELECTION_ELEMENT' &&
        child.SelectionStatus === 'SELECTED'
      ) {
        parts.push('SELECTED');
      }
    }
    return parts.join(' ');
  }

  private validateDtoFields(fields: ClaimFormDtoFields): ClaimFormValidation {
    const errors: { field: string; message: string }[] = [];

    if (!fields.diagnosis) {
      errors.push({ field: 'diagnosis', message: 'Diagnosis is required' });
    }
    if (fields.estimatedClaimAmount === null || fields.estimatedClaimAmount === undefined) {
      errors.push({
        field: 'estimatedClaimAmount',
        message: 'Estimated claim amount is required',
      });
    } else if (fields.estimatedClaimAmount < 0) {
      errors.push({ field: 'estimatedClaimAmount', message: 'Amount must be 0 or greater' });
    }
    if (fields.dateOfAdmission && !/^\d{4}-\d{2}-\d{2}$/.test(fields.dateOfAdmission)) {
      errors.push({ field: 'dateOfAdmission', message: 'Must be YYYY-MM-DD format' });
    }
    if (
      fields.proposedDischargeDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(fields.proposedDischargeDate)
    ) {
      errors.push({ field: 'proposedDischargeDate', message: 'Must be YYYY-MM-DD format' });
    }

    return { isValid: errors.length === 0, errors };
  }
}
