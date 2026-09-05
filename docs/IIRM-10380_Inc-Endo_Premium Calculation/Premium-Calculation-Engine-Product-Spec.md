# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Calculates Net Premium and Gross Premium for insurance policies during Create Inception and Create Endorsement workflows, after processing uploaded enrollment files
- **Business Value:** Eliminates manual premium computation, reduces calculation errors, and provides an auditable, automated premium summary that drives invoicing and policy acceptance decisions
- **User Value:** Operations and underwriting teams get accurate, consistent premium breakdowns instantly after file upload, without needing to manually reconcile spreadsheets or recalculate figures
- **Module Type:** Core
- **Phase 1 Scope:** End-to-end premium calculation from enrollment file upload through Net Premium and Gross Premium generation, covering both Create Inception and Create Endorsement workflows, with batch processing, validation, and summary reporting

## 2. Scope & Boundaries

- **In Scope:**
    - Enrollment file upload and document processing file lifecycle management
    - Multi-stage file validation (format, schema, business rules)
    - Country-specific Net Premium calculation: India (Basic + Terrorism), Sri Lanka (Basic + SRCC + Terrorism Commission)
    - Country-specific Gross Premium calculation: India (Net + GST), Sri Lanka (Net + Admin + Cess + Fee + Stamp + VAT)
    - Country-specific Brokerage calculation: India (Basic + TC brokerage), Sri Lanka (Basic + SRCC + TC brokerage)
    - Additional charges processing (Fee, Admin Charges, Other, CESS, Stamp Duty)
    - Addition and Deletion premium tracking for endorsements
    - Auto-calculation of dependent fields based on primary field changes
    - Aggregated premium summary generation per policy and endorsement
    - Upload status tracking and success/error file generation
    - Redis-based queue management for batch processing
- **Out of Scope:**
    - Premium rate table configuration and management
    - Policy issuance or binding post-calculation
    - Insurer submission or endorsement approval workflows
    - Claims processing or settlement calculations
    - Custom formula configuration by end users
- **Dependencies:**
    - Policy Service (policy and endorsement metadata)
    - Document Storage Service (file upload and retrieval)
    - Scheduler Service (background enrollment processing jobs)
    - Redis (queue management for batch processing)
    - IBP Service (employee and dependent data)
- **Dependents:**
    - Endorsement Confirmation and Approval workflow
    - Policy Confirmation Activity (premium display)
    - IBP Life Events Premium Summary screen
    - Invoicing and billing modules (downstream)

## 3. User Personas & Contexts

### **Persona 1: Operations Executive**

- **Goals:** Upload enrollment files, trigger premium calculation, and review the premium summary before sending to the insurer
- **Context:** Handles Create Inception and Create Endorsement workflows daily for multiple corporate clients; needs speed and accuracy in premium computation
- **Pain Points:** Manual calculation is error-prone and time-consuming; discrepancies between calculated and expected premiums create back-and-forth with insurers

### **Persona 2: Underwriting Manager**

- **Goals:** Review calculated Net and Gross Premium figures, verify brokerage amounts, and approve or flag anomalies before policy confirmation
- **Context:** Reviews premium summaries generated after file processing; accountable for calculation accuracy in policy documents
- **Pain Points:** Lack of visibility into how premium components are assembled; difficulty tracing calculation errors to specific data inputs

### **Persona 3: HR Administrator (IBP Portal)**

- **Goals:** View the premium impact of employee life events (additions and deletions) through the IBP HR portal
- **Context:** Uses the IBP portal to enrol or terminate employees and wants to see the corresponding premium effect on the policy
- **Pain Points:** Premium impact is not visible in real time after life event submission; needs to contact the operations team for figures

## 4. User Stories

### Operations Executive

- **US-PCE-001:** As an Operations Executive, I want to upload an enrollment file and have the system automatically calculate premiums for all employees and dependents, so that I do not need to compute premiums manually
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I upload a valid enrollment file, when the system processes it, then a premium summary is generated showing Net Premium and Gross Premium for each employee and dependent
        - Given the file has both additions and deletions, when processing completes, then I see separate Addition Premium and Deletion Premium figures with a net total
        - Given the file has errors, when processing completes, then I receive an error file identifying the failing rows and reasons

- **US-PCE-002:** As an Operations Executive, I want to monitor the processing status of an uploaded enrollment file in real time, so that I know when the premium calculation is ready for review
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given a file is uploaded, when processing starts, then the status changes from CREATED to PROCESSING
        - Given processing succeeds, when complete, then the status changes to COMPLETED and the premium summary is available
        - Given processing fails, when the error is encountered, then the status changes to FAILED with a descriptive reason

- **US-PCE-003:** As an Operations Executive, I want the system to auto-calculate Gross Premium when I enter Net Premium and GST percentage, so that I do not need to manually apply the GST formula
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I enter a Net Premium value, when I set a GST percentage, then Gross Premium is automatically calculated as Net Premium + (Net Premium x GST%)
        - Given I change the Net Premium, when the field loses focus, then Gross Premium recalculates automatically
        - Given I enter GST Amount directly instead of GST Percentage, when I save, then the system derives Gross Premium as Net Premium + GST Amount

### Underwriting Manager

- **US-PCE-004:** As an Underwriting Manager, I want to review a consolidated premium summary showing Basic Premium, Terrorism Premium, SRCC, GST, Brokerage, and total Gross Premium, so that I can verify all components before policy confirmation
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given premium calculation is complete, when I view the summary, then all component fields are displayed: Basic Premium, Terrorism, SRCC, Net Premium, GST Amount, Gross Premium, Brokerage Amount
        - Given brokerage is configured, when I view the summary, then Basic Brokerage, Terrorism Brokerage, and Total Brokerage are shown separately
        - Given additional charges exist, when I view the summary, then Fee, Admin Charges, Other Charges, and CESS figures are included

- **US-PCE-005:** As an Underwriting Manager, I want to see how premium is split between Per Life and Per Family calculation models, so that I can validate alignment with the policy configuration
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given the policy uses Per Life calculation, when the premium summary is shown, then premium is computed and displayed per individual member
        - Given the policy uses Per Family calculation, when the premium summary is shown, then premium is computed and displayed at the family unit level

### HR Administrator (IBP Portal)

- **US-PCE-006:** As an HR Administrator, I want to see the premium impact of adding or removing employees through the IBP portal, so that I can understand the cost effect of life events before confirming them
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given I submit an employee addition, when the premium is calculated, then I see the Addition Premium amount on the Life Events Premium Summary screen
        - Given I submit an employee deletion or termination, when the premium is calculated, then I see the Deletion Premium amount and the net premium change
        - Given both additions and deletions exist, when I view the summary, then I see Net Endorsement Premium = Addition Premium - Deletion Premium

