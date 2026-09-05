import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import MultiEnrollmentSummary from "../../components/MultiEnrollment/MultiEnrollmentSummary";

import { setToastMessage } from "../../redux/slice";
import {
  reconstructPolicyConfigurationFromSavedChoices,
  transformFamilyMembersToArray,
} from "../MultiEnrollment/utils";
import { transformDependentsToMap } from "../MultiEnrollment";
import { policyTypeKeys } from "../../components/WelllnessBenefitSection/constants";

const UnifiedSummary: React.FC = () => {
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const navigate = useNavigate();
  const { state } = useLocation();
  const fromViewEnrollment = (state as { openSummary?: boolean } | null)?.openSummary === true;
  const dispatch = useDispatch();

  const [overAllData, setOverAllData] = useState<any>();
  const [policyConfigurationData, setPolicyConfigurationData] = useState<any[]>(
    []
  );
  const [familyMemberDetails, setFamilyMemberDetails] = useState<
    Record<string, any[]>
  >({});

  // Get data from Redux store instead of API call
  const relationConstraints = useSelector(
    (state: any) => state.policyData.relationDependentData
  );
  const isLoading = useSelector((state: any) => state.policyData.loading);

  // validation
  useEffect(() => {
    if (!employeeId) {
      dispatch(
        setToastMessage("Required identifiers missing. Please try again later.")
      );
      navigate("/my-insurance");
    }
  }, [dispatch, employeeId, navigate]);

  // transform api response
  useEffect(() => {
    if (!relationConstraints || !Array.isArray(relationConstraints)) return;

    // Set the overall data as the entire array (similar to MultiEnrollment)
    setOverAllData(relationConstraints);

    // Find the Group Mediclaim Policy (the only one with dependents)
    const groupMediclaimPolicyData = relationConstraints.find(
      (policy) => policy.policyTypeKey?.includes("POLICY_TYPE_GMC")
    );

    if (groupMediclaimPolicyData?.configuration?.dependents) {
      const relationDetails = transformDependentsToMap(
        groupMediclaimPolicyData.configuration.dependents || []
      );
      setFamilyMemberDetails(relationDetails);
    }

    // Reconstruct policy configuration from all policies
    const reconstructedChoices =
      reconstructPolicyConfigurationFromSavedChoices(relationConstraints);
    setPolicyConfigurationData(reconstructedChoices);
  }, [relationConstraints]);

  const transformedDependents = useMemo(
    () => transformFamilyMembersToArray(familyMemberDetails),
    [familyMemberDetails]
  );

  const summarySource = useMemo(() => {
    if (!overAllData) return null;
    return {
      ...overAllData,
      dependents: transformedDependents,
    };
  }, [overAllData, transformedDependents]);

  const handleBack = () => fromViewEnrollment ? navigate("/dashboard") : navigate(-1);

  return (
    <MultiEnrollmentSummary
      policyConfigurationData={policyConfigurationData}
      summaryData={summarySource}
      handleSave={() => {}} // no action in view-only mode
      onBack={handleBack}
      onContinue={() => {}} // disabled in this view
      onCancel={handleBack}
      loading={false}
      isLoading={isLoading}
      isViewOnly={true}
      isViewOnlyFromEnrolled={false}
    />
  );
};

export default UnifiedSummary;
