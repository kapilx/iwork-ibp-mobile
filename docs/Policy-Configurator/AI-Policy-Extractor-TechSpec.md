# AI Policy Document Extractor — Technical Specification

**Feature:** AI-Powered Policy Configuration Extraction from PDF
**BRD Reference:** AI-Policy-Extractor-BRD.md (FR-AIE-001 through FR-AIE-023)
**Date:** 2026-06-15
**Status:** Implemented

---

## 1. Overview

This document covers the technical implementation of the **AI Policy Document Extractor** — a new endpoint in the `ai-service` that accepts a policy PDF upload and uses Azure Document Intelligence + Azure OpenAI to produce a pre-populated `PolicyConfiguration` JSON covering all six stages of the Policy Configurator wizard.

The feature introduces:
1. A new `POST /pdf-analyser/policy-configurator` endpoint in `ai-service`
2. A new `extractPolicyConfigurationFromDocument` service method with six per-stage AI extraction helpers
3. A new `ai_policy_document_extraction` audit table in the database
4. A new `AiPolicyDocumentExtraction` TypeORM entity in `service-lib`
5. Swagger metadata for the new endpoint

No new API endpoints are added to `policy-service`, `ibp-service`, or any other service. No frontend changes are included — this is a purely backend feature. The extracted JSON is returned in the API response for the caller to use.

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Client (IIRM Frontend / API Consumer)                               │
│                                                                      │
│  POST /pdf-analyser/policy-configurator                              │
│    multipart: file (PDF), header: userid                             │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ multipart upload
┌─────────────────────────────▼────────────────────────────────────────┐
│  ai-service (apps/services/ai-service)                               │
│                                                                      │
│  PdfAnalyserController                                               │
│    POST /pdf-analyser/policy-configurator                            │
│    ├── Validate file present                                         │
│    ├── Generate documentId (UUID)                                    │
│    ├── processDocumentWithDocumentIntelligence(file, userId)         │
│    │     └── Upload to S3 → Azure Document Intelligence             │
│    │           → AnalyzeResult (pages + tables)                      │
│    ├── createSearchIndexIfNotExists(indexClient, indexName)          │
│    ├── indexDocumentIntelligenceResults(searchClient, analyzeResult, │
│    │     fileName, s3Key, documentId)                                │
│    ├── wait 2s for index propagation                                 │
│    ├── extractPolicyConfigurationFromDocument(documentId,            │
│    │     searchClient, userId, fileName)                             │
│    ├── deleteDocumentById(documentId)                                │
│    └── return 200 { success, data: { policyConfiguration,           │
│                extractionStatus, warnings, message? } }              │
│                                                                      │
│  PdfAnalyserService                                                  │
│    extractPolicyConfigurationFromDocument()                          │
│    ├── Fetch document content from Azure Cognitive Search            │
│    ├── Init AzureOpenAI client                                       │
│    ├── Promise.allSettled([                                          │
│    │     extractStage1Components(),                                  │
│    │     extractStage2Relationships(),                               │
│    │     extractStage4Parameters(),                                  │
│    │     extractStage6Constraints()                                  │
│    │   ])                                                            │
│    ├── extractStage3Template(components) — sequential               │
│    ├── generateStage5Skeleton(components, parameters) — pure fn     │
│    ├── extractStage5Premiums(skeleton) — sequential                 │
│    ├── Validity check: base component + SI options present?          │
│    ├── saveExtractionAuditRecord() — fire-and-forget                │
│    └── Return policyConfiguration / {} + status + warnings          │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
         ┌────────────────────┼───────────────────────┐
         ▼                    ▼                       ▼
┌─────────────────┐  ┌─────────────────┐   ┌────────────────────────┐
│  Azure Document │  │  Azure Cognitive │   │  Azure OpenAI          │
│  Intelligence   │  │  Search          │   │  (GPT deployment)      │
│                 │  │                  │   │                        │
│  Parses PDF     │  │  Temporary doc   │   │  Stages 1,2,4,6        │
│  text + tables  │  │  index for RAG   │   │  (parallel calls)      │
│                 │  │                  │   │  Stages 3,5            │
└─────────────────┘  └─────────────────┘   │  (sequential)          │
                                            └────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                               │
