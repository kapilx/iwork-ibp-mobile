// Legacy single-form Claims Intimation flow kept for payload comparison and reference.
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import SupportFormSection from "../../common/SupportFormSection";
import { endPoints } from "@ui/ui-lib";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { policyTypeKeys } from "../../components/WelllnessBenefitSection/constants";
import {
  ClaimsIntimationWrapper,
  ClaimsIntimationContainer,
  ClaimsIntimationFormContainer,
} from "./styles";
import {
  CLAIMS_INTIMATION_FORM_CONFIG,
  initialClaimsIntimationData,
} from "./formConfig";
import ClaimsIntimationIcon from "../../../assets/svgs/claims-intimation-image.svg";

interface ClaimsIntimationProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

type ClaimsIntimationFormValues = {
  dependentId?: string | number | null;
  documents?: any[];
  fileUpload?: any;
  documentName?: string;
  documentType?: string | number | null;
  patientName?: string;
  claimAmount?: number;
  dateOfAdmission?: string;
  hospitalName?: string;
  hospitalLocation?: string;
};

const ClaimsIntimationLegacy: React.FC<ClaimsIntimationProps> = ({
  onClose,
  onSuccess,
}) => {
  const [claimsFormMethods, setClaimsFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const relationConstraints = useSelector(
    (state: any) => state.policyData.relationDependentData,
  );
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [policyIds, setPolicyIds] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | number | null>(null);
  const { mutate: uploadClaims } = useApiMutation({});

  useEffect(() => {
    if (!Array.isArray(relationConstraints)) return;
    const policyData = relationConstraints.map((policy: any) => ({
      policyId: policy?.policyId,
      policyName: policy?.policyName,
      policyTypeKey: policy?.policyTypeKey,
    }));
    const allDependents = relationConstraints.flatMap(
      (policy: any) => policy?.configuration?.dependents || [],
    );
    const seen = new Set();
    const uniqueDependents = allDependents.filter((dep: any) => {
      const key = `${dep.name}|${dep.gender}|${dep.dob}|${dep.relation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setPolicyIds(policyData);
    setDependents(uniqueDependents);
  }, [relationConstraints]);

  useEffect(() => {
    if (!claimsFormMethods) return;

    const subscription = claimsFormMethods.watch((values, { name }) => {
      if (name !== "policyId") return;
      const nextPolicyId = values?.policyId ?? null;
      setSelectedPolicyId(nextPolicyId);

      if (nextPolicyId && Array.isArray(relationConstraints)) {
        const selectedPolicy = relationConstraints.find(
          (policy: any) => String(policy?.policyId) === String(nextPolicyId),
        );
        const policyDependents = selectedPolicy?.configuration?.dependents || [];
        const seen = new Set();
        const uniqueDependents = policyDependents.filter((dep: any) => {
          const key = `${dep.name}|${dep.gender}|${dep.dob}|${dep.relation}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setDependents(uniqueDependents);
      } else {
        setDependents([]);
      }

      const policy = policyIds.find(
        (item) => String(item?.policyId) === String(nextPolicyId),
      );
      const isGmc = policy?.policyTypeKey?.includes("POLICY_TYPE_GMC");

      if (!isGmc) {
        claimsFormMethods.setValue("hospitalName", "");
        claimsFormMethods.setValue("hospitalLocation", "");
        claimsFormMethods.setValue("dateOfAdmission", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [claimsFormMethods, policyIds, relationConstraints]);

  useEffect(() => {
    if (!claimsFormMethods || policyIds.length === 0) return;

    const currentPolicyId = claimsFormMethods.getValues("policyId");
    if (currentPolicyId) {
      setSelectedPolicyId(currentPolicyId);
      return;
    }

    const defaultPolicyId =
      policyIds.find((policy: any) => policy?.policyTypeKey?.includes("POLICY_TYPE_GMC"))
        ?.policyId ?? policyIds[0]?.policyId ?? null;

    if (!defaultPolicyId) return;

    claimsFormMethods.setValue("policyId", defaultPolicyId, {
      shouldValidate: true,
      shouldDirty: false,
      shouldTouch: false,
    });
    setSelectedPolicyId(defaultPolicyId);
  }, [claimsFormMethods, policyIds]);

  const showMedicalFields = React.useMemo(() => {
    if (!selectedPolicyId) return false;
    const policy = policyIds.find(
      (item) => String(item?.policyId) === String(selectedPolicyId),
    );
    return policy?.policyTypeKey?.includes("POLICY_TYPE_GMC");
  }, [policyIds, selectedPolicyId]);

  const handleCancel = () => {
    claimsFormMethods?.reset(initialClaimsIntimationData(userDetails.id, policyIds));
    setSelectedPolicyId(
      policyIds.find((policy: any) => policy?.policyTypeKey?.includes("POLICY_TYPE_GMC"))
        ?.policyId ?? policyIds[0]?.policyId ?? null,
    );
    onClose?.();
  };

  const handleSubmit = () => {
    if (!claimsFormMethods) return;

    claimsFormMethods.handleSubmit((data: ClaimsIntimationFormValues) => {
      const rawDependentId = data?.dependentId;
      let normalizedDependentId: number | null = null;

      if (rawDependentId !== undefined && rawDependentId !== null) {
        const value = String(rawDependentId).toLowerCase();
        normalizedDependentId = value === "self" ? null : Number(value);
      }

      const normalizedData: ClaimsIntimationFormValues = {
        ...data,
        dependentId: normalizedDependentId,
      };
      const { ...rest } = normalizedData;

      // Backend handles ISBS BrokerClaimCreation internally before saving to DB
      uploadClaims(
        {
          endpoint: endPoints.uploadClaims,
          method: "POST",
          data: {
            ...rest,
            documentIds: normalizedData?.documents?.map((doc) => doc.documentId),
          },
        },
        {
          onSuccess: () => {
            onSuccess?.();
            onClose?.();
          },
        },
      );
    })();
  };

  return (
    <ClaimsIntimationWrapper>
      <ClaimsIntimationContainer>
        <SupportFormSection
          image={ClaimsIntimationIcon}
          headerText="Claims Submission"
          formConfig={CLAIMS_INTIMATION_FORM_CONFIG(
            dependents,
            policyIds,
            showMedicalFields,
            userDetails.companyId,
            selectedPolicyId,
          )}
          defaultValues={initialClaimsIntimationData(userDetails.id, policyIds)}
          setFormMethods={setClaimsFormMethods}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          containerComponent={ClaimsIntimationFormContainer}
        />
      </ClaimsIntimationContainer>
    </ClaimsIntimationWrapper>
  );
};

export default ClaimsIntimationLegacy;
