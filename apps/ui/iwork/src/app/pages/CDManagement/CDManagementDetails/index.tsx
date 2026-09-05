import {
  apiRequest,
  ChipRenderer,
  CommonBreadcrumb,
  CommonDetailsSection,
  CustomModal,
  endPoints,
  EXPORT,
  FeatureKey,
  setToastMessage,
  Table,
  useApiQuery,
  // useHasPermission,
  useTableController
} from "@ui/ui-lib";
// import { environment } from "@ui/ui-lib/environment";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  NO,
  REDIRECT_TO_POLICY,
  REDIRECT_TO_POLICY_CONFIRMATION,
  TABLE_CONTROLLER_ENTITY_KEY,
  YES,
} from "../../../constants";
import { CDListingContainer } from "../styles";
import {
  CDAccountTransaction,
  CDDetails,
  CDDetailsBreadcrumbs,
} from "./config";
import { OverviewCardBackground, TableContailer } from "./styles";

const CDManagementDetails = () => {
  const { cdid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    path: string;
    state: any;
  } | null>(null);
  // const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_CD_MANAGEMENT);
  // const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const { data: CDDetailsdata } = useApiQuery({
    queryKey: ["documentType"],
    url: endPoints.getCautionDepositDetails(Number(cdid)),
  });

  const onExportClick = async () => {
    try {
      if (!cdid) {
        dispatch(setToastMessage("Invalid selection."));
        return;
      }

      const downloadUrl = `${endPoints.getCautionDepositTransactionDetails(
        Number(cdid)
      )}?export=true`;
      const response = await apiRequest(downloadUrl, { method: "GET" });

      if (response.status !== 200 || !response?.data) {
        dispatch(setToastMessage("Download failed. Try again."));
        return;
      }

      const url = response.data;
      const link = document.createElement("a");
      link.href = url;
      link.download = `caution-deposit-transactions-${cdid}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      dispatch(setToastMessage("Transaction history downloaded successfully."));
    } catch (err) {
      dispatch(setToastMessage("Download failed. Try again."));
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
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.getCautionDepositTransactionDetails(Number(cdid)),
    customPathParam: `export=false`,
  });
  const onCellClicked = (event: any) => {
    if (
      (event?.colDef?.field === "policyId" ||
        event?.colDef?.field === "policyInsurerNumber") &&
      event?.data?.policyId
    ) {
      const targetPath = `/policies/${event.data.policyId}`;
      const targetState = {
        policyId: event.data.policyId,
        state: { activeTab: "cdDetails" },
      };
      setPendingNavigation({ path: targetPath, state: targetState });
      setRedirectModalOpen(true);
    }
  };

  return (
    <CDListingContainer>
      <CommonBreadcrumb crumbs={CDDetailsBreadcrumbs} />
      {/* <ButtonContainer>
        {isDownloadAllowed && (
          <Button
            variantType="secondary"
            sizeType="small"
            onClick={onExportClick}
          >
            <img src={DownLoadIcon} alt="Download Icon" />
            {EXPORT}
          </Button>
        )}
      </ButtonContainer> */}

      <OverviewCardBackground>
        <CommonDetailsSection sections={CDDetails} data={CDDetailsdata?.data} />
      </OverviewCardBackground>
      <TableContailer>
        <Table
          columns={CDAccountTransaction}
          rowData={rowData}
          totalRows={totalRows}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          loading={loading}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={setPageSize}
          onCellClicked={onCellClicked}
          primaryActionLabel={EXPORT}
          onPrimaryActionClick={onExportClick}
          primaryActionPermission={FeatureKey.EXPORT_CD_DETAILS}
          setSort={setSort}
          title={"Transaction history"}
          subTitle="Detailed transaction statement for the account"
          components={{
            ChipRenderer,
          }}
          height={590}
          domLayout="autoHeight"
          setColumnOrder={setColumnOrder}
          columnOrder={columnOrder}
          entityKey={TABLE_CONTROLLER_ENTITY_KEY.cdManagementDetailsEntity}
          selectedFilterValues={{}}
        />
      </TableContailer>
      <CustomModal
        open={redirectModalOpen}
        handleClose={() => {
          setRedirectModalOpen(false);
          setPendingNavigation(null);
        }}
        heading={REDIRECT_TO_POLICY}
        buttons={[
          {
            label: NO,
            variant: "secondary" as const,
            onClick: () => {
              setRedirectModalOpen(false);
              setPendingNavigation(null);
            },
          },
          {
            label: YES,
            variant: "primary" as const,
            onClick: () => {
              if (pendingNavigation) {
                navigate(pendingNavigation.path, {
                  state: pendingNavigation.state,
                });
              }
              setRedirectModalOpen(false);
              setPendingNavigation(null);
            },
          },
        ]}
        modalBoxStyles={{
          width: "30%",
        }}
      >
        <div>{REDIRECT_TO_POLICY_CONFIRMATION}</div>
      </CustomModal>
    </CDListingContainer>
  );
};

export default CDManagementDetails;
