# IIRM-XXXX: Policy Configurator – Product Specification

**Date:** 23 April 2026
**Portal:** IIRM (CRM) Portal
**Status:** Draft

---

## 1. Overview

The **Policy Configurator** is a multi-stage wizard within the IIRM portal that allows administrators to fully define the structure, rules, pricing, and constraints of an insurance policy before it is made available for employee enrolment.

It is a six-stage sequential configuration flow:

| Stage | Name                    | Purpose                                                                 |
|-------|-------------------------|-------------------------------------------------------------------------|
| 1     | Policy Components       | Define base, parental, and optional add-on components of the policy     |
| 2     | Policy Relationships    | Define the family relationship types and their age/count limits         |
| 3     | Policy Template         | Map add-on components to base/parental and assign eligible relations    |
| 4     | Policy Parameters       | Define the employee attributes (axes) that drive premium variation      |
| 5     | Policy Choices          | Configure premiums per component per parameter combination              |
| 6     | Constraints & Final Review | Set enrollment rules, validations, and review the full configuration |

Each stage must be completed before proceeding to the next.

---

## 2. Stage 1 – Policy Components

### 2.1 Overview

This stage defines the building blocks of the policy. A policy is composed of:

- **One Base Component** (mandatory, always present by default)
- **One Parental Component** (optional, maximum one allowed)
- **Multiple Optional (Add-on) Components** (zero or more, configurable)

### 2.2 Component Types

| Component Type | Cardinality | Description                                                                 |
|----------------|-------------|-----------------------------------------------------------------------------|
| Base           | Exactly 1   | The primary insurance coverage. Always present.                             |
| Parental       | 0 or 1      | A separate component exclusively for parent-category relations.             |
| Optional       | 0 to N      | Add-on components that supplement the base or parental coverage.            |

### 2.3 Configurable Properties per Component

#### a) Display Label
A customisable alias name for the component shown throughout the portal and to employees.

#### b) Sum Insured Options
The list of sum insured values that this component supports.

- Each option has a unique **ID** and a **value** (e.g., ₹5,00,000 or ₹10,00,000).
- Multiple options can be added.

#### c) Sum Insured Model

Two models are supported:

| Model      | Description                                                                                                                 |
|------------|-----------------------------------------------------------------------------------------------------------------------------|
| `FLAT`     | Sum insured values are fixed amounts (e.g., ₹5L, ₹10L).                                                                    |
| `MULTIPLE` | Sum insured is a multiple of an employee property (e.g., CTC). The stored values represent multipliers (e.g., 2x, 4x CTC). |

When `MULTIPLE` is selected:

- A **multiplier label** must be provided (e.g., `CTC`).
- A **minimum sum insured cap** must be set (e.g., ₹2,00,000).
- A **maximum sum insured cap** must be set (e.g., ₹8,00,000).
- The actual sum insured = (multiplier × employee property value), clamped within min and max.

#### d) Show Company Contribution Flag
Controls whether the employer's contribution amount is shown to the employee in the enrolment portal.

- `true` → Employee sees the company's share of the premium.
- `false` → Only total or employee-borne premium is shown.

#### e) Pro-ration Flag

Controls how premiums are calculated when an employee is added or removed mid-policy-period.

**Basis:** Pro-ration is always calculated against the **total policy duration** (in calendar days), using the employee's **effective enrolment date** as the start of the active period.

**Formula (when pro-ration is enabled):**

```
Pro-rated Premium = Full Premium × (Active Days / Total Policy Duration Days)
```

Where:
- **Total Policy Duration Days** = policy end date − policy start date (inclusive)
- **Active Days** = policy end date − employee effective enrolment date (inclusive)

**When Enabled:**

- Premium is charged proportionally based on the number of active days from the effective enrolment date to the policy end date.
- If an employee is removed before the policy ends, a refund is issued for the remaining unused days: `Refund = Full Premium × (Remaining Days / Total Policy Duration Days)`.

**When Disabled:**

- Full premium is charged regardless of when the employee enrolled or was removed.
- No refund is issued on removal.

**Example (Policy Duration: 100 days, Total Premium: ₹1,000):**

| Scenario               | Employee 1 (100 days) | Employee 2 (50 days) |
|------------------------|-----------------------|----------------------|
| Pro-ration Enabled     | ₹1,000                | ₹500                 |
| Pro-ration Disabled    | ₹1,000                | ₹1,000               |

