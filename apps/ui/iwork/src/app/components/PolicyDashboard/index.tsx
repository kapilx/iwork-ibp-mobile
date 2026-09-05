import {
  useEffect,
  useMemo,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import EmployeeDependentCard from "./EmployeeDependentCard";
import EndorsementCard from "./EndorsementStatCard";
import PolicyDashboardNeedAttentionCard from "./PolicyDashboardNeedAttentionCard";
import { Box } from "@mui/material";
import Drawer from "@ui/ui-lib/commonComponents/Drawer";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getAttentionData,
  getEmployeeDependentCardsData,
  getEndorsementCardData,
  drawerHeadingMap,
  getTrackClaimsColumns,
  getTrackClaimsColumnsForNonGroupCheck,
} from "./config";
import {
  CLAIMS_UPLOADED_DATA_HEADING,
  DOWNLOAD_FAILED_TRY_AGAIN,
  CONFIGURE,
  ENDORSEMENT_STATUS,
  ENDORSEMENT_TOASTS,
  GENERIC_ERROR,
  SOURCE_FILE_DOWNLOADED_SUCCESSFULLY,
  TRACK_CLAIMS,
  TRACK_ENDORSEMENTS,
  POLICY_DETAILS,
  POLICY_ACTIVE_RESTRICTION_MESSAGE,
  POLICY_ACTIVE_RESTRICTION_ENDORSEMENT_MESSAGE,
} from "../../constants";
import {
  endorsementBatchTrackerCols,
  getClosedEndorsementCols,
} from "../ClosedEndorsement/config";
import ChipRenderer from "@ui/ui-lib/commonComponents/Chip";
import { useLocalization } from "@ui/ui-lib/hooks/useLocalization";
import useTableController from "@ui/ui-lib/hooks/useTableController";
import {
  CUSTOM_PAGE_SIZE,
  DETAILS_KEYS,
  DETAILS_LABELS,
  ENDORSEMENT_RESTRICTION_MESSAGE,
  INCEPTION_RESTRICTION_MESSAGE,
} from "@ui/ui-lib/constants";
import DrawerContentSwitcher from "./DrawerContentSwitcher";
import FileRenderer, { handleDownload } from "./FileRenderer";
import {
  setToastMessage,
  endPoints,
  useApiQuery,
  Table,
  CustomModal,
  theme,
  apiRequest,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
} from "@ui/ui-lib";
import { MainContainer, NewsLinkSection, TableHeading } from "./styles";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import QuickActions from "./QuickLinks";
import { CellClickedEvent } from "ag-grid-community";
import { claimsBatches } from "../../pages/ClaimsPage/config";
import type { CreationType } from "../../pages/EndorsementPage/EndorsementDetails/creationFlowConfigs";

export type DrawerView =
  | "upload"
  | "employeeText"
  | "closedEndorsement"
  | "employeeBatch"
  | "insurerAcknowledgement"
  | "createEndorsement"
  | "tpaAcknowledgement"
  | "cdBalance"
  | null;

export interface Props {
  drawerView: DrawerView;
  setDrawerView: (view: DrawerView) => void;
  setOpenDrawer: (open: boolean) => void;
  additionalData: {
    readyForEndorsement: number;
    insurerId: number;
  };
  onInsurerAcknowledge: (data: any) => void;
  sendEndorsement?: () => void;
  refreshDashboard?: () => void;
}

export interface AttentionStats {
  endorsementBatchesPending: number;
  endorsementReadyEmployeesCount: number;
  yetToReceiveTpaIdsCount: number;
}

