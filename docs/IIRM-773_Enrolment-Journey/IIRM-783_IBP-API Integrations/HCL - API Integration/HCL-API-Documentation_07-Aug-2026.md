# HCL Interface — API Reference

**Broker:** IIRM
**Client:** HCL
**Method:** POST
**Content-Type:** `application/json`

---

## Document Metadata

| | |
|---|---|
| **Source Document** | `IIRM-HCL-Portal-Integration_05022024.docx` — HCL Interface Document, Version 1.4 |
| **Source Date** | 05-Feb-2024 |
| **Transcribed** | 07-Aug-2026 |

---

## Endpoint & Authentication

All 7 operations below hit the same URL and differ only by the `Flag_operationType` field in the body.

```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

| Field | Type | Description |
|---|---|---|
| `UserName` | string | `iirmhclwebservice` |
| `Password` | string | `iirmhcl$123` |

> Sent in plaintext inside the JSON body on every call — no Authorization header. The Dependent Delete sample ships with both fields blank — see [Open Questions](#open-questions) Q1.

---

## API Master Index

| # | Operation | `Flag_operationType` | Purpose |
|---|---|---|---|
| 1 | [Employee Activate/Deactivate](#1-employee-activatedeactivate-ad) | `AD` | Toggle an employee between EMCP and GHMI status, and/or between active and inactive |
| 2 | [Bulk Insert](#2-bulk-insert-bi) | `BI` | Insert/update a batch of employees (and dependents) in one call |
| 3 | [Dependent Delete](#3-dependent-delete-dd) | `DD` | Delete a specific dependent record |
| 4 | [Employee Demise](#4-employee-demise-ed) | `ED` | Remove an employee record on death |
| 5 | [Employee Separation](#5-employee-separation-es) | `ES` | Remove an employee record on exit/resignation |
| 6 | [Employee Transfer](#6-employee-transfer-et) | `ET` | Move an employee (with dependents) to EMCP |
| 7 | [Employee Natural Addition](#7-employee-natural-addition-na) | `NA` | Add a new dependent to an existing employee |

---

## 1. Employee Activate/Deactivate (`AD`)

Toggles `IS_EMCP` and `IS_EMPAD` on a single employee. The same request shape produces 4 distinct outcomes depending on the combination submitted:

| Scenario | `IS_EMCP` | `IS_EMPAD` | `returnMessage` |
|---|---|---|---|
| a | `1` | `1` | `Employee EMCP activated successfully.` |
| b | `0` | `1` | `Employee GHMI activated successfully.` |
| c | `1` | `0` | `Employee EMCP de-activated successfully.` |
| d | `0` | `0` | `Employee GHMI de-activated successfully.` |

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `iirmhclwebservice` | Service username |
| `Password` | string | `iirmhcl$123` | Service password |
| `Flag_operationType` | string | `AD` | Operation selector |
| `Groupcode` | string | `HTLC` | Group code |
| `policyno` | string | `900020001111` | Policy number |
| `SelfCount` | number | `0` | Not used for this op |
| `Del_hcldepid` | number | `0` | Not used for this op |
| `wef` | string (date) | `2021-08-03` | With-effect-from date |
| `Del_deletionremarks` | string | `testing manual function` | Free-text remark |
| `prom_ctc` | number | `0` | Unused — see Q2 |
| `prom_grade` | string | `""` | Unused — see Q2 |
| `prom_companyid` | number | `0` | Unused — see Q2 |
| `prom_basesi` | number | `0` | Unused — see Q2 |
| `objEMPLOYEE_DATA` | array | — | One `{ E_EMP_HCL, E_DEP_HCL }` object |

#### Request Fields — `E_EMP_HCL`

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `H84W8p+rJtNQPl4kZNGxFQ==` | Encrypted employee ID |
| `EIN` | string | `51854879` | Employee ID |
| `Groupcode` | string | `NA` | Object-level group code (top-level applies) |
| `policyno` | string | `NA` | Object-level policy no (top-level applies) |
| `CTC` | number | `1` | Cost to company |
| `NO_OF_DEPENDENTS` | number | `3` | Dependent count |
| `IS_ESI` | 0/1 | `0` | ESI applicability flag |
| `INSUREDNAME` | string | `Gulam Mazhar` | Employee name |
| `HCL_ENTITY` | string | `5050` | HCL entity/business-unit code |
| `TRIGGER_FLAG` | number | `1` | Change-trigger code — see Q3 |
| `IS_SEZ` | 0/1 | `1` | SEZ flag |
| `IS_EMCP` | 0/1 | `1` | EMCP flag — drives the scenario branch — see Q4 |
| `EMAIL` | string | `GULAM.MAZHAR@HCL.COM` | Employee email |
| `MOBILE` | string | `7682964667` | Employee mobile |
| `GRADE` | string | `E5` | Employee grade |
| `DOB` | string (date) | `1996-02-15` | Date of birth |
| `DOJ` | string (date) | `2019-10-11` | Date of joining |
| `INDIANADDRESS` | string | `opposite Veterinary Hospital,Pugmil Road,Hazaribagh,Hazaribagh,825301` | Address, comma-separated |
| `MARITAL_STATUS` | string | `N` | `N` unmarried / `M` married |
| `GENDER` | string | `M` | `M` / `F` |
| `OLDEMPID` | number | `0` | Prior employee ID, if reissued |
| `LOCATION` | string | `""` | Location code |
| `CHECK_SUM` | string | `925958fbd37a795a743e3979b417956574eada57` | SHA-1 hash of the record |
| `BLOOD_GROUP` | number | `0` | Blood group code — see Q5 |
| `IS_EMPAD` | 0/1 | `1` | Active/inactive flag — drives the scenario branch |

#### Request Fields — `E_DEP_HCL` (array)

| Field | Type | Example | Description |
|---|---|---|---|
| `HCL_DEPID` | number | `35` | Dependent ID |
| `DEP_NAME` | string | `NEHA` | Dependent name |
| `HCL_DEPADDON` | string (datetime) | `2017-04-09 12:12:12` | Date dependent was added |
| `HCL_DEPREL` | number | `7` | Relation code — see Q3 |
| `DEP_DOB` | string (date) | `1993-02-01` | Dependent date of birth |
| `DEP_GENDER` | string | `F` | `M` / `F` |
| `MARITAL_STATUS` | string | `N` | `N` / `M` |
| `CHECK_SUM` | string | `c358f66caf699031006851f1d643664f9dba1590` | SHA-1 hash of the dependent record |
| `TRIGGER_FLAG` | number | `6` | Change-trigger code, dependent-level |
| `IS_DEP_EMCP` | 0/1 | `1` | Dependent EMCP flag |

#### Example Request (scenario a — `IS_EMCP=1`, `IS_EMPAD=1`)

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "AD",
  "Groupcode": "HTLC",
  "policyno": "900020001111",
  "SelfCount": 0,
  "Del_hcldepid": 0,
  "wef": "2021-08-03",
  "Del_deletionremarks": "testing manual function",
  "prom_ctc": 0,
  "prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "H84W8p+rJtNQPl4kZNGxFQ==",
        "EIN": "51854879",
        "Groupcode": "NA",
        "policyno": "NA",
        "CTC": 1,
        "NO_OF_DEPENDENTS": 3,
        "IS_ESI": 0,
        "INSUREDNAME": "Gulam Mazhar",
        "HCL_ENTITY": "5050",
        "TRIGGER_FLAG": 1,
        "IS_SEZ": 1,
        "IS_EMCP": 1,
        "EMAIL": "GULAM.MAZHAR@HCL.COM",
        "MOBILE": "7682964667",
        "GRADE": "E5",
        "DOB": "1996-02-15",
        "DOJ": "2019-10-11",
        "INDIANADDRESS": "opposite Veterinary Hospital,Pugmil Road,Hazaribagh,Hazaribagh,825301",
        "MARITAL_STATUS": "N",
        "GENDER": "M",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "925958fbd37a795a743e3979b417956574eada57",
        "BLOOD_GROUP": 0,
        "IS_EMPAD": 1
      },
      "E_DEP_HCL": [
        {
          "HCL_DEPID": 35,
          "DEP_NAME": "NEHA",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 7,
          "DEP_DOB": "1993-02-01",
          "DEP_GENDER": "F",
          "MARITAL_STATUS": "N",
          "CHECK_SUM": "c358f66caf699031006851f1d643664f9dba1590",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 1
        }
      ]
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` in every sample |
| `GetEmpStatus` | array | Always `[]` for this op |
| `GetStatus.callStatus` | boolean | Call success |
| `GetStatus.procedureStatus` | boolean | Procedure success |
| `GetStatus.returnMessage` | string | One of the 4 scenario messages above |
| `GetStatus.returnValue` | number | `1` = success |