**Real-world Date Example:**

Policy period: **12-Jan-2025 to 11-Jan-2026** (365 days total)
Employee effective enrolment date: **15-Jun-2025**

- Active days = 11-Jan-2026 − 15-Jun-2025 = **211 days**
- Remaining / unused days at enrolment = 365 − 211 = **154 days** (already elapsed before enrolment)

| Component | Full Premium | Pro-ration | Charged Premium |
|---|---|---|---|
| Base Policy (pro-ration enabled) | ₹300 | 211 ÷ 365 | ₹300 × (211/365) = **₹173.42** |
| Critical Illness Add-on (pro-ration enabled) | ₹300 | 211 ÷ 365 | ₹300 × (211/365) = **₹173.42** |

> **Note:** Components with `proRationEnabled: false` always charge the **full premium** irrespective of the enrolment date. In the example above, if the base policy had pro-ration disabled, the full ₹300 would be charged even though the employee enrolled mid-year.

#### f) Premium Per Life Flag

Controls how the premium is applied relative to enrolled members.

- `true` (Per Life) → Premium is charged for **each enrolled member** individually.
    - Example: Employee + Spouse enrolled → Premium = 2 × base premium.
- `false` (Per Family) → A **single flat premium** is charged for the entire enrolled family unit, regardless of member count.

#### g) Benefit/Waiver Component Flag (`isBenefitComponent`)

Designates an optional add-on component as a **benefit or waiver type** — a product where no traditional sum insured coverage is provided, but the employee pays a fixed extra premium to unlock a benefit.

**Key characteristics:**

- `isBenefitComponent` is a boolean flag, default `false`.
- May only be set on **optional (add-on)** components. Cannot be enabled on the base or parental component.
- When enabled:
    - The **Sum Insured Model is locked to `FLAT`**.
    - The **only permitted SI value is `0`** (representing "no coverage amount").
    - Premium contributions in Stage 5 are **fully configurable** and represent the fixed charge for the benefit (e.g., ₹8,000 for a Co-pay Waiver).
    - The Display Label is still configurable and is shown to employees (e.g., "Co-pay Waiver", "Deductible Waiver").

**Example:**

| Component      | Type     | SI  | Company Premium | Employee Premium |
|----------------|----------|-----|-----------------|------------------|
| Co-pay Waiver  | Add-on   | ₹0  | ₹0              | ₹8,000           |

> **Note:** An SI of `0` on a benefit component does **not** mean the option is unavailable or that premiums must be zero. The `isAvailable` flag in Stage 5 governs editability, as with any other component.

---

## 3. Stage 2 – Policy Relationships

### 3.1 Overview

This stage defines which family relationship types are covered under the policy and sets age and count constraints per relationship.

### 3.2 Relationship Categories

| Category       | Sub-categories                                                             |
|----------------|----------------------------------------------------------------------------|
| Self           | Self                                                                       |
| Spouse/Partner | Husband, Wife, Spouse, Partner, Same-sex Spouse, Same-sex Partner          |
| Children       | Son, Daughter, Child                                                       |
| Parents        | Father, Mother, Mother-in-law, Father-in-law, Parent                      |
| Siblings       | Brother, Sister, Sibling                                                   |

### 3.3 Configuration per Category

For each **main category**:

- **Enabled / Disabled** toggle.
- **Max Count** – Maximum number of dependents of this category type allowed per employee.

For each **sub-category**:

- **Enabled / Disabled** toggle.
- **Min Age** – Minimum age (in years) for a dependent of this sub-type to be eligible.
- **Max Age** – Maximum age (in years) for a dependent of this sub-type to remain eligible.

### 3.4 Validation Rules

- If the total number of enrolled dependents in a category exceeds `maxCount`, enrolment is blocked.
- If a dependent's age falls outside the configured `minAge`–`maxAge` range for their sub-category, they cannot be enrolled.
- A **policy-level family maximum** (`familyMaxPolicyLevel`) defines the maximum total number of lives (employee + all dependents) that can be enrolled under a single policy record.

---

## 4. Stage 3 – Policy Template

### 4.1 Overview

This stage maps the optional add-on components to their parent (base or parental) components and associates eligible relationship types to each component.

### 4.2 Base Policy Template

