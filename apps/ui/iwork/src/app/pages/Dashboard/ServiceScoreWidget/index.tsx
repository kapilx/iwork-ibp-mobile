import React, { useEffect, useMemo, useState } from "react";
import {
  DynamicForm,
  endPoints,
  useApiQuery,
  FormFieldConfig,
  buildQueryString,
} from "@ui/ui-lib";
import { companyUtilityFunction } from "../../CDManagement/CreateCDAccount/config";
import ServiceScoreScatterChart from "../Charts/ServiceScoreScatterChart";
import {
  StyledServiceScoreContainer,
  StyledServiceScoreFilterRow,
  StyledNoData,
} from "./styles";
import { ChartSkeleton } from "../../../components/DashboardSkeletons";

interface ServiceScoreWidgetProps {
  filters?: Record<string, any>;
  ownerId?: number | string | null;
}

const ServiceScoreWidget: React.FC<ServiceScoreWidgetProps> = ({
  filters,
  ownerId,
}) => {
  const rawOwner = filters?.owner;
  const viewBy =
    (typeof rawOwner === "object" ? rawOwner?.value : rawOwner) || "team";

  const rawFilterOwnerId = filters?.userId;
  const filterOwnerId =
    typeof rawFilterOwnerId === "object"
      ? rawFilterOwnerId?.value
      : rawFilterOwnerId;
  const resolvedOwnerId = filterOwnerId || ownerId;

  const companyFieldConfig: FormFieldConfig[] = useMemo(
    () => [
      {
        key: "companyId",
        name: "companyId",
        label: "Company (filtered by Owner)",
        type: "selectFieldByApi",
        gridColumn: 12,
        apiDependencies: {
          endPoint: endPoints.companiesHierarchy,
          utilityFunction: companyUtilityFunction,
          customParams: {
            viewBy,
            ...(resolvedOwnerId != null && { ownerId: resolvedOwnerId }),
          },
        },
        placeholder: "Search company",
      } as FormFieldConfig,
    ],
    [resolvedOwnerId, viewBy]
  );
  const [companyFormMethods, setCompanyFormMethods] = useState<any>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!companyFormMethods?.watch) return;
    const subscription = companyFormMethods.watch((values: any) => {
      const raw = values?.companyId;
      const value = typeof raw === "object" ? raw?.value : raw;
      setSelectedCompanyId(value ? Number(value) : null);
    });
    return () => subscription.unsubscribe();
  }, [companyFormMethods]);

  useEffect(() => {
    setSelectedCompanyId(null);
    companyFormMethods?.reset?.({ companyId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBy, resolvedOwnerId]);

  const { financialYear, quarter, month, from, to } = filters ?? {};

  const chartUrl = selectedCompanyId
    ? `${endPoints.serviceScoreChart}${buildQueryString({
        companyId: selectedCompanyId,
        financialYear,
        quarter,
        month,
        from,
        to,
      })}`
    : "";

  const { data, isLoading } = useApiQuery({
    url: chartUrl,
    queryKey: ["serviceScoreChart", chartUrl],
    enabled: !!chartUrl,
  });

  const chart = data?.data as
    | { companyId: number; xAxis: string[]; yAxis: number[]; indicator?: string[] }
    | undefined;
  const hasData = Boolean(chart?.xAxis?.length);

  return (
    <StyledServiceScoreContainer>
      <StyledServiceScoreFilterRow>
        <DynamicForm
          formConfig={companyFieldConfig}
          formMethods={setCompanyFormMethods}
          defaultValues={{ companyId: null }}
          sx={{ padding: 0 }}
        />
      </StyledServiceScoreFilterRow>
      {!selectedCompanyId ? (
        <StyledNoData>Select a company to view its Service Score</StyledNoData>
      ) : isLoading ? (
        <ChartSkeleton height={460} />
      ) : !hasData ? (
        <StyledNoData>No Service Score data available for this company</StyledNoData>
      ) : (
        <ServiceScoreScatterChart
          xAxis={chart!.xAxis}
          yAxis={chart!.yAxis}
          indicator={chart!.indicator}
          height={460}
        />
      )}
    </StyledServiceScoreContainer>
  );
};

export default ServiceScoreWidget;
