# Glossary

## Biz Done

Business that has been finalised — a completed, billable policy, endorsement, or reward — as opposed to a pending opportunity. See the [BizDone Report PRD](IIRM-778_Admin-Reports/IIRM-5441_BizDone/IIRM-5441_BizDone-PRD.md).

## Business Month

The calendar month a policy or endorsement actually took effect — its coverage start date. Contrast with [Income Month](#income-month).

## Income Month

The month IIRM's own books recognise a policy, endorsement, or reward's income, governed by the monthly cut-off rule (see [Cut-Off Management PRD](IIRM-10585_Cut-Off-Mgmt/IIRM-10585_cut-off_PRD.md)). Contrast with [Business Month](#business-month).

## Brokerage

The fee IIRM earns from an insurer for placing a policy — comparable to a real-estate agent's commission, except paid by the insurer rather than the buyer.

## SBU

Strategic Business Unit — one of IIRM's internal organisational divisions, one level above Vertical and Department.

## Sales Opportunity (SO)

An Opportunity record tracking a fresh deal being pursued with a company, as distinct from a [Renewal Opportunity](#renewal-opportunity-ro). See the [Auto-Close Expired Opportunities PRD](IIRM-735_Common-Component/Scheduler-Jobs/Auto-Close-Expired-Opportunities-PRD.md).

## Renewal Opportunity (RO)

An Opportunity record tracking the renewal of an existing policy, as distinct from a [Sales Opportunity](#sales-opportunity-so). Auto-created nightly for policies entering their renewal window — see the [Auto-Create Renewal Opportunities PRD](IIRM-735_Common-Component/Scheduler-Jobs/Auto-Create-Renewal-Opportunities-PRD.md).

## Placement Slip

The ISG-stage activity where terms are locked in with the insurer for an Opportunity. Whether this stage was completed before an Opportunity's expiry date determines how the auto-close scheduler job treats it — see the [Auto-Close Expired Opportunities PRD](IIRM-735_Common-Component/Scheduler-Jobs/Auto-Close-Expired-Opportunities-PRD.md).

## Premium Calculation

The ISG-stage activity where the final premium amount is worked out for an Opportunity, normally following [Placement Slip](#placement-slip). See the [Auto-Close Expired Opportunities PRD](IIRM-735_Common-Component/Scheduler-Jobs/Auto-Close-Expired-Opportunities-PRD.md).
