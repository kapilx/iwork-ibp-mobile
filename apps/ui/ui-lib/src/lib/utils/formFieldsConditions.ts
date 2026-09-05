type AnyObject = Record<string, any>;

export const formConditions = {
  isMultipleInsurerPolicy: (
    watch: (path: string) => any,
    context: AnyObject
  ) => {
    const actualWatch = watch || ((path: string) => undefined);
    const candidates = [
      actualWatch("policyPlacedTypeLid"),
      actualWatch("feeDetails.policyPlacedTypeLid"),
      actualWatch("policyDetails.policyPlacedTypeLid"),
      actualWatch("premiumReceiptLeadSection.policyPlacedTypeLid"),
      actualWatch("premiumReceiptDetailsSection.policyPlacedTypeLid"),
      actualWatch("policyDataRectifiedSection.policyPlacedTypeLid"),
      actualWatch("deviationSection.policyPlacedTypeLid"),
    ];

    const resolved = candidates.find(
      (value) => value !== null && value !== undefined && value !== ""
    );

    return (
      String(resolved ?? "") ===
      String(context.POLICY_PLACED_TYPE_MULTIPLE_INSURER ?? "")
    );
  },

  isChequePremiumOnly: (watch: (path: string) => any, context: AnyObject) => {
    const actualWatch = watch || ((path: string) => undefined);
    return (
      actualWatch("paymentTypeLid") ===
      context.PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY
    );
  },

  isChequePremiumAndCD: (watch: (path: string) => any, context: AnyObject) => {
    const actualWatch = watch || ((path: string) => undefined);
    return (
      actualWatch("paymentTypeLid") ===
      context.PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD
    );
  },

  isNewCDAccount: (watch: (path: string) => any, context: AnyObject) => {
    const actualWatch = watch || ((path: string) => undefined);
    return actualWatch("cdAccountTypeLid") === context.CD_ACCOUNT_TOGGLE_NEW;
  },

  isExistingCDAccount: (watch: (path: string) => any, context: AnyObject) => {
    const actualWatch = watch || ((path: string) => undefined);
    return (
      actualWatch("cdAccountTypeLid") === context.CD_ACCOUNT_TOGGLE_EXISTING
    );
  },

  isChequePremiumAndCDAccount: (
    watch: (path: string) => any,
    context: AnyObject
  ) => {
    const actualWatch = watch || ((path: string) => undefined);
    const paymentType = actualWatch("paymentTypeLid");
    const cdAccountType = actualWatch("cdAccountTypeLid");
    return (
      paymentType === context.PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD &&
      (cdAccountType === context.CD_ACCOUNT_TOGGLE_NEW ||
        cdAccountType === context.CD_ACCOUNT_TOGGLE_EXISTING)
    );
  },
};
