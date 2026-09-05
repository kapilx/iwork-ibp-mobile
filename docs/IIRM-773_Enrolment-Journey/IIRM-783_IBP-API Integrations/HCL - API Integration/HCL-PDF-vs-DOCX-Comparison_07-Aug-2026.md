# HCL Interface — PDF vs DOCX Comparison

**PDF source:** `IIRM-HCL-Portal-Integration_05022024.docx` (rendered as `IIRM-HCL-Portal-Integration_05022024.docx.pdf`) — "HCL Interface Document, Version 1.4, 05-Feb-2024"
**DOCX source:** `HCL_SingleAPIService_Documentation.docx` — untitled, undated, headed **"HCL API SERVICE (2017 WCF)"**

## Headline finding

These are not two versions of the same document — they describe **two different HCL services**:

| | PDF | DOCX |
|---|---|---|
| Endpoint style | REST (ASP.NET Web API route) | WCF `.svc` service |
| Endpoint | `https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData` | Stage: `http://dev.isbsindia.in/MOBSOL2_test/HCLapiservice.svc/HCLMasterAPI`; Live: `https://myhealth.indiainsure.com/MOBSOL/MobServ/HCLapiservice.svc/HCLMasterAPI` |
| Host domain | `integratedbenefitsportal.com` (IBP) | `isbsindia.in` (stage) → `indiainsure.com` (live) — **domain changes between stage and live**, not just a hostname suffix |
| Versioned/dated | Yes — v1.4, 05-Feb-2024 | No version, no date. Self-labels "2017 WCF" |
| Scope | Clean external interface contract, 7 operations, all success-case examples | Internal working notes: 10 operations + DB/SVN pointers, mixes success **and failure** examples |

The DOCX also carries a warning the PDF has no equivalent of: *"Don't use this url for Stage"* next to an old `MOBSOL2` stage URL, with the current one being `MOBSOL2_test` — i.e. even within the DOCX there's a deprecated stage URL still sitting in the document.

Both documents clearly share the same underlying test dataset (EIN `51854879` "Gulam Mazhar", dependents `NEHA`/`RISHAB`/`Roshan`, identical `CHECK_SUM` hashes reused verbatim across ED/ES/NA/DD samples in both files) — so the DOCX reads as the earlier/legacy service that the PDF's REST service superseded, carried forward with the same demo data.

---

## Per-Operation Comparison

Sorted by `Flag_operationType` code.

| Flag | Operation | In PDF? | In DOCX? | Status |
|---|---|---|---|---|
| `AD` | Employee Activate/Deactivate | ✅ 4 scenarios (all `IS_EMCP`×`IS_EMPAD` combinations) | ✅ 1 scenario only | **Shared, but contradictory.** DOCX's only example sends `IS_EMCP:1, IS_EMPAD:0` and returns `"Employee EMCP Activated successfully."` — the exact same flag combination the PDF labels scenario **(c)** and returns `"Employee EMCP de-activated successfully."` for. Same input, opposite outcome message between the two docs. |
| `BI` | Bulk Insert | ✅ | ✅ | **Shared, schema differs.** Same employee/dependent data (EIN `51854879` + 3 deps, EIN `90089`) and same checksums, but DOCX's `E_EMP_HCL` objects have **no `Groupcode`/`policyno` fields at all** (per-employee or top-level); PDF's do (`HTLC` / `900020001111`, `1280`/`NA` per employee). |
| `DD` | Dependent Delete | ✅ success example | ✅ failure example | **Shared, opposite outcomes shown.** Same `Del_hcldepid`, `wef`, remark, and `CHECK_SUM` in the input, but DOCX's output is `"checksum not matching"` (failure) vs PDF's `"Employee dependents deleted successfully"` (success) — the two docs illustrate different halves of the same op. DOCX's failure response also leaks raw C# property names: `<GetEmpStatus>k__BackingField` / `<GetStatus>k__BackingField` instead of `GetEmpStatus`/`GetStatus`. |
| `ED` | Employee Demise | ✅ | ✅ | **Shared, near-identical.** Same EIN `51922416` "Devender Paladi", same checksum, same `wef`. Only cosmetic differences (field order, `Groupcode`/`policyno` absent in DOCX as with every other op). |
| `EP` | Employee Promotion | ❌ not present | ✅ | **DOCX-only.** This is the operation that finally explains the PDF's mystery envelope fields `prom_ctc`, `prom_grade`, `prom_companyid`, `prom_basesi` — present but always `0`/empty in every PDF sample. DOCX's `EP` example sets `prom_ctc:1` (used as a flag, not an amount), `prom_grade:"E5"`, and prefixes the EIN with `ER` (`"EIN": "ER51854879"`). Output is also a `"checksum not matching"` failure with the same backing-field leak as `DD`. |
| `ES` | Employee Separation | ✅ | ✅ | **Shared, near-identical.** Same EIN `51776256`, checksum, `wef`. Same `DOM` placeholder field. Only difference is the missing `Groupcode`/`policyno`. |
| `ET` | Employee Transfer | ✅ 1 scenario (transfer **to EMCP**) | ✅ 2 scenarios (transfer **to EMCP** and transfer **to GHMI**) | **Shared, DOCX has more coverage.** PDF's example matches DOCX's EMCP-target variant exactly (same EIN, same `CHECK_SUM` `9944c079...`). DOCX additionally documents a GHMI-target variant (different `HCL_ENTITY` `4710`, different checksum, **no `IS_EMPAD` field at all**) returning `"Employee Transferred TO GHMI Successfully"` — a second outcome message the PDF never shows. |
| `GE` | Get Employee Details | ❌ not present | ✅ | **DOCX-only.** Read-only lookup by `ENCRYPT_EIN`+`EIN` pairs. Returns policy/endorsement metadata never seen in the PDF at all: `oic_policy_no`, `oic_endorsement_no`, `oic_risk_id`, `tpaid`, `Indiainsure_portal_entry_date`, `deleted_in_iirm_portal_date`, `risk_id_generated_on`, `endorsementremarks`. |
| `NA` | Employee Natural Addition | ✅ | ✅ | **Shared, near-identical.** Same EIN `90089`, `DOM`, dependent (`Ramesh`, checksum `4a330a10...`). Only difference is the missing `Groupcode`/`policyno`. |
| `SI` | Single Insert | ❌ not present | ✅ 2 variants | **DOCX-only.** Regular Single Insert (1 employee + 3 deps, `SelfCount:1`) plus a second unlabeled variant carrying `"IS_Contract":1` on `E_EMP_HCL` ("Contract Employee Insert" per its filename) — a contract-employee flag not documented anywhere else. Both variants use the same `Flag_operationType:"SI"`; contract-vs-permanent is only distinguished by the extra field, not a separate flag. Note the DOCX's own numbered list (`flg_InsertinIIRM`) also calls out `"SI - Single Insert - there are not using"` in its closing notes — i.e. the DOCX itself flags this operation as **not currently in use**. |
| *(none)* | Employee Revocation | ❌ not present | ⚠️ named only | Listed in the DOCX's closing notes as `"ER - Employee Revocation"` but has **no flag constant, no endpoint detail, no sample JSON** — mentioned in passing, not documented. |