- **Main Policy ID** – References the base component defined in Stage 1.
- **Eligible Relations** – The list of relationship sub-categories covered under this base component (e.g., Self, Husband, Wife, Son, Daughter, Father, Mother).
- **Add-on Mappings** – One or more optional components can be mapped under the base:
    - Each add-on carries its own **eligible relations** list.
    - Each add-on carries its own policy numbers (see 4.4).
- **Club Sum Insured** – Boolean flag. If `true`, the sum insured of mapped add-ons is clubbed/aggregated with the base component's sum insured.

### 4.3 Parental Policy Template

- Same structure as the base policy template.
- Eligible relations are **restricted to parent-category** relationships only (e.g., Father, Mother, Mother-in-law, Father-in-law).

### 4.4 Policy Number Fields (per component in template)

Each component in the template (main and add-ons) carries three policy number fields:

| Field                   | Description                                          |
|-------------------------|------------------------------------------------------|
| `provisionPolicyNumber` | Provisional policy number issued before final policy |
| `insurerPolicyNumber`   | Final policy number from the insurer                 |
| `iirmPolicyNumber`      | Internal IIRM system policy reference number         |

---

## 5. Stage 4 – Policy Parameters

### 5.1 Overview

Parameters are the employee attributes used as axes for varying premiums. Each unique combination of parameter values generates a distinct **Policy Option** in Stage 5.

> **Parameters are optional.** If no parameters are configured, the system generates a single **Universal Option** — one policy option that applies uniformly to all employees regardless of their attributes. The admin configures premiums for this single option in Stage 5.

### 5.2 Supported Parameter Types

| Parameter Type     | Internal Type      | Description                                                                                                                                                                                 |
|--------------------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Age                | `range`            | Configured as range bands (e.g., 0–30, 31–100). Each band is a named range.                                                                                                                |
| Grade              | `list`             | Employee grade/band — list of values.                                                                                                                                                       |
| Relationship Group | `relation`         | Named groups of family relation categories. Each group defines which relation types are included and their max counts. Premium varies based on which group the employee falls into at enrolment. |
| Gender             | `list`             | Male, Female, etc. — list of values.                                                                                                                                                        |
| Marital Status     | `list`             | Married, Unmarried, etc. — list of values.                                                                                                                                                  |
| Designation        | `list`             | Employee designation — list of values.                                                                                                                                                      |
| Custom List        | `list`             | User-defined list of string values (e.g., Indian citizen, NRI).                                                                                                                             |
| Custom Range       | `range`            | User-defined numeric range bands on any employee property.                                                                                                                                  |
| Dependent Count    | `dependent-count`  | Count-range bands over enrolled members of a specific relation category. Each band carries an SI enhancement (₹, additive over base SI) and generates a distinct premium tier in Stage 5.   |

### 5.3 Parameter Configuration

**For list-type parameters (`list`):**

- Each list item has a **value** and an `isDefault` flag indicating it is active by default.

**For range-type parameters (`range`):**

- Each range band has:
    - A **display name** (e.g., "age band - 1")
    - A **min** and **max** value (inclusive)

**For relation-type parameters (`relation`):**

- The admin defines one or more **Relationship Groups**. Each group has:
    - A **group display name** (e.g., "Self group", "Self+Spouse", "self+spouse+child")
    - A set of **selected relation categories** (Self, Spouse/Partner, Children, Parents, Siblings), each with a `maxCount` for that group
    - A **family max count** (`familyMaxCount`) — the maximum total number of lives allowed in this group. This can be set manually or auto-calculated from the sum of selected category max counts.
- At enrolment time, the system identifies which group the employee belongs to based on the dependents they are enrolling, and applies the premium configured for that group.
- Relationship Group as a parameter allows the admin to set **different premiums for employees enrolling alone vs. enrolling with a spouse vs. enrolling with a full family unit**, independently of the other parameters.

**Example Relationship Groups:**

| Group Name         | Relations Included            | Family Max Count |
|--------------------|-------------------------------|------------------|
| Self group         | Self (max 1)                  | 1                |
| Self+Spouse        | Self (max 1), Spouse (max 1)  | 2                |
| self+spouse+child  | Self (max 1), Spouse (max 1), Children (max 2) | 4  |

**For dependent-count-type parameters (`dependent-count`):**

The admin defines:

- **Target Relation Category** — the relation category whose enrolled member count determines the tier (e.g., Parents, Children).
- **Count Bands** — one or more named bands, each with:
    - `displayName` — a descriptive label (e.g., "No Parents", "1–2 Parents", "3–4 Parents").
    - `minCount` — minimum enrolled member count (inclusive, ≥ 0).
    - `maxCount` — maximum enrolled member count (inclusive); leave blank / `null` for "and above" (unlimited upper bound).
    - `siEnhancement` — additional SI in ₹ added on top of the base component's SI for this band. Use `0` for no enhancement.

**Validation rules for count bands:**

- Bands must be non-overlapping.
- Bands must be contiguous starting from `minCount = 0`. Gaps between bands are not allowed.
- A member count must fall into exactly one band; counts outside all bands block enrolment.

**SI Enhancement logic:**

- `siEnhancement` is **additive** over the base SI defined in Stage 1.
- Effective SI at enrolment = `base component SI + siEnhancement`.
- A band with `siEnhancement = 0` retains the base SI unchanged.

**Example — Count-based parental SI enhancement:**

| Band Name       | Min Count | Max Count | SI Enhancement | Effective SI (base = ₹5L) |
|-----------------|-----------|-----------|----------------|---------------------------|
| No Parents      | 0         | 0         | ₹0             | ₹5,00,000                 |
| 1–2 Parents     | 1         | 2         | ₹5,00,000      | ₹10,00,000                |
| 3–4 Parents     | 3         | 4         | ₹10,00,000     | ₹15,00,000                |

> **Note:** Dependent Count and Relationship Group are independent parameters. Relationship Group controls *which* relation categories are included in a family unit. Dependent Count controls *how many* members of a specific category are enrolled, and scales the SI accordingly. Both can coexist in the same policy, each contributing independently to the Cartesian product.

### 5.4 Combination Generation

The system generates the **Cartesian product** of all configured parameter options. Each combination becomes a **Policy Option** that must be fully configured in Stage 5.

**Example (from sample configuration):**

| Parameter          | Type     | Options                                        | Count |
|--------------------|----------|------------------------------------------------|-------|
| Age                | range    | age band - 1 (0–30), age band - 2 (31–100)    | 2     |
| Gender             | list     | Male, Female                                   | 2     |
| Custom List        | list     | Indian citizen, NRI                            | 2     |
| Relationship Group | relation | Self group, Self+Spouse, self+spouse+child     | 3     |

Generated combinations: 2 × 2 × 2 × 3 = **24 Policy Options**

> **Note:** Adding a Relationship Group parameter significantly increases the number of policy option combinations. Each group represents a distinct premium tier for employees based on who they are enrolling alongside themselves. This is the primary driver for premium differentiation by family composition.

---

## 6. Stage 5 – Policy Choices

### 6.1 Overview

For each Policy Option generated in Stage 4, the administrator configures the premium breakdown for every component (base, parental, and their mapped add-ons) and for every sum insured value.

### 6.2 Choice Structure per Option

Each Policy Option contains:

- **`basePolicyChoices`** – Premium configuration for the base component.
    - `mainPolicyChoices` – Premiums per sum insured option for the base component.
    - `addonChoices` – Premiums per sum insured option for each add-on mapped to the base.
- **`parentalPolicyChoices`** – Premium configuration for the parental component (if configured).
    - Same structure as `basePolicyChoices`.

### 6.3 Choice Fields per Sum Insured Option

| Field                  | Type    | Description                                                       |
|------------------------|---------|-------------------------------------------------------------------|
| `sumInsuredId`         | number  | References the sum insured option ID from Stage 1                 |
| `isAvailable`          | boolean | Whether this sum insured option is available for this combination |
| `isDefault`            | boolean | Whether this sum insured option is pre-selected by default        |
| `companyContribution`  | number  | Company-borne premium amount (absolute ₹ for FLAT; per-mille rate for MULTIPLE) |
| `employeeContribution` | number  | Employee-borne premium amount (absolute ₹ for FLAT; per-mille rate for MULTIPLE) |

> **Note on MULTIPLE model:** For components using the `MULTIPLE` sum insured model, contributions are stored as **per-mille (‰) rates** — i.e., the contribution amount per ₹1,000 of the computed sum insured.
>
> **Formula:** `Premium = contribution_rate × (computed_SI / 1000)`
>
> **Example:** If `companyContribution = 0.2` and computed SI = ₹4,00,000 → Company premium = 0.2 × (4,00,000 ÷ 1,000) = 0.2 × 400 = **₹80**