#### Example Response (scenario a)

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [],
  "GetStatus": {
    "callStatus": true,
    "procedureStatus": true,
    "returnMessage": "Employee EMCP activated successfully.",
    "returnValue": 1
  }
}
```

---

## 2. Bulk Insert (`BI`)

Inserts/updates a batch of employees (with dependents) in one call. Unlike the other operations, top-level `Groupcode`/`policyno` are `NA` — group/policy are supplied per-employee instead. Not every employee in the batch needs a dependent array (see the second employee in the example, which carries only `E_EMP_HCL`).

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `iirmhclwebservice` | Service username |
| `Password` | string | `iirmhcl$123` | Service password |
| `Flag_operationType` | string | `BI` | Operation selector |
| `SelfCount` | number | `2` | Count of principal records in `objEMPLOYEE_DATA` |
| `Del_hcldepid` | number | `0` | Not used for this op |
| `Groupcode` | string | `NA` | Not used at top level — see per-employee `Groupcode` |
| `policyno` | string | `NA` | Not used at top level — see per-employee `policyno` |
| `wef` | string | `""` | Not used for this op |
| `Del_deletionremarks` | string | `""` | Not used for this op |
| `prom_ctc` / `prom_grade` / `prom_companyid` / `prom_basesi` | — | `0` / `""` / `0` / `0` | Unused — see Q2 |
| `objEMPLOYEE_DATA` | array | — | One or more `{ E_EMP_HCL, E_DEP_HCL? }` objects |

#### Request Fields — `E_EMP_HCL` (per employee)

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `H84W8p+rJtNQPl4kZNGxFQ==` | Encrypted employee ID |
| `EIN` | string / number | `51854879`, `90089` | Employee ID |
| `Groupcode` | string | `HTLC` | Group code — supplied per employee for this op |
| `policyno` | string | `900020001111` | Policy number — supplied per employee for this op |
| `CTC` | number | `0`, `1` | Cost to company |
| `NO_OF_DEPENDENTS` | number | `3`, `0` | Dependent count |
| `IS_ESI` | 0/1 | `0` | ESI applicability flag |
| `INSUREDNAME` | string | `Gulam Mazhar`, `Anand2` | Employee name |
| `HCL_ENTITY` | string | `1280`, `1000` | HCL entity code |
| `TRIGGER_FLAG` | number | `1` | Change-trigger code — see Q3 |
| `IS_SEZ` | 0/1 | `1` | SEZ flag |
| `IS_EMCP` | 0/1 | `0` | EMCP flag — see Q4 |
| `EMAIL` | string | `GULAM.MAZHAR@HCL.COM` | Employee email |
| `MOBILE` | string | `7682964667` | Employee mobile |
| `GRADE` | string | `E1` | Employee grade |
| `DOB` | string (date) | `1996-02-15` | Date of birth |
| `DOJ` | string (date) | `2019-10-11` | Date of joining |
| `INDIANADDRESS` | string | `opposite Veterinary Hospital,...` | Address, comma-separated |
| `MARITAL_STATUS` | string | `N`, `M` | `N` / `M` |
| `GENDER` | string | `M` | `M` / `F` |
| `OLDEMPID` | number | `0` | Prior employee ID, if reissued |
| `LOCATION` | string | `""` | Location code |
| `CHECK_SUM` | string | `90c1046151cf8b85ce515faa4b934f0b7c354232` | SHA-1 hash of the record |
| `BLOOD_GROUP` | number | `0` | Blood group code — see Q5 |

> No `IS_EMPAD` field on this operation — activation state is handled separately via `AD`.

#### Request Fields — `E_DEP_HCL` (array, optional per employee)

| Field | Type | Example | Description |
|---|---|---|---|
| `HCL_DEPID` | number | `35`, `36`, `37` | Dependent ID |
| `DEP_NAME` | string | `NEHA`, `RISHAB`, `Roshan` | Dependent name |
| `HCL_DEPADDON` | string (datetime) | `2017-04-09 12:12:12` | Date dependent was added |
| `HCL_DEPREL` | number | `7`, `1`, `9` | Relation code — see Q3 |
| `DEP_DOB` | string (date) | `1993-02-01` | Dependent date of birth |
| `DEP_GENDER` | string | `F`, `M` | `M` / `F` |
| `MARITAL_STATUS` | string | `N`, `M` | `N` / `M` |
| `CHECK_SUM` | string | `c358f66caf699031006851f1d643664f9dba1590` | SHA-1 hash of the dependent record |
| `TRIGGER_FLAG` | number | `6` | Change-trigger code, dependent-level |
| `IS_DEP_EMCP` | 0/1 | `1`, `0` | Dependent EMCP flag |

#### Example Request (2 employees — 1 with dependents, 1 self-only)

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "BI",
  "SelfCount": 2,
  "Del_hcldepid": 0,
  "Groupcode": "NA",
  "policyno": "NA",
  "wef": "",
  "Del_deletionremarks": "",
  "prom_ctc": 0,
  "prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "H84W8p+rJtNQPl4kZNGxFQ==",
        "EIN": "51854879",
        "Groupcode": "HTLC",
        "policyno": "900020001111",
        "CTC": 0,
        "NO_OF_DEPENDENTS": 3,
        "IS_ESI": 0,
        "INSUREDNAME": "Gulam Mazhar",
        "HCL_ENTITY": "1280",
        "TRIGGER_FLAG": 1,
        "IS_SEZ": 1,
        "IS_EMCP": 0,
        "EMAIL": "GULAM.MAZHAR@HCL.COM",
        "MOBILE": "7682964667",
        "GRADE": "E1",
        "DOB": "1996-02-15",
        "DOJ": "2019-10-11",
        "INDIANADDRESS": "opposite Veterinary Hospital,Pugmil Road,Hazaribagh,Hazaribagh,825301",
        "MARITAL_STATUS": "N",
        "GENDER": "M",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "90c1046151cf8b85ce515faa4b934f0b7c354232",
        "BLOOD_GROUP": 0
      },
      "E_DEP_HCL": [
        {
          "HCL_DEPID": 35,
          "DEP_NAME": "NEHA",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 7,
          "DEP_DOB": "1993-02-01",
          "DEP_GENDER": "F",
          "MARITAL_STATUS": "N",
          "CHECK_SUM": "c358f66caf699031006851f1d643664f9dba1590",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 1
        },
        {
          "HCL_DEPID": 36,
          "DEP_NAME": "RISHAB",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 1,
          "DEP_DOB": "1945-11-23",
          "DEP_GENDER": "M",
          "MARITAL_STATUS": "M",
          "CHECK_SUM": "e2e0b7388bd369c5aa8466698bc1ad6db0977b57",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 1
        },
        {
          "HCL_DEPID": 37,
          "DEP_NAME": "Roshan",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 9,
          "DEP_DOB": "2015-01-02",
          "DEP_GENDER": "M",
          "MARITAL_STATUS": "N",
          "CHECK_SUM": "b873127a269d0a2c271e57c345666dea8d99dbac",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 0
        }
      ]
    },
    {
      "E_EMP_HCL": {
        "EIN": 90089,
        "ENCRYPT_EIN": "B7BA0kJxCx0mzbvuZbyu+g==",
        "INSUREDNAME": "Anand2",
        "HCL_ENTITY": "1000",
        "IS_SEZ": 1,
        "IS_EMCP": 0,
        "EMAIL": "anand.kumar@isharemail.in",
        "MOBILE": "9000855537",
        "GRADE": "E1",
        "DOB": "1980-07-29",
        "DOJ": "2017-05-15",
        "INDIANADDRESS": "",
        "MARITAL_STATUS": "M",
        "GENDER": "M",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CTC": 1,
        "IS_ESI": 0,
        "NO_OF_DEPENDENTS": 0,
        "CHECK_SUM": "d55131a270459508321185e4b3a5cfc2fcfdd997",
        "TRIGGER_FLAG": 1
      }
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` |
| `GetEmpStatus` | array | **One entry per employee** — the meaningful result for this op |
| `GetEmpStatus[].callStatus` | boolean | Whether this employee's record was processed |
| `GetEmpStatus[].ein` | string | Employee ID this entry refers to |
| `GetEmpStatus[].procedureStatus` | boolean | Whether the backend procedure completed for this employee |
| `GetEmpStatus[].returnMessage` | string | e.g. `Employee and dependents successfully updated`, `Employee details successfully updated` |
| `GetEmpStatus[].returnValue` | number | `1` = success |
| `GetStatus.callStatus` | boolean | `true` in the sample |
| `GetStatus.procedureStatus` | boolean | `false` in the sample — not meaningful for this op, see Q6 |
| `GetStatus.returnMessage` | string | `""` — always empty for this op |
| `GetStatus.returnValue` | number | `0` in the sample — not meaningful for this op, see Q6 |

