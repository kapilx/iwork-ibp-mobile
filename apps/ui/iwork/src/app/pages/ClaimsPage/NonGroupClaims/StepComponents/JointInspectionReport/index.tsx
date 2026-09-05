import {
  endPoints,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  useApiQuery,
} from "@ui/ui-lib";
import {
  Step,
  StepItem,
} from "apps/ui/iwork/src/app/components/NestedStepper/config";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { StateEnum } from "../../../../../components/NestedStepper/RenderComponent";
import StepLoader from "../StepLoader";
import { useResolvedConfig } from "../hooks/useResolvedConfig";
import { processDocumentsSimple } from "../utils/documentProcessor";

// Public payload shape exposed to parent
export interface JointInspectionReportPayload {
  body: any;
  // add more typed fields as needed
}

// Methods parent can call via ref
export interface JointInspectionReportHandle {
  getPayload: () => JointInspectionReportPayload;
  getFormValues: () => unknown;
  validate?: () => Promise<boolean> | boolean;
  submitAll: () => any;
}

export interface CommonStepItemProps {
  config?: any;
  selectedStep?: Step;
  selectedItem?: StepItem;
  setIsPutCall: React.Dispatch<React.SetStateAction<boolean>>;
}

const JointInspectionReport = forwardRef<
  JointInspectionReportHandle,
  CommonStepItemProps
>(({ config, selectedItem, selectedStep, setIsPutCall }, ref) => {
  const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

  // Convert checkbox boolean values to 1/0 for backend compatibility
  const convertBoolToInt = (value: boolean | undefined): number | undefined =>
    typeof value === "boolean" || value === null ? (value ? 1 : 0) : 0;

  // Convert numeric values back to boolean for frontend compatibility
  const convertIntToBool = (value: number | undefined): boolean | undefined =>
    typeof value === "number" ? value === 1 : false;

  const payload = (): JointInspectionReportPayload => {
    const values = innerRef.current?.getValues?.() || {};
    const report = values.claimJointInspectionReport || {};

    // Use utility to process documents
    const documents = processDocumentsSimple(
      values,
      "claimJointInspectionReport"
    );

    return {
      body: {
        claimJointInspectionReport: {
          inspectionDate: report.inspectionDate,
          inspectedBy: report.inspectedBy,
          client: convertBoolToInt(report.client),
          insurer: convertBoolToInt(report.insurer),
          adjuster: convertBoolToInt(report.adjuster),
          surveyor: convertBoolToInt(report.surveyor),
          inspectionFindings: report.inspectionFindings,
          documents,
        },
      },
    };
  };

  // Expose imperative API to parent
  useImperativeHandle(
    ref,
    () => ({
      getPayload: () => payload(),
      getFormValues: () => innerRef.current?.getValues?.(),
      validate: () => {
        return false;
      },
      submitAll: () => {
        return innerRef.current?.submitAll?.();
      },
    }),
    []
  );

  const { data, isLoading } = useApiQuery({
    url: endPoints.getNonGroupClaimActivityById(
      selectedItem?.claimActivityId || ""
    ),
    queryKey: ["getClaimDataByActivity", selectedItem?.claimActivityId],
    enabled: Boolean(selectedItem?.claimActivityId),
  });

  const sliceData = (title: string, data: string) => {
    if (!data) return title;
    const maxLength = 30;
    if (data.length <= maxLength) return `${title} (${data})`;
    return `${title} (${data.substring(0, maxLength)}...)`;
  };

  // Transform config with dynamic labels based on API data
  const configTransformer = useCallback((config: any, data: any) => {
    if (!config || !data?.data?.data?.[0]?.data?.claimJointInspectionReport) {
      return config;
    }

    const reportData = data.data.data[0].data.claimJointInspectionReport;

    return config.map((section: any) => ({
      ...section,
      config:
        section.config?.map((field: any) => {
          let updatedField = { ...field };

          // Update labels with respective names from API
          if (field.key === "client" && reportData.clientName) {
            updatedField.label = sliceData("Client", reportData.clientName);
          }
          if (field.key === "insurer" && reportData.insurerName) {
            updatedField.label = sliceData("Insurer", reportData.insurerName);
          }
          if (field.key === "adjuster" && reportData.adjusterName) {
            updatedField.label = sliceData("Adjuster", reportData.adjusterName);
          }
          if (field.key === "surveyor" && reportData.surveyorName) {
            updatedField.label = sliceData("Surveyor", reportData.surveyorName);
          }

          return updatedField;
        }) || section.config,
    }));
  }, []);

  const resolvedConfig = useResolvedConfig({
    config,
    data,
    documentPath: "claimJointInspectionReport",
    configTransformer,
  });

  useEffect(() => {
    if (data && innerRef.current) {
      const activityData = data?.data?.data?.[0];
      if (Boolean(activityData?.statusKey) && activityData?.data) {
        // Transform numeric checkbox values to boolean for frontend
        const transformedData = {
          ...activityData.data,
          claimJointInspectionReport: {
            ...activityData.data.claimJointInspectionReport,
            client: convertIntToBool(
              activityData.data.claimJointInspectionReport?.client
            ),
            insurer: convertIntToBool(
              activityData.data.claimJointInspectionReport?.insurer
            ),
            adjuster: convertIntToBool(
              activityData.data.claimJointInspectionReport?.adjuster
            ),
            surveyor: convertIntToBool(
              activityData.data.claimJointInspectionReport?.surveyor
            ),
          },
        };

        innerRef.current.resetForms(transformedData);
      }
      setIsPutCall(Boolean(activityData?.statusKey));
    }
  }, [data, setIsPutCall]);

  if (isLoading) {
    return <StepLoader />;
  }

  if (!config) return null;

  return (
    <NestedDynamicForm
      config={resolvedConfig}
      ref={innerRef}
      disableAllFormFields={selectedItem?.stepState !== StateEnum.ACTIVE}
      onValuesChange={() => {}}
    />
  );
});

JointInspectionReport.displayName = "JointInspectionReport";

export default JointInspectionReport;
