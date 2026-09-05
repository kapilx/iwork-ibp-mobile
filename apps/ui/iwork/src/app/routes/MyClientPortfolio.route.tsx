import { RouteObject } from "react-router-dom";
import CompanyOverview from "../pages/ClientPortfolio/CompanyOverView";
import ClaimsTable from "../components/ClaimsTable";
import CDManagementList from "../pages/CDManagement";
import CDManagementDetails from "../pages/CDManagement/CDManagementDetails";
import CreateCDAccount from "../pages/CDManagement/CreateCDAccount";
import EndorsementListing from "../pages/EndorsementPage/EndorsementListing";

export const myClientPortfolioRoutes: RouteObject[] = [
  {
    path: "my-client-portfolio",
    element: <CompanyOverview />,
  },
  {
    path: "cd-management",
    element: <CDManagementList />,
  },
  {
    path: "cd-management/:cdid",
    element: <CDManagementDetails />,
  },
  {
    path: "create-cd-account",
    element: <CreateCDAccount />,
  },
];