#### Example Response

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [
    { "callStatus": true, "ein": "51854879", "procedureStatus": true, "returnMessage": "Employee and dependents successfully updated", "returnValue": 1 },
    { "callStatus": true, "ein": "90089",    "procedureStatus": true, "returnMessage": "Employee details successfully updated",           "returnValue": 1 }
  ],
  "GetStatus": { "callStatus": true, "procedureStatus": false, "returnMessage": "", "returnValue": 0 }
}
```

---

## 3. Dependent Delete (`DD`)

Deletes one dependent, identified by `Del_hcldepid`. The employee's own `E_EMP_HCL` fields are sent blank/zeroed in the sample — only `EIN` and `CHECK_SUM` carry real values; the request also carries two placeholder `E_DEP_HCL` entries with all-empty/zero fields.

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `""` | Blank in the sample — see Q1 |
| `Password` | string | `""` | Blank in the sample — see Q1 |
| `Flag_operationType` | string | `DD` | Operation selector |
| `Groupcode` | string | `HTLC` | Group code |
| `policyno` | string | `900020001111` | Policy number |
| `Del_hcldepid` | number | `122555` | **The dependent ID being deleted** |
| `wef` | string (date) | `2017-01-23` | Effective date of deletion |
| `Del_deletionremarks` | string | `test delete DEP1` | Free-text remark explaining the deletion |
| `prom_ctc` | number | `0` | Unused — see Q2 |
| `Prom_grade` | string | `""` | Unused — see Q2 *(note capitalization differs from other ops — `Prom_grade` not `prom_grade`)* |
| `prom_companyid` | number | `0` | Unused — see Q2 |
| `prom_basesi` | number | `0` | Unused — see Q2 |
| `SelfCount` | number | `0` | Not used for this op |
| `objEMPLOYEE_DATA` | array | — | One `{ E_EMP_HCL, E_DEP_HCL }` object, mostly placeholder values |

#### Request Fields — `E_EMP_HCL`

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `""` | Blank — not required for this op |
| `EIN` | string | `51854879` | **The employee ID whose dependent is being deleted** |
| `Groupcode` | string | `NA` | Placeholder |
| `policyno` | string | `NA` | Placeholder |
| `CTC` | number | `0` | Placeholder |
| `NO_OF_DEPENDENTS` | number | `0` | Placeholder |
| `IS_ESI` | 0/1 | `0` | Placeholder |
| `INSUREDNAME` | string | `""` | Placeholder |
| `HCL_ENTITY` | string | `""` | Placeholder |
| `TRIGGER_FLAG` | number | `0` | Placeholder |
| `IS_SEZ` | 0/1 | `0` | Placeholder |
| `IS_EMCP` | 0/1 | `0` | Placeholder |
| `EMAIL` / `MOBILE` / `GRADE` / `DOB` / `DOJ` / `INDIANADDRESS` / `MARITAL_STATUS` / `GENDER` / `LOCATION` | string | `""` | All blank placeholders |
| `OLDEMPID` | number | `0` | Placeholder |
| `CHECK_SUM` | string | `90c1046151cf8b85ce515faa4b934f0b7c354232` | **The only other real value on this object** — SHA-1 hash |
| `BLOOD_GROUP` | number | `0` | Placeholder |

#### Request Fields — `E_DEP_HCL` (array — placeholder entries)

| Field | Type | Example | Description |
|---|---|---|---|
| `HCL_DEPID` | number | `0` | Placeholder — the real target is `Del_hcldepid` at the top level |
| `DEP_NAME` | string | `""` | Placeholder |
| `HCL_DEPADDON` | string | `""` | Placeholder |
| `HCL_DEPREL` | number | `0` | Placeholder |
| `DEP_DOB` | string | `""` | Placeholder |
| `DEP_GENDER` | string | `""` | Placeholder |
| `MARITAL_STATUS` | string | `""` | Placeholder |
| `TRIGGER_FLAG` | number | `0` | Placeholder |
| `CHECK_SUM` | string | `""` | Placeholder |
| `BLOOD_GROUP` | number | `0` | Placeholder |

#### Example Request

```json
{
  "UserName": "",
  "Password": "",
  "Flag_operationType": "DD",
  "Groupcode": "HTLC",
  "policyno": "900020001111",
  "Del_hcldepid": 122555,
  "wef": "2017-01-23",
  "Del_deletionremarks": "test delete DEP1",
  "prom_ctc": 0,
  "Prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "SelfCount": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "",
        "EIN": "51854879",
        "Groupcode": "NA",
        "policyno": "NA",
        "CTC": 0,
        "NO_OF_DEPENDENTS": 0,
        "IS_ESI": 0,
        "INSUREDNAME": "",
        "HCL_ENTITY": "",
        "TRIGGER_FLAG": 0,
        "IS_SEZ": 0,
        "IS_EMCP": 0,
        "EMAIL": "",
        "MOBILE": "",
        "GRADE": "",
        "DOB": "",
        "DOJ": "",
        "INDIANADDRESS": "",
        "MARITAL_STATUS": "",
        "GENDER": "",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "90c1046151cf8b85ce515faa4b934f0b7c354232",
        "BLOOD_GROUP": 0
      },
      "E_DEP_HCL": [
        {
          "HCL_DEPID": 0,
          "DEP_NAME": "",
          "HCL_DEPADDON": "",
          "HCL_DEPREL": 0,
          "DEP_DOB": "",
          "DEP_GENDER": "",
          "MARITAL_STATUS": "",
          "TRIGGER_FLAG": 0,
          "CHECK_SUM": "",
          "BLOOD_GROUP": 0
        },
        {
          "HCL_DEPID": 0,
          "DEP_NAME": "",
          "HCL_DEPADDON": "",
          "HCL_DEPREL": 0,
          "DEP_DOB": "",
          "DEP_GENDER": "",
          "MARITAL_STATUS": "",
          "TRIGGER_FLAG": 0,
          "CHECK_SUM": "",
          "BLOOD_GROUP": 0
        }
      ]
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` |
| `GetEmpStatus` | array | One entry, for the employee the dependent belonged to |
| `GetEmpStatus[].callStatus` | boolean | `true` in the sample |
| `GetEmpStatus[].ein` | string | `51854879` in the sample |
| `GetEmpStatus[].procedureStatus` | boolean | `true` in the sample |
| `GetEmpStatus[].returnMessage` | string | `Employee dependents deleted successfully` |
| `GetEmpStatus[].returnValue` | number | `1` = success |
| `GetStatus.callStatus` | boolean | `false` in the sample — despite the deletion succeeding, see Q6 |
| `GetStatus.procedureStatus` | boolean | `false` in the sample |
| `GetStatus.returnMessage` | string | `""` — always empty for this op |
| `GetStatus.returnValue` | number | `0` in the sample |

#### Example Response

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [
    { "callStatus": true, "ein": "51854879", "procedureStatus": true, "returnMessage": "Employee dependents deleted successfully", "returnValue": 1 }
  ],
  "GetStatus": { "callStatus": false, "procedureStatus": false, "returnMessage": "", "returnValue": 0 }
}
```