## 5. Functional Requirements

- **FR-PCE-001:** Enrollment File Upload and Document Lifecycle Management
    - **Related Project FR:** File-based enrollment processing for inception and endorsement
    - **Module Context:** System must create a Document Processing File record on upload and transition it through CREATED to PROCESSING to COMPLETED or FAILED states, with Redis-based queuing for batch order management

- **FR-PCE-002:** Multi-Stage File Validation
    - **Related Project FR:** Data quality assurance before premium calculation
    - **Module Context:** System must validate file format (xlsx, xls, csv), required column presence, data types, and business rules (duplicate detection, date validity, sum insured limits) before initiating premium calculation

- **FR-PCE-003:** Policy Configurator Parameter Resolution
    - **Related Project FR:** Policy-level premium rate configuration driving per-employee and per-dependent calculations
    - **Module Context:** Before calculating any premium, the system must read the live policy configuration from the policy configurator and resolve four categories of parameters: (1) component-level settings (Sum Insured Model, Per Life / Per Family flag, multiplier property, min/max SI caps), (2) age-band parameters with range definitions, (3) relationship-type parameters, and (4) policy choices that carry the actual premium rates. All of these parameters are locked from the configurator at processing time and cannot be overridden during file upload.

- **FR-PCE-004:** Net Premium Calculation
    - **Related Project FR:** Core premium computation
    - **Module Context:** Net Premium assembly is country-specific. For India: Net Premium = Basic Premium + Terrorism. For Sri Lanka: Net Premium = Basic Premium + SRCC + Terrorism Commission. Both models support Per Life and Per Family calculation modes.

- **FR-PCE-005:** Gross Premium Calculation
    - **Related Project FR:** Tax-inclusive premium computation
    - **Module Context:** Gross Premium calculation is country-specific. For India: Gross Premium = Net Premium + GST Amount, where GST is applied on Net Premium only. For Sri Lanka: Gross Premium = Net Premium + Admin Charges + Cess + Fee + Stamp Duty + VAT Amount, where VAT is applied on the combined total of all pre-tax charges. See BR-PCE-004 for full formulas.

- **FR-PCE-006:** Brokerage Calculation
    - **Related Project FR:** Intermediary compensation computation
    - **Module Context:** System must calculate Basic Brokerage, Terrorism Brokerage, and SRCC Brokerage as percentages of the applicable premium base, and sum them into Total Brokerage

- **FR-PCE-007:** Additional Charges Processing
    - **Related Project FR:** Fee and charge capture beyond base premium
    - **Module Context:** System must process Fee Amount, Fee Percentage, Admin Charges, Admin Charges Percentage, Other Amount, Other Percentage, CESS Amount, and CESS Percentage as separate premium components

- **FR-PCE-008:** Addition and Deletion Premium Tracking (Endorsement)
    - **Related Project FR:** Endorsement premium delta calculation
    - **Module Context:** System must separately track Addition Premium (new enrollments) and Deletion Premium (terminations), and compute Net Endorsement Premium = Addition Premium - Deletion Premium

- **FR-PCE-009:** Auto-Calculation on Field Change
    - **Related Project FR:** Reactive UI premium recalculation
    - **Module Context:** System must automatically recalculate dependent fields whenever a primary field changes, following the field dependency matrix defined in the business rules

- **FR-PCE-010:** Premium Summary Aggregation and Storage
    - **Related Project FR:** Policy-level premium record keeping
    - **Module Context:** System must aggregate individual enrollment premiums into policy and endorsement-level summaries and persist them with success/error counts and batch identifiers

- **FR-PCE-011:** Error and Success File Generation
    - **Related Project FR:** Processing transparency and error resolution
    - **Module Context:** System must generate a downloadable error file for failed rows and a success file for processed rows, linked to the upload batch

## 6. Business Rules & Logic

- **BR-PCE-001:** Net Premium Assembly
    - **India Formula:** netPremium = basicPremium + terrorism
    - **Sri Lanka Formula:** netPremium = basicPremium + srccAmount + terrorismCommission
    - **Example (India):** Basic = 50,000 | Terrorism = 2,000 → Net = 52,000
    - **Example (Sri Lanka):** Basic = 50,000 | SRCC = 1,000 | TC = 2,000 → Net = 53,000
    - **Edge Cases:** Null components are treated as zero; the country context is resolved from policy metadata before assembly begins

- **BR-PCE-002:** Indian Net Premium Resolution
    - **Formula:** resolveIndianNetPremium = (basicPremium ?? 0) + (terrorism ?? 0)
    - **Example:** Used when country context is India; SRCC is handled separately
    - **Edge Cases:** Returns null only if both basicPremium and terrorism are null, which triggers fallback to grossPremium or basicPremium

- **BR-PCE-003:** Tax Base Selection Logic
    - **Formula:** System compares the stored netPremium candidate against the derived Indian Net Premium; if the difference exceeds 0.01, the derived value takes precedence
    - **Example:** Stored netPremium = 52,400 | Derived = 52,500 → difference = 100 > 0.01 → system uses 52,500
    - **Edge Cases:** If derived value is null, fallback order is: netPremium → totalNetPremium → totalPremium → grossPremium → basicPremium → 0

- **BR-PCE-004:** Tax Calculation (GST / VAT)
    - **India Formula (percentage-driven):** gstAmount = netPremium × gstPercentage / 100 | grossPremium = netPremium + gstAmount
    - **India Formula (amount-driven):** grossPremium = netPremium + gstAmount
    - **Sri Lanka Formula:** vatAmount = vatPercentage × (netPremium + adminCharges + cess + feeAmount + stampDuty) / 100 | grossPremium = netPremium + adminCharges + cess + feeAmount + stampDuty + vatAmount
    - **Example (India):** Net = 52,000 | GST 18% → GST = 9,360 → Gross = 61,360
    - **Example (Sri Lanka):** Net = 53,000 | Admin = 500 | Cess = 200 | Fee = 300 | Stamp = 100 | VAT 8% → VAT = (54,100 × 8%) = 4,328 → Gross = 58,428
    - **Edge Cases:** If both percentage and explicit amount are provided, the explicit amount takes precedence; Sri Lanka requires all charge components to be resolved before VAT is calculated

