export const transformKDMMeetingData = (data: any): any => {
  const firstData = data || {};
  console.log(
    "Transforming KDM Meeting Data:",
    firstData?.employeeParticipants?.employees
  );
  return {
    opportunityActivityId: firstData?.activity?.id || null,
    kdmMeetingFormFields: {
      meetingDate: firstData?.meetingDate || null,
      availableFrom: firstData?.startTime || "04:00:00",
      availableTo: firstData?.endTime || "05:00:00",
      meetingTypeLid: firstData?.meetingType?.id || null,
      locationTypeLid: firstData?.locationType?.id || null,
    },
    tpaParticipants: firstData?.tpaParticipants
      ? {
          tpaId: firstData?.tpaParticipants?.tpaId || null,
          tpaContactPerson: firstData?.tpaParticipants?.tpaContactPerson || [],
        }
      : null,
    insurerParticipants: firstData?.insurerParticipants
      ? {
          insurerId: firstData.insurerParticipants.insurerId || null,
          insurerContactPerson:
            firstData.insurerParticipants.insurerContactPerson || [],
        }
      : null,

    participants: {
      companyContactPerson:
        firstData?.companyParticipants?.companyContactPerson || [],
      employees: firstData?.employeeParticipants?.employees || [],
    },
    documents: firstData?.meetingDocs?.length
      ? firstData.meetingDocs
      : [
          {
            documentTypeLid: null,
            documentId: null,
          },
        ],

    statusLid: firstData?.meetingStatus?.id || null,
  };
};

export const transformHandOverMeetData = (data: any): any => {
  const firstData = data || {};

  return {
    opportunityActivityId: firstData?.activity?.id || null,
    handOverMeetFields: {
      handOverMeetingTypeLid: firstData?.meetingType?.id || null,
      selectMeeting: firstData?.meetingStatus?.id || null,
      meetingDate: firstData?.meetingDate || null,
      availableFrom: firstData?.startTime || "04:00:00",
      availableTo: firstData?.endTime || "05:00:00",
      meetingTypeLid: firstData?.meetingType?.id || null,
      locationTypeLid: firstData?.locationType?.id || null,
    },
    tpaParticipants: firstData?.tpaParticipants
      ? {
          tpaId: firstData?.tpaParticipants?.tpaId || null,
          tpaContactPerson: firstData?.tpaParticipants?.tpaContactPerson || [],
        }
      : null,
    insurerParticipants: firstData?.insurerParticipants
      ? {
          insurerId: firstData.insurerParticipants.insurerId || null,
          insurerContactPerson:
            firstData.insurerParticipants.insurerContactPerson || [],
        }
      : null,
    participants: {
      companyContactPerson:
        firstData?.companyParticipants?.companyContactPerson || [],
      employees: firstData?.employeeParticipants?.employees || [],
    },
    remarksMomSection: {
      mom: firstData?.meetingAgenda || "Default MOM",
      remarks: firstData?.meetingSubject || "Default Remarks",
    },

    documents: firstData?.meetingDocs?.length
      ? firstData.meetingDocs
      : [
          {
            documentTypeLid: null,
            documentId: null,
          },
        ],
    statusLid: firstData?.meetingStatus?.id || null,
  };
};