### 6.4 Availability Rules

- An option with `isAvailable: false` will not be presented to the employee during enrolment.
- Contributions for unavailable options must be set to `0`.
- At least one sum insured option per component per policy option must be `isAvailable: true`.

### 6.5 Special Cases

**Benefit/Waiver components (`isBenefitComponent: true`):**

- The Sum Insured displayed is `₹0`. This does not mean the option is unavailable or that premiums must be `0`.
- When `isAvailable: true`, `companyContribution` and `employeeContribution` are fully editable and should reflect the fixed benefit charge (e.g., ₹8,000 for Co-pay Waiver).

**Dependent Count parameter options:**

- For policy options generated from Dependent Count bands, Stage 5 displays the **effective SI** for the admin's reference: `Effective SI = base component SI + siEnhancement`.
- Example: base SI = ₹5,00,000 and count band SI enhancement = ₹5,00,000 → effective SI displayed = ₹10,00,000.
- Premium contributions for each count-band option are entered and stored independently; they are not auto-derived from the `siEnhancement` value.

---

## 7. Stage 6 – Constraints & Final Review

### 7.1 Overview

The final stage configures enrollment rules, validation gates, tax settings, and compliance flags. After all constraints are set, the administrator reviews the complete policy configuration before saving.

### 7.2 Constraint Properties

#### Family & Dependent Rules

| Constraint                           | Type    | Default | Description                                                                                     |
|--------------------------------------|---------|---------|-----------------------------------------------------------------------------------------------------|
| `crossParentsAllowed`               | boolean | false   | Allow employee to select parents AND parents-in-law simultaneously                              |
| `maleEmployeesCoverParents`         | boolean | true    | Allow male employees to add their own parents                                                   |
| `femaleEmployeesCoverParents`       | boolean | true    | Allow female employees to add their own parents                                                 |
| `maleEmployeesCoverInLaws`          | boolean | true    | Allow male employees to add their parents-in-law                                                |
| `femaleEmployeesCoverInLaws`        | boolean | true    | Allow female employees to add their parents-in-law                                              |
| `sameGenderParentsAllowed`          | boolean | false   | Allow coverage for same-gender parent and parent-in-law combination                             |
| `ageGapBetweenParentAndEmployee`    | number  | 18      | Minimum age gap (years) required — parent must be older than employee by this value             |
| `ageGapBetweenChildrenAndEmployee`  | number  | 18      | Minimum age gap (years) required — employee must be older than child by this value              |
| `twinsSecondChildAllowed`           | boolean | true    | Allow the second child to be enrolled if twins                                                  |
| `studyingSonAgeExtension`           | number  | 0       | Additional years beyond the standard max age limit for a son if still in full-time education    |
| `unmarriedDaughterAgeExtension`     | number  | 0       | Additional years beyond the standard max age limit for an unmarried daughter                   |

#### Tax & Financial Rules

| Constraint              | Type    | Default | Description                                                            |
|-------------------------|---------|---------|------------------------------------------------------------------------|
| `gstApplicable`         | boolean | true    | Whether GST is applicable on premiums                                 |
| `showGstToEmployee`     | boolean | true    | Whether the GST component is shown to the employee                    |
| `sezApplicable`         | boolean | false   | Whether SEZ-based tax discount is applicable                          |
| `payrollInstallments`   | number  | 1       | Number of payroll installments across which premium deduction is split |

#### Enrollment Process Rules

| Constraint                              | Type    | Default | Description                                                                          |
|-----------------------------------------|---------|---------|--------------------------------------------------------------------------------------|
| `enrollmentConfirmationRequired`       | boolean | true    | Require the employee to explicitly confirm their enrolment submission                |
| `lockEnrollmentAfterCutoff`            | boolean | true    | Automatically lock enrollment for all employees after the defined cutoff date        |
| `confirmationStatusVisibleToHR`        | boolean | true    | Allow HR/Admin to view whether each employee has confirmed their enrolment           |
| `showEmployeeContribution`             | boolean | true    | Show the employer's contribution breakdown to the employee                           |
| `tpaMandatory`                         | boolean | true    | Require TPA card/document upload as part of the enrolment process                   |
| `documentUploadForAdditionsRequired`   | boolean | true    | Require document upload when adding a dependent (natural life event)                 |
| `documentUploadForDeletionsRequired`   | boolean | true    | Require document upload when removing a dependent (natural life event)               |