export interface PolicyDashboardResponse {
  employeeAndDependents: {
    employeeCount: number;
    dependentsCount: number;
    totalLives: number;
  };
  tpaData: {
    totalLives: number;
    livesHavingTpaIds: number;
    yetToHaveTpaIds: number;
  };
  enrollmentStatus: {
    registeredCount: number;
    inProgressCount: number;
    submittedCount: number;
    notStartedCount: number;
  };
  endorsementManagement: {
    processedCount: number;
    insurerAcknowledgePendingCount: number;
    readyForEndorsementCount: number;
  };
  claims: {
    pendingClaims: number;
    settledClaims: number;
    totalClaims: number;
  };
  cdBalance: {
    cdAccountName: string;
    cdAccountId: number;
    netPolicyPremium: number;
    cdBalance: number;
  };
}
interface PolicyDashboardProps {
  isConfigStatusLive: boolean;
  handleUpdateCompany: () => void;
  isGroupPolicyType: boolean;
  isEnrolmentPremiumBased?: boolean;
  inceptionId: number | null | undefined;
  isInceptionCompleted: boolean;
  companyId: number;
  policyStatus?: string;
}

export interface PolicyDashboardRef {
  scrollToClaimsSection: () => void;
}

const PolicyDashboard = forwardRef<PolicyDashboardRef, PolicyDashboardProps>(
  (
    {
      isConfigStatusLive,
      handleUpdateCompany,
      isGroupPolicyType,
      isEnrolmentPremiumBased = false,
      inceptionId,
      isInceptionCompleted,
      companyId,
      policyStatus,
    },
    ref
  ) => {
    const canEnroll =
      !isConfigStatusLive && isGroupPolicyType && !isEnrolmentPremiumBased;
    const claimsSectionRef = useRef<HTMLDivElement>(null);

    // endorsementBatchTrackerCols is shared between two different backend
    // methods: the group tracker (listEndorsementBatchesTracker, TypeORM
    // structured findAndCount({order}) — verified correct for endorsementDate/
    // basicBrokeragePercentage/basicBrokerageAmount) and the non-group/asset
    // tracker (listAssetEndorsementBatchesTracker, raw QueryBuilder .orderBy()
    // — confirmed live to silently no-op on those same 3 fields, root cause
    // documented in Table-Sort-Problem-List.md section 1.7). The shared config
    // disables them unconditionally (correct for asset, wrong for group), so
    // re-enable them here for the group path only. additionCount/
    // deletionCount/grossPremium/TATduration stay disabled on both — they're
    // computed post-fetch on the group tracker and not part of its sort map
    // regardless of the asset tracker's bug.
    const trackEndorsementsColumns = useMemo(
      () =>
        isGroupPolicyType
          ? endorsementBatchTrackerCols.map((col) =>
              [
                "endorsementDate",
                "basicBrokeragePercentage",
                "basicBrokerageAmount",
              ].includes(col.field as string)
                ? { ...col, disableSort: false }
                : col
            )
          : endorsementBatchTrackerCols,
      [isGroupPolicyType]
    );

    useImperativeHandle(ref, () => ({
      scrollToClaimsSection: () => {
        if (claimsSectionRef.current) {
          claimsSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      },
    }));

    const hasAttentionData = getAttentionData.length > 0;
    const { id } = useParams();
    const [refreshDashboard, setRefreshDashboard] = useState(false);
    const navigate = useNavigate();
    const { data } = useApiQuery({
      url: id
        ? isGroupPolicyType
          ? endPoints.policyDashboard(Number(id))
          : endPoints.nonGroupPolicyDashboard(Number(id))
        : "",
      queryKey: ["policyDashboardDetails", id, refreshDashboard],
      enabled: Boolean(id),
    });
    const dashboardData: PolicyDashboardResponse | undefined = data?.data;
    const [openDrawer, setOpenDrawer] = useState(false);
    const [drawerView, setDrawerView] = useState<DrawerView>("upload");
    const [insurerAcknowledgementData, setInsurerAcknowledgementData] =
      useState<any>(null);
    const [showRestrictionModal, setShowRestrictionModal] = useState(false);
    const [restrictionMessage, setRestrictionMessage] = useState<string>("");

    const handleEmpClick = () => {
      if (inceptionId) {
        navigateToCreationFlow("inception", {
          endorsementId: inceptionId,
        });
        return;
      }
      
      if (canEnroll) {
        setRestrictionMessage(POLICY_ACTIVE_RESTRICTION_MESSAGE);
        setShowRestrictionModal(true);
        return;
      }

      // Active-policy check: non-group policies and premium-based (bypass) policies
      // do not gate via the configure step, so they must verify activation here.
      if (!isGroupPolicyType || isEnrolmentPremiumBased) {
        const isPolicyStatusActive =
          typeof policyStatus === "string" &&
          policyStatus.trim().toLowerCase() === "active";

        if (!isPolicyStatusActive) {
          setRestrictionMessage(POLICY_ACTIVE_RESTRICTION_MESSAGE);
          setShowRestrictionModal(true);
          return;
        }
      }

      navigateToCreationFlow("inception", {
        endorsementId: inceptionId || undefined,
      });
    };

    const location = useLocation();
    const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
    const policyEndorsementBreadcrumb =
      existingBreadcrumbs.length > 0
        ? existingBreadcrumbs
        : [
            createBreadcrumbEntry({
              label: "Policy Details",
              path: `/policies/${id}`,
              key: "policy-details",
            }),
          ];

    const handleAcknowledgeClick = () => {
      setOpenDrawer(false);
      setRefreshDashboard((prev) => !prev);
    };
    const navigateToCreationFlow = (
      creationType: CreationType = "endorsement",
      options?: { endorsementId?: number; cellClick?: boolean; endorsementType?: string }
    ) => {
      if (!id) {
        return;
      }

      const basePath = `/${id}/create-${creationType}`;
      const path =
        options?.endorsementId !== undefined &&
        Number.isFinite(options.endorsementId)
          ? `${basePath}/${options.endorsementId}`
          : basePath;

      const isPolicyExtension = options?.endorsementType === "EXTENSION";

      if (options?.cellClick) {
        const destinationConfig = {
          label: DETAILS_LABELS.ENDORSEMENT,
          path: path,
          key: DETAILS_KEYS.ENDORSEMENT,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: policyEndorsementBreadcrumb,
          crumb: destinationConfig,
          state: {
            navigationFrom: `/policies/${id}`,
            navigationLabel: POLICY_DETAILS,
            ...(isPolicyExtension ? { isPolicyExtension: true } : {}),
          },
        });
        navigate(destinationConfig.path, {
          state: destinationState,
        });
        return;
      }

      navigate(path, {
        state: {
          navigationFrom: `/policies/${id}`,
          navigationLabel: POLICY_DETAILS,
        },
      });
    };
    const handleClaimsClick = () => {
      if (isGroupPolicyType) {
        navigate(`/${id}/upload-claims`, {
          state: {
            navigationFrom: `/policies/${id}`,
            navigationLabel: POLICY_DETAILS,
          },
        });
      } else {
        navigate(`/${id}/upload-non-group-claims`, {
          state: {
            navigationFrom: `/policies/${id}`,
            navigationLabel: POLICY_DETAILS,
            companyId: companyId,
          },
        });
      }
    };

    const handleEndorsementClick = () => {
      if (!isGroupPolicyType || isEnrolmentPremiumBased) {
        const isPolicyStatusActive =
          typeof policyStatus === "string" &&
          policyStatus.trim().toLowerCase() === "active";

        if (!isPolicyStatusActive) {
          setRestrictionMessage(POLICY_ACTIVE_RESTRICTION_ENDORSEMENT_MESSAGE);
          setShowRestrictionModal(true);
          return;
        }
      }
      if (isEnrolmentPremiumBased && !isInceptionCompleted) {
        setRestrictionMessage(ENDORSEMENT_RESTRICTION_MESSAGE);
        setShowRestrictionModal(true);
        return;
      }
      navigateToCreationFlow("endorsement");
    };

    const handleCdBalanceClick = () => {
      const cdId = dashboardData?.cdBalance?.cdAccountId;
      if (!dashboardData?.cdBalance?.cdAccountId) {
        dispatch(setToastMessage("No CD account exists"));
      } else {
        navigate(`/policies/${id}/cd-balance/${cdId}`, {
          state: {
            from: "PolicyDashboard",
            to: "AddCdDetails",
            policyId: Number(id),
            cdId: Number(cdId),
          },
        });
      }
    };

    const handleRefreshDashboard = () => {
      setRefreshDashboard((prev) => !prev);
    };

    const handleAcknowledgementClick = (key: string, data: any) => {
      if (key === "insurer_ack" || key === "upload_tpa_ids") {
        setInsurerAcknowledgementData(data);
        data?.status === ENDORSEMENT_STATUS.ENDORSEMENT_STATUS_PENDING
          ? setDrawerView("insurerAcknowledgement")
          : setDrawerView("tpaAcknowledgement");
        setOpenDrawer(true);
      }
    };
    const onEmployeeDependentCardClick = () => {
      setDrawerView("employeeBatch");
      setOpenDrawer(true);
    };
    const handleTpaClick = () => {};

    const handleViewEndorsementBatcheClick = () => {
      setDrawerView("employeeBatch");
      setOpenDrawer(true);
    };

    const onCDDetailsClick = () => {
      if (!dashboardData?.cdBalance?.cdAccountId) {
        dispatch(
          setToastMessage("No Caution Deposit account exists for this policy")
        );
        return;
      }
      navigate(`/cd-management/${dashboardData?.cdBalance?.cdAccountId}`);
    };
    const { id: policyId } = useParams();
    const dispatch = useDispatch();
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

    const handleDownload = async (errorFileUploadId: number) => {
      try {
        if (!errorFileUploadId) {
          dispatch(setToastMessage(ENDORSEMENT_TOASTS.INVALID_SELECTION));
          return;
        }

        const downloadUrl = endPoints.fileUploadDownloadById(errorFileUploadId);
        const response = await apiRequest(downloadUrl, {
          method: "GET",
          responseType: "blob",
        });

        const blob = response.data as Blob;

        if (blob.type.includes("text/html")) {
          const text = await blob.text();
          if (text.includes("<html")) {
            dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
            return;
          }
        }

        let filename = "claims_batch_upload.xlsx";
        const contentDisposition =
          response.headers?.["content-disposition"] ||
          response.headers?.get?.("content-disposition");

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) filename = match[1];
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        dispatch(setToastMessage(SOURCE_FILE_DOWNLOADED_SUCCESSFULLY));
      } catch (err) {
        console.error("Download source file", err);
        dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
      }
    };
    const {
      rowData,
      totalRows,
      currentPage,
      loading,
      setCurrentPage,
      pageSize,
      setPageSize,
      PAGE_SIZE_OPTIONS,
      setSort,
      refetch: refetchEndorsementData,
    } = useTableController({
      endpoint: isGroupPolicyType
        ? endPoints.endorsementBatchTrackerData(Number(policyId))
        : endPoints.endorsementBatchesForNonGroupPolicies(Number(policyId)),
    });

    const {
      rowData: rowForClaims,
      totalRows: totalRowsForClaims,
      currentPage: claimsCurrentPage,
      loading: claimsLoading,
      setCurrentPage: setCurrentPageForClaims,
      pageSize: claimsPageSize,
      setPageSize: setPageSizeForClaims,
      PAGE_SIZE_OPTIONS: claimsPageSizeOptions,
      setSort: setSortForClaims,
      refetch: refetchClaimsData,
    } = useTableController(
      isGroupPolicyType
        ? {
            endpoint: endPoints.claimsByPolicyId(Number(policyId)),
          }
        : {
            endpoint: endPoints.claimsByPolicyId(Number(policyId)),
            // customPathParam: `search=policyId:[${policyId}]`,
          }
    );

    const {
      rowData: rowForClaimsBatch,
      totalRows: totalRowsForClaimsBatch,
      currentPage: claimsBatchCurrentPage,
      loading: claimsBatchLoading,
      setCurrentPage: setCurrentPageForClaimsBatch,
      pageSize: claimsBatchPageSize,
      setPageSize: setPageSizeForClaimsBatch,
      PAGE_SIZE_OPTIONS: claimsBatchPageSizeOptions,
      setSort: setSortForClaimsBatch,
      refetch: refetchClaimsBatchData,
    } = useTableController({
      endpoint: endPoints.getAllClaimsBatch,
      customPathParam: `policyId=${Number(policyId)}`,
    });

    useEffect(() => {
      if (refetchEndorsementData) {
        refetchEndorsementData();
      }
    }, [refreshDashboard, refetchEndorsementData]);

    useEffect(() => {
      if (refetchClaimsData) {
        refetchClaimsData();
      }
    }, [refreshDashboard, refetchClaimsData]);
    useEffect(() => {
      if (refetchClaimsBatchData) {
        refetchClaimsBatchData();
      }
    }, [refreshDashboard, refetchClaimsBatchData]);

    const { localizationData } = useLocalization();

    const onCellClicked = (event: CellClickedEvent) => {
      if (event.colDef.field === "endorsementId" || event.colDef.field === "currentStatus") {
        navigateToCreationFlow("endorsement", {
          endorsementId: Number(event.data?.endorsementId),
          cellClick: true,
          endorsementType: event.data?.endorsementType,
        });
      }
    };

    const onClaimCellClicked = (event: CellClickedEvent) => {
      if (
        !isGroupPolicyType &&
        event.colDef.field === "claimId" &&
        event.data?.claimId &&
        policyId
      ) {
        navigate(`/${policyId}/upload-non-group-claims/${event.data.claimId}`, {
          state: {
            navigationFrom: `/policies/${policyId}`,
            navigationLabel: POLICY_DETAILS,
            companyId: companyId,
          },
        });
      }
    };

    const getClosedEndorsementColumnss = useMemo(() => {
      return getClosedEndorsementCols(
        hoveredRowIndex ?? -1,
        handleAcknowledgementClick,
        localizationData?.data
      );
    }, [handleAcknowledgementClick, localizationData]);

    const ActionButtonRenderer = (params: any) => {
      const errorFileId = params.data?.tpaErrorDocumentId;
      if (!errorFileId) {
        return <span></span>;
      }
      return (
        <ActionButton onClick={() => handleDownload(errorFileId, dispatch)} />
      );
    };
    const ClaimsActionButtonRenderer = (params: any) => {
      const sourceFileId = params.data?.sourceFileId;
      return (
        <ActionButton
          onClick={() => handleDownload(sourceFileId)}
          buttonText={"Download source file"}
        />
      );
    };
    return (
      <>
        <MainContainer>
          {hasAttentionData ? (
            <>
              <NewsLinkSection>
                <PolicyDashboardNeedAttentionCard
                  data={getAttentionData(
                    handleAcknowledgeClick,
                    handleEndorsementClick,
                    dashboardData?.attentionStats
                  )}
                />
                <QuickActions
                  onEmpClick={handleEmpClick}
                  onEndorsementClick={handleEndorsementClick}
                  onCDBalanceClick={handleCdBalanceClick}
                  isInceptionCompleted={isInceptionCompleted}
                  inceptionId={inceptionId}
                  onClaimClick={handleClaimsClick}
                  isGroupPolicyType={isGroupPolicyType}
                />
              </NewsLinkSection>
              <EmployeeDependentCard
                data={getEmployeeDependentCardsData(
                  handleEmpClick,
                  handleTpaClick,
                  onEmployeeDependentCardClick,
                  onCDDetailsClick,
                  dashboardData,
                  isGroupPolicyType
                )}
              />

              <EndorsementCard
                data={getEndorsementCardData(
                  dashboardData,
                  handleEndorsementClick,
                  handleAcknowledgeClick,
                  handleViewEndorsementBatcheClick
                )}
              />
            </>
          ) : (
            <PolicyDashboardNeedAttentionCard />
          )}

          <TableHeading> {TRACK_ENDORSEMENTS}</TableHeading>
          <Table
            columns={trackEndorsementsColumns}
            rowData={rowData}
            totalRows={totalRows}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            setPageSize={setPageSize}
            onCellClicked={onCellClicked}
            onPrimaryActionClick={() => {}}
            setSort={setSort}
            components={{
              ChipRenderer,
              FileRenderer: FileRenderer,
              ActionButton: ActionButtonRenderer,
            }}
            title={""}
            height={550}
            domLayout="autoHeight"
          />
          <TableHeading> {TRACK_CLAIMS}</TableHeading>
          <Table
            columns={
              isGroupPolicyType
                ? getTrackClaimsColumns()
                : getTrackClaimsColumnsForNonGroupCheck()
            }
            rowData={rowForClaims}
            totalRows={totalRowsForClaims}
            currentPage={claimsCurrentPage}
            setCurrentPage={setCurrentPageForClaims}
            loading={claimsLoading}
            pageSize={claimsPageSize}
            pageSizeOptions={claimsPageSizeOptions}
            setPageSize={setPageSizeForClaims}
            onCellClicked={onClaimCellClicked}
            onPrimaryActionClick={() => {}}
            setSort={setSortForClaims}
            components={{
              ChipRenderer,
              ActionButton: ActionButtonRenderer,
            }}
            title={""}
            height={550}
            domLayout="autoHeight"
          />
          {isGroupPolicyType && (
            <div ref={claimsSectionRef}>
              <TableHeading> {CLAIMS_UPLOADED_DATA_HEADING} </TableHeading>
              <Table
                columns={claimsBatches}
                rowData={rowForClaimsBatch}
                totalRows={totalRowsForClaimsBatch}
                currentPage={claimsBatchCurrentPage}
                setCurrentPage={setCurrentPageForClaimsBatch}
                loading={claimsBatchLoading}
                pageSize={claimsBatchPageSize}
                pageSizeOptions={claimsBatchPageSizeOptions}
                setPageSize={setPageSizeForClaimsBatch}
                onCellClicked={() => {}}
                onPrimaryActionClick={() => {}}
                setSort={setSortForClaimsBatch}
                components={{
                  ChipRenderer,
                  ActionButton: ClaimsActionButtonRenderer,
                }}
                title={""}
                height={550}
                domLayout="autoHeight"
              />
            </div>
          )}
        </MainContainer>
        <CustomModal
          open={showRestrictionModal}
          handleClose={() => setShowRestrictionModal(false)}
          heading="Action Not Allowed"
          buttons={[
            ...(typeof handleUpdateCompany === "function" &&
            isGroupPolicyType &&
            !isEnrolmentPremiumBased
              ? [
                  {
                    label: CONFIGURE,
                    onClick: handleUpdateCompany,
                    variant: "secondary" as const,
                  },
                ]
              : []),
            {
              label: "OK",
              onClick: () => setShowRestrictionModal(false),
              variant: "primary" as const,
            },
          ]}
        >
          <div>{restrictionMessage}</div>
        </CustomModal>

        <CustomModal
          open={openDrawer}
          handleClose={() => setOpenDrawer(false)}
          heading={
            drawerView === "cdBalance" &&
            dashboardData?.cdBalance?.cdAccountName
              ? drawerHeadingMap.cdBalance.replace(
                  "{cdAccountName}",
                  dashboardData?.cdBalance?.cdAccountName
                )
              : drawerHeadingMap[drawerView] || ""
          }
          disablePortal={true}
          headingStyles={{ color: theme.palette.chips.senary }}
        >
          <DrawerContentSwitcher
            drawerView={drawerView}
            setDrawerView={setDrawerView}
            setOpenDrawer={setOpenDrawer}
            additionalData={{
              readyForEndorsement:
                dashboardData?.endorsementManagement?.readyForEndorsementCount,
              insurerId: dashboardData?.insurerId || 0,
              cdId: dashboardData?.cdBalance?.cdAccountId,
            }}
            onInsurerAcknowledge={handleAcknowledgementClick}
            insurerAcknowledgementData={insurerAcknowledgementData}
            sendEndorsement={handleAcknowledgeClick}
            refreshDashboard={handleRefreshDashboard}
          />
        </CustomModal>
      </>
    );
  }
);

PolicyDashboard.displayName = "PolicyDashboard";

export default PolicyDashboard;
