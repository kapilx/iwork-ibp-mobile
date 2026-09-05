# Claim Management Process


## 1. Claim Intimation  

### Step 1.1: Claim Informed  
- **Intimation Date & Time (M)**  
  - Data Type: Date & Time  
  - Rules:  
    - Pre-populate current date & time  
    - Allow user to change either past or future date and time  
    - Format: `dd/mm/yyyy HH:MM` (24 Hours clock)  

- **Intimated By (M)**  
  - Data Type: Text (Dropdown)  
  - Values: `Client, CRM`  

- **Intimation Channel (M)**  
  - Data Type: Text (Dropdown)  
  - Values: `Phone, Email, Portal`  

- **Loss Location (M)**  
  - Data Type: Text (Dropdown)  
  - Rules:  
    - If policy linked to single risk location → pre-populate  
    - If linked to multiple locations → display list for user selection  

- **Description of Loss (M)**  
  - Data Type: Text Area  
  - Rules: Max 500 characters  

- **Buttons**  
  - Save (O): Save input data without validation  
  - Next (M): Validate fields, save data, and move to next step  


### Step 1.2: First Notice of Loss (FNOL) Details  
- **FNOL Sent Date (M)**  
  - Data Type: Date  
  - Rules:  
    - Pre-populate current date  
    - Allow past/future date  
    - Format: `dd/mm/yyyy`  
    - Must be Claim Intimation Date or future date  

- **Insurer Reference No. (M)**  
  - Data Type: String  
  - Rules: Alphanumeric + Special characters (pattern TBD)  

- **Uploaded FNOL Copy (C)**  
  - Data Type: Table View  
  - Columns:  
    - Document Name  
    - Uploaded On (dd/mm/yyyy)  
    - Uploaded By  
    - Actions: Download / Re-Upload / Delete  
  - Show "No Data" if no file uploaded  

- **Upload FNOL Copy (M)**  
  - Data Type: File Upload (1 file)  
  - Rules:  
    - Formats: `.pdf, .docx, .doc`  
    - Max size: 25 MB (TBD)  
    - At least 1 file must be uploaded to proceed  

- **Buttons**  
  - Save (O)  
  - Next (M)  


## 2. Survey and Documentation  

### Step 2.1: Loss Adjuster Details  
- **Adjuster Appointment Date (M)**  
  - Data Type: Date  
  - Rules:  
    - Pre-populate current date  
    - Allow past/future date  
    - Format: `dd/mm/yyyy`  
    - Must not be earlier than FNOL Sent Date  

- **Adjuster Name (M)** → String, Alphabets only, Max 100 chars  
- **Adjuster Phone (M)**  
  - Data Type: Numeric  
  - Country Rules:  
    - India: `^[6-9]\d{9}$`  
    - Srilanka: `^7\d{8}$`  
    - Maldives: `^\d{7}$`  

- **Adjuster Email (O)** → Validate standard email format  
- **Adjuster Appointment Ref No. (O)** → Alphanumeric, Max 30 chars  
- **Adjuster Assigned By (M)** → Pre-populate company full name (non-editable)  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 2.2: Survey Completed  
- **Survey Date (M)** → Pre-populate, not earlier than Adjuster Appointment Date  
- **Surveyor Name (M)** → Alphabets, Max 100 chars  
- **Findings Summary (O)** → Text Area, Max 500 chars  
- **Uploaded Survey Copy(ies) (C)** → Table view with doc details + actions  
- **Upload Survey Copy (M)** → Multiple allowed, `.pdf, .docx, .doc`, Max 25 MB, Min 1 required  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 2.3: Documents Collected  
- **List of Required Documents (M)** → Table view with:  
  - Document Name (Policy Copy, FIR, Invoices, Photos, Estimate, Other)  
  - Received Date  
  - Upload File  
  - Actions: Download / Delete  

- **Special Rules**:  
  - "Other" → show input box for custom doc name  
  - Allow multiple "Other" docs  
  - File formats: `.pdf, .docx, .doc`, Max 25 MB  
  - At least 1 file required to proceed  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 2.4: Joint Inspection Report  