#### Custom Disclaimer

| Constraint                        | Type   | Default                                                                                                  | Description                                                          |
|-----------------------------------|--------|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `customDisclaimerBeforeSubmission` | text   | *"I confirm that the information provided is accurate and complete..."* | Custom disclaimer displayed to employee before submission of enrolment |

---

## 8. User Stories

### Stage 1 – Policy Components

- **US-PC-01:** As an admin, I want to define a base component for the policy so that every policy has a mandatory primary coverage.
- **US-PC-02:** As an admin, I want to optionally add one parental component so that parents of employees can be covered under a separate sub-policy.
- **US-PC-03:** As an admin, I want to add multiple optional add-on components so that employees can elect supplemental coverage.
- **US-PC-04:** As an admin, I want to configure the sum insured model as FLAT or MULTIPLE so that coverage adapts to either fixed or salary-linked values.
- **US-PC-05:** As an admin, I want to set min/max caps on MULTIPLE sum insured so that the coverage stays within acceptable limits regardless of the computed multiple.
- **US-PC-06:** As an admin, I want to enable or disable pro-ration per component so that refund and premium calculation behaviour is controlled at a granular level.
- **US-PC-07:** As an admin, I want to toggle the premium-per-life/per-family flag so that the billing model matches the policy agreement.

- **US-PC-08:** As an admin, I want to designate an optional add-on component as a benefit/waiver type (e.g., Co-pay Waiver) so that I can charge a fixed premium for a benefit without tying it to a sum insured coverage amount.

### Stage 2 – Policy Relationships

- **US-PR-01:** As an admin, I want to enable or disable relationship categories (e.g., Siblings) so that only policy-supported family types are available during enrolment.
- **US-PR-02:** As an admin, I want to set age limits per relationship sub-category so that enrolled dependents meet the insurer's eligibility criteria.
- **US-PR-03:** As an admin, I want to set a max count per category so that the total number of dependents per type does not exceed the policy limit.
- **US-PR-04:** As an admin, I want to set a policy-level family maximum so that the total insured lives per employee stay within policy bounds.

### Stage 3 – Policy Template

- **US-PT-01:** As an admin, I want to map add-on components to the base policy so that add-ons are correctly associated with their parent coverage.
- **US-PT-02:** As an admin, I want to assign eligible relations per component so that only allowed dependents can be enrolled under each component.
- **US-PT-03:** As an admin, I want to enter provisional, insurer, and IIRM policy numbers per component so that policy traceability is maintained.
- **US-PT-04:** As an admin, I want to toggle the club sum insured flag so that add-on benefits and base benefits can be combined or kept separate.

### Stage 4 – Policy Parameters

- **US-PP-01:** As an admin, I want to define parameters (Age, Gender, Marital Status, etc.) so that premiums can vary based on employee attributes.
- **US-PP-02:** As an admin, I want to define age range bands with custom labels so that age-based premium tiers are clearly named.
- **US-PP-03:** As an admin, I want to define custom lists with freeform values so that unique employee classifications can drive premium variation.
- **US-PP-04:** As an admin, I want to define relationship groups with named family compositions so that employees enrolling different combinations of dependents are priced differently.
- **US-PP-05:** As an admin, I want to set max counts per relation category within each relationship group so that the group's family composition is precisely controlled.
- **US-PP-06:** As an admin, I want to define a Dependent Count parameter targeting a specific relation category (e.g., Parents) so that the sum insured and premium can scale based on how many members of that category are enrolled.
- **US-PP-07:** As an admin, I want to define SI enhancement values per count band so that employees enrolling more dependents in a category receive an appropriately higher sum insured automatically.

### Stage 5 – Policy Choices

- **US-PCH-01:** As an admin, I want to configure premiums per parameter combination so that each employee segment receives accurately priced coverage options.
- **US-PCH-02:** As an admin, I want to mark certain sum insured options as unavailable for specific combinations so that ineligible plans are hidden during enrolment.
- **US-PCH-03:** As an admin, I want to set default sum insured options per combination so that a pre-selected plan is offered to employees at enrolment.
- **US-PCH-04:** As an admin, I want to set company and employee contribution amounts separately so that cost-sharing is clearly defined and transparent.

### Stage 6 – Constraints