- **BR-PCE-005:** Brokerage Calculation
    - **India Formula:** basicBrokerageAmount = basicBrokeragePercentage / 100 × basicPremium | tcBrokerageAmount = tcBrokeragePercentage / 100 × terrorism | totalBrokerageAmount = basicBrokerageAmount + tcBrokerageAmount
    - **Sri Lanka Formula:** basicBrokerageAmount = basicBrokeragePercentage / 100 × basicPremium | srccBrokerageAmount = srccBrokeragePercentage / 100 × srccAmount | tcBrokerageAmount = tcBrokeragePercentage / 100 × terrorismCommission | totalBrokerageAmount = basicBrokerageAmount + srccBrokerageAmount + tcBrokerageAmount
    - **Example (India):** Basic = 50,000 at 5% + Terrorism = 2,000 at 3% → Brokerage = 2,500 + 60 = 2,560
    - **Example (Sri Lanka):** Basic = 50,000 at 5% + SRCC = 1,000 at 3% + TC = 2,000 at 3% → Brokerage = 2,500 + 30 + 60 = 2,590
    - **Edge Cases:** Brokerage percentage cannot exceed 100%; null brokerage components are treated as zero; SRCC brokerage is not applicable for India policies

- **BR-PCE-006:** Endorsement Addition vs Deletion Premium
    - **Formula (Net delta):** totalEndorsementPremium = additionPremium - deletionPremium
    - **India Gross formula:** grossEndorsementPremium = totalEndorsementPremium + (totalEndorsementPremium × gstPercentage / 100)
    - **Sri Lanka Gross formula:** grossEndorsementPremium = totalEndorsementPremium + adminCharges + cess + feeAmount + stampDuty + (vatPercentage × (totalEndorsementPremium + adminCharges + cess + feeAmount + stampDuty) / 100)
    - **Example (India):** Addition = 10,000 | Deletion = 3,000 → Net Endorsement = 7,000 | GST 18% → Gross Endorsement = 8,260
    - **Edge Cases:** If deletions exceed additions, the result is negative, representing a premium credit; Sri Lanka requires all charge components to be resolved before VAT is applied to the endorsement delta

- **BR-PCE-007:** Batch Processing Size Limit
    - **Rule:** Enrollments are processed in buckets of maximum 50 records per batch to manage memory and queue throughput
    - **Example:** A file with 200 rows is split into 4 batches of 50 and processed sequentially via the Redis queue
    - **Edge Cases:** Remaining records smaller than bucket size are processed in a final partial batch

- **BR-PCE-008:** Duplicate Enrollment Prevention
    - **Rule:** An employee cannot be enrolled more than once in the same policy within the same file upload
    - **Example:** If Employee ID EMP001 appears twice in the same file, the second occurrence is rejected with a duplicate error
    - **Edge Cases:** Same employee appearing in different upload batches (different files) is handled at the business logic level, not file validation

- **BR-PCE-009:** Auto-Calculation Field Dependency Order
    - **Primary Calculations — India (immediate):** Net Premium = Basic + Terrorism | GST Amount = Net Premium × GST% | Gross Premium = Net Premium + GST Amount
    - **Primary Calculations — Sri Lanka (immediate):** Net Premium = Basic + SRCC + TC | VAT Amount = VAT% × (Net + Admin + Cess + Fee + Stamp) | Gross Premium = Net + Admin + Cess + Fee + Stamp + VAT
    - **Secondary Calculations (dependent, both countries):** Basic Brokerage Amount = Basic Brokerage% × Basic Premium | TC Brokerage Amount = TC Brokerage% × Terrorism (or TC) | SRCC Brokerage Amount = SRCC Brokerage% × SRCC Premium (Sri Lanka only) | Total Brokerage = sum of brokerage components | Final Premium = Gross Premium + CESS (India additional charge)
    - **Edge Cases:** Circular dependencies are prevented by enforcing the calculation sequence; secondary calculations only trigger after primary calculations are complete; changing a brokerage percentage field only recalculates that brokerage component and the total — it does not re-trigger Net or Gross Premium

- **BR-PCE-010:** Premium Validation Constraints
    - **Rule:** Net Premium cannot be negative; GST percentage must be between 0 and 100; Brokerage percentage cannot exceed 100
    - **Example:** If a file contains a row with basicPremium = -5,000, that row is rejected with a validation error
    - **Edge Cases:** Zero premium is valid for certain product types; system must not reject zero-value records

- **BR-PCE-011:** Rate Lookup Rule (Flat vs Per-Mille)
    - **Rule:** The rate model is determined by `choice.sumInsuredModel`. If the model is `FLAT`, the raw `choice.premium` value is used directly as the member's base premium. If the model is `MULTIPLE`, the base premium is computed as `(applicableSumInsured / 1000) × (choice.companyPay + choice.employeePay)` — i.e., a per-mille rate applied to the resolved Sum Insured.
    - **Example (FLAT):** choice.premium = 1,200 → memberPremium = 1,200
    - **Example (MULTIPLE):** SI = 500,000 | companyPay = 1.5 | employeePay = 0.5 → memberPremium = (500,000 / 1000) × 2.0 = 1,000
    - **Edge Cases:** If `choice.premium` is null or zero in FLAT mode, member premium is zero; zero is valid and not treated as an error; in MULTIPLE mode, `companyPay` and `employeePay` are summed into a single combined per-mille rate before multiplying by SI — the individual split is not preserved in the premium summary and does not affect Net or Gross Premium assembly

- **BR-PCE-012:** Per Life vs Per Family Decision Rule
    - **Rule:** Determined by `choice.premiumPerLife` (boolean, resolved via `parsePremiumPerLife`). If `true`, each member — the employee and each dependent — receives an independently calculated rate. If `false`, a single family-level `choicePremium` covers the entire family unit, regardless of dependent count.
    - **Example (Per Life):** Employee premium = 1,000 | Spouse premium = 800 | Child premium = 600 → Total = 2,400
    - **Example (Per Family):** choicePremium = 2,000 → Total for family of 3 = 2,000 (no multiplication per member)
    - **Edge Cases:** A family with only the employee and no dependents uses the same rule path; Per Family still applies the single rate without multiplying; if age-band pricing is configured on the same policy, Per Family takes precedence — age-band resolution is bypassed entirely and the single family-level `choicePremium` is used; the `ENABLE_DEPENDENT_AGE_BASED_PREMIUM_CALCULATION` flag has no effect when `premiumPerLife = false`

