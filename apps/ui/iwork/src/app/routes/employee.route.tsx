import { RouteObject } from "react-router-dom";
import EmployeeListing from "../pages/EmployeePage/EmployeeListing";
import EmployeeDetails from "../pages/EmployeePage/EmployeeDetails";
import EmployeeDeactivate from "../pages/EmployeePage/EmployeeDeactivate";
import EmployeeForm from "../pages/EmployeePage/EmployeeForm/addEmployee";
import ProfilePage from "../pages/ProfilePage";
import {
  PermissionGuard,
  FeatureKey
} from "@ui/ui-lib";

export const employeeRoutes: RouteObject[] = [
  {
    path: "my-profile",
    element: <ProfilePage />,
  },
  {
    path: "employee",
    element: (
      <PermissionGuard
        feature={FeatureKey.VIEW_EMPLOYEE && FeatureKey.CREATE_EMPLOYEE}
      >
        <EmployeeListing />
      </PermissionGuard>
    ),
  },
  {
    path: "employees/new",
    element: <EmployeeForm key="new" />,
  },
  {
    path: "employee/:id",
    element: <EmployeeDetails />,
  },
  {
    path: "employee/:id/edit",
    element: <EmployeeForm key="edit" />,
  },
  {
    path: "employee/:id/deactivate",
    element: <EmployeeDeactivate />,
  },
];