- **US-CON-01:** As an admin, I want to configure parent-coverage eligibility rules by gender so that the policy honours insurer-defined constraints.
- **US-CON-02:** As an admin, I want to set age gap constraints between employee and dependents so that invalid dependent-employee combinations are rejected.
- **US-CON-03:** As an admin, I want to enable enrollment lock after a cutoff date so that late submissions are automatically blocked.
- **US-CON-04:** As an admin, I want to require document uploads for life events so that evidence is collected for additions and deletions.
- **US-CON-05:** As an admin, I want to configure a custom disclaimer text so that employees acknowledge policy-specific terms before confirming enrolment.
- **US-CON-06:** As an admin, I want to enable or disable GST and SEZ tax flags so that the premium calculations reflect the correct tax treatment.
- **US-CON-07:** As an admin, I want to configure the number of payroll installments so that premium deductions are spread across the appropriate pay cycles.

---

## 9. Acceptance Criteria

### Stage 1 – Policy Components

- [ ] System enforces exactly one base component per policy; the base cannot be deleted.
- [ ] System allows at most one parental component; adding a second is blocked.
- [ ] System allows zero or more optional components with no upper enforced limit.
- [ ] When MULTIPLE sum insured model is selected, siMultipleLabel, siMultipleMin, and siMultipleMax are mandatory fields.
- [ ] When FLAT model is selected, min/max fields are hidden and not required.
- [ ] Pro-ration flag defaults to `true`; toggling to `false` disables refund processing for that component.
- [ ] When pro-ration is enabled, the charged premium is calculated as: `Full Premium × (Active Days / Total Policy Duration Days)`, where Active Days = policy end date − employee effective enrolment date (inclusive).
- [ ] When an employee is removed mid-policy and pro-ration is enabled, the refund is: `Full Premium × (Remaining Days / Total Policy Duration Days)`.
- [ ] When pro-ration is disabled, the full premium is charged regardless of the enrolment date and no refund is issued on removal.
- [ ] Pro-ration is evaluated independently per component — a policy can have some components with pro-ration enabled and others disabled.
- [ ] Premium-per-life flag correctly drives whether the billing multiplier is 1 (family) or N (count of enrolled lives).
- [ ] Admin can designate an optional add-on component as a benefit/waiver type (`isBenefitComponent: true`); Stage 1 validation accepts SI = 0 without error.
- [ ] When `isBenefitComponent: true`, the Sum Insured Model is locked to `FLAT` and the only permitted SI value is `0`.
- [ ] Attempting to enable `isBenefitComponent` on the base or parental component is blocked with a clear error.

### Stage 2 – Policy Relationships

- [ ] Disabling a category hides all its sub-categories and prevents enrolment of those relation types.
- [ ] Min and max age fields are mandatory when a sub-category is enabled.
- [ ] Attempting to enrol a dependent violating age range shows a clear validation error.
- [ ] Attempting to enrol a dependent exceeding category max count blocks the addition.
- [ ] familyMaxPolicyLevel is enforced across all categories combined.

### Stage 3 – Policy Template

- [ ] Each add-on can only be mapped once per parent (base or parental).
- [ ] Eligible relations for parental components can only include parent-category types.
- [ ] All three policy number fields (provisional, insurer, IIRM) are available per component but not mandatory.
- [ ] Club sum insured flag is correctly reflected in premium calculation when enabled.

### Stage 4 – Policy Parameters

- [ ] Parameters are optional. If no parameters are configured, the system generates exactly one **Universal Option** in Stage 5 that applies to all employees.
- [ ] If one or more parameters are configured, the system generates the full Cartesian product of all parameter options as individual policy options.
- [ ] Range-type parameters require non-overlapping, contiguous ranges covering the full expected input domain.
- [ ] List-type parameters require at least one enabled value.
- [ ] Relation-type parameters require at least one relationship group to be defined.
- [ ] Each relationship group must have at least one relation category selected with a valid max count.
- [ ] `familyMaxCount` on a relationship group must be ≥ the sum of all selected category max counts within that group when set manually.
- [ ] Changing parameters in Stage 4 invalidates and regenerates all choices in Stage 5, with a confirmation prompt shown to the admin.
- [ ] Admin can add a Dependent Count parameter targeting a relation category, define count bands with SI enhancements, and Stage 4 generates one policy option per band.
- [ ] Overlapping count bands are rejected with a validation error before Stage 4 can be completed.
- [ ] Gaps between count bands are rejected with a validation error.
- [ ] Multiple Dependent Count parameters targeting different relation categories may coexist and contribute independently to the Cartesian product.