│    ai_policy_document_extraction (new audit table)                   │
│    ├── document_id, file_name, user_id, policy_id                   │
│    ├── extraction_status: SUCCESS | PARTIAL | FAILED                 │
│    ├── extracted_configuration (jsonb)                               │
│    ├── stage_results (jsonb)                                         │
│    ├── failure_reason (text)                                         │
│    ├── warnings (jsonb)                                              │
│    └── created_at                                                    │
│                                                                      │
│    S3 (AWS)                                                          │
│    └── ai-uploads/policy-configurator/{userId}_{ts}_{fileName}      │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| AI strategy | Structured JSON extraction (prompted schema) rather than Q&A pattern | The Policy Configurator requires a complex nested JSON; schema-anchored prompts produce more reliable structured output than open-ended questions |
| Stage parallelism | Stages 1, 2, 4, 6 run in parallel via `Promise.allSettled`; Stages 3 and 5 run sequentially after their dependencies | Stage 3 needs component IDs from Stage 1; Stage 5 skeleton needs Stage 1 + Stage 4 results |
| Stage 5 two-pass | Programmatic Cartesian product skeleton + AI premium fill as a second pass | Separation ensures structural correctness even when premium tables are absent or AI parse fails |
| Fallback strategy | Per-stage try/catch returning `{ result, failed }` tuples | Individual stage failures do not abort the overall extraction; admin receives best-effort output with per-stage failure visibility |
| Validity check | `components.length > 0 && components.some(c => c.type === 'base' && c.sumInsuredOptions.length > 0)` | A policy configuration without a base component with SI options cannot be meaningfully used in the Policy Configurator wizard |
| AI model parameters | `temperature: 0.1`, `max_tokens: 4000` | Low temperature for consistent structured output; 4000 tokens covers typical per-stage JSON for a 20-page GMC document |
| Audit persistence | `saveExtractionAuditRecord` wraps all DB writes in try/catch; errors are logged, not rethrown | Audit failure must never block the API response |
| Document lifecycle | Indexed document deleted from Azure Cognitive Search after extraction | No residual policy document content persists in the search index beyond a single request |
| S3 key path | `ai-uploads/policy-configurator/{userId}_{timestamp}_{fileName}` | Namespaced under `policy-configurator/` to distinguish from cover uploads (`ai-uploads/covers/`) |
| Entity location | `AiPolicyDocumentExtraction` entity in `service-lib` | Consistent with all other entities; allows future reuse from other services without cross-service imports |
| Module registration | `TypeOrmModule.forFeature([AiPolicyDocumentExtraction])` in `PdfAnalyserModule` | Follows the established NestJS pattern used by all other feature modules that own repository injection |

---

## 2. Database Changes

### 2.1 New Table: `ai_policy_document_extraction`

This is a new table with no modifications to any existing tables.

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `integer` | NOT NULL, PK | auto-increment | |
| `document_id` | `varchar` | NOT NULL | — | UUID generated per upload |
| `file_name` | `varchar` | NOT NULL | — | Original file name |
| `user_id` | `integer` | NULL | — | `userid` header value |
| `policy_id` | `integer` | NULL | — | Reserved for future policy linkage |
| `extraction_status` | `varchar` | NOT NULL | — | `'SUCCESS'` \| `'PARTIAL'` \| `'FAILED'` |
| `extracted_configuration` | `jsonb` | NULL | — | Full `policyConfiguration` or `{}` |
| `stage_results` | `jsonb` | NULL | — | `{ stage1: 'ok'|'failed', ..., stage6: 'ok'|'failed' }` |
| `failure_reason` | `text` | NULL | — | Populated only on `FAILED` status |
| `warnings` | `jsonb` | NULL | — | `string[]` of per-stage warning messages |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` | Auto-set by TypeORM `@CreateDateColumn` |

### 2.2 SQL Migration

```sql
CREATE TABLE IF NOT EXISTS ai_policy_document_extraction (
    id                       SERIAL PRIMARY KEY,
    document_id              VARCHAR NOT NULL,
    file_name                VARCHAR NOT NULL,
    user_id                  INTEGER,
    policy_id                INTEGER,
    extraction_status        VARCHAR NOT NULL,
    extracted_configuration  JSONB,
    stage_results            JSONB,
    failure_reason           TEXT,
    warnings                 JSONB,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_policy_doc_extract_user_id
    ON ai_policy_document_extraction (user_id);

CREATE INDEX idx_ai_policy_doc_extract_status
    ON ai_policy_document_extraction (extraction_status);

CREATE INDEX idx_ai_policy_doc_extract_created_at
    ON ai_policy_document_extraction (created_at DESC);
```

---

## 3. service-lib Changes

### 3.1 New Entity: `AiPolicyDocumentExtraction`

**File:** `apps/services/service-lib/src/lib/entities/ai-policy-document-extraction.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'ai_policy_document_extraction' })
export class AiPolicyDocumentExtraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id' })
  documentId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'policy_id', nullable: true })
  policyId: number;

  @Column({ name: 'extraction_status' })
  extractionStatus: string; // 'SUCCESS' | 'PARTIAL' | 'FAILED'

  @Column({ name: 'extracted_configuration', type: 'jsonb', nullable: true })
  extractedConfiguration: object;

  @Column({ name: 'stage_results', type: 'jsonb', nullable: true })
  stageResults: object;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @Column({ name: 'warnings', type: 'jsonb', nullable: true })
  warnings: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 3.2 Barrel Export

**File:** `apps/services/service-lib/src/lib/entities/index.ts`

Add after existing AI entity exports:
```typescript
export * from "./ai-policy-document-extraction.entity";
```

Add to the `entities[]` array:
```typescript
AiPolicyDocumentExtraction,
```

---

## 4. ai-service Changes

### 4.1 Swagger Metadata

**File:** `apps/services/ai-service/src/app/ai-service.swagger.ts`

New exported function added before the `// ========== PDF Analyser Endpoints ==========` section:

```typescript
// ========== Policy Configurator Extractor Endpoints ==========

export function extractPolicyConfiguratorSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Extract policy configuration from PDF',
      description:
        'Upload a policy document PDF and use AI to extract a pre-populated Policy Configurator JSON ' +
        'covering all 6 stages (components, relationships, template, parameters, choices, constraints).',
    }),
    ApiHeader({ name: 'userid', description: 'User ID', required: true, schema: { type: 'string' } }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary', description: 'Policy document PDF' },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Extraction completed. policyConfiguration is populated on success or {} on failure.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              policyConfiguration: { type: 'object', additionalProperties: true, description: 'Extracted JSON or {}' },
              extractionStatus: { type: 'string', enum: ['SUCCESS', 'PARTIAL', 'FAILED'] },
              message: { type: 'string', nullable: true, description: 'Set when extraction failed' },
              warnings: { type: 'array', items: { type: 'string' }, description: 'Per-stage warnings' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - No file uploaded' }),
    ApiResponse({ status: 500, description: 'Internal server error' })
  );
}
```

### 4.2 Module Registration

**File:** `apps/services/ai-service/src/app/pdf-analyser/pdf-analyser.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { PdfAnalyserService } from "./pdf-analyser.service";
import { PdfAnalyserController } from "./pdf-analyser.controller";
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiPolicyDocumentExtraction } from "../../../../service-lib/src/lib/entities/ai-policy-document-extraction.entity";

@Module({
  imports: [
    InsuranceWellnessHubServiceLibModule,
    TypeOrmModule.forFeature([AiPolicyDocumentExtraction]),
  ],
  controllers: [PdfAnalyserController],
  providers: [PdfAnalyserService],
})
export class PdfAnalyserModule {}
```

### 4.3 Controller Endpoint

**File:** `apps/services/ai-service/src/app/pdf-analyser/pdf-analyser.controller.ts`

New endpoint added after the existing `/cover` endpoint:

```typescript
@extractPolicyConfiguratorSwaggerMetadata()
@Post("/policy-configurator")
@UseInterceptors(FileInterceptor("file"))
async extractPolicyConfigurator(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: Request,
  @Res() res: Response
): Promise<void> {
  if (!file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
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

    const s3Key = `ai-uploads/policy-configurator/${userId || "unknown"}_${Date.now()}_${originalFileName}`;
    await this.pdfAnalyserService.indexDocumentIntelligenceResults(
      searchClient, analyzeResult, originalFileName, s3Key, documentId
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await this.pdfAnalyserService.extractPolicyConfigurationFromDocument(
      documentId, searchClient, userId, originalFileName
    );

    await this.pdfAnalyserService.deleteDocumentById(documentId);

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    this.logger.error("Error in extractPolicyConfigurator:", error);
    res.status(500).json({
      success: false,
      error: error && error.message ? error.message : "Internal server error",
    });
  }
}
```

### 4.4 Service Method: `extractPolicyConfigurationFromDocument`

**File:** `apps/services/ai-service/src/app/pdf-analyser/pdf-analyser.service.ts`

**Signature:**
```typescript
async extractPolicyConfigurationFromDocument(
  documentId: string,
  searchClient: SearchClient<SearchDocument>,
  userId?: number,
  fileName?: string
): Promise<{
  policyConfiguration: object;
  warnings: string[];
  extractionStatus: string;
  message?: string;
}>
```

**Algorithm:**

```
1. Fetch document content from Azure Cognitive Search
   filter: `id eq '${documentId}' or documentId eq '${documentId}'`
   Concatenate: page content + table content for each result

2. If documentContent is empty:
   → saveExtractionAuditRecord({ status: 'FAILED', failureReason: 'No document content' })
   → return { policyConfiguration: {}, extractionStatus: 'FAILED', message: '...' }

3. Init AzureOpenAI client from config:
   endpoint, apiKey, apiVersion, deploymentName

4. Run in parallel (Promise.allSettled):
   s1 = extractStage1Components(documentContent, client, deploymentName)
   s2 = extractStage2Relationships(documentContent, client, deploymentName)
   s4 = extractStage4Parameters(documentContent, client, deploymentName)
   s6 = extractStage6Constraints(documentContent, client, deploymentName)

5. Unwrap settled results, applying safe defaults for rejected/failed stages
   s1Failed, s2Failed, s4Failed, s6Failed flags

6. Run sequentially:
   s3 = extractStage3Template(documentContent, client, deploymentName, components)
   skeletonOptions = generateStage5Skeleton(components, parameters)
   s5 = extractStage5Premiums(documentContent, client, deploymentName, skeletonOptions, components)

7. Build stageResults map and warnings[]

8. Validity check:
   isValid = components.length > 0 &&
             components.some(c => c.type === 'base' &&
                                  Array.isArray(c.sumInsuredOptions) &&
                                  c.sumInsuredOptions.length > 0)

9. If !isValid:
   → saveExtractionAuditRecord({ status: 'FAILED', extractedConfiguration: {} })
   → return { policyConfiguration: {}, extractionStatus: 'FAILED', message: '...' }

10. Determine extractionStatus:
    warnings.length === 0 → 'SUCCESS'
    warnings.length > 0   → 'PARTIAL'

11. saveExtractionAuditRecord({ status, policyConfiguration, stageResults, warnings })

12. Return { policyConfiguration, warnings, extractionStatus }
```