export const transformFinalizedQuoteData = (data: any): any => {
  const quoteData = data?.selectFinalisedQuote ?? {};
  return {
    selectFinalisedQuote: {
      finalizedQuoteId: toNumberOrNull(quoteData?.finalizedQuoteId),
      finalizedVersionId: toNumberOrNull(quoteData?.finalizedVersionId),
      ...(quoteData?.isQuoteEdited !== undefined &&
      quoteData?.isQuoteEdited !== null
        ? { isQuoteEdited: quoteData.isQuoteEdited }
        : {}),
      insurerId: toNumberOrNull(quoteData?.insurerId),
      insurerLocationId: toNumberOrNull(quoteData?.insurerLocationId),
      quoteReceivedOn: quoteData?.quoteReceivedOn ?? null,
      basicPremium: toNumberOrNull(quoteData?.basicPremium),
      // basicPremiumPercentage: toNumberOrNull(quoteData?.basicPremiumPercentage),
      basicBrokeragePercentage: toNumberOrNull(
        quoteData?.basicBrokeragePercentage ?? quoteData?.brokeragePercentage
      ),
      basicBrokerageAmount: toNumberOrNull(
        quoteData?.basicBrokerageAmount ?? quoteData?.brokerageAmount
      ),
      totalBrokerageAmount: toNumberOrNull(
        quoteData?.totalBrokerageAmount ?? quoteData?.brokerageAmount
      ),
      tcBrokerageAmount: toNumberOrNull(quoteData?.tcBrokerageAmount),
      srccAmount: toNumberOrNull(quoteData?.srccAmount),
      srccPercentage: toNumberOrNull(quoteData?.srccPercentage),
      srccBrokerageAmount: toNumberOrNull(quoteData?.srccBrokerageAmount),
      terrorism: toNumberOrNull(quoteData?.terrorism),
      // terrorismCommission: toNumberOrNull(quoteData?.terrorismCommission),
      terrorismBrokeragePercentage: toNumberOrNull(
        quoteData?.terrorismBrokeragePercentage
      ),
      gstAmount: toNumberOrNull(
        quoteData?.gstAmount ?? quoteData?.serviceTaxAmount
      ),
      gstPercentage: toNumberOrNull(
        quoteData?.gstPercentage ?? quoteData?.serviceTaxPercentage
      ),
      // serviceTaxAmount: toNumberOrNull(quoteData?.serviceTaxAmount),
      // serviceTaxPercentage: toNumberOrNull(quoteData?.serviceTaxPercentage),
      // totalGrossPremiumIncTax: toNumberOrNull(
      //   quoteData?.totalGrossPremiumIncTax
      // ),
      grossPremium: toNumberOrNull(quoteData?.grossPremium),
      fee: toNumberOrNull(quoteData?.fee),
      feePercentage: toNumberOrNull(quoteData?.feePercentage),
      other: toNumberOrNull(quoteData?.other),
      otherPercentage: toNumberOrNull(quoteData?.otherPercentage),
      adminCharges: toNumberOrNull(quoteData?.adminCharges),
      adminChargesPercentage: toNumberOrNull(quoteData?.adminChargesPercentage),
      cessAmount: toNumberOrNull(quoteData?.cessAmount),
      cessPercentage: toNumberOrNull(quoteData?.cessPercentage),
      netPremium: toNumberOrNull(quoteData?.netPremium),
      totalPremium: toNumberOrNull(quoteData?.totalPremium),
      totalNetPremium: toNumberOrNull(quoteData?.totalNetPremium),
    },
    quoteTaxDetails:
      data?.quoteTaxDetails?.map((taxDetail: any) => ({
        tax: taxDetail?.tax || null,
        taxValue: taxDetail?.taxValue || null,
      })) || [],
    netPremiumDetails: {
      // netPremium: data?.netPremiumDetails?.netPremium || null,
      // brokeragePercentage: data?.netPremiumDetails?.brokeragePercentage || null,
      insurerRemarks: data?.netPremiumDetails?.insurerRemarks || null,
    },
    // quoteDocuments:
    //   data?.quoteDocuments?.map((doc: any) => ({
    //     documentId: doc?.documentId || null,
    //   })) || [],
    covers: Object.keys(data?.covers || {}).reduce((acc: any, key: string) => {
      acc[key] = data?.covers[key] || null;
      return acc;
    }, {}),
  };
};

export const transformCDDetailsData = (data: any): any => {
  return {
    accountName: data?.cdAccountName || null,
    accountNumber: data?.cdAccountNumber || null,
    openBalance: parseInt(data?.balanceAmount) || 0,
    cdSafeLimit: data?.cdSafeLimit != null ? Number(data.cdSafeLimit) : null,
  };
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const sanitizeNumericString = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      return "";
    }
    return trimmed.replace(/[^0-9.-]/g, "");
  };

  const normalizedValue =
    typeof value === "string" ? sanitizeNumericString(value) : value;

  if (
    typeof normalizedValue === "string" &&
    (normalizedValue === "" ||
      normalizedValue === "." ||
      normalizedValue === "-")
  ) {
    return null;
  }

  const numericValue = Number(normalizedValue);
  return Number.isNaN(numericValue) ? null : numericValue;
};

