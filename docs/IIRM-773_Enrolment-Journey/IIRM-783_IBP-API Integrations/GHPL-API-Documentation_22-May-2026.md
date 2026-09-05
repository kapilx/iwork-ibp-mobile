# Good Health TPA — API Reference

**Broker:** IIRM
**Environments:** WebServ LIVE · WebAce SSO · ISBS Stage
**Methods:** POST (REST) · GET (SSO redirect)
**Content-Type:** `application/json`

---

## Document Metadata

| | |
|---|---|
| **Created Date** | 15-May-2026 |
| **Updated Date** | 22-May-2026 |
| **Source Documents** | See [Source References](#source-references) |

---

## Table of Contents

1. [API Master Index](#api-master-index)
2. [Authentication](#authentication)
3. [Environments](#environments)
4. [Good Health TPA — WebServ APIs](#good-health-tpa--webserv-apis)
   - [1. Get Claim Details (All Records)](#1-get-claim-details-all-records)
   - [2. Get Single Claim Details](#2-get-single-claim-details)
5. [Good Health TPA — SSO](#good-health-tpa--sso)
   - [3. WebAce SSO (Encrypted Redirect)](#3-webace-sso-encrypted-redirect)
6. [ISBS Broker APIs](#isbs-broker-apis)
   - [4. Broker Claim Intimation](#4-broker-claim-intimation)
   - [5. Broker Claim Document Upload](#5-broker-claim-document-upload)
7. [Claim Status — WhatsApp](#claim-status--whatsapp)
8. [Status Codes](#status-codes)
9. [Error Handling](#error-handling)
10. [Open Questions](#open-questions)
11. [Source References](#source-references)
12. [Appendix A — ICD Complaints Master](#appendix-a--icd-complaints-master)

---

## API Master Index

| # | API Name | Method | Environment | URL | Source Date |
|---|---|---|---|---|---|
| 1 | Get Claim Details (All Records) | POST | WebServ LIVE | `https://webserv.goodhealthtpa.in/api/Intermediary/GetClaims` | 04-May-2026 |
| 2 | Get Single Claim Details | POST | WebServ LIVE | `https://webserv.goodhealthtpa.in/api/Intermediary/GetSingleClaimDetails` | 13-May-2026 |
| 3 | WebAce SSO (Redirect) | GET | WebAce LIVE | `https://webace.goodhealthtpa.in/PrudentSSO.aspx` | 04-May-2026 |
| 4 | Broker Claim Intimation (Create) | POST | ISBS Stage | `https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimCreation` | 04-May-2026 |
| 5 | Broker Claim Document Upload | POST | ISBS Stage | `https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimDocupload` | 04-May-2026 |
| – | Claim Status via WhatsApp (QR) | – | LIVE | QR → `https://goodhealthtpa.com/wp-content/uploads/2024/09/I4A2FPAGJM4UC1.png` | 04-May-2026 |

---

## Authentication

### Good Health TPA — WebServ — Body Authentication

WebServ APIs authenticate via `userName` + `password` fields in the request body — no Authorization header required.

| Field | Type | Description |
|---|---|---|
| `userName` | string | IIRM broker username — `IIRMHO` |
| `password` | string | IIRM broker password — `IIRMHO` |

### Good Health TPA — SSO — AES-256 CBC Encrypted Query Params

WebAce SSO uses AES-256 CBC encryption (Rijndael, ISO10126 padding) to encrypt `PolicyId` and `EmpId` before passing them as URL query parameters.

| Field | Type | Description |
|---|---|---|
| `EncryptedPartnerId` | string | AES-encrypted Policy ID, Base64-encoded |
| `EncryptedSSO` | string | AES-encrypted Employee ID, Base64-encoded |

### ISBS — Body Authentication

ISBS APIs authenticate via request body fields — no Authorization header required.

| Field | Type | Description |
|---|---|---|
| `brokerUsername` | string | IIRM broker username |
| `brokerPassword` | string | IIRM broker password |
| `brokerAPIKey` | string | Pre-shared encrypted API key issued by ISBS |

ISBS uses **AES + Rfc2898DeriveBytes** (PBKDF2-derived key/IV) for the broker key.
Broker Key (Stage): `E6A180E54B3FA06FEBFAE171BBF399E9`

---

## Environments

| Environment | Base URL |
|---|---|
| GH TPA WebAce — SSO | `https://webace.goodhealthtpa.in` |
| GH TPA WebServ — LIVE | `https://webserv.goodhealthtpa.in/api/Intermediary` |
| ISBS — Stage | `https://dev.isbsindia.in/WebServ/api/Intermediary` |

---

## Good Health TPA — WebServ APIs

> WebServ APIs authenticate via `userName` + `password` in the body. Source documents provide LIVE URL only — UAT URL not yet confirmed *(see Open Question Q1)*.

---

### 1. Get Claim Details (All Records)

Fetches all claim details for a given policy and policy period. Returns an array of claim records (cashless and reimbursement).
**Source:** `GHPL - Get Claim (All) Details_4-May-2026.docx`

**Endpoint**
```
POST https://webserv.goodhealthtpa.in/api/Intermediary/GetClaims   [LIVE]
```

> Provide broker login credentials along with the policy number and policy period.

#### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `userName` | string | Required | IIRM broker username — `IIRMHO` |
| `password` | string | Required | IIRM broker password — `IIRMHO` |
| `policyNo` | string | Required | Policy number e.g. `0723002824P108701489` |
| `policyStartDate` | string | Required | Policy start date. Format: `DD-MM-YYYY` |
| `policyEndDate` | string | Required | Policy end date. Format: `DD-MM-YYYY` |

#### Example Request

```json
{
  "userName":        "IIRMHO",
  "password":        "IIRMHO",
  "policyNo":        "0723002824P108701489",
  "policyStartDate": "01-07-2024",
  "policyEndDate":   "30-06-2025"
}
```

#### Response Fields (array — one object per claim)

| Field | Type | Description |
|---|---|---|
| `COMPANY_NAME` | string | Employer / company name |
| `INSURANCE_COMPANY_NAME` | string | Insurer name |
| `POLICY_NO` | string | Policy number |
| `POLICY_START_DATE` | string | Policy start date `DD/MM/YYYY` |
| `POLICY_END_DATE` | string | Policy end date `DD/MM/YYYY` |
| `TPA_ID` | string | TPA-assigned health ID |
| `EMPLOYEE_NO` | string | Employee number |
| `EMPLOYEE_NAME` | string | Employee name |
| `PATIENT_NAME` | string | Patient name |
| `PATIENT_DOB` | string | Patient date of birth `DD/MM/YYYY` |
| `PATIENT_RELATION` | string | Relation to employee e.g. `FATHER`, `SELF` |
| `PRE_AUTH_NO` | string | Pre-authorisation number |
| `PRE_AUTH_TYPE` | string | `CASHLESS` / `REIMBURSEMENT` |
| `PRE_AUTH_REQUEST_DATE` | string | Date pre-auth requested |
| `PRE_AUTH_SENT_DATE` | string | Date pre-auth sent |
| `PRE_AUTH_AMOUNT` | string | Pre-auth amount |
| `PRE_AUTH_STATUS` | string | Pre-auth status *(see Open Question Q5)* |
| `PRE_AUTH_STATUS_DATE` | string | Pre-auth status date |
| `CLAIM_ID` | string | Claim ID — use to fetch single claim details |
| `CLAIM_TYPE` | string | `CASHLESS` / `REIMBURSEMENT` |
| `ICD_CODE` | string | ICD diagnosis code e.g. `N18` |
| `AILMENT` | string | Ailment description |
| `PROCEDURE_NAME` | string | Procedure performed |
| `DATE_OF_ADMISSION` | string | Date of hospital admission |
| `DATE_OF_DISCHARGE` | string | Date of hospital discharge |
| `CLAIM_REG_DATE` | string | Claim registration date |
| `CLAIM_RECEIVED_DATE` | string | Date claim was received |
| `CLAIM_AMOUNT` | string | Total claim amount |
| `APPROVED_AMOUNT` | string | Approved amount |
| `APPROVED_DATE` | string | Approval date |
| `DEDUCTION_AMOUNT` | string | Deduction amount |
| `DEDUCTION_REASONS` | string | Reasons for deduction |
| `SETTLED_DATE` | string | Settlement date |
| `CHEQUE_AMOUNT` | string | Cheque amount |
| `CHEQUE_NO` | string | Cheque number |
| `CHEQUE_DATE` | string | Cheque date |
| `DISPATCH_DATE` | string | Dispatch date |
| `NEFT_REF_NO` | string | NEFT reference number |
| `NEFT_DATE` | string | NEFT date |
| `CLAIM_STATUS` | string | Final claim status e.g. `Settled`, `Pending`, `Rejected` *(see Open Question Q4)* |
| `STATUS_REASON` | string | Status reason |
| `SUM_INSURED` | string | Total sum insured |
| `BALANCE_SUM_INSURED` | string | Available balance sum insured |
| `HOSPITAL_NAME` | string | Hospital name |
| `HOSPITAL_CITY` | string | Hospital city |
| `HOSPITAL_STATE` | string | Hospital state |
| `DOCUMENT_REQUIRED` | string | Documents required (if any) |
| `FILE_NO` | string | File number |

#### Example Response

```json
[
  {
    "COMPANY_NAME":           "TEAMLEASE UNITED",
    "INSURANCE_COMPANY_NAME": "United India Insurance Co. Ltd.",
    "POLICY_NO":              "0723002824P108701489",
    "POLICY_START_DATE":      "01/07/2024",
    "POLICY_END_DATE":        "30/06/2025",
    "TPA_ID":                 "GHUI0421428405",
    "EMPLOYEE_NO":            "T13794",
    "EMPLOYEE_NAME":          "AJESH BALACHANDRAN",
    "PATIENT_NAME":           "BALACHANDRAN MEPURATHU NARAYANAN",
    "PATIENT_DOB":            "11/02/1947",
    "PATIENT_RELATION":       "FATHER",
    "PRE_AUTH_NO":            "1248141",
    "PRE_AUTH_TYPE":          "CASHLESS",
    "CLAIM_ID":               "1248141",
    "CLAIM_TYPE":             "CASHLESS",
    "ICD_CODE":               "N18",
    "AILMENT":                "CKD",
    "PROCEDURE_NAME":         "Hemodialysis",
    "DATE_OF_ADMISSION":      "02/08/2024",
    "DATE_OF_DISCHARGE":      "28/08/2024",
    "CLAIM_AMOUNT":           "32500",
    "APPROVED_AMOUNT":        "32500",
    "DEDUCTION_AMOUNT":       "0",
    "DEDUCTION_REASONS":      "DIALYSIS",
    "CHEQUE_AMOUNT":          "29250",
    "NEFT_REF_NO":            "24529754063",
    "NEFT_DATE":              "26/09/2024",
    "CLAIM_STATUS":           "Settled",
    "SUM_INSURED":            "2000000",
    "BALANCE_SUM_INSURED":    "1230452",
    "HOSPITAL_NAME":          "MANIPAL HOSPITALS - DWARKA",
    "HOSPITAL_CITY":          "NEW DELHI",
    "HOSPITAL_STATE":         "DELHI"
  }
]
```

---

### 2. Get Single Claim Details

Fetches claim details for a specific claim ID. Validates broker credentials and forwards the request to the downstream Java Claim Status service.
**Source:** `GHPL - GetSingleClaimDetails_PROD_13-May-2026.docx`

**Endpoint**
```
POST https://webserv.goodhealthtpa.in/api/Intermediary/GetSingleClaimDetails   [LIVE]
```

> Pass the correct policy number to which the respective claim is tagged. Java Service backend.

#### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `userName` | string | Required | IIRM broker username |
| `password` | string | Required | IIRM broker password |
| `policyNo` | string | Required | Policy number |
| `policyStartDate` | string | Required | Policy start date. Format: `DD-MM-YYYY` |
| `policyEndDate` | string | Required | Policy end date. Format: `DD-MM-YYYY` |
| `claimId` | string | Required | Claim ID from Get Claim Details (All Records) |

#### Example Request

```json
{
  "userName":        "IIRMHO",
  "password":        "IIRMHO",
  "policyNo":        "0723002824P108701489",
  "policyStartDate": "01-07-2024",
  "policyEndDate":   "30-06-2025",
  "claimId":         "1248141"
}
```

#### Sample cURL

```bash
curl --location 'https://webserv.goodhealthtpa.in/api/Intermediary/GetSingleClaimDetails' \
  --header 'Content-Type: application/json' \
  --data '{
    "userName":        "IIRMHO",
    "password":        "IIRMHO",
    "policyNo":        "0723002824P108701489",
    "policyStartDate": "01-07-2024",
    "policyEndDate":   "30-06-2025",
    "claimId":         "1248141"
  }'
```

#### Response Fields (array with single object — camelCase from Java service)

| Field | Type | Description |
|---|---|---|
| `companyName` | string | Employer / company name |
| `insuranceCompanyName` | string | Insurer name |
| `policyNo` | string | Policy number |
| `policyStartDate` | string | Policy start date `YYYY-MM-DD HH:mm:ss.S` |
| `policyEndDate` | string | Policy end date |
| `tpaId` | string | TPA-assigned health ID |
| `employeeNo`, `employeeName` | string | Employee identifiers |
| `patientName`, `patientDob`, `patientRelation` | string | Patient details |
| `preAuthNo`, `preAuthType`, `preAuthRequestDate`, `preAuthSentDate`, `preAuthAmount`, `preAuthStatus`, `preAuthStatusDate` | string | Pre-authorisation details |
| `claimId`, `claimType` | string | Claim identifiers |
| `icdCode`, `ailment`, `procedureName` | string | Clinical details |
| `dateOfAdmission`, `dateOfDischarge` | string | Hospitalisation dates |
| `claimRegDate`, `claimReceivedDate` | string | Claim registration dates |
| `claimAmount`, `approvedAmount`, `approvedDate` | string | Claim amounts |
| `deductionAmount`, `deductionReasons` | string | Deductions |
| `settledDate`, `chequeAmount`, `chequeNo`, `chequeDate`, `dispatchDate` | string | Settlement details |
| `neftRefNo`, `neftDate` | string | NEFT details |
| `claimStatus`, `statusReason` | string | Final status |
| `sumInsured`, `balanceSumInsured` | string | Sum insured |
| `hospitalName`, `hospitalCity`, `hospitalState` | string | Hospital details |
| `documentRequired`, `fileNo` | string | Documents / file reference |

#### Example Response

```json
[
  {
    "companyName":          "TEAMLEASE GROUP UNITED",
    "insuranceCompanyName": "United India Insurance Co. Ltd.",
    "policyNo":             "0723002824P108701489",
    "policyStartDate":      "2024-07-01 00:00:00.0",
    "policyEndDate":        "2025-06-30 00:00:00.0",
    "tpaId":                "GHUI0421428405",
    "employeeNo":           "T13794",
    "employeeName":         "AJESH BALACHANDRAN",
    "patientName":          "BALACHANDRAN MEPURATHU NARAYANAN",
    "patientRelation":      "FATHER",
    "preAuthNo":            "1248141",
    "preAuthType":          "CASHLESS",
    "preAuthAmount":        "32500",
    "preAuthStatus":        "Settled",
    "claimId":              "1248141",
    "claimType":            "CASHLESS",
    "icdCode":              "N18",
    "ailment":              "CKD",
    "procedureName":        "Hemodialysis",
    "claimAmount":          "32500",
    "approvedAmount":       "32500",
    "deductionAmount":      "0",
    "deductionReasons":     "DIALYSIS",
    "chequeAmount":         "29250",
    "neftRefNo":            "24529754063",
    "claimStatus":          "Settled",
    "sumInsured":           "2000000",
    "hospitalName":         "MANIPAL HOSPITALS - DWARKA",
    "hospitalCity":         "NEW DELHI",
    "hospitalState":        "DELHI",
    "documentRequired":     "okok, Admissible, Total no of pages are 36, OK …"
  }
]
```

#### Failure Responses

**Case 1 — Invalid Credentials**
```json
{ "errorMsg": "Invalid broker username or password" }
```

**Case 2 — Downstream Service Unreachable**
```json
{ "errorMsg": "Java service not reachable" }
```

**Case 3 — No Data Found**
```json
[]
```

> Field names are **camelCase** (Java service) — different from UPPER_SNAKE_CASE in API #1. Date formats also differ (`YYYY-MM-DD HH:mm:ss.S` vs `DD/MM/YYYY`) *(see Open Question Q6)*.

---

## Good Health TPA — SSO

---

### 3. WebAce SSO (Encrypted Redirect)

Single Sign-On flow into WebAce Web Portal using AES-256 CBC encrypted credentials passed as URL query parameters. **No REST API** — this is a browser redirect flow.
**Source:** `GHPL - SSO_4-May-2026.docx`

**Endpoint**
```
GET https://webace.goodhealthtpa.in/PrudentSSO.aspx?EncryptedPartnerId={…}&EncryptedSSO={…}
```

#### Flow

1. User Portal collects `PolicyId` (PartnerId) and `EmpId` (SSO).
2. Both values are AES-256 CBC encrypted using a pre-shared `Key` and `IV` (config: `PrudentTPAKey`, `PrudentTPAIV`).
3. Base64-encoded ciphertext is appended to the redirect URL.
4. WebAce decrypts, validates against the WebAce DB (`corpins.GET_LOGIN_PRUDENT_SSO`), and establishes session.

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `EncryptedPartnerId` | string (Base64) | Required | AES-encrypted Policy ID |
| `EncryptedSSO` | string (Base64) | Required | AES-encrypted Employee ID |

> If the URL contains `+` characters that get URL-decoded into spaces or `@`, WebAce internally replaces `@` → `+` before decrypting.

#### Encryption Spec

| Parameter | Value |
|---|---|
| Algorithm | AES (RijndaelManaged) |
| Key Size | 256 bits |
| Block Size | 128 bits |
| Mode | CBC |
| Padding | ISO10126 |
| Key | UTF-8 bytes of `PrudentTPAKey` *(pre-shared)* |
| IV | UTF-8 bytes of `PrudentTPAIV` *(pre-shared)* |
| Output | Base64 |

#### Sample Encrypt (C#)

```csharp
private string Encrypt(string plainStr, string Key, string IV, int keySize)
{
    var aes = new RijndaelManaged
    {
        KeySize   = keySize,
        BlockSize = 128,
        Mode      = CipherMode.CBC,
        Padding   = PaddingMode.ISO10126,
        IV        = ASCIIEncoding.UTF8.GetBytes(IV),
        Key       = ASCIIEncoding.UTF8.GetBytes(Key)
    };
    var plainBytes  = ASCIIEncoding.UTF8.GetBytes(plainStr);
    var cipherBytes = aes.CreateEncryptor()
                         .TransformFinalBlock(plainBytes, 0, plainBytes.Length);
    return Convert.ToBase64String(cipherBytes);
}
```

#### Sample Redirect

```csharp
int    keySize      = 256;
string Key          = ConfigurationManager.AppSettings["PrudentTPAKey"];
string IV           = ConfigurationManager.AppSettings["PrudentTPAIV"];
string EncryptedPid = Encrypt(policyId,   Key, IV, keySize);
string EncryptedSSO = Encrypt(employeeId, Key, IV, keySize);
Response.Redirect(
  $"https://webace.goodhealthtpa.in/PrudentSSO.aspx?EncryptedPartnerId={EncryptedPid}&EncryptedSSO={EncryptedSSO}"
);
```

#### Outcomes

| Outcome | Behaviour |
|---|---|
| Success | WebAce session created; redirected to `Home.aspx` |
| Policy not found | Error: `Invalid login credentials.` |
| Missing query params | Error: `Encrypted PartnerId & SSO Required` |
| Decryption / other exception | Error: `Error : <exception message>` |

> Pre-shared `PrudentTPAKey` and `PrudentTPAIV` must be obtained from Good Health TPA — never log or expose them *(see Open Question Q7)*.

---

## ISBS Broker APIs

> ISBS APIs authenticate via **request body fields** (brokerUsername, brokerPassword, brokerAPIKey) — no Authorization header required.
> Broker Key (Stage): `E6A180E54B3FA06FEBFAE171BBF399E9`
> Encryption: AES + Rfc2898DeriveBytes (PBKDF2-derived key/IV, salt = `Ivan Medvedev`).

---

### 4. Broker Claim Intimation

Creates a new claim intimation in the ISBS system. Returns a Claim Creation Number (CCN).
**Source:** `Broker_API_CLM_INTIMATION_UAT_4-May-2026.docx`

**Endpoint**
```
POST https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimCreation   [STAGE]
```

#### Request Body

> Source data dictionary uses UPPER_CASE field names; sample payload uses camelCase. Both shown below — confirm the live API wire format *(see Open Question Q8)*.

| Field (sample) | Field (dictionary) | Type | Required | Min/Max | Allowed Values | Description |
|---|---|---|---|---|---|---|
| `brokerUsername` | `BROKER_USERNAME` | string | Required | 3–100 | – | IIRM broker username |
| `brokerPassword` | `BROKER_PASSWORD` | string | Required | 3–100 | – | IIRM broker password |
| `brokerAPIKey` | `SECURED_KEY` | string | Required | – | – | Pre-shared encrypted API key *(see Open Question Q9)* |
| `ptGhCardId` | `PT_GH_CARDID` | string | Required | 12–50 | – | Patient's Good Health card ID e.g. `GHBA0102084924` |
| `policyNo` | `POLICY_NO` | string | Required | 7–50 | – | Policy number e.g. `ABC/2026/1901` |
| `clmPatientName` | `CLM_PATIENT_NAME` | string | Required | 3–200 | – | Patient full name |
| `ptMobileNo` | `PT_MOBILE_NO` | string | Required | 10–15 | – | Patient mobile number |
| `ptEmail` | `PT_EMAIL` | string | Required | 4–100 | – | Patient email address |
| `ghHospitalId` | `GH_HOSPITALID` | string | Conditional | – | – | Good Health hospital ID. **Required if admitted in GH network hospital** |
| `clmRequestedAmt` | `CLM_REQUESTED_AMOUNT` | string | Required | – | – | Claim requested amount in INR |
| `clmHospFrom` | `CLM_HOSPFROM` | string | Required | 20–35 | ISO 8601 | Admission datetime (from) |
| `clmHospTo` | `CLM_HOSPTO` | string | Required | 20–35 | ISO 8601 | Admission datetime (to / est. discharge) |
| `clmHospName` | `CLM_HOSPITALNAME` | string | Required | 3–200 | – | Hospital name |
| `clmCity` | `CLM_CITY` | string | Conditional | 3–100 | – | Hospital city. **Required if `GH_HOSPITALID` absent** |
| `clmState` | `CLM_STATE` | string | Conditional | 3–100 | – | Hospital state. **Required if `GH_HOSPITALID` absent** |
| `clmHospAddress` | `CLM_HOSPITAL_ADDRESS` | string | Conditional | 3–500 | – | Hospital full address. **Required if `GH_HOSPITALID` absent** |
| `clmPincode` | `CLM_PINCODE` | string | Conditional | 4–10 | – | PIN code. **Required if `GH_HOSPITALID` absent** |
| `clmReasonAdmission` | `CLM_REASON_ADM` | string | Required | 5–500 | See ICD master | Reason for admission. Format: `<Complaint>(<ICD>)` e.g. `DentalCaries(K02.9)` — *see [ICD Complaints Master](#appendix-a--icd-complaints-master)* |
| `clmNatureOfLossCode` | `CLM_NATURE_OF_LOSS_CODE` | string | Required | 3–100 | `Illness`, `Injury`, `Maternity`, `OPD` | Nature of loss |
| `clmCommunicationRemarks` | `CLM_COMMUNICATION_REMARKS` | string | Required | 4–500 | – | Free-text communication remarks |
| `clmSubtype` | `CLM_SUBTYPE` | string | Required | 4–20 | `IP-1`, `OPD Claim-2`, `Domiciliary Hospitalization-3`, `Health Check up-4`, `Benefit Claims-5` | Claim subtype |
| `clmTypeOfAdmission` | `CLM_TYPE_OF_ADMISSION` | string | Required | 3–50 | `Emergency`, `Planned`, `Day Care`, `OPD` | Type of admission |
| `moduleId` | `moduleId` | int | Required | – | `1` | Module identifier |

#### Example Request

```json
{
  "brokerUsername":          "IIRMHO",
  "brokerPassword":          "IIRMHO",
  "brokerAPIKey":            "2sNt9WUV/FnDsHxVPZRVU9Vc2F7erhqXDzz6ViN30ldY...",
  "ptGhCardId":              "GHIL0500023716",
  "policyNo":                "4016/X/377719834/01/000",
  "clmPatientName":          "MADHUBABU G",
  "ptMobileNo":              "9876543210",
  "ptEmail":                 "abcd@gmail.com",
  "ghHospitalId":            165392,
  "clmRequestedAmt":         1000,
  "clmHospFrom":             "2026-01-17T18:30:00.000Z",
  "clmHospTo":               "2026-01-18T19:30:00.000Z",
  "clmHospName":             "Apollo Hospital",
  "clmCity":                 "HYDERABAD",
  "clmState":                "TELANGANA",
  "clmHospAddress":          "Hyderabad",
  "clmPincode":              "522614",
  "clmReasonAdmission":      "DentalCaries(K02.9)",
  "clmNatureOfLossCode":     "Illness",
  "clmCommunicationRemarks": "test",
  "clmSubtype":              "IP-1",
  "clmTypeOfAdmission":      "Emergency",
  "moduleId":                "1"
}
```

#### Response Fields

| Field (sample) | Field (dictionary) | Type | Description |
|---|---|---|---|
| `ccn` | `CCN` | string | Claim Control Number assigned by TPA. Use as `ccno` in document upload |
| `error_Flag` | `ERROR_FLAG` | string | `"0"` = success, `"1"` = error |
| `error_Message` | `ERROR_MSG` | string | Error description. Empty string on success |

#### Example Success Response

```json
{
  "ccn":           "1334234",
  "error_Flag":    "0",
  "error_Message": ""
}
```

#### Example Failure Response

```json
{
  "ccn":           "",
  "error_Flag":    "1",
  "error_Message": "CLAIM DOA DOES NOT FALL IN BETWEEN DOJ AND DOL"
}
```

> Store the `ccn` — it is required as `ccno` in API #5 (Broker Claim Document Upload).

---

### 5. Broker Claim Document Upload

Uploads a claim document (Base64-encoded) to ISBS against an existing CCN.
**Source:** `Broker_API_CLM_INTIMATION_UAT_4-May-2026.docx`

**Endpoint**
```
POST https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimDocupload   [STAGE]
```

#### Request Body

| Field (sample) | Field (dictionary) | Type | Required | Allowed Values | Description |
|---|---|---|---|---|---|
| `brokerUserName` | `BROKER_USERNAME` | string | Required | – | IIRM broker username |
| `brokerPassword` | `BROKER_PASSWORD` | string | Required | – | IIRM broker password |
| `brokerAPIKey` | `SECURED_KEY` | string | Required | – | Pre-shared encrypted API key |
| `base64String` | `BASE64STRING` | string | Required | – | Base64-encoded file content |
| `ccno` | `CCNO` | string | Required | – | Claim Creation Number from API #4 |
| `docCatagory` | `DOC_CATEGORY` | string | Required | See [Document Categories](#document-categories) | Document category |
| `docName` | `DOC_NAME` | string | Required | – | Document display name e.g. `DISCHARGESUMMARY` |
| `docType` | `DOC_TYPE` | string | Required | `pdf`, `jpg`, `png` | File type *(see Open Question Q10)* |
| `moduleId` | `moduleId` | int | Required | `1` | Module identifier |

#### Document Categories

| Category | Description |
|---|---|
| Claim Form (Part A & Part B) | Duly completed by the insured and hospital |
| PPN Declaration Form | Original — GIPSA PPN hospital only |
| TPA ID Card | Photocopy |
| Employee Photo ID Proof | Employee ID card, Aadhaar card & PAN Card (mandatory) |
| Cancelled Cheque | With printed name or Bank Statement |
| Discharge Card/Summary | Original |
| Indoor Case Papers (ICP) | If required |
| Police FIR/Medico Legal Certificate | Mandatory for all road traffic accidents |
| Hospital Main Bill | Original with detailed break-up |
| Investigation Bills and Reports | Original |
| Prescriptions | Original on Doctor's letterhead |
| Pharmacy Bills | Original receipts/Cash Memo |
| Implant Stickers and Invoices | For specific surgeries |

#### Example Request

```json
{
  "brokerUserName": "IIRMHO",
  "brokerPassword": "IIRMHO",
  "brokerAPIKey":   "2sNt9WUV/FnDsHxVPZRVU9Vc2F7erhqXDzz6ViN30ldY...",
  "base64String":   "JVBERi0xLjQKMSAwIG9iago...",
  "ccno":           "1334234",
  "docCatagory":    "Discharge Card/Summary",
  "docName":        "DISCHARGESUMMARY",
  "docType":        "pdf",
  "moduleId":       1
}
```

#### Response Fields

| Field (sample) | Field (dictionary) | Type | Description |
|---|---|---|---|
| `ccno` | `CCN` | string | Claim Control Number echoed back. `"0"` on failure |
| `errorFlag` | `ERROR_FLAG` | string | `"0"` = success, `"1"` = error |
| `errorMsg` | `ERROR_MSG` | string | Error description. Empty string on success |

#### Example Success Response

```json
{
  "ccno":      "1334234",
  "errorMsg":  "",
  "errorFlag": "0"
}
```

#### Example Failure Response

```json
{
  "ccno":      "0",
  "errorMsg":  "FTP UPLOAD FAILED",
  "errorFlag": "1"
}
```

#### Encryption Sample (C#)

```csharp
public string Encrypt(string clearText)
{
    string EncryptionKey = "$!@#";
    byte[] clearBytes = Encoding.Unicode.GetBytes(clearText);
    using (Aes encryptor = Aes.Create())
    {
        var pdb = new Rfc2898DeriveBytes(EncryptionKey, new byte[]
        {
            0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d,
            0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76   // "Ivan Medvedev"
        });
        encryptor.Key = pdb.GetBytes(32);
        encryptor.IV  = pdb.GetBytes(16);
        using (var ms = new MemoryStream())
        {
            using (var cs = new CryptoStream(ms, encryptor.CreateEncryptor(), CryptoStreamMode.Write))
            {
                cs.Write(clearBytes, 0, clearBytes.Length);
            }
            return Convert.ToBase64String(ms.ToArray());
        }
    }
}
```

---

## Claim Status — WhatsApp

Member-facing channel for self-service claim status enquiry via WhatsApp. **Not a programmatic API** — the QR code links to a WhatsApp chat (AuraChat) with the TPA.
**Source:** `GHPL - WhatsAPP_QRCode.txt`

| Field | Value |
|---|---|
| QR Code Image | `https://goodhealthtpa.com/wp-content/uploads/2024/09/I4A2FPAGJM4UC1.png` |
| Channel | WhatsApp (AuraChat) |
| Use Case | End-user claim status enquiry — not for system integration |

> Embed in member-facing UI (eCard, portal, email). No backend integration required from the IIRM platform.

---

## Status Codes

| HTTP Status | Meaning | Action |
|---|---|---|
| `200 OK` | Request processed successfully | Read response body for confirmation fields |
| `401 Unauthorized` | Invalid or missing credentials | Verify `userName` / `password` (WebServ) or `brokerAPIKey` (ISBS) |
| `400 Bad Request` | Malformed request or missing required fields | Check all required fields are present and correctly formatted |
| `500 Internal Server Error` | Server-side failure | Retry with exponential backoff; contact integration team if persistent |

---

## Error Handling

Always check both the **HTTP status code** and the error fields inside the response body.

| Scenario | Response Indicator | Resolution |
|---|---|---|
| Invalid WebServ credentials | `{ "errorMsg": "Invalid broker username or password" }` | Verify `userName` / `password` in body |
| WebServ downstream service down | `{ "errorMsg": "Java service not reachable" }` | Retry with backoff; escalate if persistent |
| WebServ — no data | `[]` (empty array) | Confirm policy / claim ID exists for the period |
| SSO decryption fail | Page renders `Error : <exception message>` | Confirm `PrudentTPAKey` / `PrudentTPAIV` match WebAce |
| Invalid ISBS brokerAPIKey | `error_Flag: "1"` | Confirm the brokerAPIKey with ISBS integration team |
| Missing required fields | HTTP 400 | Ensure all required fields are present |
| CCN not found on doc upload | `errorFlag: "1"`, `errorMsg: "FTP UPLOAD FAILED"` | Confirm the CCN from API #4 before uploading |
| Network / timeout errors | No response | Implement exponential backoff. Retry up to 3 times |

> For ISBS APIs, **error_Flag / errorFlag = "1"** always indicates a failure even when HTTP status is 200. Always validate this field.

---

## Open Questions

The following items require clarification from the Good Health TPA / ISBS integration teams before this document can be considered final.

### Environments

| # | Question | Affects |
|---|---|---|
| Q1 | Is there a UAT/Stage base URL for the WebServ APIs (`webserv.goodhealthtpa.in`), or do we test against LIVE only? | APIs #1, #2 |
| Q2 | Are the ISBS Stage URLs the final production URLs as well, or is there a separate ISBS production base URL? | APIs #4, #5 |

### Authentication & Keys

| # | Question | Affects |
|---|---|---|
| Q3 | Is the ISBS `brokerAPIKey` ever rotated? If so, what is the rotation frequency and process to obtain a new key? | APIs #4, #5 |
| Q7 | What are the `PrudentTPAKey` and `PrudentTPAIV` values for UAT vs PROD? How are they rotated? | API #3 |
| Q9 | The xlsx data dictionary names the auth field `SECURED_KEY` while the .docx sample uses `brokerAPIKey`. Confirm the actual field name on the wire. | APIs #4, #5 |

### Field Values & Enumerations

| # | Question | Affects | Status |
|---|---|---|---|
| Q4 | What are all possible `CLAIM_STATUS` values? (e.g. Settled, Pending, Rejected, Under Query, …) | APIs #1, #2 | Open |
| Q5 | What does `PRE_AUTH_STATUS` enumerate to? Are values the same as `CLAIM_STATUS`? | APIs #1, #2 | Open |
| Q8 | Field naming inconsistency — data dictionary uses `BROKER_USERNAME` / `CLM_PATIENT_NAME` (UPPER_SNAKE_CASE) but sample payload uses `brokerUsername` / `clmPatientName` (camelCase). **Which is the actual wire format?** | APIs #4, #5 | Open |
| Q10 | `docType` — is `pdf`, `jpg`, `png` the complete list? Any file size limit per upload? | API #5 | Open |
| Q11 | Is `clmReasonAdmission` always required in `<Complaint>(<ICD>)` format (e.g. `DentalCaries(K02.9)`), or is plain text acceptable? | API #4 | Open |
| Q12 | Is the [ICD Complaints Master](#appendix-a--icd-complaints-master) list strictly enforced, or is free text accepted? | API #4 | Open |

### Integration Flow

| # | Question | Affects |
|---|---|---|
| Q13 | After WebAce SSO redirect lands on `Home.aspx`, is deep-linking to a specific page (e.g. claim status for claim X) supported? | API #3 |
| Q14 | Is the eCard API in scope for this integration? It was mentioned in the original requirement but no source documentation has been provided. | eCard |

### Date Formats

| # | Question | Affects |
|---|---|---|
| Q6 | Date formats are inconsistent across APIs — API #1 returns `DD/MM/YYYY`; API #2 returns `YYYY-MM-DD HH:mm:ss.S`; APIs #4/#5 request ISO 8601. Confirm authoritative format per field to avoid integration bugs. | APIs #1, #2, #4 |

### Rate Limits & Reliability

| # | Question | Affects |
|---|---|---|
| Q15 | Are there rate limits, throttling rules, or recommended timeout values? | All APIs |
| Q16 | Is there a health check / status endpoint? | All APIs |
| Q17 | Is there a scheduled maintenance window? How are downtime notifications sent? | All APIs |

### Environment & Access

| # | Question | Affects |
|---|---|---|
| Q18 | Are there IP whitelisting requirements for our server IPs? | All APIs |
| Q19 | Is there a sandbox / mock environment for development and testing? | All APIs |
| Q20 | Is a Postman collection or OpenAPI (Swagger) spec available? | All APIs |

### Security & Transport

| # | Question | Affects |
|---|---|---|
| Q21 | Is mutual TLS (mTLS) required? If yes, share certificate details and client certificate registration process. | All APIs |
| Q22 | What TLS version is supported? (TLS 1.2 / TLS 1.3) | All APIs |

### Data & Compliance

| # | Question | Affects |
|---|---|---|
| Q23 | Which PII fields (name, DOB, policy number, mobile, email) must not be logged on the IIRM platform side? | All APIs |
| Q24 | Are there data residency requirements — must all data remain within India? | All APIs |
| Q25 | Is a signed NDA or data-sharing agreement required before production access is granted? | All APIs |

---

## Deliverables Requested from Good Health TPA / ISBS

- [ ] Postman collection or OpenAPI / Swagger spec for all APIs
- [ ] UAT base URL and credentials (`userName` / `password` for WebServ; `brokerAPIKey` / `PrudentTPAKey` + `IV` for ISBS / SSO)
- [ ] Sample request and response payloads for success and error cases per API
- [ ] Full list of error codes and their meanings
- [ ] Confirmed enum values for `CLAIM_STATUS`, `PRE_AUTH_STATUS`, `docType`
- [ ] Technical point of contact — name, email, and escalation path

---

## Source References

| API | Source File | Date |
|---|---|---|
| Get Claim Details (All Records) | `GHPL - Get Claim (All) Details_4-May-2026.docx` | 04-May-2026 |
| Get Single Claim Details | `GHPL - GetSingleClaimDetails_PROD_13-May-2026.docx` | 13-May-2026 |
| WebAce SSO | `GHPL - SSO_4-May-2026.docx` (≡ `WebAce SSO Document.docx`) | 04-May-2026 |
| Broker Claim Intimation, Broker Claim Document Upload | `GHPL - Claim Intimation_4-May-2026/Broker_API_CLM_INTIMATION_UAT_4-May-2026.docx` | 04-May-2026 |
| Claim Intimation Field Dictionary | `GHITL_Claim_Intimation_API_Data_Dictionary_4-May-2026.xlsx` | 04-May-2026 |
| Claim Document Field Dictionary | `GHITL_Claim_Document_API_Data_Dictionary_4-May-2026.xlsx` | 04-May-2026 |
| Claim Status WhatsApp QR | `GHPL - WhatsAPP_QRCode.txt` | 04-May-2026 |

---

*Document version: 3.0 — Good Health TPA API Reference · Broker: IIRM · Updated 22-May-2026*

---

## Appendix A — ICD Complaints Master

Authoritative ICD-10 code lookup for the `clmReasonAdmission` field on API #4 (Broker Claim Intimation). Use the `<Complaint>(<ICD>)` format — e.g. `DentalCaries(K02.9)`.

**Source:** `GHITL_Claim_Intimation_API_Data_Dictionary_4-May-2026.xlsx` — sheet *Complaints- Master* (~260 entries).

| Complaint | ICD Code |
|---|---|
| AIDS | `B20` |
| Abdominalpain | `R10.9` |
| AbnormalUterinebleeding | `N93.9` |
| Abortion | `O02.1` |
| AccidentsofSeriousNature | `X59` |
| AcuteGastroenetritis-AcuteGE-gastritis | `A08` |
| AcuteLymphadenitis | `L04.9` |
| AcutePharyngitis | `J02.9` |
| AcuteSinusitis | `J01.91` |
| AcuteTonsillitis | `J03.90` |
| Acuteserousotitismedia,unspecified | `H65.00` |
| Addison'sDisease | `E27.1` |
| Adenoiditis | `J35.02` |
| Age-relatedosteoporosis | `M81.0` |
| All Animal/reptile/insect bite or sting | `T63` |
| All Seizure disorders | `G40` |
| All strokes leading to paralysis | `G81` |
| AllStrokesleadingtoparalysis | `I69.3` |
| Allergy | `T78.40XA` |
| AmoebicDysentery | `A06.0` |
| Amyloidosis | `E85.9` |
| AnalFistula | `K60.3` |
| Aneurysm | `I72.9` |
| Animal/reptile/insectbiteorsting | `T63.9` |
| AnuriaAndOliguria | `R34` |
| Anxiety | `F41.9` |
| AplasticAnemia | `D61.9` |
| Appendicitis | `K35.80` |
| Arthritis | `M13.9` |
| Arthritis | `M19.90` |
| Ascites | `K70.10` |
| Asthma | `J45.909` |
| Asthma | `J45` |
| Autism | `F84.0` |
| AutoimmuneMyositis | `M33.2` |
| Autoimmunevasculitis | `M31` |
| BipolarDisorder | `F31.30` |
| BloodLoss | `D50.0` |
| Brain stroke - CVA | `I67.9` |
| Brainstroke-CVA | `I63.9` |
| BreastLump | `N63.0` |
| Bronchitis | `J20.9` |
| Brucellosis | `A23.9` |
| Burns | `M61.30` |
| COPD-ChronicobstructivePulmonaryDisease | `J44.9` |
| CaBaseOfTongue | `C01` |
| CaGums | `C03.9` |
| CaLip | `C44.02` |
| CaMouthUnspecified | `C06.9` |
| CaOfColon | `C18.9` |
| CaOfHypopharynx | `C13.9` |
| CaOfOesophagus | `C15.9` |
| CaOfSmallIntestine | `C17.9` |
| CaOfStomach | `C16.9` |
| CaPalate | `C05.0` |
| CaParotidGrand | `C07` |
| CaTongue | `C01` |
| Caesareandelivery-LSCS | `O82` |
| Camouth | `C06.9` |
| Cancer | `C97` |
| Cancer | `C07` |
| CancerOfTonsil | `C07` |
| CancerSalivaryGlands | `C07` |
| CarcinomaNasopharynx | `C07` |
| CarcinomaOfPiriformSinus | `C12` |
| CarcinomaOropharynx | `C10.9` |
| Cardiac Ailments | `I52` |
| CardiacAilments | `I51.9` |
| Cataract | `H25.1` |
| CeliacDisease | `K90.0` |
| Cellulitis | `L03.90` |
| CerebralPalsy | `G80.9` |
| ChestPain | `R07.9` |
| Cholera | `A00.0` |
| Chronic Hepatitis-Liver | `K73` |
| ChronicBronchitis | `J42` |
| ChronicHepatitis-Liver | `K73.9` |
| ChronicPancreatitis | `K86.1` |
| Chronickidneydisease-CKD | `N18.9` |
| CleftLip | `Q37.5` |
| CleftPalate | `Q37.5` |
| Colitis | `K52.9` |
| Connectivetissuedisorder | `M35.9` |
| Cough | `R05` |
| Covid19Positive | `U07.1` |
| CysticFibrosis | `E84.9` |
| DJStentremoval | `N20.0` |
| Denguefever | `A90` |
| DentalCaries | `K02.9` |
| Depression | `F32.9` |
| Deviatednasalseptum | `J34.2` |
| Diabetes | `E119` |
| Diabetes and its complications (including Type 1 Diabetes) | `E14` |
| Diabetesanditscomplications | `E11.9` |
| Dialysis - Kidney Ailment | `N18` |
| Diphtheria | `A36.9` |
| Dyspepsia | `K30` |
| Dysphagia | `R13.10` |
| Dystonia | `U07.1` |
| Elbowpain | `M25.529` |
| Encephalitis | `G04.90` |
| Epidermolysisbullosa | `Q81` |
| EyeDisorder | `H57.9` |
| Femaleinfertility | `N97.9` |
| Fever | `R50.9` |
| Fibroiduterus | `D25.9` |
| ForeignBody-General | `T18.9` |
| ForeignBodyOnExternalEye | `T15.90XA` |
| ForeignBodyinEar | `T16` |
| Fracture | `S72.301` |
| Fracture of femur | `S72.00XA` |
| Fractureoffemur | `S72.9` |
| GallbladderDisease | `K82.9` |
| GallbladderStones-Cholelithiasis | `K80.20` |
| Gangrene | `I96` |
| GastricUlcer | `K25.9` |
| GastritisAndDuodenitis | `K29.90` |
| Gastro-OesophagealRefluxDisease | `K21.9` |
| Giddiness | `R42` |
| Glaucoma | `H40.9` |
| Gout | `M10.9` |
| Growth disorders | `R62.8` |
| Growthdisorders | `E34.3` |
| Haemorrhagescausedbyaccidents | `S00` |
| Haemorroids | `K64.9` |
| Hair loss | `L63.9` |
| Hairloss | `L65.9` |
| Hashimoto'sThyroiditis | `E06.3` |
| HashimotosThyroiditis | `E06.3` |
| Headache | `R51.9` |
| Healthcheckup | `Z00.0` |
| HeartDisease | `I51.9` |
| Hematuria | `R31.9` |
| Hemodialysis | `N18.6` |
| Hemophilia | `D66` |
| Hepatitis-B | `B16` |
| Hepatitis-C | `B17.1` |
| Hernia | `K40.00` |
| Hydrocele | `N43.3` |
| Hypertension | `I10` |
| Hyperthyroidism | `E05.90` |
| Hypospadias | `Q54.9` |
| Hypothermia | `R68.0` |
| Hypothyroidism | `E03.9` |
| Hysterectomy | `N93.9` |
| Illness,unspecified | `R69` |
| Immunization | `Z23` |
| Inflammatory Bowel Disease | `K50` |
| InflammatoryBowelDisease | `K52.9` |
| InguinalHernia | `K40.2` |
| Injury,unspecidied | `T14.90` |
| Irondeficiencyanemia | `D50.9` |
| Jaundice | `R17` |
| KidneyStone-Renalcalculi | `N20.0` |
| Kidneytransplantstatus | `Z94.0` |
| Kneepain | `M25.569` |
| Leprosy | `A30.9` |
| Leprosy | `A30` |
| Leukemia | `C94` |
| Leukemia | `C95.9` |
| Liverdisease | `K76.9` |
| Lowbackpain | `M54.5` |
| LowerRespiratoryTractInfections-LRTI | `J22` |
| Majordepressivedisorder | `F32.9` |
| Malabsorption | `K90.9` |
| Malaria | `B54` |
| MaternityNormal | `O80` |
| MiliaryTuberculosis | `A19.9` |
| MultipleSclerosis | `G35` |
| Musculardystrophies | `G71.0` |
| Myastheniagravis | `G70.0` |
| MycobacteriumInfection | `A31.9` |
| NeonatalJaundice | `P59.9` |
| Newborn conditions | `P00-P96` |
| Newbornconditions | `P96.9` |
| Non-Alcoholic Cirrhosis of Liver | `K74.6` |
| Non-AlcoholicCirrhosisofLiver | `K74.60` |
| NormalDelivery | `O80` |
| Orchiditis | `N45.2` |
| Osteoarthritisofknee,unspecified | `M17.9` |
| Osteoporosis | `M81` |
| Osteoporosis | `M81.0` |
| Otherdisordersofexternalear | `H61.1` |
| Otitis media, unspecified | `H66.90` |
| Otitismedia | `H66.9` |
| Ovarian Cyst | `N83.0` |
| OvarianCyst | `N83.20` |
| Paralysis | `G83` |
| Paralysis | `G83.9` |
| Parkinson'sDisease | `G20` |
| Peritonitis | `K65.9` |
| Pernicious Anemia | `D51` |
| PerniciousAnemia | `D51.0` |
| Phimosos | `N47.1` |
| Physiotherapy | `Z47.89` |
| Physiotherapy | `Z51.89` |
| Physiotherapy-treatment,notdiagnosis | `Z51` |
| PilonidalCyst | `L05.91` |
| Pleurisy | `R09.1` |
| Pneumonia | `J18.9` |
| Polio | `A80` |
| Polyarthritis | `M13.0` |
| Pregnancy | `Z33.1` |
| PregnancyComplication | `O99.891` |
| Psoriasis | `L40.9` |
| Psoriasis | `L40.0` |
| Psychiatric disorder including Schizophrenia | `F20` |
| PsychiatricdisorderincludingSchizophrenia | `F20.9` |
| Purpura | `D69.9` |
| Purpura | `D69` |
| Rheumatoid Arthritis (RA) | `M06` |
| RheumatoidArthritis | `M06.9` |
| Seizuredisorders | `G40.909` |
| SelfHarm | `N76.5` |
| Senility | `G31.1` |
| Sepsis | `A41.9` |
| Septicshock | `R65.21` |
| Sickle cell disease, systemic lupus erythematosus (SLE) | `D57` |
| Sicklecelldisease | `D57.1` |
| SjogrensSyndrome | `M35` |
| Sleep apnea syndrome | `G47` |
| Sleepapneasyndrome | `G47.30` |
| SpinaBifida | `Q05.9` |
| Status asthmaticus, sequelae of meningitis | `J46` |
| Statusasthmaticus,sequelaeofmeningitis | `J45.902` |
| Swine flu | `J09` |
| Swineflu | `J09.X2` |
| Systemic Lupus Erythematosus | `M32.0` |
| SystemicLupusErythematosus-SLE | `M32.9` |
| Third Degree burns | `T31` |
| ThirdDegreeburns | `T31.0` |
| Thromboembolism venous thrombosis/venous thromboembolism (VTE) | `I82` |
| Thromboembolismvenousthrombosis/venousthromboembolism(VTE) | `I82.90` |
| Thryroiditis | `E06.9` |
| Tuberculosis | `A15.0` |
| Tumor | `D49.9` |
| Tumor | `D49` |
| Type2diabetesmellitus | `E11.9` |
| Typhoidfever | `A01.0` |
| Ulcerative Colitis | `K51` |
| UlcerativeColitis | `K51.90` |
| UmblicalHernia | `K42.9` |
| UndescendedTesticle | `Q53.10` |
| UpperRespiratoryTractInfection-URTI | `J06.9` |
| Urethralcalculi | `N21.1` |
| UrinaryIncontinence | `N39.498` |
| VaginalCyst | `N90.7` |
| VaginalProlapse | `N81.4` |
| VaricoseVeins | `I86.8` |
| Venous Thrombosis (not caused by smoking) | `I82` |
| VenousThrombosis | `I82.90` |
| ViralConjunctivitis | `B30.9` |
| ViralFever | `B34.9` |
| ViralHepatitis | `B19.9` |
| ViralWarts | `B07.9` |
| VitaminDeficiencies | `E56.9` |
| Vomitings | `R11.10` |
| Wilsonsdisease | `E83.01` |
