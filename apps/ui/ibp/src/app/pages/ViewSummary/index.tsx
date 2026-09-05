import { endPoints, useApiQuery } from "@ui/ui-lib";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import EnrollmentSummary from "../../components/EnrollmentSummary";

import { setToastMessage } from "../../redux/slice";
import {
  reconstructPolicyConfigurationFromSavedChoices,
  transformFamilyMembersToArray,
} from "../Enrollment/utils";
import { transformDependentsToMap } from "../Enrollment";

const ViewSummary: React.FC = () => {
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const policyId = location.state?.policyInfo?.policyId;
  const isViewOnlyFromEnrolled = location.state?.isViewOnlyFromEnrolled || false;

  const [overAllData, setOverAllData] = useState<any>();
  const [policyConfigurationData, setPolicyConfigurationData] = useState<any[]>(
    []
  );
  const [familyMemberDetails, setFamilyMemberDetails] = useState<
    Record<string, any[]>
  >({});

  const { data: relationConstraints, isLoading } = useApiQuery({
    queryKey: ["relationConstraintsViewSummary", employeeId, policyId],
    url: endPoints.relationConstraints(policyId, employeeId),
    enabled: Boolean(employeeId && policyId),
  });

  // validation
  useEffect(() => {
    if (!employeeId || !policyId) {
      dispatch(
        setToastMessage("Required identifiers missing. Please try again later.")
      );
      navigate("/my-insurance");
    }
  }, [dispatch, employeeId, navigate, policyId]);

  // transform api response
  useEffect(() => {
    if (!relationConstraints?.data) return;
    const data = relationConstraints.data;
    setOverAllData(data);

    if (data?.dependents?.length) {
      setFamilyMemberDetails(transformDependentsToMap(data.dependents));
    }

    const reconstructedChoices =
      reconstructPolicyConfigurationFromSavedChoices(data);
    setPolicyConfigurationData(reconstructedChoices);
  }, [relationConstraints?.data]);

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

  const handleBack = () => navigate(-1);

  return (
    <EnrollmentSummary
      policyConfigurationData={policyConfigurationData}
      summaryData={summarySource}
      handleSave={() => {}} // no action
      onBack={handleBack}
      onContinue={() => {}} // disabled in this view
      onCancel={handleBack}
      loading={false}
      isLoading={isLoading}
      isViewOnly={true}
      isViewOnlyFromEnrolled={isViewOnlyFromEnrolled}
    />
  );
};

export default ViewSummary;
