import React from "react";
import {
  Table,
  useTableController,
  endPoints,
  POLICY_DETAILS_TITLE,
  POLICY_DETAILS_SUBTITLE,
  useLocalization,
  Button,
  setToastMessage,
  buildBreadcrumbState,
  DETAILS_KEYS,
  DETAILS_LABELS,
} from "@ui/ui-lib";
import { getColumns } from "./tableConfig";
import { PORTFOLIO_ACTIVE_ONLY_PARAM } from "../CompanyOverView/tableConfig";
import { Typography } from "@mui/material";
import { Container, FileIcon, Icons, SubHeading } from "./styles";
import { CellClickedEvent } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import { CardBackground } from "../CompanyOverView/styles.js";
import { ACTIVATE_POLICY } from "../../../constants";
import fileEdit from "../../../assets/svgs/file-pen-icon.svg";
import fileUpload from "../../../assets/svgs/file-upload-icon.svg";
import filePlus from "../../../assets/svgs/file-plus-icon.svg";
import { useDispatch } from "react-redux";

interface CompanyPoliciesProps {
  companyData: any;
  breadcrumbInfo?: any;
  filters?: any;
  pastCompanies?: boolean;
}
const CompanyPolicies: React.FC<CompanyPoliciesProps> = ({
  companyData,
  breadcrumbInfo,
  filters,
  pastCompanies = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
    setSmartSearch,
  } = useTableController({
    endpoint: endPoints.policyList(companyData?.companyId),
    searchFieldName: "companyName",
    defaultFieldName: "policyFrom",
    customPathParam: pastCompanies
      ? `${PORTFOLIO_ACTIVE_ONLY_PARAM}&pastCompanies=true`
      : PORTFOLIO_ACTIVE_ONLY_PARAM,
  });

  React.useEffect(() => {
    // searchFieldName "companyName" routes any company-name term to searchBy
    // (an ILIKE), not a structured filter, so it's safe to pass filters as-is.
    setSmartSearch(filters || {});
  }, [filters, setSmartSearch]);

  const { localizationData } = useLocalization();
  const columns = React.useMemo(
    () => getColumns(localizationData?.data),
    [localizationData]
  );

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${companyData.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: breadcrumbInfo,
        crumb: destinationConfig,

        state: {
          from: "clientPortfolio",
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/companies/${companyData.companyId}`, {
      //   state: { from: "clientPortfolio" },
      // });
    }
    if (event.colDef.field === "policyNumber") {
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${event.data.id}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: breadcrumbInfo,
        crumb: destinationConfig,

        state: {
          from: "clientPortfolio",
          policyName: event.data.policyNumber,
          companyData,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/policies/${event.data.id}`, {
      //   state: {
      //     from: "clientPortfolio",
      //     policyName: event.data.policyNumber,
      //     companyData,
      //   },
      // });
    }
  };

  const ActionButtonRenderer = (props: any) => {
    const [showIcons, setShowIcons] = React.useState(false);
    const policyId = props?.data?.id;

    const handleUploadClaim = () => {
      if (policyId) {
        navigate(`/${policyId}/upload-claims`, {
          state: {
            policyId,
            from: "policyListing",
          },
        });
      } else {
        dispatch(setToastMessage("Unable to navigate: Policy ID not found"));
      }
    };

    const handleCreateEndorsement = () => {
      const policyId = props?.data?.policyId;
      if (policyId) {
        navigate(`/${policyId}/upload-claims`);
      } else {
        dispatch(setToastMessage("Unable to navigate: Policy ID not found"));
      }
    };
    // policyType is an object with lookUpValue per your column config
    const policyType = props?.data?.policyType ?? "";
    const isGroup = String(policyType).toLowerCase().includes("group");
    return (
      <Container>
        <Button
          onClick={() => setShowIcons(true)}
          sizeType="small"
          disabled={showIcons}
          aria-disabled={showIcons}
        >
          {ACTIVATE_POLICY}
        </Button>

        {showIcons && (
          <Icons>
            {/* keep endorsement icon as-is */}
            <FileIcon
              src={fileEdit}
              alt="Create endorsement"
              title="Create endorsement"
              onClick={handleCreateEndorsement}
            />

            {/* claims icon switches based on policyType */}
            {isGroup ? (
              <FileIcon
                src={filePlus}
                alt="Create claim"
                title="Create claim"
              />
            ) : (
              <FileIcon
                src={fileUpload}
                alt="Upload claim"
                title="Upload claim"
                onClick={handleUploadClaim}
              />
            )}
          </Icons>
        )}
      </Container>
    );
  };

  return (
    <CardBackground>
      <Typography variant="h1">
        {POLICY_DETAILS_TITLE} - {companyData?.companyName}
      </Typography>
      <SubHeading>{POLICY_DETAILS_SUBTITLE}</SubHeading>

      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        setSort={setSort}
        title=""
        domLayout="autoHeight"
        components={{ ActionButton: ActionButtonRenderer }}
      />
    </CardBackground>
  );
};

export default CompanyPolicies;