> `GetStatus.callStatus` is `false` even though the operation succeeded per `GetEmpStatus[0]` — see [Open Questions](#open-questions) Q6.

---

## 4. Employee Demise (`ED`)

Removes an employee record on death. No `E_DEP_HCL` array in the request at all — dependents are presumably cascade-removed server-side.

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `iirmhclwebservice` | Service username |
| `Password` | string | `iirmhcl$123` | Service password |
| `Flag_operationType` | string | `ED` | Operation selector |
| `Groupcode` | string | `HTLC` | Group code |
| `policyno` | string | `900020001111` | Policy number |
| `Del_hcldepid` | number | `0` | Not used for this op |
| `wef` | string (date) | `2021-09-11` | Date of demise / effective removal |
| `Del_deletionremarks` | string | `testing` | Free-text remark |
| `prom_ctc` / `Prom_grade` / `prom_companyid` / `prom_basesi` | — | `0` / `""` / `0` / `0` | Unused — see Q2 |
| `SelfCount` | number | `0` | Not used for this op |
| `objEMPLOYEE_DATA` | array | — | One `{ E_EMP_HCL }` object — **no `E_DEP_HCL` key** |

#### Request Fields — `E_EMP_HCL`

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `H84W8p+rJtNQPl4kZNGxFQ==` | Encrypted employee ID |
| `EIN` | string | `51922416` | **The deceased employee's ID** |
| `Groupcode` | string | `NA` | Placeholder |
| `policyno` | string | `NA` | Placeholder |
| `CTC` | number | `0` | Placeholder |
| `NO_OF_DEPENDENTS` | number | `0` | Placeholder |
| `IS_ESI` | 0/1 | `0` | Placeholder |
| `INSUREDNAME` | string | `Devender Paladi` | Employee name |
| `HCL_ENTITY` | string | `""` | Placeholder |
| `TRIGGER_FLAG` | number | `1` | Change-trigger code — see Q3 |
| `IS_SEZ` | 0/1 | `1` | SEZ flag |
| `IS_EMCP` | 0/1 | `0` | EMCP flag — see Q4 |
| `EMAIL` | string | `DEVENDER.PALADI@HCL.COM` | Employee email |
| `MOBILE` | string | `7682964667` | Employee mobile |
| `GRADE` | string | `E1` | Employee grade |
| `DOB` | string (date) | `1996-02-15` | Date of birth |
| `DOJ` | string (date) | `2019-10-11` | Date of joining |
| `INDIANADDRESS` | string | `PDM RESIDENCY, 12 11 1649 AMBERNAGAR,...` | Address, comma-separated |
| `MARITAL_STATUS` | string | `N` | `N` / `M` |
| `DOM` | string | `""` | Date of marriage — blank here (only populated on Natural Addition) |
| `GENDER` | string | `M` | `M` / `F` |
| `OLDEMPID` | number | `0` | Prior employee ID, if reissued |
| `LOCATION` | string | `""` | Location code |
| `CHECK_SUM` | string | `6c4b626ead1a31f382d762fba9c97e2e41f5616c` | SHA-1 hash of the record |
| `BLOOD_GROUP` | number | `0` | Placeholder — see Q5 |

#### Example Request

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "ED",
  "Groupcode": "HTLC",
  "policyno": "900020001111",
  "Del_hcldepid": 0,
  "wef": "2021-09-11",
  "Del_deletionremarks": "testing",
  "prom_ctc": 0,
  "Prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "SelfCount": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "H84W8p+rJtNQPl4kZNGxFQ==",
        "EIN": "51922416",
        "Groupcode": "NA",
        "policyno": "NA",
        "CTC": 0,
        "NO_OF_DEPENDENTS": 0,
        "IS_ESI": 0,
        "INSUREDNAME": "Devender Paladi",
        "HCL_ENTITY": "",
        "TRIGGER_FLAG": 1,
        "IS_SEZ": 1,
        "IS_EMCP": 0,
        "EMAIL": "DEVENDER.PALADI@HCL.COM",
        "MOBILE": "7682964667",
        "GRADE": "E1",
        "DOB": "1996-02-15",
        "DOJ": "2019-10-11",
        "INDIANADDRESS": "PDM RESIDENCY, 12 11 1649 AMBERNAGAR,WARASIGUDA,HYDERABAD,HYDERABAD,500044",
        "MARITAL_STATUS": "N",
        "DOM": "",
        "GENDER": "M",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "6c4b626ead1a31f382d762fba9c97e2e41f5616c",
        "BLOOD_GROUP": 0
      }
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` |
| `GetEmpStatus` | array | Always `[]` for this op |
| `GetStatus.callStatus` | boolean | Call success |
| `GetStatus.procedureStatus` | boolean | Procedure success |
| `GetStatus.returnMessage` | string | `Employee deleted successfully.` |
| `GetStatus.returnValue` | number | `1` = success |

#### Example Response

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [],
  "GetStatus": { "callStatus": true, "procedureStatus": true, "returnMessage": "Employee deleted successfully.", "returnValue": 1 }
}
```

