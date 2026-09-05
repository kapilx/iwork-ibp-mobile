import { kdmMeetingConfig } from "./KDMMeetingConfig";
import { dataValidationConfig } from "./DataValidation";
import { mandateDetailsConfig } from "./MandateDetailsConfig";
import { heldCoverNoteConfig } from "./HeldCoverNoteConfig";
import { rfpDetailCoversConfig } from "./RFPCoverDetailsConfig";
import { rfpDetailsConfig } from "./RFPDetailsEntryConfig";
import { quoteComparisionReportConfig } from "./QuoteComparisionReportConfig";
import { finalNegotiationConfig } from "./FinalNegotiationConfig";
import { placementSlipConfig } from "./PlacementSlipConfig";
import { premiumCalculationConfig } from "./PremiumCalculationConfig";
import { policyHardCopyConfig } from "./PolicyHardCopyConfig";
import { policyDocketConfig } from "./PolicyDocketConfig";
import { policyConfirmationConfig } from "./PolicyConfirmationConfig";
import { handOverMeetingConfig } from "./HandOverMeetConfig";
import {
  buildConfigV2,
  computeRequireFieldsPlacementSlip,
  computeRequireFollowups,
  computeRequiredFieldsPolicyConfirmation,
  computeRequiredFieldsPolicyHardCopy,
} from "./LocalizationConfigParser";
import { makePlacementSlipGenerationChangeSets } from "../LocalizationConfigs/PlacementSlipChangeSetGenerator";
import { makePolicyConfirmationChangeSets } from "../LocalizationConfigs/PolicyConfirmationChangeSetGenerator.js";
import { makeFinalNegotiationChangeSets } from "../LocalizationConfigs/FinalNegotiationChangeSetGenerator";
import { makeHeldCoverNoteChangeSets } from "../LocalizationConfigs/HeldCoverNoteChangeSetGenerator";
import { makePolicyHardCopyChangeSets } from "../LocalizationConfigs/PolicyHardCopyChangeSetGenerator";

export type ActivityType =
  | "data_validation_activity"
  | "kdm_meeting_activity"
  | "mandate_details_entry_activity"
  | "rfp_cover_detail_activity"
  | "held_cover_note_activity"
  | "rfp_details_entry_activity"
  | "quote_comparison_report_activity"
  | "final_negotiation_activity"
  | "placement_slip_generation_activity"
  | "premium_calculation_activity"
  | "policy_hard_copy_activity"
  | "policy_docket_activity"
  | "hand_over_meet_activity"
  | "policy_confirmation_activity";

/**
 * Returns the config object for a given activity type.
 * @param activityType - The type of activity.
 * @returns The corresponding config object or undefined.
 */