### Stage 5 – Policy Choices

- [ ] The system generates all Cartesian product combinations from Stage 4 parameters.
- [ ] Each combination must have all components fully configured before the policy can be saved.
- [ ] Unavailable (`isAvailable: false`) sum insured options must have contributions set to 0.
- [ ] Exactly one sum insured option per component per combination should be `isDefault: true`.
- [ ] For MULTIPLE model components, contributions are stored as per-mille (‰) rates, not absolute ₹ values or percentages. Premium = `rate × (computed_SI / 1000)`.
- [ ] For benefit/waiver components (`isBenefitComponent: true`) with `isAvailable: true`, contribution fields are fully editable and accept positive values (not locked to 0 because SI = 0).
- [ ] For policy options derived from Dependent Count bands, Stage 5 displays the effective SI (base SI + siEnhancement) for admin reference alongside the contribution fields.

### Stage 6 – Constraints

- [ ] All boolean constraints default to their documented default values on first load.
- [ ] `payrollInstallments` must be a positive integer (minimum 1).
- [ ] Age extension fields (`studyingSonAgeExtension`, `unmarriedDaughterAgeExtension`) accept 0 or positive integers only.
- [ ] Age gap constraints (`ageGapBetweenParentAndEmployee`, `ageGapBetweenChildrenAndEmployee`) must be positive integers; defaulting to 18.
- [ ] Custom disclaimer text is mandatory and must not be blank before final save.
- [ ] Final Review screen displays a read-only summary of all six stages before the admin confirms and saves.
- [ ] Saving is blocked if any stage has an incomplete or invalid configuration, with a clear per-stage error indicator.

---

## 10. Data Model Reference

### Component Schema (abbreviated)

```json
{
  "id": "string",
  "type": "base | parental | optional",
  "label": "string",
  "sumInsuredModel": "FLAT | MULTIPLE",
  "sumInsuredOptions": [{ "id": "number", "value": "string" }],
  "siMultipleLabel": "string",
  "siMultipleMin": "number",
  "siMultipleMax": "number",
  "premiumPerLife": "boolean",
  "proRationEnabled": "boolean",
  "showCompanyContribution": "boolean",
  "isBenefitComponent": "boolean"
}
```

### Relationship Schema (abbreviated)

```json
{
  "type": "Self | Spouse/Partner | Children | Parents | Siblings",
  "enabled": "boolean",
  "maxCount": "string",
  "configuredOptions": [
    { "name": "string", "minAge": "string", "maxAge": "string", "enabled": "boolean" }
  ]
}
```

### Policy Option / Choice Schema (abbreviated)

```json
{
  "optionId": "string",
  "optionLabel": "string",
  "optionMeta": [{ "parameterId": "string", "parameterOptionId": "string" }],
  "basePolicyChoices": {
    "mainPolicyChoices": {
      "policyId": "string",
      "choices": [
        { "sumInsuredId": "number", "isAvailable": "boolean", "isDefault": "boolean",
          "companyContribution": "number", "employeeContribution": "number" }
      ]
    },
    "addonChoices": []
  },
  "parentalPolicyChoices": {}
}
```

### DependentCountBand Schema

```json
{
  "id": "string",
  "displayName": "string",
  "minCount": "number (≥ 0)",
  "maxCount": "number | null (null = unlimited / and-above)",
  "siEnhancement": "number (₹, ≥ 0)"
}
```

### Policy Parameter Schema — Dependent Count extension

```json
{
  "id": "string",
  "parameterType": "DependentCount",
  "internalType": "dependent-count",
  "label": "string",
  "dependentCountConfig": {
    "targetRelationCategory": "Self | Spouse/Partner | Children | Parents | Siblings",
    "countBands": [
      { "id": "string", "displayName": "No Parents",  "minCount": 0, "maxCount": 0, "siEnhancement": 0 },
      { "id": "string", "displayName": "1–2 Parents", "minCount": 1, "maxCount": 2, "siEnhancement": 500000 },
      { "id": "string", "displayName": "3–4 Parents", "minCount": 3, "maxCount": null, "siEnhancement": 1000000 }
    ]
  }
}
```

---

*Document generated: 23 April 2026*
*Updated: 26 May 2026 — Added Benefit/Waiver Component (isBenefitComponent) and Dependent Count parameter type requirements.*
