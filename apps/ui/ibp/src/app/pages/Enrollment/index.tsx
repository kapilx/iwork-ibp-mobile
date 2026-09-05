import {
  CustomModal,
  endPoints,
  fetchEmployeePolicies,
  formatAmountWithCurrency,
  useApiQuery,
  useLocalization,
} from "@ui/ui-lib";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Bottomfooter from "../../common/BottomFooter";
import ConfirmationPage from "../../components/Enrollment/ConfirmationPage";
import EnrollmentFlow from "../../components/Enrollment/EnrollmentFlow";
import EnrollmentSummary from "../../components/EnrollmentSummary";
import {
  ALERT_MESSAGES,
  CANCEL,
  CONTINUE,
  SAVE_EXIT,
  SAVE_EXIT_MODAL_MESSAGE,
  SPOUSE_PARTNERS,
  SPOUSE_PARTNERS_PAYLOAD,
} from "../../constants";
import { setToastMessage } from "../../redux/slice";
import { isEqual } from "../../utils/deepCompare";
import { StyledEnrollContainer } from "./styles";
import {
  reconstructPolicyConfigurationFromSavedChoices,
  transformFamilyMembersToArray,
} from "./utils";

enum EnrollmentStep {
  Configuration,
  Summary,
  success,
}

interface FamilyMemberDetailsMap {
  [key: string]: any[];
}

export const transformDependentsToMap = (dependents: any[] = []) => {
  return dependents.reduce<FamilyMemberDetailsMap>((acc, dependent) => {
    if (!dependent) return acc;
    const relationType = dependent.relationshipType || dependent.relation;
    if (!relationType) return acc;

    const relation =
      relationType === SPOUSE_PARTNERS_PAYLOAD ? SPOUSE_PARTNERS : relationType;
    if (!relation) return acc;

    const formatted = {
      id: dependent.id, // Keep the backend provided id
      tempKey: dependent.tempKey, // Preserve tempKey if it exists
      name: dependent.name,
      relationship: dependent.relation || dependent.relationship,
      dateOfBirth: dependent.dateOfBirth,
      gender: dependent.gender || "",
      relationshipType: relationType,
      parentpolicyComponentActionTypeId:
        dependent.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionTypeId:
        dependent.policyComponentActionTypeId ?? null,
      policyComponentActionLabel: dependent.policyComponentActionLabel ?? null,
      policyComponentActionType: dependent.policyComponentActionType ?? null,
      choices: Array.isArray(dependent.choices) ? dependent.choices : [],
    };

    if (acc[relation]) {
      acc[relation] = [...acc[relation], formatted];
    } else {
      acc[relation] = [formatted];
    }

    return acc;
  }, {});
};

// Function to merge current family member details with backend response
// This updates tempKey dependents with their new IDs from backend
const mergeDependentsWithBackendResponse = (
  currentFamilyDetails: FamilyMemberDetailsMap,
  backendDependents: any[]
): FamilyMemberDetailsMap => {
  const currentArray = transformFamilyMembersToArray(currentFamilyDetails);
  const mergedArray = currentArray.map((currentDependent) => {
    // If it's a new dependent (has tempKey), try to find it in backend response
    if (currentDependent.tempKey) {
      // Find matching dependent in backend response by name and relationship
      const backendMatch = backendDependents.find(
        (backendDep) =>
          backendDep.name === currentDependent.name &&
          backendDep.relation === currentDependent.relation &&
          backendDep.relationshipType === currentDependent.relationshipType
      );

      if (backendMatch && backendMatch.id) {
        // Remove tempKey and add the backend id
        const { tempKey, ...dependentWithoutTempKey } = currentDependent;
        return {
          ...dependentWithoutTempKey,
          id: backendMatch.id,
        };
      }
    }
    return currentDependent;
  });

  return transformDependentsToMap(mergedArray);
};

