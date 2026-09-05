import { NotFoundException } from "@nestjs/common";
import { In, Repository } from "typeorm";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { LookupQueryType } from "../constants";
import { LookUp, OpportunityActivityMap } from "../entities";
/**
 * Fetches activity meta for a given opportunity ID.
 * @param repository - The repository for OpportunityActivityMap.
 * @param opportunityId - The opportunity ID.
 * @returns A promise resolving to the activity meta data.
 */
export async function fetchActivityMeta(
  repository: Repository<OpportunityActivityMap>,
  opportunityId: number,
  refActivityId: number
): Promise<any[]> {
  try {
    if (!opportunityId || !refActivityId) {
      throw new NotFoundException("Invalid opportunity or activity ID.");
    }

    const activitymeta = await repository.find({
      where: { opportunityId, refActivityId },
      select: [
        "id",
        "activityName",
        "opportunityId",
        "activityMeta",
        "statusLid",
        "activityKey",
      ],
    });

    if (!activitymeta || activitymeta.length === 0) {
      throw new NotFoundException(
        errorMessages.opportunityActivityMetaNotFound
      );
    }

    const disableActivities = [
      "data_validation_activity",
      "kdm_meeting_activity",
      "mandate_details_entry_activity",
      "rfp_details_entry_activity",
      "rfp_cover_detail_activity",
      "broking_slip_activity",
      "quote_entry_activity",
    ];
    const enableActivities = [
      "quote_comparison_report_activity",
      "final_negotiation_activity",
      "placement_slip_generation_activity",
      "premium_calculation_activity",
      "hand_over_meet_activity",
      "policy_confirmation_activity",
      "held_cover_note_activity",
      "policy_hard_copy_activity",
      "policy_docket_activity",
    ];
    let isEnabled = true;
    if (disableActivities.includes(activitymeta[0].activityKey)) {
      isEnabled = false;
    } else if (enableActivities.includes(activitymeta[0].activityKey)) {
      isEnabled = true;
    }

    const allOpportunityActivityList = await repository.find({
      where: { opportunityId },
      select: [
        "id",
        "activityName",
        "opportunityId",
        "activityMeta",
        "statusLid",
        "activityKey",
      ],
      relations: ["status", "opportunity", "opportunity.status"],
    });
    const activityIndex = allOpportunityActivityList.findIndex(
      (activity) =>
        activity.status.lookUpKey ===
          "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS" ||
        activity.status.lookUpKey === "OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED" ||
        activity.status.lookUpKey === "OPPORTUNITY_ACTIVITY_STATUS_REJECTED"
    );
    if (activityIndex !== -1) {
      if (
        disableActivities.includes(
          allOpportunityActivityList[activityIndex].activityKey
        )
      ) {
        isEnabled = false;
      }
    } else {
      if (
        allOpportunityActivityList[0].opportunity.status?.lookUpKey ===
        "OPPORTUNITY_STATUS_WON"
      ) {
        isEnabled = true;
      }
    }
    if (
      allOpportunityActivityList[0].opportunity.status?.lookUpKey ===
      "OPPORTUNITY_STATUS_LOST"
    ) {
      isEnabled = false;
    }

    activitymeta[0].isEnabled = isEnabled;
    return activitymeta[0];
  } catch (error) {
    throw new NotFoundException(
      errorMessages.opportunityActivityMetaNotFound,
      error.message
    );
  }
}

export interface LookUpData {
  id: number;
  lookUpKey: string;
  lookUpValue: string;
  value: string;
  lookUpOrder: number;
}

export async function getLookups(
  repository: Repository<LookUp>,
  data: string[] | number[],
  type: LookupQueryType
): Promise<LookUpData[]> {
  if (!data.length) return [];
  const whereConditions = {
    LOOK_UP_NAME: { lookUpName: In(data as string[]) },
    LOOK_UP_KEY: { lookUpKey: In(data as string[]) },
    LOOK_UP_ID: { id: In(data as number[]) },
  };
  const lookups = await repository.find({
    where: whereConditions[type],
    select: ["id", "lookUpName", "lookUpKey", "lookUpValue", "lookUpOrder"],
  });
  return lookups.map((lookup) => ({
    id: lookup.id,
    lookUpName: lookup.lookUpName,
    lookUpKey: lookup.lookUpKey,
    lookUpValue: lookup.lookUpValue,
    value: lookup.lookUpValue,
    lookUpOrder: lookup.lookUpOrder,
  }));
}

export async function getLookup(
  lookups: LookUpData[],
  data: string[] | number[],
  type: LookupQueryType
) {
  try {
    const result: Record<string, LookUpData> = {};

    for (const item of data) {
      let foundLookup: LookUpData | undefined;

      switch (type) {
        case "LOOK_UP_KEY":
          foundLookup = lookups.find((lookup) => lookup.lookUpKey === item);
          if (!foundLookup) {
            throw new NotFoundException(
              errorMessages.lookupKeyNotFound(item as string)
            );
          }
          break;

        case "LOOK_UP_ID":
          foundLookup = lookups.find((lookup) => lookup.id === item);
          if (!foundLookup) {
            throw new NotFoundException(
              errorMessages.lookupWithIdNotFound(item as number)
            );
          }
          break;

        default:
          throw new Error(`Invalid lookup type: ${type}`);
      }
      result[`lookup_${item}`] = foundLookup;
    }

    return result;
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    throw error;
  }
}