export const getActivityConfig = (
  activityType: ActivityType,
  formValues: any = {},
  dynamicvalues: any = {},
  organisationKey: string
): unknown => {
  switch (activityType) {
    case "data_validation_activity":
      return dataValidationConfig;
    case "kdm_meeting_activity":
      return kdmMeetingConfig;
    case "mandate_details_entry_activity":
      return mandateDetailsConfig(formValues, dynamicvalues);
    case "rfp_cover_detail_activity":
      return rfpDetailCoversConfig;
    case "rfp_details_entry_activity":
      return rfpDetailsConfig;
    case "quote_comparison_report_activity":
      return quoteComparisionReportConfig;
    // case "final_negotiation_activity":
    //   return getCountrySpecificConfig(finalNegotiationConfigLanka, {
    //     India: finalNegotiationConfig,
    //   });
    case "final_negotiation_activity": {
      const configV1 = finalNegotiationConfig(formValues, dynamicvalues); // ensure this is defined
      const { removedFields, replacedFields, newlyAddedFields } =
        makeFinalNegotiationChangeSets(organisationKey);

      const configs = buildConfigV2({
        configV1,
        replacedFields,
        newlyAddedFields,
        removedFields,
      });
      console.log("Final Negotiation Configs:", configs);
      return configs;
    }
    case "placement_slip_generation_activity": {
      const configV1 = placementSlipConfig(formValues, dynamicvalues); // ensure this is defined
      const isInstallmentRequired = computeRequireFieldsPlacementSlip(
        formValues,
        dynamicvalues
      );

      const { removedFields, replacedFields, newlyAddedFields } =
        makePlacementSlipGenerationChangeSets({
          isInstallmentRequired,
          organisationKey,
        });

      const configs = buildConfigV2({
        configV1,
        replacedFields,
        newlyAddedFields,
        removedFields,
      });
      console.log("Placement Slip Configs:", configs);
      return configs;
    }
    case "premium_calculation_activity":
      return premiumCalculationConfig;
    // case "policy_hard_copy_activity":
    //   return getCountrySpecificConfig(
    //     policyHardCopyConfigLanka(formValues, dynamicvalues),
    //     {
    //       India: policyHardCopyConfig(formValues, dynamicvalues),
    //     }
    //   );
    case "policy_hard_copy_activity": {
      const configV1 = policyHardCopyConfig(formValues, dynamicvalues); // ensure this is defined
      const requireFields = computeRequiredFieldsPolicyHardCopy(
        formValues,
        dynamicvalues
      );
      const isInstallmentRequired =
        String(
          formValues?.installmentSummarySection?.isPremiumInstallmentBased ??
            formValues?.deviationSection?.isPremiumInstallmentBased
        ) === String(dynamicvalues?.TOGGLE_YES);

      const { removedFields, replacedFields, newlyAddedFields } =
        makePolicyHardCopyChangeSets({
          requireFields,
          isInstallmentRequired,
          organisationKey,
        });

      const configs = buildConfigV2({
        configV1,
        replacedFields,
        newlyAddedFields,
        removedFields,
      });
      console.log("Policy Hard Copy Configs:", configs);
      return configs;
    }
    case "held_cover_note_activity": {
      const configV1 = heldCoverNoteConfig(formValues, dynamicvalues); // ensure this is defined
      const requireFollowups = computeRequireFollowups(
        formValues,
        dynamicvalues
      );
      const isInstallmentRequired =
        String(formValues?.premiumReceiptDetailsSection?.isPremiumInstallmentBased) ===
        String(dynamicvalues?.TOGGLE_YES);

      const { removedFields, replacedFields, newlyAddedFields } =
        makeHeldCoverNoteChangeSets({
          requireFollowups,
          isInstallmentRequired,
          organisationKey,
        });

      const configs = buildConfigV2({
        configV1,
        replacedFields,
        newlyAddedFields,
        removedFields,
      });
      console.log("Held Cover Note Configs:", configs);
      return configs;
    }

    case "policy_docket_activity":
      return policyDocketConfig;
    case "hand_over_meet_activity":
      return handOverMeetingConfig;
    // case "policy_confirmation_activity":
    //   return getCountrySpecificConfig(
    //     policyConfirmationConfigLanka(formValues, dynamicvalues),
    //     {
    //       India: policyConfirmationConfig(formValues, dynamicvalues),
    //     }
    //   );
    case "policy_confirmation_activity": {
      const configV1 = policyConfirmationConfig(formValues, dynamicvalues); // ensure this is defined
      const requireFields = computeRequiredFieldsPolicyConfirmation(
        formValues,
        dynamicvalues
      );
      const isInstallmentRequired =
        String(
          formValues?.installmentSummarySection?.isPremiumInstallmentBased ??
            formValues?.policyDataRectifiedSection?.isPremiumInstallmentBased
        ) === String(dynamicvalues?.TOGGLE_YES);

      const { removedFields, replacedFields, newlyAddedFields } =
        makePolicyConfirmationChangeSets({
          requireFields,
          isInstallmentRequired,
          organisationKey,
        });

      const configs = buildConfigV2({
        configV1,
        replacedFields,
        newlyAddedFields,
        removedFields,
      });
      console.log("Policy Confirmation  Configs:", configs);
      return configs;
    }
    default:
      return undefined;
  }
};