---

## 5. Employee Separation (`ES`)

Removes an employee record on exit/resignation. Structurally identical to Demise but keeps an `E_DEP_HCL` array in the request — populated with a single all-blank placeholder entry rather than being omitted.

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `iirmhclwebservice` | Service username |
| `Password` | string | `iirmhcl$123` | Service password |
| `Flag_operationType` | string | `ES` | Operation selector |
| `Groupcode` | string | `HTLC` | Group code |
| `policyno` | string | `900020001111` | Policy number |
| `Del_hcldepid` | string | `"0"` | Not used for this op *(sent as a string here, unlike the numeric `0` elsewhere)* |
| `wef` | string (date) | `2021-06-01` | Last working day / effective separation date |
| `Del_deletionremarks` | string | `testing` | Free-text remark |
| `prom_ctc` / `prom_grade` / `prom_companyid` / `prom_basesi` | — | `0` / `""` / `0` / `0` | Unused — see Q2 |
| `SelfCount` | number | `0` | Not used for this op |
| `objEMPLOYEE_DATA` | array | — | One `{ E_EMP_HCL, E_DEP_HCL }` object, mostly placeholder values |

#### Request Fields — `E_EMP_HCL`

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `""` | Blank — not required for this op |
| `EIN` | string | `51776256` | **The separating employee's ID** |
| `Groupcode` | string | `NA` | Placeholder |
| `policyno` | string | `NA` | Placeholder |
| `CTC` | number | `0` | Placeholder |
| `NO_OF_DEPENDENTS` | number | `0` | Placeholder |
| `IS_ESI` | 0/1 | `0` | Placeholder |
| `INSUREDNAME` | string | `""` | Placeholder |
| `HCL_ENTITY` | string | `""` | Placeholder |
| `TRIGGER_FLAG` | number | `0` | Placeholder |
| `IS_SEZ` | 0/1 | `0` | Placeholder |
| `IS_EMCP` | 0/1 | `0` | Placeholder |
| `EMAIL` / `MOBILE` / `GRADE` / `DOB` / `DOJ` / `INDIANADDRESS` / `MARITAL_STATUS` / `DOM` / `GENDER` / `LOCATION` | string | `""` | All blank placeholders |
| `OLDEMPID` | number | `0` | Placeholder |
| `CHECK_SUM` | string | `dff5b7c6119bcb61f27c337ea84f79576af5dc37` | **The only other real value on this object** — SHA-1 hash |
| `BLOOD_GROUP` | number | `0` | Placeholder |