- **Joint Inspection Date (M)** → Not earlier than Survey Date  
- **Inspected By (M)** → Alphabets, Max 100 chars  
- **Parties Present (M)** → Multi-select (Client, Insurer, Adjuster, Surveyor)  
- **Inspection Findings (O)** → Text Area, Max 500 chars  
- **Uploaded Inspection Report(s) (C)** → Table view with actions  
- **Upload Inspection Report (M)** → Multiple, `.pdf, .docx, .doc`, Max 25 MB, Min 1 required  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 2.5: Letter of Requirements (LOR)  
- **LOR Issued Date (M)** → Not earlier than Joint Inspection Date  
- **Issued By (M)** → Dropdown (Surveyor, Insurer)  
- **Required Documents (M)** → Text Area, Max 500 chars  
- **Uploaded LOR Copy (C)** → Table view  
- **Upload LOR Copy (M)** → At least 1 required, `.pdf, .docx, .doc`, Max 25 MB  

- **Buttons**  
  - Save (O)  
  - Next (M)  


## 3. Assessment and Validation  

### Step 3.1: Track Document Submission  
- **Document Tracker** → Table with:  
  - Doc Name (Policy Copy, FIR, Invoices, Photos, Estimate, Other)  
  - Status → Pending / Submitted / Verified  
  - Received Date  
  - Submitted Date  
- **Default Status**: "Submitted" if uploaded in earlier steps  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 3.2: Assessment Report  
- **Report Date (M)** → Not earlier than LOR Issued Date  
- **Report By (M)** → Alphabets, Max 100 chars  
- **Assessed Loss Amount (M)** → Currency format (India, Srilanka, Maldives)  
- **Key Observations (O)** → Text Area, Max 500 chars  
- **Uploaded Report (C)** → Table view  
- **Upload Report (M)** → At least 1 required, `.pdf, .docx, .doc`, Max 25 MB  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 3.3: Validation of Report  
- **Validator Name (M)** → Alphabets, Max 100 chars  
- **Validation Status (M)** → Dropdown (Approved, Revision Required)  
- **Validation Date (M)** → Not earlier than Report Date  
- **Remarks (O)** → Text Area, Max 500 chars  

- **Buttons**  
  - Save (O)  
  - Next (M)  


## 4. Settlement  

### Step 4.1: Claim Settlement  
- **Settlement Date (M)** → Not earlier than Validation Date  
- **Settlement Amount (M)** → Currency format (India, Srilanka, Maldives)  
- **Approved By (M)** → Alphabets, Max 100 chars  
- **Mode of Settlement (M)** → Dropdown (Cashless, Reimbursement)  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 4.2: Discharge Voucher Generation  
- **Discharge Voucher Number (M)** → Alphanumeric & Special chars (pattern TBD)  
- **Discharge Voucher Date (M)** → Not earlier than Settlement Date  
- **Amount in Discharge Voucher (M)** → Currency format  
- **Uploaded Discharge Voucher Copy (C)** → Table view  
- **Upload Discharge Voucher Copy (M)** → At least 1 required, `.pdf, .docx, .doc`, Max 25 MB  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 4.3: Customer Agreement  
- **Date of Agreement (M)** → Not earlier than Discharge Voucher Date  
- **Customer Confirmation (M)** → Radio (Yes / No)  
- **Remarks / Comments (O)** → Text Area, Max 500 chars  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 4.4: Voucher to Insurer  
- **Sent to Insurer Date (M)** → Not earlier than Date of Agreement  
- **Acknowledgement Ref. No. (M)** → Alphanumeric & Special chars (pattern TBD)  
- **Uploaded Acknowledged Copy (C)** → Table view  
- **Upload Acknowledged Copy (M)** → At least 1 required, `.pdf, .docx, .doc`, Max 25 MB  

- **Buttons**  
  - Save (O)  
  - Next (M)  


### Step 4.5: Claim Payment  
- **Payment Date (M)** → Not earlier than Sent to Insurer Date  
- **Payment Reference No. (M)** → Alphanumeric & Special chars (pattern TBD)  
- **Paid Amount (M)** → Currency format (India, Srilanka, Maldives)  
- **Mode of Payment (M)** → Dropdown (NEFT, RTGS, Others)  
- **Uploaded Payment Proof Copy (C)** → Table view  
- **Upload Payment Proof Copy (M)** → At least 1 required, `.pdf, .docx, .doc`, Max 25 MB  

- **Buttons**  
  - Save (O)  
  - Submit (M)  


## Additional Notes  
- **Claim Amount** → Free text field  
- **Sent By** → Not required in UI (tag backend user – CRM / Account Manager)  
