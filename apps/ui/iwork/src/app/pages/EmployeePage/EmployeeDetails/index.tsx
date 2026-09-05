import EditIcon from "@mui/icons-material/Edit";
import { CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { EDIT, EMPLOYEE_DETAILS, UPDATE_EMPLOYEE } from "../../../constants";
import {
  companyBreadcrumbs,
  employeeInfoFieldGroup,
  employeeSummaryCard,
  generateEmployeeReporteeFields,
} from "./detailsConfig";
import {
  ButtonContainer,
  EmployeeContainer,
  EmployeeDetailsSectionTitle,
} from "./styles";
import {
  NOT_AVAILABLE,
  REPORTEES,
  endPoints,
  useApi,
  Button,
  CommonDetailsSection,
  CommonBreadcrumb,
  SummaryCard,
  CommonAGGrid,
} from "@ui/ui-lib";
import editIcon from "../../../assets/svgs/edit-icon.svg";
import { LoaderOverlay } from "../../Dashboard/styles";

const EmployeeDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: employeeId } = useParams();
  const { doFetch, data } = useApi();

  const [employeeData, setEmployeeData] = useState(location.state?.row || null);

  useEffect(() => {
    if (employeeId) {
      doFetch(endPoints.employeeById(Number(employeeId)));
    }
  }, []);

  useEffect(() => {
    if (data?.data) {
      setEmployeeData(data?.data);
    }
  }, [data]);

  if (!employeeData) {
    return (
      <LoaderOverlay>
        <CircularProgress />
      </LoaderOverlay>
    );
  }

  const handleEditEmployee = () => {
    if (employeeId) {
      navigate(`/employee/${employeeId}/edit`);
    }
  };

  const { reportingTo, reportees, ...employeeInfo } = employeeData;
  const reporteeFieldGroups = generateEmployeeReporteeFields(reportees);

  const employeeRole =
    employeeData?.userRoles &&
    employeeData.userRoles.map((role) => role.name).join(", ");
  const employeeDataWithRole = { ...employeeData, role: employeeRole };

  const reporteesRowData = Array.isArray(employeeData?.reportees)
    ? employeeData?.reportees.map((reportee) => {
        return {
          ...reportee,
          roles: reportee?.userRoles?.map((role) => role.name).join(", "),
        };
      })
    : [];

  return (
    <EmployeeContainer>
      <ButtonContainer>
        <CommonBreadcrumb
          crumbs={companyBreadcrumbs(
            employeeData?.firstName,
            location.state?.filters
          )}
        />
        <Button
          variantType="secondary"
          onClick={handleEditEmployee}
          className="edit-button"
        >
          <img src={editIcon} alt={EDIT} /> {EDIT}
        </Button>
      </ButtonContainer>
      <SummaryCard
        data={{
          employeeName:
            `${employeeData?.firstName ?? ""} ${
              employeeData?.lastName ?? ""
            }`.trim() || NOT_AVAILABLE,
          employeeID: (employeeData?.iirmEmpId as string) || NOT_AVAILABLE,
          userId: employeeData?.userId?.toString() || NOT_AVAILABLE,
          department:
            (employeeData?.department?.name as string) || NOT_AVAILABLE,
          designation:
            (employeeData?.designation.name as string) || NOT_AVAILABLE,
          role: (employeeRole as string) || NOT_AVAILABLE,
        }}
        sections={employeeSummaryCard}
        headerConfig={{
          titleKey: "employeeName",
        }}
      />
      {/* Employee info section */}
      <CommonDetailsSection
        sections={employeeInfoFieldGroup}
        data={employeeDataWithRole}
      />
      {reporteesRowData.length > 0 && (
        <>
          <EmployeeDetailsSectionTitle>{REPORTEES}</EmployeeDetailsSectionTitle>
          <CommonAGGrid
            rowData={reporteesRowData}
            columnDefs={generateEmployeeReporteeFields()}
            pagination={false}
            height={300}
            rowHeight={52}
          />
        </>
      )}
    </EmployeeContainer>
  );
};

export default EmployeeDetails;