- **BR-PCE-013:** Age Band Rate Resolution Rule
    - **Rule:** For policies with age-band pricing, the system walks `policyConfig.parameters` and finds the parameter whose `displayName` contains "age". It then iterates that parameter's `rangeDetails` array (each entry has `min`, `max`, and `id`) to find the band where `memberAge >= min && memberAge <= max`. The matched range's `id` becomes the `matchingRangeId`. The system then finds the `policyOption` whose `optionMeta` contains `{ parameterId: ageParameterId, parameterOptionId: matchingRangeId }` and uses that option's choice rate instead of the base rate.
    - **Dependent handling:** Controlled by feature flag `ENABLE_DEPENDENT_AGE_BASED_PREMIUM_CALCULATION`. If `false`, dependents inherit the employee's resolved age-band rate. If `true`, each dependent resolves their own age band independently. The flag value is read once at the start of batch processing and is fixed for the entire batch; a flag change mid-endorsement does not affect records already in the queue.
    - **Age measurement timing:** Member age is calculated from Date of Birth as of the policy start date (inception) or the endorsement effective date (endorsement). It is not re-evaluated at the time of file upload if the upload date differs from the effective date.
    - **Interaction with MULTIPLE SI model:** When both age-band pricing and MULTIPLE SI model are active, age-band resolution selects the applicable per-mille rate, and BR-PCE-016 / BR-PCE-014 supply the SI. The rate from the matched age-band option's choice is used as the per-mille factor applied to the clamped SI; the two rules operate on separate axes (rate vs SI) and do not conflict.
    - **Example:** Employee age = 35 | Age bands: 18–30 (rate 800), 31–45 (rate 1,200), 46–60 (rate 1,800) → Employee matches 31–45 → rate = 1,200
    - **Edge Cases:** If no age band contains the member's age, the system falls back to `basePremium` (the flat `choice.premium`); no error is raised; age-band resolution is bypassed entirely when `premiumPerLife = false` (see BR-PCE-012)

- **BR-PCE-014:** Sum Insured Cap Rule
    - **Rule:** Before applying the per-mille rate in MULTIPLE model, the resolved Sum Insured is clamped: if `SI > maxSumInsuredValue` (from `siMultipleMax`), SI is capped at `maxSumInsuredValue`; if `SI < minSumInsuredValue` (from `siMultipleMin`), SI is floored at `minSumInsuredValue`. Clamping is applied prior to BR-PCE-011 rate calculation.
    - **Example:** Resolved SI = 1,200,000 | siMultipleMax = 1,000,000 → SI capped at 1,000,000 before per-mille calculation
    - **Edge Cases:** If min and max are not configured, no clamping is applied; SI is used as-is

- **BR-PCE-015:** Proration Rule
    - **Rule:** Controlled by `choice.proRationEnabled`. If `true`, the member's premium is prorated as `Math.round((choicePremium × remainingDays / totalPolicyDays) × 100) / 100`, where `remainingDays` is the number of days from the member's effective date to the policy end date, and `totalPolicyDays` is the total duration of the policy period. Result is rounded to 2 decimal places. If `false`, the full `choicePremium` is applied regardless of the member's effective date.
    - **Example:** choicePremium = 1,200 | totalPolicyDays = 365 | remainingDays = 180 → proratedPremium = round(1,200 × 180 / 365 × 100) / 100 = 591.78
    - **Edge Cases:** If the member's effective date equals the policy start date, remainingDays equals totalPolicyDays and no reduction occurs; if effective date is after the policy end date, remaining days is zero and premium is zero; for deletions, the same proration formula applies using the number of days the member was covered (from their effective date to their termination date), and the result is stored as the Deletion Premium — no separate refund formula exists in Phase 1

- **BR-PCE-016:** Salary Multiplier Rule (MULTIPLE Sum Insured Model)
    - **Rule:** When `choice.sumInsuredModel === "MULTIPLE"`, the applicable Sum Insured is derived from the employee's salary record, not the file's SI column. The system uses `choice.sumInsuredModelProperty` (the `siMultipleLabel` value, e.g., "Annual Salary") to fuzzy-match the correct salary field from the employee profile via `resolveEmployeeMultiplierValue()`. The matched salary value is then multiplied by the configured multiplier factor to produce the SI. The SI is then clamped per BR-PCE-014 before BR-PCE-011 applies the per-mille rate.
    - **Example:** siMultipleLabel = "Annual Salary" | employee.annualSalary = 600,000 | multiplier = 3 → SI = 1,800,000 → clamped if exceeds siMultipleMax → per-mille applied
    - **Edge Cases:** If no matching salary field is found on the employee record, SI defaults to zero, resulting in zero premium for that member; no error is raised but the premium summary will reflect zero for that row

- **BR-PCE-017:** Country Context Resolution Rule
    - **Rule:** Before any Net Premium, Gross Premium, or Brokerage calculation begins, the system resolves the country context from the policy's organisation record (`policy.organisation.country` or equivalent field). If the resolved country is `IN` (India), the India formula path is used for all calculations in BR-PCE-001, BR-PCE-004, BR-PCE-005, and BR-PCE-006. If the resolved country is `LK` (Sri Lanka), the Sri Lanka formula path is used. If the country field is null or unrecognised, the system defaults to the India formula path and logs a warning.
    - **Example:** policy.organisation.country = "LK" → system uses Sri Lanka Net, Gross, and Brokerage formulas for the entire policy
    - **Edge Cases:** Multi-country organisations (where a single policy spans employees in multiple countries) are not supported in Phase 1; all members within a single policy use the same country formula

- **BR-PCE-018:** CD Balance Display Rule
    - **Rule:** The CD Balance displayed in the Summary Stats Panel is the current Credit/Debit account balance for the policy, sourced from the CD Management module, not calculated by this engine. It is read-only on this screen. The value represents the running balance of premium deposits minus premium debits for the policy. A positive value indicates funds available; a negative value indicates an outstanding debit.
    - **Example:** Policy has received deposits of 50,000 and processed premiums of 30,000 → CD Balance = 20,000
    - **Edge Cases:** If the CD Management module is unavailable, the tile displays "—" (dash) rather than 0, to avoid implying a zero balance; this is a display-only field and does not affect premium calculation

- **BR-PCE-019:** Relationship-Type Rate Resolution Rule
    - **Rule:** When the policy configurator defines relationship-type parameters (e.g., separate rates for Spouse, Child, Parent), the system matches each dependent's `relationship` field from the enrollment file against the parameter options. The matched option's choice rate overrides the default member rate for that dependent. If no relationship-type parameter is defined on the policy, all dependents use the same rate as the employee (the base choice rate).
    - **Example:** Policy has relationship params: Employee = 1,000 | Spouse = 800 | Child = 600 | Parent = 1,100 → Dependent with relationship = "Spouse" gets rate 800, not 1,000
    - **Edge Cases:** If a dependent's relationship value does not match any configured option (e.g., "Domestic Partner" with no matching param), the system falls back to the base choice rate and does not raise an error; relationship-type resolution applies independently of Per Life / Per Family mode — it only determines the rate, not whether the rate is multiplied per member