#### Request Fields — `E_DEP_HCL` (array — single placeholder entry)

| Field | Type | Example | Description |
|---|---|---|---|
| `HCL_DEPID` | number | `0` | Placeholder |
| `DEP_NAME` | string | `""` | Placeholder |
| `HCL_DEPADDON` | string | `""` | Placeholder |
| `HCL_DEPREL` | number | `0` | Placeholder |
| `DEP_DOB` | string | `""` | Placeholder |
| `DEP_GENDER` | string | `""` | Placeholder |
| `MARITAL_STATUS` | string | `""` | Placeholder |
| `TRIGGER_FLAG` | number | `0` | Placeholder |
| `CHECK_SUM` | string | `""` | Placeholder |
| `BLOOD_GROUP` | number | `0` | Placeholder |

#### Example Request

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "ES",
  "Groupcode": "HTLC",
  "policyno": "900020001111",
  "Del_hcldepid": "0",
  "wef": "2021-06-01",
  "Del_deletionremarks": "testing",
  "prom_ctc": 0,
  "prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "SelfCount": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "",
        "EIN": "51776256",
        "Groupcode": "NA",
        "policyno": "NA",
        "CTC": 0,
        "NO_OF_DEPENDENTS": 0,
        "IS_ESI": 0,
        "INSUREDNAME": "",
        "HCL_ENTITY": "",
        "TRIGGER_FLAG": 0,
        "IS_SEZ": 0,
        "IS_EMCP": 0,
        "EMAIL": "",
        "MOBILE": "",
        "GRADE": "",
        "DOB": "",
        "DOJ": "",
        "INDIANADDRESS": "",
        "MARITAL_STATUS": "",
        "DOM": "",
        "GENDER": "",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "dff5b7c6119bcb61f27c337ea84f79576af5dc37",
        "BLOOD_GROUP": 0
      },
      "E_DEP_HCL": [
        {
          "HCL_DEPID": 0,
          "DEP_NAME": "",
          "HCL_DEPADDON": "",
          "HCL_DEPREL": 0,
          "DEP_DOB": "",
          "DEP_GENDER": "",
          "MARITAL_STATUS": "",
          "TRIGGER_FLAG": 0,
          "CHECK_SUM": "",
          "BLOOD_GROUP": 0
        }
      ]
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` |
| `GetEmpStatus` | array | Always `[]` for this op |
| `GetStatus.callStatus` | boolean | Call success |
| `GetStatus.procedureStatus` | boolean | Procedure success |
| `GetStatus.returnMessage` | string | `Employee deleted successfully.` |
| `GetStatus.returnValue` | number | `1` = success |

#### Example Response

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [],
  "GetStatus": { "callStatus": true, "procedureStatus": true, "returnMessage": "Employee deleted successfully.", "returnValue": 1 }
}
```

---

## 6. Employee Transfer (`ET`)

Moves an employee (and dependents) to EMCP — e.g. on an entity or location transfer. `IS_EMPAD` is sent as `0` in the sample despite the employee remaining active; only `IS_EMCP: 1` is asserted as the outcome.

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `iirmhclwebservice` | Service username |
| `Password` | string | `iirmhcl$123` | Service password |
| `Flag_operationType` | string | `ET` | Operation selector |
| `Groupcode` | string | `HTLC` | Group code |
| `policyno` | string | `900020001111` | Policy number |
| `SelfCount` | number | `2` | Count of principal records — *(sample body carries only 1 employee despite this value; see Q7)* |
| `Del_hcldepid` | number | `0` | Not used for this op |
| `wef` | string (date) | `2021-08-03` | Effective transfer date |
| `Del_deletionremarks` | string | `""` | Not used for this op |
| `prom_ctc` / `prom_grade` / `prom_companyid` / `prom_basesi` | — | `0` / `""` / `0` / `0` | Unused — see Q2 |
| `objEMPLOYEE_DATA` | array | — | One `{ E_EMP_HCL, E_DEP_HCL }` object |

#### Request Fields — `E_EMP_HCL`

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `H84W8p+rJtNQPl4kZNGxFQ==` | Encrypted employee ID |
| `EIN` | string | `51854879` | Employee ID |
| `Groupcode` | string | `NA` | Placeholder |
| `policyno` | string | `NA` | Placeholder |
| `CTC` | number | `1` | Cost to company |
| `NO_OF_DEPENDENTS` | number | `3` | Dependent count |
| `IS_ESI` | 0/1 | `0` | ESI applicability flag |
| `INSUREDNAME` | string | `Gulam Mazhar` | Employee name |
| `HCL_ENTITY` | string | `5050` | HCL entity code |
| `TRIGGER_FLAG` | number | `1` | Change-trigger code — see Q3 |
| `IS_SEZ` | 0/1 | `1` | SEZ flag |
| `IS_EMCP` | 0/1 | `1` | **Target EMCP flag for the transfer** |
| `EMAIL` | string | `GULAM.MAZHAR@HCL.COM` | Employee email |
| `MOBILE` | string | `7682964667` | Employee mobile |
| `GRADE` | string | `E5` | Employee grade |
| `DOB` | string (date) | `1996-02-15` | Date of birth |
| `DOJ` | string (date) | `2019-10-11` | Date of joining |
| `INDIANADDRESS` | string | `opposite Veterinary Hospital,...` | Address, comma-separated |
| `MARITAL_STATUS` | string | `N` | `N` / `M` |
| `GENDER` | string | `M` | `M` / `F` |
| `OLDEMPID` | number | `0` | Prior employee ID, if reissued |
| `LOCATION` | string | `""` | Location code |
| `CHECK_SUM` | string | `9944c079f868931d121aca110a0be229e4e7df21` | SHA-1 hash of the record |
| `BLOOD_GROUP` | number | `0` | Placeholder — see Q5 |
| `IS_EMPAD` | 0/1 | `0` | Active/inactive flag — `0` despite employee remaining active, see Q8 |

