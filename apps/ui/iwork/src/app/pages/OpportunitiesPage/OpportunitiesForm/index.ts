export default function getPercentageData(
  getData: any,
  setPercentage: React.Dispatch<
    React.SetStateAction<{ filledValues: number; totalFields: number }>
  >
) {
  // Define default objects with ALL expected keys
  const DEFAULT_CLAIM = {
    policyFrom: undefined,
    policyTo: undefined,
    natureOfLoss: undefined,
    premium: undefined,
    claimAmount: undefined,
    claimPercentage: undefined,
    remarks: undefined,
  };

  const DEFAULT_RISK = { addressId: undefined };
  const DEFAULT_PLACEMENT = {
    challengesAndMitigation: undefined,
    existingCompetition: undefined,
    remarks: undefined,
  };

  const formattedData = {
    opportunity: {
      companyId: getData?.company?.id,
      estimatedBrokerage: getData?.estimatedBrokerage,
      policyTypeLid: getData?.policyType?.id,
      policyStatusLid: getData?.policyStatus?.id,
      serviceLevelLid: getData?.serviceLevel?.id,
      expiryDate: getData?.expiryDate,
      sumInsured: getData?.sumInsured,
      premiumPaid: getData?.premiumPaid,
      estimatedFee: getData?.estimatedFee,
      opportunityTypeLid: getData?.opportunityType?.id,
      isPolicyMinedLid: getData?.isPolicyMined?.id,
      opportunitySourceTypeLid: getData?.opportunitySource?.id,
      source: getData?.source,
    },
    claimExperiences:
      (getData?.claimExperiences?.length || 0) > 0
        ? getData?.claimExperiences?.map((claim: any) => ({
            ...DEFAULT_CLAIM,
            policyFrom: claim?.policyFrom,
            policyTo: claim?.policyTo,
            natureOfLoss: claim?.natureOfLoss,
            premium: claim?.premium,
            claimAmount: claim?.claimAmount,
            claimPercentage: claim?.claimPercentage,
            remarks: claim?.remarks,
          }))
        : [DEFAULT_CLAIM],
    riskLocations:
      (getData?.riskLocations?.length || 0) > 0
        ? getData?.riskLocations?.map((location: any) => ({
            ...DEFAULT_RISK,
            addressId: location?.addressId,
          }))
        : [DEFAULT_RISK],
    previousPlacementDetails:
      (getData?.previousPlacementDetails?.length || 0) > 0
        ? getData?.previousPlacementDetails?.map((placement: any) => ({
            ...DEFAULT_PLACEMENT,
            challengesAndMitigation: placement?.challengesAndMitigation,
            existingCompetition: placement?.existingCompetition,
            remarks: placement?.remarks,
          }))
        : [DEFAULT_PLACEMENT],
  };

  setPercentage(countFilledFields(formattedData));
}

function countFilledFields(obj: any): {
  filledValues: number;
  totalFields: number;
} {
  let filledValues = 0;
  let totalFields = 0;

  function traverse(value: any) {
    if (Array.isArray(value)) {
      value.forEach((item) => traverse(item));
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach((val) => traverse(val));
    } else {
      // Count every primitive value as a field
      totalFields += 1;
      // Check if the value is filled
      if (value !== null && value !== undefined && value !== "") {
        filledValues += 1;
      }
    }
  }

  traverse(obj);

  // Check if the object is empty
  return { filledValues, totalFields };
}