- **BR-PCE-020:** Multi-Component Policy Aggregation Rule
    - **Rule:** A single policy may include multiple insurance components (e.g., GMC + GPA + GTL). Each component is processed independently through the full premium calculation pipeline (BR-PCE-001 through BR-PCE-018) using its own policy configuration, rates, and country context. The premium summary screen aggregates and displays each component's Net Premium, Gross Premium, and Brokerage separately; there is no cross-component blending or averaging of rates.
    - **Example:** Policy with GMC (Net = 52,000, Gross = 61,360) and GPA (Net = 10,000, Gross = 11,800) → Summary shows two rows; Total Gross = 73,160
    - **Edge Cases:** If a component has no enrolled members in the current batch, it contributes zero to the summary and is not suppressed from the display; brokerage is calculated per component, not on the combined gross total

## 7. User Interface Requirements

### **Premium Summary Screen (iWork - Endorsement / Inception Confirmation)**

- **Screen/Page:** Premium Calculation Summary
    - **Purpose:** Display consolidated premium breakdown after file processing is complete, for review before policy confirmation

    - **Summary Stats Panel (read-only tiles at top of screen):**
        - Total Employees — count of enrolled employees in the policy
        - Total Dependents — count of enrolled dependents across all employees
        - Total Lives — Total Employees + Total Dependents
        - Additions — count of lives added in this endorsement (0 for inception)
        - Deletions — count of lives removed in this endorsement (0 for inception)
        - CD Balance — current Credit/Debit balance amount for the policy
        - Net Premium — calculated net premium total (Basic + Terrorism component)
        - Gross Premium — Net Premium + applicable tax (GST/VAT)
        - Not Started — count of enrollment records not yet processed
        - In Progress — count of enrollment records currently being processed
        - Completed — count of enrollment records successfully processed

    - **Brokerage Details Section (editable fields):**
        - Basic Brokerage Percentage — editable percentage input; triggers auto-calculation of Basic Brokerage Amount on change
        - Basic Brokerage Amount — auto-calculated as `basicBrokeragePercentage / 100 × basicPremium`; read-only unless manually overridden
        - Terrorism Commission Percentage — editable percentage input; triggers auto-calculation of Terrorism Brokerage Amount
        - Terrorism Commission Amount — auto-calculated as `tcBrokeragePercentage / 100 × terrorismPremium`
        - SRCC Brokerage Percentage — editable; applicable for Sri Lanka policies only; triggers auto-calculation of SRCC Brokerage Amount
        - SRCC Brokerage Amount — auto-calculated as `srccBrokeragePercentage / 100 × srccPremium`; hidden for India policies
        - Total Brokerage Amount — read-only sum of all brokerage component amounts

    - **Premium Components Section (editable fields):**
        - Basic Premium — primary premium amount; source of brokerage calculation base
        - Terrorism Premium — terrorism surcharge component
        - SRCC Premium — applicable for Sri Lanka policies only
        - Net Premium — auto-calculated; read-only
        - GST / VAT Percentage — editable tax rate input
        - GST / VAT Amount — auto-calculated from tax base and percentage; read-only unless manually overridden
        - Gross Premium — auto-calculated; read-only
        - Fee Amount and Fee Percentage — additional charge inputs
        - Admin Charges Amount and Admin Charges Percentage
        - Other Charges Amount and Other Charges Percentage
        - CESS Amount and CESS Percentage

    - **Endorsement Delta Section (endorsement workflow only):**
        - Addition Premium — net premium for all added lives in this endorsement
        - Deletion Premium — net premium for all deleted lives in this endorsement
        - Net Endorsement Premium — Addition Premium minus Deletion Premium

    - **User Flow:**
        1. User uploads enrollment file and waits for processing to complete
        2. Summary Stats Panel populates with live counts and calculated Net and Gross Premium
        3. User reviews all premium tiles and brokerage fields
        4. User enters or adjusts Brokerage Percentage fields; Brokerage Amounts auto-update
        5. User adjusts GST/VAT Percentage if needed; Gross Premium auto-updates
        6. User confirms and proceeds to next workflow step

    - **Validation Rules:**
        - Basic Brokerage Percentage: 0–100 range, numeric, 4 decimal places
        - Terrorism Commission Percentage: 0–100 range, numeric, 4 decimal places
        - SRCC Brokerage Percentage: 0–100 range, numeric, 4 decimal places; field hidden for India policies
        - GST / VAT Percentage: 0–100 range, numeric, 4 decimal places
        - Net Premium: cannot be negative
        - All currency amount fields: Decimal(10,2), maximum 99,999,999.99
        - Total Lives must equal Total Employees + Total Dependents; mismatch triggers a warning

### **File Upload and Processing Status Screen (iWork - Endorsement Request Step)**

- **Screen/Page:** Enrollment File Upload and Status Tracker
    - **Purpose:** Allow users to upload enrollment files and monitor processing progress
    - **Key Elements:**
        - File picker (xlsx, xls, csv only)
        - Upload progress indicator
        - Processing status badge (CREATED / PROCESSING / COMPLETED / FAILED)
        - Success count and Error count display
        - Download buttons for success file and error file
    - **User Flow:**
        1. User selects and uploads enrollment file
        2. Status badge updates to PROCESSING
        3. Progress indicators show batch completion
        4. On completion, status changes to COMPLETED with counts
        5. User downloads error file if errors are present
    - **Validation Rules:**
        - File format: xlsx, xls, csv only; other formats rejected immediately
        - File size: Maximum 50MB
        - Row count: Maximum 10,000 records per file

### **IBP Portal - Life Events Premium Summary**

- **Screen/Page:** Employee Life Event Premium Impact View
    - **Purpose:** Show HR Administrators the premium effect of adding or removing employees via the IBP portal
    - **Key Elements:**
        - Addition Premium total
        - Deletion Premium total
        - Net Endorsement Premium
        - Per-employee premium breakdown
    - **User Flow:**
        1. HR Administrator submits life event (addition or deletion)
        2. System calculates premium impact
        3. Summary screen displays Addition, Deletion, and Net Endorsement Premium
        4. HR Administrator confirms the life event submission

## 8. Data Requirements

- **Input Data:**
    - Enrollment files in xlsx, xls, or csv format containing employee and dependent records with fields: Employee ID, Date of Birth, Gender, Relationship, Sum Insured, Effective Date, Salary
    - Policy configuration data: country context (India / Sri Lanka), GST/VAT percentage, Brokerage percentage, Terrorism rate, SRCC rate (Sri Lanka only), Per Life or Per Family model, product type
    - Sri Lanka additional charge inputs: Admin Charges, CESS Amount, Stamp Duty — required for VAT base calculation
    - Endorsement metadata: Endorsement ID, Policy ID, endorsement type (addition, deletion, modification)

- **Output Data:**
    - Premium Summary: Net Premium, GST Amount, Gross Premium, Brokerage Amount, Additional Charges, per policy and endorsement
    - Endorsement Counts: Total enrolled, Total terminated, Addition Premium, Deletion Premium, Net Premium
    - Processing Summary: Success count, Error count, Batch ID, processing timestamp
    - Error File: Failed rows with specific error codes and messages, downloadable by user
    - Success File: Successfully processed rows confirming what was enrolled

