export default function getPercentageData(
  getData: any,
  setPercentage: React.Dispatch<
    React.SetStateAction<{ filledValues: number; totalFields: number }>
  >
) {
  const DEFAULT_GST = {
    stateId: undefined,
    gstNumber: undefined,
    gstCategoryLid: undefined,
  };
  const DEFAULT_ADDRESS = {
    addressTypeLid: undefined,
    address1: undefined,
    address2: undefined,
    area: undefined,
    countryId: undefined,
    stateId: undefined,
    cityId: undefined,
    pinCode: undefined,
    email: undefined,
    phoneNumber: undefined,
    alternatePhoneNumber: undefined,
    supportNumber: undefined,
  };

  const formattedData = {
    company: {
      companyName: getData?.companyName,
      displayName: getData?.displayName,
      companyTypeLid: getData?.companyType?.id,
      industrySegmentLid: getData?.industrySegment?.id,
      priorityLid: getData?.priority?.id,
      groupCompanyLid: getData?.groupCompany?.id,
      noOfEmployees: getData?.noOfEmployees,
      website: getData?.website,
      sourceTypeLid: getData?.sourceType?.id,
      source: getData?.source,
      sentimentLid: getData?.sentiment?.id,
      leadCrm: getData?.leadCrmInfo?.id,
      accountManager: getData?.accountManagerInfo?.id,
      countryId: getData?.country?.id,
    },

    groupCompanyMap: {
      groupCompanyId: getData?.groupCompany?.id,
    },

    regulatory: {
      registrationNo: getData?.registrationNo,
      panCardNumber: getData?.panCardNumber,
      tanNumber: getData?.tanNumber,
      annualPremium: getData?.annualPremium,
      dateOfIncorporation: getData?.dateOfIncorporation,
      currencyId: getData?.currency?.id,
    },

    gstDetails:
      (getData?.stateGstDetails?.length || 0) > 0
        ? getData?.stateGstDetails?.map((item: any) => ({
            stateId: item?.stateId,
            gstNumber: item?.gstNumber,
            gstCategoryLid: item?.gstCategoryLid,
          }))
        : [DEFAULT_GST],

    addresses:
      (getData?.companyAddresses?.length || 0) > 0
        ? getData?.companyAddresses?.map((item: any) => {
            const address = item?.address || {};
            return {
              addressTypeLid: parseInt(address?.addressTypeLid ?? "0", 10),
              address1: address?.address1,
              address2: address?.address2,
              area: address?.area,
              countryId: address?.countryId?.id,
              pinCode: address?.pinCode,
              phoneNumber: address?.phoneNumber,
              email: address?.email,
              supportNumber: address?.supportNumber,
              stateId: address?.stateId?.id,
              cityId: address?.cityId?.id,
              alternatePhoneNumber: address?.alternatePhoneNumber,
            };
          })
        : [DEFAULT_ADDRESS],

    profileDetails: {
      companyHistory: getData?.details?.companyHistory,
      majorProducts: getData?.details?.majorProducts,
      keyCustomers: getData?.details?.keyCustomers,
      businessProcesses: getData?.details?.businessProcesses,
      remarks: getData?.remarks,
    },

    salesStrategy: {
      industryIntelligence: getData?.details?.industryIntelligence,
      potentialOpportunity: getData?.details?.potentialOpportunity,
      weakness: getData?.details?.weakness,
      actionPlan: getData?.details?.actionPlan,
      targetingReason: getData?.details?.targetingReason,
      competitor: getData?.details?.competitor,
      accountStrategy: getData?.details?.accountStrategy,
      salesPitch: getData?.details?.salesPitch,
    },

    companyDetails: {
      servicePlan: getData?.details?.servicePlan,
      acquisitionHistory: getData?.details?.acquisitionHistory,
      bizProfile: getData?.details?.bizProfile,
      servicePerformance: getData?.details?.servicePerformance,
    },
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

  return { filledValues, totalFields };
}
