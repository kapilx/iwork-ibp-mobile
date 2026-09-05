import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';
import { BusinessCard, BusinessCardError } from '../business-card/interfaces/business-card.interface';
import { OpenAiConfig } from './interfaces/open-ai.interface';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class OpenAiService {
  private openai: AzureOpenAI;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly configService: ConfigService,
    private readonly traceIdService: TraceIdService,
  ) {
    const config = this.configService.get<OpenAiConfig>('openAi');
    if (!config) {
      throw new Error('OpenAI configuration is missing.');
    }

    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);

    this.openai = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      apiVersion: config.apiVersion,
      deployment: config.deploymentName,
    });
  }

  async explainCardDetails(text: string): Promise<BusinessCard[] | BusinessCardError> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'OpenAiService',
        method: 'explainCardDetails',
        messageData: 'method invoked',
      }),
    });
    try {
      const prompt = `Here is extracted text from a business card: ${text}`;
      const deploymentName = this.configService.get<string>('openAi.deploymentName');
      
      if (!deploymentName) {
        throw new Error('OpenAI deployment name is missing.');
      }

      const response = await this.openai.chat.completions.create({
        model: deploymentName, // Using the retrieved value directly
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are a strict JSON generator for business card details. Your output must always be valid JSON, without any extra text.
            The input might contain multiple business cards data. 
            If the input is not a business card(does not contain **any identifiable information at all), then return:
            { "error": "This is not a business card. Please upload a valid business card.", "reason": "Reason for Invalid input" }

            Otherwise, return:
            [{
            "name": "...",
            "jobTitle": "...",
            "companyName": "...",
            "workPhoneNumber": [...],
            "personalPhoneNumber": [...],
            "faxNumber": "...",
            "workEmail": "...",
            "personalEmail": "...",
            "website": "...",
            "address": [
                {
                "plotNumber": "...",
                "doorNumber": "...",
                "buildingName": "...",
                "street": "...",
                "area": "...",
                "district": "...",
                "city": "...",
                "state": "...",
                "province": "...",
                "country": "...",
                "postalCode": "..."
                },
                {
                "plotNumber": "...",
                "doorNumber": "...",
                "buildingName": "...",
                "street": "...",
                "area": "...",
                "district": "...",
                "city": "...",
                "state": "...",
                "province": "...",
                "country": "...",
                "postalCode": "..."
                  }
            ],
            "socialMediaHandles": {
                "LinkedIn": "...",
                "Twitter": "...",
                "Instagram": "...",
                "Facebook": "...",
                "WeChat": "...",
                "WhatsApp": "...",
                "Telegram": "..."
            },
            "summary": "A two-line description of the company based on publicly available information. You should find something about the company."
            }]

            Segregation Rules:
            - **Work email**: If the email domain belongs to a company (e.g., name@company.com), classify it as "workEmail".
            - **Personal email**: If the email is from a free provider (e.g., Gmail, Yahoo, Outlook), classify it as "personalEmail".
            - **Work phone number**: If labeled as "Office", "Work", "Company" or matches a corporate format, classify it as "workPhoneNumber".
            - **Personal phone number**: If labeled as "Mobile", "Personal", or from a consumer telecom provider, classify it as "personalPhoneNumber".
            - **Fax number**: If the number is explicitly labeled as "Fax", classify it as "faxNumber".

            ### Address Segregation (International Support):
            If multiple addresses exist, store them as separate objects in a **list**, not concatenated strings. Do not truncate any data from the input. 
            Each object should contain:
            - **plotNumber** (Used in some countries instead of street number)
            - **doorNumber** (Specific house/unit number in apartment buildings or standalone homes)
            - **buildingName** (Used in places like Japan, UAE, Singapore), include floor numbers as well
            - **street** (Street name, Avenue, Boulevard, etc.)
            - **area** (Locality, neighborhood, township)
            - **district** (Important in Middle Eastern and Asian countries)
            - **city** 
            - **state** (For countries using "states" like the US, India, Australia)
            - **province** (For countries using "provinces" like Canada, China, Italy)
            - **country**
            - **postalCode**
            - **poBox** (Used in UAE, Qatar, etc.)

            If any field is missing, return null. But do not miss reading any fields. All the address from the card should be included in the JSON.

            ### Company Name Handling:
            - If the company name is missing, try inferring it from the email domain or website URL.

            ### Summary Extraction:
            - Find and include a two-line description of the company based on publicly available information. If the company is well-known, include key facts.
            - You should bring the company information without miss
            
            If there are multiple cards in the input, return a list of JSON objects.

            Return JSON array only even if it has single object, no explanations or extra text. All keys must be in camelCase.
            Strictly follow the JSON format. Return null or [] for keys if the information is not available. Make sure the value of any key should be possible value or null or []`
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      try {
        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error('Response content is null or undefined.');
        }
        return JSON.parse(content);
      } catch (err) {
        this.logger.error({
          level: 'error',
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: 'failure',
            location: 'OpenAiService',
            method: 'explainCardDetails',
            messageData: err,
          }),
        });
        return { error: 'Failed to parse response from OpenAI.' };
      }
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'OpenAiService',
          method: 'explainCardDetails',
          messageData: err,
        }),
      });
      return {
        error: 'Failed to communicate with OpenAI API.',
        details: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async extractTextFromImage(imageBase64: string, qrData: any): Promise<string> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'OpenAiService',
        method: 'extractTextFromImage',
        messageData: 'method invoked',
      }),
    });
    try {
      const message:any = [
        {
          type: 'text',
          text: `What's in this image? Read all the text and extract the information. Also consider any QR code content if present in ${qrData}`
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${imageBase64}` }
        }
      ];

      const model = this.configService.get<string>('openAi.deploymentName');
      if (!model) {
        throw new Error('OpenAI deployment name is missing.');
      }

      const response = await this.openai.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          { role: 'user', content: message } // Ensure messages are properly formatted
        ]
      });

      return response.choices[0].message.content || '';
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'OpenAiService',
          method: 'extractTextFromImage',
          messageData: err,
        }),
      });
      throw new Error(`Failed to extract text from image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async extractClaimFormData(rawText: string): Promise<{
    dtoFields: {
      diagnosis: string | null;
      estimatedClaimAmount: number | null;
      dateOfAdmission: string | null;
      proposedDischargeDate: string | null;
      claimType: 'CASHLESS' | 'REIMBURSEMENT' | null;
      hospitalName: string | null;
      hospitalLocation: string | null;
      placeOfAccident: string | null;
      patientName: string | null;
      patientRelation: string | null;
    };
    fullData: Record<string, unknown>;
  }> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'OpenAiService',
        method: 'extractClaimFormData',
        messageData: 'method invoked',
      }),
    });

    const deploymentName = this.configService.get<string>('openAi.deploymentName');
    if (!deploymentName) throw new Error('OpenAI deployment name is missing.');

    const systemPrompt = `You are an insurance claim form extraction engine.
Your job is to convert OCR output from Amazon Textract into structured JSON.
Return ONLY valid JSON — no markdown, no code blocks, no explanation, no comments.

SOURCE RELIABILITY ORDER (highest → lowest):
  1. [CHECKED] markers          ← ABSOLUTE truth, never override
  2. FORM FIELD KEY-VALUE PAIRS ← high confidence
  3. TABLE DATA                 ← medium confidence
  4. RAW OCR TEXT               ← lowest confidence, may contain OCR errors

When the same field appears in multiple sources, always use the value from the highest
confidence source. If equal-confidence sources conflict, return null.

EXTRACTION RULES:
1. DO NOT infer, guess, assume, or correct values. Extract only what is explicitly in the OCR.
2. NEVER truncate field values — read every character to the end.
3. RAW OCR TEXT may contain recognition errors — when a value appears in both RAW OCR and FORM FIELD KEY-VALUE PAIRS or [CHECKED] markers, always prefer the higher-confidence source.
4. If multiple [CHECKED] lines exist for the same field (e.g. injuryCause can have more than one ticked), return ALL selected values as an array. NEVER arbitrarily pick just one.
5. This form uses individual character boxes: text appears as "P A M P A N A" or merged "PAMPANA". Parse both as the same word.
6. Names are UPPERCASE. Combine SURNAME + FIRSTNAME + MIDDLENAME into one full name string.
   NAME TEMPLATE POLLUTION — strip these printed placeholder tokens from ALL name fields before returning:
   "SURNAME", "S U R N A M E", "FIRST NAME", "F I R S T N A M E", "FIRSTNAME",
   "MIDDLE NAME", "M I D D L E N A M E", "MIDDLENAME",
   "SI NAME", "ME NAME", "LE NAME", "RST NAME", "NAME MIDDLE NAME",
   "LAST NAME", "L A S T N A M E", "GIVEN NAME", "G I V E N N A M E"
   Applies to: patientName, sectionA name, sectionC name, sectionB patientName, treatingDoctorName, and all other name fields.
   After stripping, trim spaces. If empty, return null.
7. Convert dates from DD/MM/YYYY to YYYY-MM-DD. If ambiguous, return null.
8. Monetary amounts: strip Rs., ₹, commas, spaces — return plain number or null.
9. claimType must be exactly "CASHLESS" or "REIMBURSEMENT" based on the checked checkbox, otherwise null.
10. If a field is blank or unreadable, return null — never guess.
11. sectionF_billsEnclosed is an array — one object per bill row.
12. claimDocumentsChecklist (Part A) and sectionD_documentsChecklist (Part B) — include ONLY items whose line has a [CHECKED] marker. Return [] if none checked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKBOX INTERPRETATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The OCR pre-processor has already resolved all checkbox positions using Textract SELECTION_ELEMENT data.
Every SELECTED checkbox is emitted as its own dedicated line:  [CHECKED] <selected-label>
Unselected checkboxes produce NO [CHECKED] line — absence means not selected.
Each [CHECKED] line contains EXACTLY the label of ONE selected option — nothing else.
NEVER derive checkbox selections from surrounding text or medical knowledge.

── YES/NO FIELDS ──────────────────────────────────────────────────────────────────
For every field in the list below, find the [CHECKED] line that appears in that
field's section and map it:
  [CHECKED] Yes  →  field value = "Yes"
  [CHECKED] No   →  field value = "No"
  No [CHECKED] line found  →  field value = null

CRITICAL OVERRIDE — The checkbox is ABSOLUTE. Do NOT change a "No" to "Yes" (or
vice versa) because subordinate detail fields (company name, policy number, sum
insured, etc.) appear to be filled in. A form-filler may fill detail rows for
reference even when ticking No. The checkbox wins unconditionally.

YES/NO FIELD LIST (match [CHECKED] Yes/No by section proximity):
  partA.sectionB → currentlyCoveredByOtherInsurance
  partA.sectionB → hospitalizedInLastFourYears
  partA.sectionB → previouslyCoveredByOtherInsurance
  partA.sectionD → isMedicoLegal
  partA.sectionD → reportedToPolice
  partA.sectionD → mlcReportAttached
  partA.sectionE → domiciliaryHospitalization
  partB.sectionC → preAuthorizationObtained
  partB.sectionC → hospitalizationDueToInjury
  partB.sectionC → substanceAbuseTestConducted
  partB.sectionC → isMedicoLegal
  partB.sectionC → reportedToPolice
  partB.sectionE → facilitiesOt
  partB.sectionE → facilitiesIcu

── MULTI-CHOICE FIELDS ────────────────────────────────────────────────────────────
The [CHECKED] label IS the selected value. Match it to the allowed values below.
Return null if no [CHECKED] line matches.

  partA.sectionC → gender:                      "Male" | "Female"
  partA.sectionC → relationshipToPrimaryInsured: "Self" | "Spouse" | "Child" | "Father" | "Mother" | "Other"
  partA.sectionC → occupation:                   "Service" | "Self Employed" | "Home Maker" | "Student" | "Retired" | "Other"
  partA.sectionD → roomCategory:                 "Day care" | "Single occupancy" | "Twin sharing" | "3 or more beds per room"
  partA.sectionD → hospitalizationDueTo:         "Injury" | "Illness" | "Maternity"
  partA.sectionD → injuryCause:                  "Self inflicted" | "Road Traffic Accident" | "Substance Abuse / Alcohol Consumption"
  partB.sectionA → typeOfHospital:               "Network" | "Non Network"
  partB.sectionB → gender:                       "Male" | "Female"
  partB.sectionB → typeOfAdmission:              "Emergency" | "Planned" | "Day Care" | "Maternity"
  partB.sectionB → statusAtDischarge:            "Discharge to home" | "Discharge to another hospital" | "Deceased"
  partB.sectionC → injuryCause:                  "Self-inflicted" | "Road Traffic Accident" | "Substance abuse / alcohol consumption"

── DOCUMENT CHECKLISTS ────────────────────────────────────────────────────────────
Include an item ONLY if its exact text appears on a [CHECKED] line. No [CHECKED] = not checked = exclude it.
Return [] if nothing is checked.

PART A — sectionE_claimDetails.claimDocumentsChecklist:
  "Claim form duly signed", "Copy of the claim intimation, if any", "Hospital Main Bill",
  "Hospital Break-up Bill", "Hospital Bill Payment Receipt", "Hospital Discharge Summary",
  "Pharmacy Bill", "Operation Theater Notes", "ECG", "Doctor's request for investigation",
  "Investigation Reports (Including CT/MRI/USG/HPE)", "Doctor's Prescriptions", "Others"

PART B — sectionD_documentsChecklist (above is a reference list only — add ONLY items with [CHECKED]):
  "Claim Form duly signed", "Original Pre-authorization request",
  "Copy of the Pre-authorization approval letter",
  "Copy of Photo ID Card of patient Verified by hospital", "Hospital Discharge summary",
  "Operation Theatre Notes", "Hospital main bill", "Hospital break-up bill",
  "Investigation reports", "CT/MR/USG/HPE investigation reports",
  "Doctor's reference slip for investigation", "ECG", "Pharmacy bills",
  "MLC reports & Police FIR", "Original death summary from hospital where applicable",
  "Any other, please specify"

NOTE: In FORM KEY-VALUE PAIRS, a value of "SELECTED" means that checkbox is ticked — use the field lists above to map it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY this JSON structure (fill in actual values, do not omit any key):

{
  "dtoFields": {
    "patientName": null,
    "patientRelation": null,
    "diagnosis": null,
    "estimatedClaimAmount": null,
    "dateOfAdmission": null,
    "proposedDischargeDate": null,
    "claimType": null,
    "hospitalName": null,
    "hospitalLocation": null,
    "placeOfAccident": null
  },
  "fullData": {
    "partA": {
      "sectionA_primaryInsured": {
        "policyNumber": null,
        "slNoCertificateNo": null,
        "companyTpaIdNo": null,
        "name": null,
        "address": {
          "street": null,
          "city": null,
          "state": null,
          "pinCode": null,
          "phoneNo": null,
          "emailId": null
        }
      },
      "sectionB_insuranceHistory": {
        "currentlyCoveredByOtherInsurance": null,
        "dateOfFirstInsuranceWithoutBreak": null,
        "otherInsuranceCompanyName": null,
        "otherInsurancePolicyNo": null,
        "otherInsuranceSumInsured": null,
        "hospitalizedInLastFourYears": null,
        "hospitalizationDate": null,
        "hospitalizationDiagnosis": null,
        "previouslyCoveredByOtherInsurance": null,
        "previousInsuranceCompanyName": null
      },
      "sectionC_patientDetails": {
        "name": null,
        "gender": null,
        "ageYears": null,
        "ageMonths": null,
        "dateOfBirth": null,
        "relationshipToPrimaryInsured": null,
        "occupation": null,
        "address": {
          "street": null,
          "city": null,
          "state": null,
          "pinCode": null,
          "phoneNo": null
        }
      },
      "sectionD_hospitalization": {
        "hospitalName": null,
        "roomCategory": null,
        "hospitalizationDueTo": null,
        "dateOfInjuryOrDiseaseFirstDetected": null,
        "dateOfAdmission": null,
        "timeOfAdmission": null,
        "dateOfDischarge": null,
        "timeOfDischarge": null,
        "injuryCause": null,
        "isMedicoLegal": null,
        "reportedToPolice": null,
        "mlcReportAttached": null,
        "systemOfMedicine": null
      },
      "sectionE_claimDetails": {
        "treatmentExpenses": {
          "preHospitalization": null,
          "hospitalization": null,
          "postHospitalization": null,
          "healthCheckup": null,
          "ambulance": null,
          "others": null,
          "total": null,
          "preHospitalizationDays": null,
          "postHospitalizationDays": null
        },
        "domiciliaryHospitalization": null,
        "lumpSumBenefits": {
          "hospitalDailyCash": null,
          "surgicalCash": null,
          "criticalIllness": null,
          "convalescence": null,
          "prePostHospitalizationLumpSum": null,
          "others": null,
          "total": null
        },
        "claimDocumentsChecklist": []
      },
      "sectionF_billsEnclosed": [],
      "sectionG_bankDetails": {
        "pan": null,
        "accountNumber": null,
        "bankNameAndBranch": null,
        "chequeOrDDPayableDetails": null,
        "ifscCode": null
      },
      "sectionH_declaration": {
        "date": null,
        "place": null
      }
    },
    "partB": {
      "sectionA_hospital": {
        "hospitalName": null,
        "hospitalId": null,
        "typeOfHospital": null,
        "treatingDoctorName": null,
        "qualification": null,
        "registrationNoWithStateCode": null,
        "phoneNo": null
      },
      "sectionB_patientAdmitted": {
        "patientName": null,
        "ipRegistrationNumber": null,
        "gender": null,
        "ageYears": null,
        "ageMonths": null,
        "dateOfBirth": null,
        "dateOfAdmission": null,
        "timeOfAdmission": null,
        "dateOfDischarge": null,
        "timeOfDischarge": null,
        "typeOfAdmission": null,
        "maternityDateOfDelivery": null,
        "maternityGravidaStatus": null,
        "statusAtDischarge": null,
        "totalClaimedAmount": null
      },
      "sectionC_ailmentDiagnosed": {
        "icd10": {
          "primaryDiagnosis": { "code": null, "description": null },
          "additionalDiagnosis": { "code": null, "description": null },
          "comorbidities1": { "code": null, "description": null },
          "comorbidities2": { "code": null, "description": null }
        },
        "icd10Pcs": {
          "procedure1": { "code": null, "description": null },
          "procedure2": { "code": null, "description": null },
          "procedure3": { "code": null, "description": null },
          "procedureDetails": null
        },
        "preAuthorizationObtained": null,
        "preAuthorizationNumber": null,
        "reasonForNoPreAuth": null,
        "hospitalizationDueToInjury": null,
        "injuryCause": null,
        "substanceAbuseTestConducted": null,
        "isMedicoLegal": null,
        "reportedToPolice": null,
        "firNo": null,
        "reasonNotReportedToPolice": null
      },
      "sectionD_documentsChecklist": [],
      "sectionE_nonNetworkHospital": {
        "address": null,
        "city": null,
        "state": null,
        "pinCode": null,
        "phoneNo": null,
        "registrationNoWithStateCode": null,
        "hospitalPan": null,
        "numberOfInpatientBeds": null,
        "facilitiesOt": null,
        "facilitiesIcu": null
      },
      "sectionF_declaration": {
        "date": null,
        "place": null
      }
    }
  }
}

For sectionF_billsEnclosed each entry: { "slNo": 1, "billNo": null, "date": null, "issuedBy": null, "towards": null, "amount": null }
For sectionD_documentsChecklist list only checked items as strings, e.g. ["Claim Form duly signed", "Discharge Summary"]

OUTPUT RULES:
- Return STRICT JSON only.
- No markdown, no code fences, no explanation, no comments.
- No additional keys beyond the schema above.
- No reasoning, no confidence scores, no notes inside the JSON.
- null for missing fields. [] for empty arrays. Never omit a key.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: deploymentName,
        temperature: 0,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawText || '(no text extracted from document)' },
        ],
      });

      const content = response.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        dtoFields: parsed.dtoFields ?? {},
        fullData: parsed.fullData ?? {},
      };
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'OpenAiService',
          method: 'extractClaimFormData',
          messageData: err,
        }),
      });
      throw new Error(`GPT claim form extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

}