- **Stored Data:**
    - policy_enrollment_upload_summary: documentProcessingFileId, policyId, sourceFileUploadId, errorFileUploadId, successFileUploadId, successCount, errorCount, processCount, endorsementId, batchId
    - Endorsement table updates: endorsementCount, endorsementDependentCount, employeeEndorsementAdditionCount, employeeEndorsementDeletionCount, netPremium, grossPremium
    - Document processing file status transitions with timestamps

## 9. Integration Specifications

- **APIs/Interfaces:**
    - POST /api/policy/enrollment/upload: Accepts enrollment file, creates document processing file, enqueues processing job
    - GET /api/policy/enrollment/status/{documentProcessingFileId}: Returns current processing status and counts
    - GET /api/policy/premium-summary/{policyId}: Returns aggregated premium breakdown for a policy
    - GET /api/endorsement/premium-summary/{endorsementId}: Returns endorsement-level Addition/Deletion/Net Premium
    - PATCH /api/policy/premium-summary/{policyId}: Accepts user-entered brokerage percentages and GST/VAT percentage; persists them and returns recalculated brokerage amounts and Gross Premium
    - PATCH /api/endorsement/premium-summary/{endorsementId}: Same as above for endorsement-level brokerage and tax overrides

- **Events:**
    - EnrollmentFileUploaded: Published on file upload; triggers batch processing job via Redis queue
    - EnrollmentBatchProcessed: Published per batch; updates progress counters
    - PremiumCalculationCompleted: Published when all batches are processed; triggers premium summary generation
    - EnrollmentProcessingFailed: Published on critical failure; triggers status update and error notification

- **Data Flow:**
    - File Upload → Document Processing File (CREATED) → Redis Queue → Batch Processor → Validation → Premium Calculation → Summary Aggregation → Document Processing File (COMPLETED or FAILED)

- **Error Handling:**
    - Row-level validation errors are collected per batch and written to the error file; processing continues for valid rows
    - Critical system errors (DB connection, Redis failure) trigger status change to FAILED and retry up to 3 times with exponential backoff
    - Partial batch failures roll back only the failing batch; successfully committed batches are not re-processed

## 10. Performance & Quality Requirements

- **Performance:**
    - Files up to 10MB with up to 5,000 rows must complete processing within 5 minutes
    - Premium summary must be available within 10 seconds of processing completion
    - Auto-calculation on field change must respond within 500ms in the UI
    - Batch size is capped at 50 records to maintain consistent throughput

- **Reliability:**
    - Processing retry: maximum 3 attempts with exponential backoff for transient failures
    - Checkpoint-based recovery: failed batches resume from last successful checkpoint, not from the beginning of the file
    - 99.5% of valid files must complete processing without system-level errors

- **Security:**
    - Uploaded files are virus-scanned before processing begins
    - Premium data is encrypted at rest; PII fields are masked in application logs
    - Role-based access control: only users with enrollment management permissions can upload files or view premium summaries

- **Usability:**
    - Processing status is visible in real time without requiring page refresh
    - Auto-calculation provides immediate feedback within the same form interaction
    - Error file is downloadable in the same format as the original upload file, with an additional error column

## 10.1. Technical Validation Requirements

### Database Field Constraints

- **Amount Fields:** All monetary values must use NUMERIC(21,4) precision
    - Maximum value: ₹99,999,999,999,999,999.9999 (21 digits total, 4 decimal places)
    - Minimum non-zero value: ₹0.0001
    - Negative amounts: Not allowed (must be ≥ 0)
    - Fields: basicPremium, netPremium, grossPremium, gstAmount, brokerageAmount, sumInsured, etc.

- **Percentage Fields:** All percentages must use NUMERIC(7,4) precision
    - Maximum value: 999.9999% (7 digits total, 4 decimal places)  
    - Minimum value: 0.0000%
    - Fields: gstPercentage, brokeragePercentage, sharePercentage, etc.

### Calculation Precision Standards

- **GST Calculation:**
    - GST percentage validation: 0.0000% ≤ GST% ≤ 100.0000%
    - Default GST rate: 18.0000%
    - Formula: `gstAmount = (netPremium × gstPercentage) / 100`
    - Precision: 4 decimal places with .toFixed() rounding

- **Brokerage Calculation:**
    - Brokerage percentage validation: 0.0000% ≤ Brokerage% ≤ 999.9999%
    - Formula: `brokerageAmount = (baseAmount × brokeragePercentage) / 100`
    - Precision: 4 decimal places with .toFixed() rounding

- **Cross-Field Validation:**
    - Net Premium = Basic Premium + Terrorism + SRCC Amount (tolerance: ±₹0.01)
    - Gross Premium = Net Premium + GST Amount (tolerance: ±₹0.01)
    - All percentage calculations must sum correctly within ±0.0001% tolerance

### Age and Date Validation

- **Age Limits (Configurable):**
    - Employee: 18-65 years (2 decimal precision)
    - Dependent: 0-25 years (extensions: studying son +2 years)
    - Parent: 18-80 years (minimum 18-year gap with employee)

- **Date Boundaries:**
    - Date of Birth: Cannot be future date; must be after 1900-01-01
    - Must include complete day/month/year
    - Policy dates: Start date within 1 year, end date within 10 years

### Share Percentage Validation

- **Total Share Requirement:** All insurer shares must sum to exactly 100.0000%
- **Tolerance:** ±0.0001% allowed for rounding errors
- **Individual Share Range:** 0.0000% ≤ Individual Share ≤ 100.0000%
- **Lead Insurer:** Exactly one insurer must be marked as lead
- **Insurer Count:** Minimum 1, Maximum 50 insurers per policy

### Text Field Validation

- **Field Length Limits:**
    - Short text (names, titles): Maximum 100 characters
    - Medium text (descriptions): Maximum 255 characters
    - Long text (remarks, comments): Maximum 500 characters
- **Email Format:** Must match pattern `^\S+@\S+\.\S+$`
- **Phone Numbers:** Maximum 20 characters, pattern `^[+]?[\d\s\-\(\)]+$`

### Error Handling Standards

- **Validation Error Messages:** Must include field name, current value, and acceptable range
- **Cross-Field Errors:** Must specify which fields are involved and the expected relationship
- **Precision Errors:** Must indicate the required decimal precision and current precision
- **Boundary Errors:** Must state the violated boundary and provide the acceptable range

### API Response Validation

- **Amount Formatting:** Display amounts with 2 decimal places, calculate with 4 decimal places
- **Percentage Display:** Show percentages with 4 decimal places
- **Currency Formatting:** Use comma thousands separator, dot decimal separator
- **Null Handling:** Return null for division by zero or invalid calculations
- **Error Responses:** Include field-specific validation errors with error codes