---

## Cross-Cutting Structural Differences

These apply across every operation rather than to one flag specifically.

| Topic | PDF | DOCX |
|---|---|---|
| `Groupcode` / `policyno` | Present at top level **and** per-employee on every one of the 7 operations (real values like `HTLC`/`900020001111`, or `NA` placeholders) | **Absent entirely** — no operation in any of the 12 DOCX samples includes either field, top-level or per-employee |
| Response envelope shape | Fully uniform: `GetEmpDetails` (always present, always `null`), `GetEmpStatus` (array — `[]` or populated), `GetStatus` (always a populated object) | Wildly inconsistent sample-to-sample: `GetEmpDetails` key is missing on 10 of 12 examples; `GetEmpStatus` is sometimes `null`, sometimes a bare object (not array), sometimes an array; `GetStatus` is `null` on 5 of 12 examples |
| Property-name serialization | Always clean JSON keys | `DD` and `EP` failure responses leak raw C# auto-property backing-field names — `<GetEmpStatus>k__BackingField`, `<GetStatus>k__BackingField` — instead of `GetEmpStatus`/`GetStatus` |
| Error/failure examples | None — all 21 PDF examples are success cases | 2 of 12 (`DD`, `EP`) are failure cases (`"checksum not matching"`) — the only place either document shows what an error response looks like |
| Infra references (DB, SVN, source file) | None | DB host `192.168.100.30`, DB `IIRM_HCL_STAGE_NEW`, SVN `http://192.168.100.92/svn/IIRM_HCL_Service_2021`, source file `HCLapiservice.svc.cs` |
| Document framing | Formal external interface contract, versioned | Informal internal notes — flag list + embedded sample files, no prose explanation per operation |

---

## Practical implications

1. **Don't assume the two are interchangeable.** If HCL (or anyone) is still calling the WCF `.svc` endpoint, it is a distinct integration from the REST `HCLProcessEnrollData` one documented in the PDF — different host, different auth expectations (no `Groupcode`/`policyno`), different response shape. Confirm which one is actually live/in-use before doing any integration work.
2. **`SI` is explicitly marked unused** by the DOCX's own notes — safe to treat as legacy/dead unless someone says otherwise.
3. **`EP` and `GE` are real capabilities missing from the PDF's contract.** If the REST service is meant to be the full successor to the WCF one, these two need a home there — worth asking whether the REST side already has equivalents in a different, undocumented endpoint before assuming the WCF-only ops need to be ported over.
4. **The `AD` scenario-c contradiction is worth resolving with HCL/the source author**, not guessing — it directly affects whether `IS_EMPAD:0` means "deactivate" or "activate" depending on which service generation you trust.

---

## Source References

- `IIRM-HCL-Portal-Integration_05022024.docx` — HCL Interface Document, Version 1.4, 05-Feb-2024 (rendered PDF)
- `HCL_SingleAPIService_Documentation.docx` — undated, "HCL API SERVICE (2017 WCF)"
