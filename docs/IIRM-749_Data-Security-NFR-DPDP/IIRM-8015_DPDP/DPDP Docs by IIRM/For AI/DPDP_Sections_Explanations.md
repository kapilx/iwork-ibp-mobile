# DPDP Compliance Sheets -- Detailed Explanations

## 1. ROPA --- Record of Processing Activities

### Purpose:

• Acts as the master inventory of all personal data your organization collects, processes, stores, shares, and deletes.

• Necessary for DPDP audits, DPIA, SDF obligations, and legal defensibility.

### Why needed:

• Shows WHAT data is processed, WHY, WHERE it is stored, WHO can access it, and HOW long it is retained.

• Helps identify risk areas and cross-border transfers.

• Required as good practice for listed companies and SDF.

## 2. CrossBorder_Transfers --- Cross-border Transfer Register

### Purpose:

• Track all personal data leaving India as per DPDP Rule 15.

• Maintain record of destinations, vendors, encryption controls, and legal justifications.

### Why needed:

• DPDP mandates documenting every cross-border transfer.

• Required for AWS/Azure foreign regions and international SaaS.

• Ensures compliance if government restricts specific destinations.

## 3. DPIA_Template --- Data Protection Impact Assessment

### Purpose:

• Assess privacy risks for systems handling large volumes of personal data.

• Mandatory for Significant Data Fiduciaries (listed companies are likely classified as SDF).

### Why needed:

• Identifies high-risk processing activities and evaluates mitigations.

• Supports DPO and Board approvals.

• Needed annually for SDF compliance.

## 4. Breach_Register --- Data Breach Log

### Purpose:

• Document all data breaches, including attempts, per DPDP Rule 7.

• Maintain timeline for 72-hour reporting requirement.

### Why needed:

• Regulators and auditors require historical breach logs.

• SEBI and DPDP both mandate breach reporting.

• This register becomes critical during investigations.

## 5. DP_Request_Register --- Data Principal Request Register

### Purpose:

• Track rights requests such as Access, Correction, Erasure, Consent Withdrawal, and Grievances.

• Proves compliance to DPDP Rule 14.

### Why needed:

• DPDP mandates responding within defined timelines.

• Auditors check whether requests were closed within SLA.

• Acts as legal defense showing timely action.

## 6. Vendor_Risk_Assessment --- Vendor/Processor Evaluation

### Purpose:

• Evaluate all vendors handling personal data (processors) under DPDP Rule 6(f).

• Ensure vendors have appropriate security and privacy controls.

### Why needed:

• You remain responsible for breaches caused by your vendors.

• Helps score risk levels (High/Medium/Low).

• Required for contract renewals and due diligence.

## 7. Evidence_Checklist --- Compliance Evidence Repository

### Purpose:

• Track all evidence supporting DPDP compliance.

• Includes logs, screenshots, reports, policies, and audit exports.

### Why needed:

• Auditors require proof for every implemented control.

• Makes DPDP, SEBI, and ISO audits faster.

• Prevents missing evidence during regulatory inspections.

## 8. DPDP_ISO_SEBI_Map --- Compliance Cross-Mapping

### Purpose:

• Map DPDP controls to ISO 27001 and SEBI Cybersecurity guidelines.

• Shows how one control satisfies multiple compliance frameworks.

### Why needed:

• Reduces duplicate work.

• Helps CISOs and auditors identify coverage gaps.

• Creates unified compliance governance.

## 9. Training_Register --- Employee Training Log

### Purpose:

• Track DPDP and cybersecurity training for employees.

• Proves that organizational safeguards under Rule 6 were implemented.

### Why needed:

• Training is compulsory for privacy and security programs.

• Listed companies must maintain cybersecurity training logs for SEBI.

• Demonstrates awareness across workforce.

## 10. Key_Management --- Encryption Key Register

### Purpose:

• Track cryptographic keys used for:

• • Database encryption (Oracle TDE, SQL TDE)

• • File encryption

• • AWS/Azure KMS keys

• • Server certificates

• • API keys (optional)

• • Secrets stored in vaults

### Why needed:

• To prove:

• • Keys are rotated regularly

• • Access to keys is restricted

• • Sensitive encryption material is protected

• • Encryption is managed safely across systems

• Auditors routinely ask: "Show me encryption key rotation logs."

• This sheet provides that proof.