#### Request Fields — `E_DEP_HCL` (array)

| Field | Type | Example | Description |
|---|---|---|---|
| `HCL_DEPID` | number | `35`, `36`, `37` | Dependent ID |
| `DEP_NAME` | string | `NEHA`, `RISHAB`, `Roshan` | Dependent name |
| `HCL_DEPADDON` | string (datetime) | `2017-04-09 12:12:12` | Date dependent was added |
| `HCL_DEPREL` | number | `7`, `1`, `9` | Relation code — see Q3 |
| `DEP_DOB` | string (date) | `1993-02-01` | Dependent date of birth |
| `DEP_GENDER` | string | `F`, `M` | `M` / `F` |
| `MARITAL_STATUS` | string | `N`, `M` | `N` / `M` |
| `CHECK_SUM` | string | `c358f66caf699031006851f1d643664f9dba1590` | SHA-1 hash of the dependent record |
| `TRIGGER_FLAG` | number | `6` | Change-trigger code, dependent-level |
| `IS_DEP_EMCP` | 0/1 | `1`, `0` | Dependent EMCP flag |

#### Example Request

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "ET",
  "Groupcode": "HTLC",
  "policyno": "900020001111",
  "SelfCount": 2,
  "Del_hcldepid": 0,
  "wef": "2021-08-03",
  "Del_deletionremarks": "",
  "prom_ctc": 0,
  "prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "H84W8p+rJtNQPl4kZNGxFQ==",
        "EIN": "51854879",
        "Groupcode": "NA",
        "policyno": "NA",
        "CTC": 1,
        "NO_OF_DEPENDENTS": 3,
        "IS_ESI": 0,
        "INSUREDNAME": "Gulam Mazhar",
        "HCL_ENTITY": "5050",
        "TRIGGER_FLAG": 1,
        "IS_SEZ": 1,
        "IS_EMCP": 1,
        "EMAIL": "GULAM.MAZHAR@HCL.COM",
        "MOBILE": "7682964667",
        "GRADE": "E5",
        "DOB": "1996-02-15",
        "DOJ": "2019-10-11",
        "INDIANADDRESS": "opposite Veterinary Hospital,Pugmil Road,Hazaribagh,Hazaribagh,825301",
        "MARITAL_STATUS": "N",
        "GENDER": "M",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "9944c079f868931d121aca110a0be229e4e7df21",
        "BLOOD_GROUP": 0,
        "IS_EMPAD": 0
      },
      "E_DEP_HCL": [
        {
          "HCL_DEPID": 35,
          "DEP_NAME": "NEHA",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 7,
          "DEP_DOB": "1993-02-01",
          "DEP_GENDER": "F",
          "MARITAL_STATUS": "N",
          "CHECK_SUM": "c358f66caf699031006851f1d643664f9dba1590",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 1
        },
        {
          "HCL_DEPID": 36,
          "DEP_NAME": "RISHAB",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 1,
          "DEP_DOB": "1945-11-23",
          "DEP_GENDER": "M",
          "MARITAL_STATUS": "M",
          "CHECK_SUM": "e2e0b7388bd369c5aa8466698bc1ad6db0977b57",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 1
        },
        {
          "HCL_DEPID": 37,
          "DEP_NAME": "Roshan",
          "HCL_DEPADDON": "2017-04-09 12:12:12",
          "HCL_DEPREL": 9,
          "DEP_DOB": "2015-01-02",
          "DEP_GENDER": "M",
          "MARITAL_STATUS": "N",
          "CHECK_SUM": "b873127a269d0a2c271e57c345666dea8d99dbac",
          "TRIGGER_FLAG": 6,
          "IS_DEP_EMCP": 0
        }
      ]
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` |
| `GetEmpStatus` | array | Always `[]` for this op |
| `GetStatus.callStatus` | boolean | Call success |
| `GetStatus.procedureStatus` | boolean | Procedure success |
| `GetStatus.returnMessage` | string | `Employee Transferred TO EMCP Successfully` |
| `GetStatus.returnValue` | number | `1` = success |

#### Example Response

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [],
  "GetStatus": { "callStatus": true, "procedureStatus": true, "returnMessage": "Employee Transferred TO EMCP Successfully", "returnValue": 1 }
}
```

---

## 7. Employee Natural Addition (`NA`)

Adds a new dependent to an existing employee (e.g. birth, marriage). `E_EMP_HCL` carries only `EIN` and `DOM` (date of marriage) with everything else blank; the new dependent is the sole entry in `E_DEP_HCL`.