### File Processing Validation

- **File Upload Constraints:**
    - Maximum file size: 50MB per file
    - Maximum records per file: 10,000 records
    - Allowed formats: CSV, Excel (.xlsx, .xls)
    - Processing timeout: 30 seconds per operation

- **Batch Processing Rules:**
    - Maximum batch size: 50 records per batch
    - Maximum concurrent batches: 5 batches
    - Retry attempts: 3 attempts with exponential backoff
    - Batch processing delay: 1 second between batches

- **Status Workflow Validation:**
    - File status progression: CREATED → PROCESSING → COMPLETED/FAILED
    - No backwards status transitions allowed
    - Failed batches must allow retry without affecting successful batches

### Enrollment Data Validation

- **Employee Data Requirements:**
    - Date of Birth: Cannot be future date, must include day/month/year, cannot be before 1900
    - Email format: Must match pattern `^\S+@\S+\.\S+$` when email authentication required
    - Phone number: Required when phone authentication configured
    - Employee ID: Must be unique within policy, alphanumeric, max 50 characters

- **Family Relationship Constraints:**
    - Cross parents allowed: Configurable business rule
    - Same gender parents: Configurable business rule
    - Studying son age extension: Configurable additional years (typically +2)
    - Unmarried daughter extension: Configurable additional years
    - Male employees covering parents/in-laws: Configurable permissions
    - Female employees covering parents/in-laws: Configurable permissions
    - Parent age gap requirement: Minimum years between parent and employee (typically 18)
    - Child age gap requirement: Minimum years between employee and children

- **Contact Information Validation:**
    - Email required for email authentication methods
    - Phone required for SMS/phone authentication methods
    - Email format validation: `^\S+@\S+\.\S+$`
    - Phone format validation: `^[+]?[\d\s\-\(\)]+$` (max 20 characters)

### Error Message Standards

- **File Processing Errors:**
    - ER0008: "Missing or invalid date of birth"
    - ER0009: "Email is required for email authentication"  
    - ER0010: "Email is required"
    - ER0011: "Invalid email format"
    - File size exceeded: "File size exceeds maximum limit of 50MB"
    - Record limit exceeded: "File contains more than 10,000 records"

- **Processing Status Errors:**
    - Processing timeout: "File processing exceeded 30 second timeout limit"
    - Batch failure: "Batch processing failed, retrying (attempt X of 3)"
    - Queue failure: "Background processing queue unavailable, will retry"

### Integration Validation

- **Redis Queue Requirements:**
    - Queue processing validation with health checks
    - Background job completion tracking
    - Processing status synchronization across services

- **Database Transaction Rules:**
    - Foreign key constraint validation before processing
    - Data integrity checks during multi-table operations  
    - Automatic rollback for failed batch processing
    - Duplicate prevention during re-upload scenarios

- **Service Integration Constraints:**
    - File storage validation (S3 upload success confirmation)
    - Storage quota validation before upload
    - File accessibility validation post-upload

### Workflow State Management

- **Status Transition Atomicity:**
    - All status changes must be atomic to prevent race conditions
    - Only one service can claim a CREATED file for processing
    - Status updates must use conditional WHERE clauses to ensure consistency

- **Processing Phase Validation:**
    - Phase 1: File parsing and data validation (30 second timeout)
    - Phase 2: Business rule validation (60 second timeout)
    - Phase 3: Data preparation and payload creation (45 second timeout)
    - Phase 4: Database setup and configuration (30 second timeout)
    - Phase 5: Summary generation and file creation (15 second timeout)
    - Each phase must complete successfully before proceeding to next phase

- **Summary Consistency Requirements:**
    - Processing counts must match: `processCount = successCount + errorCount`
    - Summary record must be created before marking status as COMPLETED
    - Success/error file generation must complete before finalizing summary
    - All file upload records must be created with valid S3 keys

- **Error Recovery and Status Validation:**
    - Files stuck in PROCESSING status for >30 minutes must be auto-recovered
    - Recovery logic: Check for summary record existence to determine final status
    - Failed processes must have error logging before status change to FAILED
    - Terminal states (COMPLETED/FAILED) cannot be changed once set

- **Resource Management Requirements:**
    - Maximum 5 concurrent file processing jobs
    - Cleanup temporary files and Redis buckets after processing completion
    - Memory limit: 512MB per processing job
    - Temporary file retention: 24 hours maximum

## 11. Success Metrics

- **Business Metrics:**
    - 80% reduction in time from enrollment file upload to confirmed premium figure
    - Less than 1% calculation discrepancy rate between system-generated and manually verified premiums
    - Zero insurer rejections due to incorrect premium calculations in processed policies

- **User Metrics:**
    - Operations team can complete full inception premium calculation in under 10 minutes for files up to 500 employees
    - 90% of users rate the premium summary screen as easy to understand after first use
    - Error file resolution time reduced by 60% due to specific row-level error messages

- **Technical Metrics:**
    - 98% of files processed within the defined SLA timeframes
    - Auto-calculation latency below 500ms for 95th percentile of field change events
    - Processing queue depth does not exceed 10 pending jobs under normal operating conditions

- **Adoption Metrics:**
    - 100% of Create Inception and Create Endorsement workflows use the automated calculation engine within 1 month of launch
    - Manual premium overrides fall below 5% of total processed policies within 3 months

## 12. Edge Cases & Error Scenarios

- **Error Case 1: File with All Rows Failing Validation**
    - **User Experience:** User sees FAILED status on the upload, error count equals total rows, success count is zero; error file is available for download
    - **System Behavior:** No premium summary is generated; endorsement record is not updated; user must correct the file and re-upload

- **Error Case 2: Negative Net Endorsement Premium (Deletions Exceed Additions)**
    - **User Experience:** Premium summary shows a negative Net Endorsement Premium, indicating a credit is owed to the client
    - **System Behavior:** System stores the negative value; downstream billing module must handle credit application; no calculation error is raised

- **Error Case 3: GST Percentage Not Configured**
    - **User Experience:** Gross Premium field shows same value as Net Premium; a warning indicator is displayed on the GST field
    - **System Behavior:** GST Amount defaults to zero; system does not block processing but flags the record for review

- **Edge Case 1: Same Employee in Addition and Deletion in Same File**
    - **Business Logic:** If an employee appears in both the addition and deletion sections of the same endorsement file, both are processed; the net premium impact reflects the addition minus the deletion for that employee
    - **User Impact:** Premium summary correctly reflects the net change; no duplicate error is raised