const calculateFooterStats = (
  policyConfigurationData: any[],
  dependents: any[]
) => {
  const plansSelected = policyConfigurationData.filter(Boolean).length;
  const membersCover = dependents.length;
  const totalMembers = membersCover + 1; // Include employee

  return policyConfigurationData.reduce(
    (acc, policy) => {
      if (!policy) return acc;

      const baseCompany = Number(
        policy.companyContribution ?? policy.companyPay ?? 0
      );
      const baseEmployee = Number(
        policy.employeeContribution ?? policy.employeePay ?? 0
      );

      // If premiumPerLife is true, multiply by total member count
      const premiumMultiplier = policy.premiumPerLife ? totalMembers : 1;

      const company = baseCompany * premiumMultiplier;
      const employee = baseEmployee * premiumMultiplier;
      const total = company + employee;

      return {
        plansSelected,
        membersCover,
        totalPremium: acc.totalPremium + total,
        companyPays: acc.companyPays + company,
        yourPay: acc.yourPay + employee,
      };
    },
    {
      plansSelected,
      membersCover,
      totalPremium: 0,
      companyPays: 0,
      yourPay: 0,
    }
  );
};

function Enrollment() {
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const companyId = userDetails?.employeeCompanyId;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { localizationData } = useLocalization();
  const policyId = location.state?.policyInfo?.policyId;
  const [step, setStep] = useState<EnrollmentStep>(
    EnrollmentStep.Configuration
  );
  const [policyConfigurationData, setPolicyConfigurationData] = useState<any[]>(
    []
  );
  const [initialPolicyConfigurationData, setInitialPolicyConfigurationData] =
    useState<any[]>([]);
  const [familyMemberDetails, setFamilyMemberDetails] =
    useState<FamilyMemberDetailsMap>({});
  const [profileOnlyDependents, setProfileOnlyDependents] = useState<any[]>([]);
  const [deletedProfileOnlyIds, setDeletedProfileOnlyIds] = useState<Set<number>>(new Set());

  const handleProfileSuggestedDepDeleted = useCallback((dep: any) => {
    if (dep?.id) {
      setDeletedProfileOnlyIds((prev) => new Set([...prev, Number(dep.id)]));
    }
  }, []);

  // Filter out deleted deps so FMM instances never re-inject them.
  const activeProfileSuggestedDependents = useMemo(
    () => profileOnlyDependents.filter((d: any) => !deletedProfileOnlyIds.has(Number(d?.id))),
    [profileOnlyDependents, deletedProfileOnlyIds]
  );
  const [overAllData, setOverAllData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [isPolicyComponentsLoading, setIsPolicyComponentsLoading] =
    useState(false);
  const [isDependentsModified, setIsDependentsModified] = useState(false);
  const [shouldResetSelections, setShouldResetSelections] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(false);
  const lastRelationshipGroupPayloadRef = useRef<string | null>(null);
  const lastReconstructedChoicesRef = useRef<any[] | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [showSaveExitModal, setShowSaveExitModal] = useState(false);

  useEffect(() => {
    setIsReadOnly(location.state?.policyInfo?.isEditable ?? false);
  }, [location.state?.policyInfo?.isEditable]);

  const {
    data: relationConstraints,
    isLoading,
    refetch,
  } = useApiQuery({
    queryKey: ["relationConstraints", employeeId, policyId],
    url: endPoints.relationConstraints(policyId, employeeId),
    enabled: Boolean(employeeId && policyId),
  });

  const [initialFamilyMemberDetails, setInitialFamilyMemberDetails] =
    useState<FamilyMemberDetailsMap>({});

  useEffect(() => {
    if (!employeeId || !policyId) {
      dispatch(
        setToastMessage(
          "Required identifiers missing. Please try enrolling again later."
        )
      );
      navigate("/");
    }
  }, [dispatch, employeeId, navigate, policyId]);

  useEffect(() => {
    if (!relationConstraints?.data) return;

    setOverAllData(relationConstraints.data);

    if (relationConstraints.data?.dependents) {
      const allDependents: any[] = relationConstraints.data.dependents;
      const enrolledDependents = allDependents.filter(
        (dep: any) => Array.isArray(dep?.choices) && dep.choices.length > 0
      );
      const profileOnly = allDependents.filter(
        (dep: any) => !Array.isArray(dep?.choices) || dep.choices.length === 0
      );
      const relationDetails = transformDependentsToMap(enrolledDependents);
      setFamilyMemberDetails(relationDetails);
      setInitialFamilyMemberDetails(relationDetails);
      setProfileOnlyDependents(profileOnly);
    }
  }, [relationConstraints?.data]);

  // Fetch enrollment progress to store enrollmentBatchKey
  const { data: enrollmentProgressData } = useApiQuery({
    queryKey: ["enrollmentProgressForBatchKey", employeeId],
    url: employeeId ? endPoints.enrollmentProgress(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  // Store enrollmentBatchKey when fetched
  useEffect(() => {
    if (!enrollmentProgressData || !employeeId) return;

    const payload = enrollmentProgressData as {
      data?: {
        enrollmentBatchKey?: string;
      };
    };

    if (payload?.data?.enrollmentBatchKey) {
      const key = payload.data.enrollmentBatchKey;
      sessionStorage.setItem(`enrollment_batch_key_${employeeId}`, key);
      console.error('🔥✅ ENROLLMENT PAGE: Stored enrollmentBatchKey on page load:', key);
    } else {
      console.error('⚠️ ENROLLMENT PAGE: No enrollmentBatchKey in API response', {
        hasData: !!payload?.data,
        fullPayload: payload,
      });
    }
  }, [enrollmentProgressData, employeeId]);

  const { mutate: updatePoliciesData } = useApiMutation({
    config: {
      onSuccess: (updatedData: any) => {
        setIsPolicyComponentsLoading(false);
        setOverAllData((prev: any) => ({
          ...prev,
          policyComponentsConfiguration:
            updatedData?.data?.policyComponentsConfiguration || [],
          employeeChosenChoices: updatedData?.data?.enrollmentChoicesMade || [],
        }));
        setShouldResetSelections(true);
        // ✅ Only reset selections when dependents were modified
        if (isDependentsModified) {
          setShouldResetSelections(true);
          setPolicyConfigurationData([]); // Reset selections on dependent change -- need to enroll again
          setIsDependentsModified(false); // reset flag
        }
      },
      onError: (error: any) => {
        dispatch(
          setToastMessage(
            Array.isArray(error?.message)
              ? error.message[0]
              : error?.message || ALERT_MESSAGES.GENERIC_ERROR
          )
        );
        setIsPolicyComponentsLoading(false);
      },
    },
  });

  const { mutate: saveEnrollment } = useApiMutation({
    config: {
      onSuccess: (data: any, variables: any) => {
        const action = variables?.data?.action;
        setLoading(false);

        // Update family member details with IDs from backend response
        if (data?.data?.dependents) {
          const updatedFamilyDetails = mergeDependentsWithBackendResponse(
            familyMemberDetails,
            data.data.dependents
          );
          setFamilyMemberDetails(updatedFamilyDetails);
          // Reset the modified flag after successful save
          setIsDependentsModified(false);

          // Update enrollment progress: addDependents step completed
          // Only update if dependents exist and it's save or submit action
          if (data.data.dependents.length > 0 && (action === 'save' || action === 'submit')) {
            updateEnrollmentStep('addDependents', true);
          }
        }

        if (action === "save") {
          setShowSaveExitModal(true);
        }

        if (action === "submit") {
          // setStep(EnrollmentStep.success);
          // refetch();
          dispatch(setToastMessage("Enrollment submitted successfully"));
        }
      },
      onError: (error: any) => {
        dispatch(
          setToastMessage(
            Array.isArray(error?.message)
              ? error.message[0]
              : error?.message || ALERT_MESSAGES.GENERIC_ERROR
          )
        );
        setLoading(false);
      },
    },
  });

  // Mutation to update enrollment progress
  const { mutate: updateEnrollmentProgress } = useApiMutation({
    config: {
      onSuccess: () => {
        console.error('✅✅✅ ENROLLMENT PROGRESS UPDATE SUCCESS ✅✅✅');
      },
      onError: (error: any) => {
        console.error('❌❌❌ ENROLLMENT PROGRESS UPDATE FAILED ❌❌❌', error);
      },
    },
  });

  // Helper function to update enrollment step (wrapped in useCallback to stabilize reference)
  const updateEnrollmentStep = useCallback((stepName: string, completed: boolean) => {
    const enrollmentBatchKey = sessionStorage.getItem(`enrollment_batch_key_${employeeId}`);
    
    console.error('🔥🔥🔥 updateEnrollmentStep FUNCTION CALLED 🔥🔥🔥', { 
      stepName, 
      completed, 
      employeeId, 
      enrollmentBatchKey,
      hasKey: !!enrollmentBatchKey
    });

    if (!enrollmentBatchKey || !employeeId) {
      console.error('⛔ MISSING enrollmentBatchKey or employeeId - ABORTING', {
        enrollmentBatchKey,
        employeeId,
      });
      return;
    }

    console.error('🔥🔥🔥 CALLING API updateEnrollmentProgress 🔥🔥🔥', {
      endpoint: endPoints.updateEnrollmentProgress(employeeId),
      enrollmentBatchKey,
      stepName,
      completed,
    });

    updateEnrollmentProgress({
      endpoint: endPoints.updateEnrollmentProgress(employeeId),
      method: 'PUT',
      data: {
        enrollmentBatchKey,
        stepName,
        completed,
      },
    });
  }, [employeeId, updateEnrollmentProgress]);

  const handleCloseModal = () => {
    setShowSaveExitModal(false);
  };

  const handleSaveAndExit = () => {
    navigate("/");
  };

  // Track familyMemberDetails changes
  useEffect(() => {
    console.error('🔥📋 FAMILYMEMBERDETAILS STATE CHANGED', { 
      familyMemberDetails,
      keys: Object.keys(familyMemberDetails),
      Spouse: familyMemberDetails?.Spouse?.length,
      Children: familyMemberDetails?.Children?.length,
    });
  }, [familyMemberDetails]);

  const transformedDependents = useMemo(
    () => {
      console.error('🔥🔥🔥 TRANSFORMEDDEPENDENTS USEMEMO RUNNING 🔥🔥🔥', { familyMemberDetails });
      const result = transformFamilyMembersToArray(familyMemberDetails);
      console.error('🔥🔥🔥 TRANSFORMEDDEPENDENTS RESULT 🔥🔥🔥', { result, length: result?.length });
      return result;
    },
    [familyMemberDetails]
  );

  useEffect(() => {
    console.error('🔥🔥🔥 ENROLLMENT USEEFFECT CALLED (BEFORE ANY CHECKS) 🔥🔥🔥', { 
      hasOverAllData: !!overAllData, 
      transformedDependentsLength: transformedDependents?.length 
    });
    
    if (!overAllData) {
      console.warn('⚠️ ENROLLMENT USEEFFECT: overAllData is null/undefined, returning early');
      return;
    }

    console.error('🔥 ENROLLMENT USEEFFECT TRIGGERED', {
      isRelationshipGroup: overAllData.isRelationshipGroup,
      isDependentParameter: overAllData.isDependentParameter,
      transformedDependents,
      dependentsCount: transformedDependents?.length,
    });

    // Dependent Count / Dependent Attribute parameters (mutually exclusive with
    // relationship-group configs) also need the bucket/premium recomputed live
    // as dependents are added or removed, via the same endpoint used for the
    // relationship-group case — filterPolicyOptions already matches on
    // dependent count for these policies.
    if (overAllData.isRelationshipGroup || overAllData.isDependentParameter) {
      console.error('🔥 IS RELATIONSHIP GROUP OR DEPENDENT PARAMETER = TRUE');
      if (!employeeId || !policyId) {
        console.warn('⚠️ Missing employeeId or policyId, returning early', { employeeId, policyId });
        return;
      }
      const dependentsPayload = transformedDependents?.map(
        (dependent: any) => ({
          id: Number(dependent.id),
          name: dependent.name,
          relation: dependent.relation,
          relationshipType: dependent.relationshipType,
          dateOfBirth: dependent.dateOfBirth,
          gender: dependent.gender || "",
        })
      );

      console.error('🔥 DEPENDENTS PAYLOAD PREPARED:', {
        dependentsPayload,
        payloadLength: dependentsPayload?.length,
      });

      const payloadKey = JSON.stringify(dependentsPayload);

      if (lastRelationshipGroupPayloadRef.current !== payloadKey) {
        console.error('🔥 PAYLOAD CHANGED - UPDATING POLICIES AND ENROLLMENT');
        console.error('🔥 Previous payload key:', lastRelationshipGroupPayloadRef.current);
        console.error('🔥 New payload key:', payloadKey);
        lastRelationshipGroupPayloadRef.current = payloadKey;
        setIsPolicyComponentsLoading(true);
        updatePoliciesData({
          endpoint: endPoints.policyConfigurationByDependents,
          method: "POST",
          data: {
            policyId,
            employeeId,
            dependents: dependentsPayload,
            isModified: isDependentsModified,
          },
        });

        // Update enrollment progress: addDependents step completed
        // For isRelationshipGroup = true, step completes when at least one dependent is added
        console.error('🔥 CHECKING DEPENDENTS COUNT:', dependentsPayload.length);
        if (dependentsPayload.length > 0) {
          console.error('🔥🔥🔥 CALLING updateEnrollmentStep for addDependents 🔥🔥🔥');
          updateEnrollmentStep('addDependents', true);
          console.error('🔥🔥🔥 AFTER CALLING updateEnrollmentStep 🔥🔥🔥');
        } else {
          console.warn('⚠️ Not calling updateEnrollmentStep - no dependents in payload');
        }
      } else {
        console.warn('⚠️ PAYLOAD UNCHANGED - SKIPPING UPDATE');
      }

      // return;
    }

    const reconstructedChoices =
      reconstructPolicyConfigurationFromSavedChoices(overAllData);

    const shouldUpdate =
      !lastReconstructedChoicesRef.current ||
      !isEqual(lastReconstructedChoicesRef.current, reconstructedChoices);

    if (shouldUpdate) {
      lastReconstructedChoicesRef.current = reconstructedChoices;
      if (reconstructedChoices.length > 0) {
        setPolicyConfigurationData(reconstructedChoices);
        // Store initial API data only once when first loaded
        if (initialPolicyConfigurationData.length === 0) {
          setInitialPolicyConfigurationData(reconstructedChoices);
        }
      } else {
        setPolicyConfigurationData([]);
      }
    }
  }, [
    employeeId,
    overAllData,
    policyId,
    transformedDependents,
    updatePoliciesData,
    updateEnrollmentStep,
  ]);

  const handleSave = (action: string) => {
    if (!employeeId || !policyId || !companyId) {
      dispatch(
        setToastMessage(
          "Unable to save enrollment without valid employee and policy information."
        )
      );
      return;
    }

    setLoading(true);

    const choices = policyConfigurationData
      .filter((policy) => policy)
      .map((policy) => {
        const rawPremium =
          policy.rawPremium ??
          (policy.rawCompanyContribution ?? 0) +
            (policy.rawEmployeeContribution ?? 0);

        const baseData = {
          sumInsured: Number(policy.rawSumInsured ?? policy.sumInsured ?? 0),
          premium: Number(rawPremium ?? policy.premium ?? 0),
          companyPay: Number(
            policy.rawCompanyContribution ??
              policy.companyPay ??
              policy.companyContribution ??
              0
          ),
          employeePay: Number(
            policy.rawEmployeeContribution ??
              policy.employeePay ??
              policy.employeeContribution ??
              0
          ),
          parentpolicyComponentActionTypeId:
            policy?.parentpolicyComponentActionTypeId,
          policyComponentActionType: policy.policyComponentActionType,
          policyComponentActionTypeId: policy.policyComponentActionTypeId,
          policyComponentActionLabel: policy.policyComponentActionLabel,
        };

        if (policy?.id) {
          return { id: policy?.id, ...baseData };
        }
        return baseData;
      });

    saveEnrollment(
      {
        endpoint: endPoints.policyConfiguration,
        method: "PUT",
        data: {
          employeeId,
          policyId,
          companyId: Number(companyId),
          action,
          dependents: [
            ...transformedDependents,
            ...(profileOnlyDependents || []).filter(
              (dep: any) =>
                dep?.id &&
                !deletedProfileOnlyIds.has(Number(dep.id)) &&
                !transformedDependents.some(
                  (d: any) => Number(d?.id) === Number(dep.id)
                )
            ).map((dep: any) => ({
              id: Number(dep.id),
              name: dep.name,
              relation: dep.relation || dep.relationship,
              relationshipType: dep.relationshipType || dep.relation || dep.relationship,
              dateOfBirth: dep.dateOfBirth,
              gender: dep.gender,
              choices: [],
            })),
          ],
          choices,
        },
      },
      {
        onSuccess: () => {
          if (action === "submit") {
            setStep(EnrollmentStep.success);
            dispatch(fetchEmployeePolicies());
          }
        },
      }
    );
  };

  const footerStats = useMemo(() => {
    const stats = calculateFooterStats(
      policyConfigurationData,
      transformedDependents
    );

    return {
      plansSelected: stats.plansSelected,
      membersCover: stats.membersCover + 1,
      totalPremium: `${formatAmountWithCurrency(stats.totalPremium, localizationData?.data)}`,
      companyPays: `${formatAmountWithCurrency(stats.companyPays, localizationData?.data)}`,
      yourPay: `${formatAmountWithCurrency(stats.yourPay, localizationData?.data)}`,
    };
  }, [policyConfigurationData, transformedDependents, localizationData]);

  const handleFamilyMemberChange = (updated: FamilyMemberDetailsMap) => {
    const prevCount = Object.values(familyMemberDetails).flat().length;
    const newCount = Object.values(updated).flat().length;

    //  Detect newly added dependents (using tempKey)
    const hasNewDependents = Object.values(updated).some((members) =>
      Array.isArray(members) ? members.some((member) => member.tempKey) : false
    );

    // Detect deleted dependents (new count < old count)
    const hasDeletedDependents = newCount < prevCount;

    if (hasNewDependents || hasDeletedDependents) {
      setIsDependentsModified(true);
    }

    setFamilyMemberDetails(updated);
  };

  const summarySource = useMemo(() => {
    if (!overAllData) return null;
    return {
      ...overAllData,
      dependents: transformedDependents,
    };
  }, [overAllData, transformedDependents]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    setStep(EnrollmentStep.Summary);
  };

  const handleSummaryBack = () => {
    setStep(EnrollmentStep.Configuration);
  };

  const resetAllData = () => {
    // Reset family member details to initial
    setFamilyMemberDetails(initialFamilyMemberDetails);
    // Reset policy configuration data to initial API data
    setPolicyConfigurationData([...initialPolicyConfigurationData]);
    // Trigger accordion reset in child component
    setResetTrigger(true);
  };

  return (
    <StyledEnrollContainer>
      {step === EnrollmentStep.Configuration ? (
        <>
          <EnrollmentFlow
            policyData={overAllData}
            policyConfigurationData={policyConfigurationData}
            setPolicyConfigurationData={setPolicyConfigurationData}
            isLoading={isLoading}
            isPolicyComponentsLoading={isPolicyComponentsLoading}
            familyMemberDetails={familyMemberDetails}
            profileSuggestedDependents={activeProfileSuggestedDependents}
            onProfileSuggestedDepDeleted={handleProfileSuggestedDepDeleted}
            onFamilyMemberChange={handleFamilyMemberChange}
            isReadOnly={isReadOnly}
            setShouldResetSelections={setShouldResetSelections}
            shouldResetSelections={shouldResetSelections}
            resetTrigger={resetTrigger}
            setResetTrigger={setResetTrigger}
          />
          {/* <ImageContainer>
            <StyledImage src={groupPolicyImage} alt="group" />
          </ImageContainer> */}
          <Bottomfooter
            stats={footerStats}
            onBack={handleBack}
            onSave={() => handleSave("save")}
            onContinue={handleContinue}
            loading={loading}
            isContinueDisabled={
              isLoading ||
              isPolicyComponentsLoading ||
              policyConfigurationData.filter(
                (policy) =>
                  policy && policy.policyComponentActionType === "base"
              ).length === 0
            }
            overAllData={overAllData}
            isReadOnly={isReadOnly}
            setIsReadOnly={setIsReadOnly}
            resetData={resetAllData}
          />
          {/* Save & Exit Confirmation Modal */}
          <CustomModal
            open={showSaveExitModal}
            handleClose={handleCloseModal}
            heading={SAVE_EXIT}
            buttons={[
              {
                label: CANCEL,
                onClick: handleCloseModal,
                variant: "secondary",
              },
              {
                label: CONTINUE,
                onClick: handleSaveAndExit,
                variant: "primary",
              },
            ]}
          >
            {SAVE_EXIT_MODAL_MESSAGE}
          </CustomModal>
        </>
      ) : step === EnrollmentStep.success ? (
        <ConfirmationPage />
      ) : (
        <EnrollmentSummary
          policyConfigurationData={policyConfigurationData}
          summaryData={summarySource}
          handleSave={(action: string) => handleSave(action)}
          onBack={handleSummaryBack}
          onContinue={() => handleSave("submit")}
          onCancel={handleBack}
          loading={loading}
          isLoading={isLoading || isPolicyComponentsLoading}
        />
      )}
    </StyledEnrollContainer>
  );
}

export default Enrollment;