export const transformPremiumData = (data: any): any => {
  const basicPremium = toNumberOrNull(data?.basicPremium);
  const srccAmount = toNumberOrNull(data?.srccAmount);
  const rawTerrorism =
    data?.terrorism !== undefined && data?.terrorism !== null
      ? data?.terrorism
      : data?.terrorismCommission;
  const terrorismAmount = toNumberOrNull(rawTerrorism);
  const terrorismCommission = toNumberOrNull(
    data?.terrorismCommission !== undefined &&
      data?.terrorismCommission !== null
      ? data?.terrorismCommission
      : rawTerrorism
  );
  const serviceTaxAmount = toNumberOrNull(data?.serviceTaxAmount);
  const gstAmount = toNumberOrNull(data?.gstAmount ?? data?.serviceTaxAmount);
  const derivedTotalNetPremium = [
    basicPremium,
    srccAmount,
    terrorismAmount,
  ].every((value) => value === null)
    ? null
    : (basicPremium || 0) + (srccAmount || 0) + (terrorismAmount || 0);
  const derivedTotalPremium = [
    basicPremium,
    gstAmount ?? serviceTaxAmount,
    terrorismAmount,
  ].every((value) => value === null)
    ? null
    : (basicPremium || 0) +
      (gstAmount ?? serviceTaxAmount ?? 0) +
      (terrorismAmount || 0);

  const totalPremium =
    derivedTotalPremium ?? toNumberOrNull(data?.totalPremium);
  const totalNetPremium =
    derivedTotalNetPremium ?? toNumberOrNull(data?.totalNetPremium);

  const brokerageAmount = toNumberOrNull(
    data?.basicBrokerageAmount ?? data?.brokerageAmount
  );
  let brokeragePercentage = toNumberOrNull(
    data?.basicBrokeragePercentage ?? data?.brokeragePercentage
  );

  const brokerageBase =
    basicPremium ?? totalPremium ?? toNumberOrNull(data?.premium) ?? null;

  if (
    brokeragePercentage === null &&
    brokerageAmount !== null &&
    brokerageBase !== null &&
    brokerageBase !== 0
  ) {
    brokeragePercentage = Number(
      ((brokerageAmount / brokerageBase) * 100).toFixed(2)
    );
  }

  return {
    premium: toNumberOrNull(data?.premium),
    sumInsured: toNumberOrNull(data?.sumInsured),
    basicPremium,
    // basicPremiumPercentage: toNumberOrNull(data?.basicPremiumPercentage),
    basicBrokerageAmount: toNumberOrNull(data?.basicBrokerageAmount),
    basicBrokeragePercentage: toNumberOrNull(data?.basicBrokeragePercentage),
    tcBrokerageAmount: toNumberOrNull(data?.tcBrokerageAmount),
    // brokerageAmount,
    // brokeragePercentage,
    netPremium: toNumberOrNull(data?.netPremium),
    fee: toNumberOrNull(data?.fee),
    feePercentage: toNumberOrNull(data?.feePercentage),
    serviceTaxAmount,
    serviceTaxPercentage: toNumberOrNull(data?.serviceTaxPercentage),
    gstAmount,
    gstPercentage: toNumberOrNull(
      data?.gstPercentage ?? data?.serviceTaxPercentage
    ),
    other: toNumberOrNull(data?.other),
    otherPercentage: toNumberOrNull(data?.otherPercentage),
    totalPremium,
    terrorism: terrorismAmount,
    terrorismCommission,
    terrorismBrokeragePercentage: toNumberOrNull(
      data?.terrorismBrokeragePercentage
    ),
    srccAmount,
    srccPercentage: toNumberOrNull(data?.srccPercentage),
    srccBrokerageAmount: toNumberOrNull(data?.srccBrokerageAmount),
    totalNetPremium,
    totalGrossPremiumIncTax: toNumberOrNull(data?.totalGrossPremiumIncTax),
    adminCharges: toNumberOrNull(data?.adminCharges),
    adminChargesPercentage: toNumberOrNull(data?.adminChargesPercentage),
    cessAmount: toNumberOrNull(data?.cessAmount),
    cessPercentage: toNumberOrNull(data?.cessPercentage),
    grossPremium: toNumberOrNull(data?.grossPremium),
  };
};