- **Edge Case 2: File Upload During Active Processing of Previous Upload**
    - **Business Logic:** System allows concurrent uploads but processes them in FIFO queue order; each file gets its own Document Processing File record and status
    - **User Impact:** User sees both uploads in the tracking view with individual statuses; the second upload does not block or interrupt the first

- **Edge Case 3: Per Family Policy with Single-Member Enrollment**
    - **Business Logic:** Premium is calculated at the family level even if only one member is enrolled; the family premium rate applies rather than the per-life rate
    - **User Impact:** Premium summary reflects the family rate, which may be higher than expected for a single enrollee; no system error is raised

- **Error Case 4: Redis Queue Unavailable**
    - **User Experience:** User sees the file upload succeed but the status remains at CREATED without transitioning to PROCESSING; a system notification is displayed
    - **System Behavior:** Scheduler service detects the stalled job on recovery, re-enqueues it, and processing continues; no data loss occurs

- **Edge Case 4: Re-Upload After Failed Batch**
    - **Business Logic:** When a user re-uploads a corrected file after a FAILED or partial batch, the system creates a new Document Processing File record and new batch IDs. It does not void or roll back the previously committed batches from the first upload. Successfully processed records from the first upload remain enrolled; the re-upload should contain only the records that failed, not the full original file.
    - **User Impact:** If the user re-uploads the full file instead of only failed rows, duplicate enrollment prevention (BR-PCE-008) will reject the already-enrolled records with duplicate errors; endorsement counts reflect the cumulative result across both uploads

## 13. Future Considerations

- **Enhancement 1: Configurable Premium Formula Engine**
    - Allow administrators to define and modify premium calculation formulas through a UI rather than code changes, enabling faster adaptation to new product types

- **Enhancement 2: Real-Time Per-Row Premium Preview**
    - Display a live premium estimate per employee row as the enrollment file is being reviewed before final submission, reducing post-upload surprises

- **Enhancement 3: Multi-Country Policy Support**
    - A single policy that spans employees across India and Sri Lanka currently defaults to one country formula for all members. Future enhancement would allow per-member country resolution so mixed-country policies are calculated correctly per jurisdiction.

- **Enhancement 4: Streaming Processing for Very Large Files**
    - Replace batch chunking with a streaming processing model to handle files beyond 10,000 rows without performance degradation or memory pressure

- **Enhancement 5: Audit Trail for Calculation Changes**
    - Log every premium field change with the previous value, new value, user identity, and timestamp to support regulatory audit requirements and dispute resolution

## 14. Acceptance Criteria Summary

- [ ] Enrollment file upload creates Document Processing File and transitions through correct status states
- [ ] Country context resolved from policy organisation metadata before any calculation begins
- [ ] India Net Premium calculated correctly as Basic + Terrorism; Sri Lanka Net Premium as Basic + SRCC + TC
- [ ] India Gross Premium = Net + GST (applied on Net only); Sri Lanka Gross = Net + charges + VAT (applied on Net + all charges)
- [ ] India Brokerage = Basic% + TC% components; Sri Lanka Brokerage = Basic% + SRCC% + TC% components
- [ ] Gross Premium auto-calculated and updates on field change within 500ms
- [ ] FLAT rate model: member premium = choice.premium; MULTIPLE rate model: member premium = (SI / 1000) × (companyPay + employeePay)
- [ ] Per Life model: each member calculated independently; Per Family model: single rate covers the full family unit
- [ ] Age-band pricing: correct rate band selected by member age; feature flag controls dependent age independence
- [ ] Sum Insured clamped to min/max bounds before per-mille calculation in MULTIPLE model
- [ ] Proration applied when proRationEnabled = true: round(premium × remainingDays / totalPolicyDays × 100) / 100
- [ ] Salary multiplier SI derived from employee salary record and clamped before per-mille calculation
- [ ] Brokerage amounts calculated per component and persisted via PATCH API
- [ ] Additional charges (Fee, Admin, Other, CESS, Stamp Duty) processed and included in premium summary
- [ ] Addition and Deletion Premiums tracked separately for endorsement workflows
- [ ] Net Endorsement Premium computed as Addition minus Deletion Premium
- [ ] Batch processing handles files up to 10,000 rows in buckets of 50 via Redis queue
- [ ] Error file generated with row-level error messages for all validation failures
- [ ] Success file generated for all successfully processed rows
- [ ] Premium summary persisted at policy and endorsement level in the database
- [ ] Processing SLA met: files up to 5,000 rows complete within 5 minutes
- [ ] CD Balance tile sourced from CD Management module; displays "—" when unavailable
- [ ] IBP Life Events Premium Summary screen reflects Addition and Deletion Premium correctly
- [ ] Role-based access control enforced for file upload and premium summary access

## 15. Open Questions

- **Question 1: Negative Premium Credit Handling**
    - **Description:** When Deletion Premium exceeds Addition Premium in an endorsement, the net is negative. Should the system automatically generate a credit note, or is this handled manually by the billing team downstream?
    - **Impact:** Affects integration with billing module and user-facing messaging on the premium summary screen

- **Question 2: Per Family vs Per Life Mode Switching**
    - **Description:** Can a user switch between Per Life and Per Family calculation modes mid-workflow, or is this locked once the enrollment file is uploaded?
    - **Impact:** Determines whether recalculation is needed on mode change and whether processed data is invalidated

- **Question 3: GST Percentage Source of Truth**
    - **Description:** Should the GST percentage be locked from policy configuration, or should operations users be able to override it on the premium summary screen?
    - **Impact:** Affects calculation accuracy and whether overrides need audit logging

- **Question 4: Maximum File Size and Row Count Limits**
    - **Description:** The current configuration allows 50MB and 10,000 rows. Are these limits confirmed with the infrastructure team, or should they be validated against actual production data volumes?
    - **Impact:** Determines whether streaming processing needs to be prioritised for Phase 1 or can be deferred

- **Question 5: Endorsement Brokerage Calculation Basis — India**
    - **Description:** For India endorsements, is Basic Brokerage applied to the endorsement's Addition Net Premium only, or to the Net Endorsement Premium (Addition minus Deletion)?
    - **Impact:** If brokerage applies only to additions, a policy with 10,000 addition and 8,000 deletion gets brokerage on 10,000. If it applies to the net delta (2,000), brokerage is materially lower.

- **Question 6: Endorsement Brokerage Calculation Basis — Sri Lanka**
    - **Description:** Same question for Sri Lanka: is SRCC and TC brokerage applied to the full addition amount per component, or to the net endorsement delta per component?
    - **Impact:** Affects all three brokerage components (Basic, SRCC, TC) independently in Sri Lanka endorsement workflows

---

**Source:** This specification is reverse-engineered from the existing codebase implementation. Business rules and calculation formulas are extracted from the working production code. Validate any changes against the current implementation before modifying calculation logic.