### 4.5 Service Method: `saveExtractionAuditRecord`

```typescript
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
    const record = this.extractionAuditRepository.create({ ...data });
    await this.extractionAuditRepository.save(record);
  } catch (err) {
    this.logger.error('Failed to save extraction audit record:', err);
    // Never rethrow — audit failure must not block the API response
  }
}
```

### 4.6 Service Method: `stripMarkdownFromJson`

Strips markdown code fences from AI responses before `JSON.parse`:

```typescript
private stripMarkdownFromJson(content: string): string {
  if (content.includes('```')) {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) return match[1].trim();
    return content.replace(/```/g, '').trim();
  }
  return content.trim();
}
```

### 4.7 Service Method: `callOpenAI`

Shared helper for all per-stage AI calls:

```typescript
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
```

### 4.8 Per-Stage Extraction Helpers

All helpers share the same system prompt: *"You are an insurance document analyser. Respond with valid JSON only. No markdown or code blocks."*

Each returns `{ result: T; failed: boolean }`.

#### Stage 1: `extractStage1Components`

**Output shape:**
```json
[{
  "id": "comp-1",
  "type": "base | parental | optional",
  "label": "Group Medical Cover",
  "sumInsuredModel": "FLAT | MULTIPLE",
  "siMultipleLabel": "CTC",
  "siMultipleMin": 0,
  "siMultipleMax": 0,
  "sumInsuredOptions": [{"id": 1, "value": "500000"}],
  "nextSumInsuredId": 2,
  "showCompanyContribution": true,
  "premiumPerLife": false,
  "proRationEnabled": true,
  "isBenefitComponent": false
}]
```

**Safe default on failure:** `[]`

**Validity guard:** If parsed result is not a non-empty array → `{ result: [], failed: true }`

---

#### Stage 2: `extractStage2Relationships`

**Output shape:**
```json
{
  "enabledPolicyRelations": [{
    "type": "Self",
    "enabled": true,
    "maxCount": "1",
    "configuredOptions": [{ "name": "Self", "enabled": true, "minAge": "18", "maxAge": "65" }]
  }],
  "familyMaxPolicyLevel": "6"
}
```

**Relation categories:** Self, Spouse/Partner, Children, Parents, Siblings  
**Safe default on failure:** `{ enabledPolicyRelations: [], familyMaxPolicyLevel: '0' }`

---

#### Stage 3: `extractStage3Template`

**Runs sequentially** after Stage 1. Receives `components[]` to inject `baseComp.id` and `parentalComp.id` into the prompt.

**Output shape:**
```json
{
  "basePolicy": {
    "mainPolicyId": "comp-1",
    "provisionPolicyNumber": "",
    "insurerPolicyNumber": "",
    "iirmPolicyNumber": "",
    "eligibleRelations": ["Self", "Spouse/Partner", "Children"],
    "clubSumInsured": false,
    "addonIds": [{
      "optionId": "comp-3",
      "sequence": 1,
      "provisionPolicyNumber": "",
      "insurerPolicyNumber": "",
      "iirmPolicyNumber": "",
      "eligibleRelations": ["Self", "Spouse/Partner", "Children"]
    }]
  },
  "parentalPolicy": { ... }
}
```

**Safe default on failure:** `{ basePolicy: { mainPolicyId: baseComp?.id || '', addonIds: [] } }`

---

#### Stage 4: `extractStage4Parameters`

**Output shape (range type):**
```json
{
  "id": "param-1",
  "parameterMasterName": "Age",
  "type": "range",
  "displayName": "Employee Age",
  "applyToDependents": false,
  "rangeDetails": [{"id": "r-1", "rangeDisplayName": "Band 1", "min": "0", "max": "35"}],
  "nextRangeDetailId": 2,
  "lovDetails": [],
  "nextLovDetailId": 1,
  "relationGroupDetails": [],
  "nextRelationGroupDetailId": 1
}
```

**Output shape (list type):**
```json
{
  "id": "param-2",
  "parameterMasterName": "Gender",
  "type": "list",
  "lovDetails": [{"id": "lov-1", "value": "Male", "isDefault": true}],
  ...
}
```

**Output shape (relation type):**
```json
{
  "id": "param-3",
  "parameterMasterName": "Relationship Group",
  "type": "relation",
  "relationGroupDetails": [{
    "id": "rg-1",
    "groupDisplayName": "Self Only",
    "selectedRelations": [{"name": "Self", "selected": true, "maxCount": "1"}],
    "familyMaxCount": "1",
    "familyMaxManuallySet": false
  }],
  ...
}
```

**Output shape (dependent-count type):**
```json
{
  "id": "param-4",
  "parameterMasterName": "Dependent Count",
  "type": "dependent-count",
  "dependentCountConfig": {
    "targetRelationCategory": "Parents",
    "countBands": [{"id": "cb-1", "displayName": "No Parents", "minCount": "0", "maxCount": "0", "siEnhancement": "0"}],
    "nextCountBandId": 2
  },
  ...
}
```

**Safe default on failure:** `[]`

---

#### Stage 5 Pass 1: `generateStage5Skeleton` (pure synchronous function)

Computes the Cartesian product of all Stage 4 parameter options:
- For `range` params: uses `rangeDetails[*].id`
- For `list` params: uses `lovDetails[*].id`
- For `relation` params: uses `relationGroupDetails[*].id`
- For `dependent-count` params: uses `dependentCountConfig.countBands[*].id`

If no parameters, result is one Universal Option.

Each option entry:
```json
{
  "optionId": "option-1",
  "optionLabel": "r-1 | lov-1",
  "optionMeta": [
    { "parameterId": "param-1", "parameterOptionId": "r-1" },
    { "parameterId": "param-2", "parameterOptionId": "lov-1" }
  ],
  "basePolicyChoices": {
    "mainPolicyChoices": {
      "policyId": "comp-1",
      "configured": false,
      "choices": [{ "sumInsuredId": 1, "isAvailable": true, "isDefault": true, "companyContribution": 0, "employeeContribution": 0 }]
    },
    "addonChoices": [...]
  }
}
```

All `companyContribution` and `employeeContribution` values default to `0`.

---

#### Stage 5 Pass 2: `extractStage5Premiums`

**Runs sequentially** after skeleton generation.

Provides the first 10 skeleton options as JSON context. Instructs the AI to:
- Match option labels to premium tables in the document
- Fill `companyContribution` and `employeeContribution` with numeric values
- Return all N options in the same order
- Not modify structural fields (`optionId`, `optionLabel`, `optionMeta`, `sumInsuredId`, `isAvailable`, `isDefault`)

**Safe default on failure:** return the original `skeletonOptions` unchanged with `failed: true`

---

#### Stage 6: `extractStage6Constraints`

Provides all 22 constraint default values as fallback guidance in the prompt. AI merges extracted values over defaults: `{ ...defaults, ...parsed }`.

**Default constraint values:**
```json
{
  "sezApplicable": false,
  "payrollInstallments": 1,
  "showEmployeeContribution": true,
  "crossParentsAllowed": false,
  "sameGenderParentsAllowed": false,
  "twinsSecondChildAllowed": true,
  "unmarriedDaughterAgeExtension": 0,
  "studyingSonAgeExtension": 0,
  "enrollmentConfirmationRequired": true,
  "autoLockEnrollmentAfterConfirmation": true,
  "lockEnrollmentAfterCutoff": true,
  "allowResubmissionBeforeLock": true,
  "confirmationStatusVisibleToHR": true,
  "documentUploadForAdditionsRequired": true,
  "documentUploadForDeletionsRequired": true,
  "customDisclaimerBeforeSubmission": "",
  "femaleEmployeesCoverParents": true,
  "maleEmployeesCoverParents": true,
  "femaleEmployeesCoverInLaws": true,
  "maleEmployeesCoverInLaws": true,
  "ageGapBetweenChildrenAndEmployee": 18,
  "ageGapBetweenParentAndEmployee": 18
}
```

**Safe default on failure:** returns the full defaults object

---

## 5. API Contract

### `POST /pdf-analyser/policy-configurator`

**Description:** Upload a policy PDF and receive an AI-extracted pre-populated PolicyConfiguration JSON.

**Authentication:** Bearer token (JWT) required.

**Headers:**

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | `Bearer <jwt-token>` |
| `userid` | Yes | Requesting administrator's user ID (integer as string) |
| `Content-Type` | Yes | `multipart/form-data` |

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | binary (PDF) | Yes | Policy document PDF file |

**Success Response — HTTP 200:**

```json
{
  "success": true,
  "data": {
    "policyConfiguration": {
      "components": [...],
      "relationships": {
        "enabledPolicyRelations": [...],
        "familyMaxPolicyLevel": "6"
      },
      "policyTemplate": {
        "basePolicy": { "mainPolicyId": "comp-1", "addonIds": [...], "eligibleRelations": [...] },
        "parentalPolicy": { ... }
      },
      "parameters": [...],
      "policyOptions": [...],
      "constraints": { ... }
    },
    "extractionStatus": "SUCCESS | PARTIAL | FAILED",
    "warnings": [],
    "message": "Could not extract a valid policy configuration from the provided document. The document may not contain sufficient policy structure. Please configure manually."
  }
}
```

Notes:
- `policyConfiguration` is `{}` when `extractionStatus === 'FAILED'`
- `message` is only present when `extractionStatus === 'FAILED'`
- `warnings` is `[]` when `extractionStatus === 'SUCCESS'`; contains per-stage messages when `'PARTIAL'`

**Error Response — HTTP 400 (no file):**
```json
{ "success": false, "error": "No file uploaded" }
```

**Error Response — HTTP 500:**
```json
{ "success": false, "error": "Internal server error" }
```

---

## 6. Error Reference

| Code / Condition | HTTP Status | Response Field | Description |
|---|---|---|---|
| No `file` in multipart body | 400 | `error` | Guard at controller level before any processing |
| `extractionStatus: 'FAILED'` | 200 | `data.message` | Validity check failed — no base component with SI options extracted |
| `extractionStatus: 'PARTIAL'` | 200 | `data.warnings[]` | One or more stages fell back to safe defaults |
| Azure Document Intelligence unavailable | 500 | `error` | `processDocumentWithDocumentIntelligence` throws |
| Azure Cognitive Search unavailable | 500 | `error` | `createSearchIndexIfNotExists` or `indexDocumentIntelligenceResults` throws |
| Azure OpenAI unavailable | 200 | `extractionStatus: 'FAILED'` | All stage AI calls fail → validity check fails → `{}` returned with message |
| Empty document content (no text layer) | 200 | `extractionStatus: 'FAILED'` | `documentContent` is empty after search fetch → immediate fallback with audit record |
| Audit DB write failure | — | — | Logged at ERROR level; API response not affected |

### Warning Messages (per-stage)

| Stage | Warning Text |
|---|---|
| Stage 1 | `"Stage 1 (Components) could not be fully extracted — defaults applied."` |
| Stage 2 | `"Stage 2 (Relationships) could not be extracted — defaults applied."` |
| Stage 3 | `"Stage 3 (Template) could not be extracted — defaults applied."` |
| Stage 4 | `"Stage 4 (Parameters) could not be extracted — defaults applied."` |
| Stage 5 | `"Stage 5 (Choices) premiums defaulted to 0 — fill manually in Stage 5."` |
| Stage 6 | `"Stage 6 (Constraints) could not be extracted — defaults applied."` |

---

## 7. Configuration Requirements

All configuration values are under the `openAi` namespace in the `ai-service` environment config:

| Config Key | Description |
|---|---|
| `openAi.intelligenceEndpoint` | Azure Document Intelligence endpoint URL |
| `openAi.intelligenceKey` | Azure Document Intelligence API key |
| `openAi.searchEndPoint` | Azure Cognitive Search endpoint URL |
| `openAi.searchKey` | Azure Cognitive Search API key |
| `openAi.searchIndexName` | Azure Cognitive Search index name |
| `openAi.endpoint` | Azure OpenAI endpoint URL |
| `openAi.apiKey` | Azure OpenAI API key |
| `openAi.apiVersion` | Azure OpenAI API version (e.g. `2024-02-01`) |
| `openAi.deploymentName` | Azure OpenAI GPT deployment name |
| `S3_AWS_BUCKET` | S3 bucket name for file upload |
| `S3_AWS_ACCESS_KEY_ID` | AWS access key |
| `S3_AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `S3_AWS_REGION` | AWS region |

---

## 8. Task Breakdown

### Group A — service-lib

| # | Task | File(s) | Status |
|---|---|---|---|
| A-1 | Create `AiPolicyDocumentExtraction` entity with all columns | `apps/services/service-lib/src/lib/entities/ai-policy-document-extraction.entity.ts` | Done |
| A-2 | Export entity from barrel | `apps/services/service-lib/src/lib/entities/index.ts` | Done |
| A-3 | Add entity to `entities[]` array | `apps/services/service-lib/src/lib/entities/index.ts` | Done |

### Group B — ai-service

| # | Task | File(s) | Status |
|---|---|---|---|
| B-1 | Add `extractPolicyConfiguratorSwaggerMetadata()` function | `apps/services/ai-service/src/app/ai-service.swagger.ts` | Done |
| B-2 | Add `TypeOrmModule.forFeature([AiPolicyDocumentExtraction])` to `PdfAnalyserModule` | `apps/services/ai-service/src/app/pdf-analyser/pdf-analyser.module.ts` | Done |
| B-3 | Inject `extractionAuditRepository` in `PdfAnalyserService` constructor | `apps/services/ai-service/src/app/pdf-analyser/pdf-analyser.service.ts` | Done |
| B-4 | Implement `saveExtractionAuditRecord` private method | Same | Done |
| B-5 | Implement `stripMarkdownFromJson` private method | Same | Done |
| B-6 | Implement `callOpenAI` shared private helper | Same | Done |
| B-7 | Implement `extractStage1Components` private method | Same | Done |
| B-8 | Implement `extractStage2Relationships` private method | Same | Done |
| B-9 | Implement `extractStage3Template` private method | Same | Done |
| B-10 | Implement `extractStage4Parameters` private method | Same | Done |
| B-11 | Implement `generateStage5Skeleton` pure synchronous private method | Same | Done |
| B-12 | Implement `extractStage5Premiums` private method | Same | Done |
| B-13 | Implement `extractStage6Constraints` and `defaultConstraints` private methods | Same | Done |
| B-14 | Implement `extractPolicyConfigurationFromDocument` public method with full pipeline | Same | Done |
| B-15 | Add `POST /policy-configurator` endpoint to controller | `apps/services/ai-service/src/app/pdf-analyser/pdf-analyser.controller.ts` | Done |

### Group C — Database

| # | Task | File(s) | Notes |
|---|---|---|---|
| C-1 | Run SQL migration to create `ai_policy_document_extraction` table | Migration file in project migrations directory | Required before deployment |
| C-2 | Verify TypeORM synchronisation or migration order to ensure the table is created before `ai-service` starts | `app.module.ts` `synchronize` setting | Only required if `synchronize: false` in production TypeORM config |

### Group E — Frontend

| # | Task | File(s) | Status |
|---|---|---|---|
| E-1 | Add `extractPolicyConfiguration` endpoint constant | `apps/ui/ui-lib/src/lib/constants/endPoints.ts` | Done |
| E-2 | Add UI string constants: button label, toasts, modal copy, AI disclaimer alert | `apps/ui/iwork/src/app/constants/index.ts` | Done |
| E-3 | Create `ExtractPolicyFromPdfModal` component (2-phase: file picker → result preview) | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/ExtractPolicyFromPdfModal.tsx` | Done |
| E-4 | Add `extractPdfModalOpen` state, "Extract from PDF" button, `handleExtractConfirm` handler, and modal render to wizard | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/index.tsx` | Done |

### Group D — Testing

| # | Task | Type | Description |
|---|---|---|---|
| D-1 | Integration test | API | `POST /pdf-analyser/policy-configurator` with a valid GMC PDF → `extractionStatus: 'SUCCESS'`, all 6 keys present in `policyConfiguration` |
| D-2 | Integration test | API | Upload a non-policy PDF → `extractionStatus: 'FAILED'`, `policyConfiguration: {}`, descriptive message |
| D-3 | Unit test | Service | `generateStage5Skeleton` with 2 Age bands × 2 Gender options → 4 options with correct `optionMeta` |
| D-4 | Unit test | Service | `generateStage5Skeleton` with no parameters → 1 Universal Option |
| D-5 | Unit test | Service | `saveExtractionAuditRecord` wraps DB failure in try/catch → does not throw |
| D-6 | Unit test | Service | `stripMarkdownFromJson` correctly strips ` ```json ` fences and plain ` ``` ` fences |
| D-7 | Integration test | Database | Verify audit record is written for both SUCCESS and FAILED extractions |
| D-8 | Integration test | API | Call endpoint without `file` field → HTTP 400 with correct error message |

---

## 9. Reused Infrastructure (No Changes Required)

| Method | Location | Notes |
|---|---|---|
| `processDocumentWithDocumentIntelligence(file, userId)` | `PdfAnalyserService` | Unchanged; uploads to S3 + calls Azure Document Intelligence |
| `createSearchIndexIfNotExists(indexClient, indexName)` | `PdfAnalyserService` | Unchanged; idempotent index creation |
| `indexDocumentIntelligenceResults(searchClient, result, fileName, s3Key, documentId)` | `PdfAnalyserService` | Unchanged; indexes pages and tables |
| `deleteDocumentById(documentId)` | `PdfAnalyserService` | Unchanged; removes indexed document |
| Azure Cognitive Search setup in controller | `PdfAnalyserController` | Same `SearchIndexClient` + `SearchClient` initialisation pattern as `/cover` endpoint |
| TypeORM root config | `ai-service/app.module.ts` | Already has `TypeOrmModule.forRoot(typeOrmConfig)`; no changes needed |

---

---

## 10. Frontend Integration

### 10.1 Overview

The frontend integration adds an **"Extract from PDF"** button to the Policy Configurator wizard action bar. The button opens a modal that drives the entire extraction flow — file upload, API call, result preview, and configuration loading — without leaving the wizard page.

The extracted `policyConfiguration` from the API response maps **directly** to `PolicyConfiguration["configuration"]` used by the wizard:

| API response key | Wizard state key |
|---|---|
| `policyConfiguration.components` | `policyConfiguration.configuration.components` |
| `policyConfiguration.relationships` | `policyConfiguration.configuration.relationships` |
| `policyConfiguration.policyTemplate` | `policyConfiguration.configuration.policyTemplate` |
| `policyConfiguration.parameters` | `policyConfiguration.configuration.parameters` |
| `policyConfiguration.policyOptions` | `policyConfiguration.configuration.policyOptions` |
| `policyConfiguration.constraints` | `policyConfiguration.configuration.constraints` |

### 10.2 New Files

| File | Purpose |
|---|---|
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/ExtractPolicyFromPdfModal.tsx` | Self-contained 2-phase modal component |

### 10.3 Modified Files

| File | Change |
|---|---|
| `apps/ui/ui-lib/src/lib/constants/endPoints.ts` | Add `extractPolicyConfiguration` endpoint pointing to `environment.aiServiceUrl + "/pdf-analyser/policy-configurator"` |
| `apps/ui/iwork/src/app/constants/index.ts` | Add `EXTRACT_FROM_PDF` button label, three extraction toast messages, modal heading constant, and AI disclaimer alert to the existing `POLICY_CONFIGURATOR_*` constant objects |
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/index.tsx` | Add modal state, button, handler, modal render, and extraction-loaded flag |

### 10.4 `ExtractPolicyFromPdfModal` Component

**Props:**
```typescript
interface ExtractPolicyFromPdfModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (extractedConfig: PolicyConfiguration["configuration"]) => void;
}
```

**Internal state:**
```typescript
const [file, setFile] = useState<File | null>(null);
const [phase, setPhase] = useState<"pick" | "loading" | "result">("pick");
const [extractionResult, setExtractionResult] = useState<{
  policyConfiguration: object;
  extractionStatus: "SUCCESS" | "PARTIAL" | "FAILED";
  warnings: string[];
  message?: string;
} | null>(null);
const [error, setError] = useState<string | null>(null);
```

**API call pattern (multipart/form-data with userid header):**
```typescript
const handleExtract = async () => {
  if (!file) return;
  setPhase("loading");
  setError(null);

  const formData = new FormData();
  formData.append("file", file);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = user?.accessToken?.accessToken || "";
  const userId = user?.id || user?.userId || "";

  try {
    const response = await axios.post(
      endPoints.extractPolicyConfiguration,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          userid: String(userId),
          "Content-Type": "multipart/form-data",
        },
        timeout: 100000, // 100 s — slightly above the 90 s NFR target
      }
    );
    setExtractionResult(response.data?.data);
    setPhase("result");
  } catch (err: any) {
    setError(err?.response?.data?.error || "Extraction failed. Please try again.");
    setPhase("result");
  }
};
```

**Phase 1 — File Picker:**
- `<input type="file" accept=".pdf">` styled consistently with the app's MUI theme
- File name chip shown after selection
- "Extract" button disabled until a file is selected; shows `CircularProgress` and is disabled while loading

**Phase 2 — Result Preview:**
- `extractionStatus === "SUCCESS"`: MUI `Alert` with `severity="success"`, message _"All 6 stages extracted successfully."_
- `extractionStatus === "PARTIAL"`: MUI `Alert` with `severity="warning"`, message listing each item from `warnings[]`
- `extractionStatus === "FAILED"` or network error: MUI `Alert` with `severity="error"`, failure message
- "Load into Configurator" button: disabled when `extractionStatus === "FAILED"` or error; calls `onConfirm(extractedConfig)`
- "Cancel" button always enabled; calls `onClose()`

**Reset on close:** file, phase, result, and error state reset when the modal closes.

### 10.5 Wizard Integration (`index.tsx`)

**New state:**
```typescript
const [extractPdfModalOpen, setExtractPdfModalOpen] = useState(false);
const [wasConfigExtracted, setWasConfigExtracted] = useState(false);
```

**Handler:**
```typescript
const handleExtractConfirm = (extracted: PolicyConfiguration["configuration"]) => {
  setPolicyConfiguration((prev) => ({
    ...prev,
    configuration: {
      ...prev.configuration,
      components: extracted.components,
      relationships: extracted.relationships,
      policyTemplate: extracted.policyTemplate,
      parameters: extracted.parameters,
      policyOptions: extracted.policyOptions,
      constraints: extracted.constraints,
    },
  }));
  setCurrentStep("policyComponents");
  setWasConfigExtracted(true);
  setExtractPdfModalOpen(false);
  dispatch(setToastMessage({ message: POLICY_CONFIGURATOR_TOASTS.EXTRACT_LOADED }));
};
```

**Button placement** — added adjacent to the existing "Import Policy Configuration" button, shown under the same `canShowExportButton` condition:
```tsx
{canShowExportButton && (
  <StyledPrevButton
    variantType={BUTTON_VARIANTS.SECONDARY}
    onClick={() => setExtractPdfModalOpen(true)}
    disabled={isSaving}
    data-testid="policy-extract-from-pdf-button"
  >
    {POLICY_CONFIGURATOR_BUTTONS.EXTRACT_FROM_PDF}
  </StyledPrevButton>
)}
```

**AI disclaimer alert** — shown on Step 1 when `wasConfigExtracted` is true:
```tsx
{currentStep === "policyComponents" && wasConfigExtracted && (
  <StyledInfoAlert severity="info" onClose={() => setWasConfigExtracted(false)}>
    {POLICY_CONFIGURATOR_ALERTS.EXTRACT_AI_DISCLAIMER}
  </StyledInfoAlert>
)}
```

### 10.6 Endpoint and Auth

The `extractPolicyConfiguration` endpoint is added to `endPoints.ts` in the AI-service section:
```typescript
extractPolicyConfiguration: environment.aiServiceUrl + "/pdf-analyser/policy-configurator",
```

`aiServiceUrl` is already configured (`VITE_AI_API_URL || "http://localhost:3000/iirm/ai-service"`). No new environment variable is required.

The `userid` header value is read from the parsed `sessionStorage` user object. It is used for audit logging only (FR-AIE-022) and is not a security boundary (NFR-AIE-009).

### 10.7 Testing (Frontend)

| # | Test | Type | Description |
|---|---|---|---|
| E-D1 | Extract button visibility | Unit | Button visible on DRAFT/WIP; hidden on SUBMITTED/LIVE |
| E-D2 | Modal file validation | Unit | Non-PDF file shows validation error; Extract button disabled without a file |
| E-D3 | Loading state | Unit | CircularProgress shown and Extract button disabled during API call |
| E-D4 | SUCCESS result | Integration | SUCCESS response shows success alert; Load button enabled; config loaded into wizard |
| E-D5 | PARTIAL result | Integration | PARTIAL response shows warning alert listing all warnings from `warnings[]` |
| E-D6 | FAILED result | Integration | FAILED response shows error alert; Load button disabled |
| E-D7 | Configuration load | Unit | `handleExtractConfirm` replaces all 6 config keys and resets step to `policyComponents` |
| E-D8 | AI disclaimer | Unit | `wasConfigExtracted = true` shows disclaimer alert on Step 1; dismissing it clears the flag |

---

*Document created: 2026-06-15*
*Feature: AI Policy Document Extractor*
*Implemented in: ai-service, service-lib, iwork UI*