**Endpoint**
```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

#### Request Fields — Top Level

| Field | Type | Example | Description |
|---|---|---|---|
| `UserName` | string | `iirmhclwebservice` | Service username |
| `Password` | string | `iirmhcl$123` | Service password |
| `Flag_operationType` | string | `NA` | Operation selector |
| `Groupcode` | string | `HTLC` | Group code |
| `policyno` | string | `900020001111` | Policy number |
| `Del_hcldepid` | string | `"0"` | Not used for this op |
| `wef` | string (date) | `2021-08-01` | Effective date of the addition |
| `Del_deletionremarks` | string | `testing` | Free-text remark |
| `prom_ctc` / `prom_grade` / `prom_companyid` / `prom_basesi` | — | `0` / `""` / `0` / `0` | Unused — see Q2 |
| `SelfCount` | number | `0` | Not used for this op |
| `objEMPLOYEE_DATA` | array | — | One `{ E_EMP_HCL, E_DEP_HCL }` object |

#### Request Fields — `E_EMP_HCL`

| Field | Type | Example | Description |
|---|---|---|---|
| `ENCRYPT_EIN` | string | `""` | Blank — not required for this op |
| `EIN` | string | `90089` | **The employee gaining the new dependent** |
| `Groupcode` | string | `NA` | Placeholder |
| `policyno` | string | `NA` | Placeholder |
| `CTC` | number | `0` | Placeholder |
| `NO_OF_DEPENDENTS` | number | `0` | Placeholder |
| `IS_ESI` | 0/1 | `0` | Placeholder |
| `INSUREDNAME` | string | `""` | Placeholder |
| `HCL_ENTITY` | string | `""` | Placeholder |
| `TRIGGER_FLAG` | number | `0` | Placeholder |
| `IS_SEZ` | 0/1 | `0` | Placeholder |
| `IS_EMCP` | 0/1 | `0` | Placeholder |
| `EMAIL` / `MOBILE` / `GRADE` / `DOB` / `DOJ` / `INDIANADDRESS` / `MARITAL_STATUS` / `GENDER` / `LOCATION` | string | `""` | All blank placeholders |
| `DOM` | string (date) | `2017-05-15` | **Date of marriage — the real field driving this addition** |
| `OLDEMPID` | number | `0` | Placeholder |
| `CHECK_SUM` | string | `""` | Blank in the sample |
| `BLOOD_GROUP` | number | `0` | Placeholder |

#### Request Fields — `E_DEP_HCL` (array — the new dependent)

| Field | Type | Example | Description |
|---|---|---|---|
| `HCL_DEPID` | number | `485079` | New dependent ID |
| `DEP_NAME` | string | `Ramesh` | Dependent name |
| `HCL_DEPADDON` | string | `""` | Blank in the sample |
| `HCL_DEPREL` | number | `4` | Relation code — see Q3 |
| `DEP_DOB` | string (date) | `1978-09-21` | Dependent date of birth |
| `DEP_GENDER` | string | `F` | `M` / `F` |
| `MARITAL_STATUS` | string | `M` | `N` / `M` |
| `TRIGGER_FLAG` | number | `0` | Change-trigger code, dependent-level |
| `CHECK_SUM` | string | `4a330a105c8e2aeda4d113343b796ac9484da8cf` | SHA-1 hash of the dependent record |
| `BLOOD_GROUP` | number | `0` | Placeholder — see Q5 |

#### Example Request

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "NA",
  "Groupcode": "HTLC",
  "policyno": "900020001111",
  "Del_hcldepid": "0",
  "wef": "2021-08-01",
  "Del_deletionremarks": "testing",
  "prom_ctc": 0,
  "prom_grade": "",
  "prom_companyid": 0,
  "prom_basesi": 0,
  "SelfCount": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "ENCRYPT_EIN": "",
        "EIN": "90089",
        "Groupcode": "NA",
        "policyno": "NA",
        "CTC": 0,
        "NO_OF_DEPENDENTS": 0,
        "IS_ESI": 0,
        "INSUREDNAME": "",
        "HCL_ENTITY": "",
        "TRIGGER_FLAG": 0,
        "IS_SEZ": 0,
        "IS_EMCP": 0,
        "EMAIL": "",
        "MOBILE": "",
        "GRADE": "",
        "DOB": "",
        "DOJ": "",
        "INDIANADDRESS": "",
        "MARITAL_STATUS": "",
        "DOM": "2017-05-15",
        "GENDER": "",
        "OLDEMPID": 0,
        "LOCATION": "",
        "CHECK_SUM": "",
        "BLOOD_GROUP": 0
      },
      "E_DEP_HCL": [
        {
          "HCL_DEPID": 485079,
          "DEP_NAME": "Ramesh",
          "HCL_DEPADDON": "",
          "HCL_DEPREL": 4,
          "DEP_DOB": "1978-09-21",
          "DEP_GENDER": "F",
          "MARITAL_STATUS": "M",
          "TRIGGER_FLAG": 0,
          "CHECK_SUM": "4a330a105c8e2aeda4d113343b796ac9484da8cf",
          "BLOOD_GROUP": 0
        }
      ]
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|---|---|---|
| `GetEmpDetails` | null | Always `null` |
| `GetEmpStatus` | array | Always `[]` for this op |
| `GetStatus.callStatus` | boolean | Call success |
| `GetStatus.procedureStatus` | boolean | Procedure success |
| `GetStatus.returnMessage` | string | `Natural addition added successfully.` |
| `GetStatus.returnValue` | number | `1` = success |

#### Example Response

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [],
  "GetStatus": { "callStatus": true, "procedureStatus": true, "returnMessage": "Natural addition added successfully.", "returnValue": 1 }
}
```

---

## Open Questions

1. **Credentials inconsistency (DD).** The Dependent Delete sample ships with `UserName`/`Password` blank, while every other operation sends real credentials. Confirm whether auth is optional for `DD` or the sample is simply redacted.
2. **`prom_ctc` / `prom_grade` / `prom_companyid` / `prom_basesi`.** Present on every request envelope but `0`/empty in all 21 sample payloads across all 7 operations — no scenario in the source document exercises a non-zero value. Purpose (likely promotion-driven CTC/grade/base-SI change) is not documented. Note also the casing is inconsistent — `Prom_grade` on `DD`/`ED`, `prom_grade` everywhere else.
3. **`TRIGGER_FLAG` / `HCL_DEPREL` legends.** Both are numeric codes with no lookup table in the source document. Observed `TRIGGER_FLAG` values: `0`, `1`, `6`. Observed `HCL_DEPREL` values: `1`, `4`, `7`, `9` (likely spouse/parent/child/infant, but unconfirmed).
4. **`IS_EMCP` / `IS_EMPAD` / `GHMI` abbreviations.** Drive the entire AD/ET scenario branching but are never expanded in the source document.
5. **`BLOOD_GROUP` encoding.** Always `0` across every sample — no code table given.
6. **`GetStatus` unreliable on `DD` and `BI`.** `GetStatus.callStatus: false` on a *successful* Dependent Delete (contradicts `GetEmpStatus[0]`), and `GetStatus.procedureStatus: false` / `returnValue: 0` on a *successful* Bulk Insert. Needs confirmation on whether consumers should trust `GetEmpStatus[]` over `GetStatus` for these two operations.
7. **`SelfCount: 2` on `ET` with only 1 employee in the payload.** The sample's declared count doesn't match the array length — likely a copy-paste artifact in the source document, but worth confirming against a real payload.
8. **`IS_EMPAD: 0` on a successful Transfer.** The employee is being transferred (implicitly remaining active), yet `IS_EMPAD` is sent as `0`. Unclear whether Transfer requires a separate `AD` call to (re)activate, or whether `IS_EMPAD` is simply ignored by the `ET` operation.

---

## Source References

- `IIRM-HCL-Portal-Integration_05022024.docx` — HCL Interface Document, Version 1.4, 05-Feb-2024
