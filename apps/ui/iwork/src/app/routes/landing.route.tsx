import { Navigate, RouteObject } from "react-router-dom";
import LandingPage from "../components/LandingPage";
import FileUploadPage from "../pages/CompanyPage/FileUpload";
import ManageEngagements from "../pages/ManageEngagements";
export const landingRoutes: RouteObject[] = [
  {
    path: "landing",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "",
    element: <LandingPage />,
  },
  {
    path: "file-upload",
    element: <FileUploadPage />,
  },
  {
    path: "my-ro",
    element: <LandingPage />,
  },
  {
    path: "manage-so",
    element: <LandingPage />,
  },
  {
    path: "manage-ro",
    element: <LandingPage />,
  },
  {
    path: "my-approvals",
    element: <LandingPage />,
  },
  {
    path: "team-assignments",
    element: <LandingPage />,
  },
  {
    path: "manage-policies",
    element: <LandingPage />,
  },
  // {
  //   path: "manage-endorsements",
  //   element: <LandingPage />,
  // },
  // {
  //   path: "manage-claims",
  //   element: <LandingPage />,
  // },
  {
    path: "engagements/*",
    element: <ManageEngagements />,
    children: [
      { path: "approvals", element: <ManageEngagements key="approvals" /> },
      { path: "assignments", element: <ManageEngagements key="assignments" /> },
      { path: "meetings", element: <ManageEngagements key="meetings" /> },
      { path: "tasks", element: <ManageEngagements key="tasks" /> },
    ],
  },
  {
    path: "my-tasks",
    element: <LandingPage />,
  },
  {
    path: "reinsurance-hub",
    element: <LandingPage />,
  },
  {
    path: "dm-smart-connect",
    element: <LandingPage />,
  },
  {
    path: "lia-consulting",
    element: <LandingPage />,
  },
  {
    path: "fin-ops",
    element: <LandingPage />,
  },
];
