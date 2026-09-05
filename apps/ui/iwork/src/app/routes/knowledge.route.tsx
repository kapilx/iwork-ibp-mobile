import { RouteObject } from "react-router-dom";
import LandingPage from "../components/LandingPage";
import ILearnPage from "../pages/ILearn";
import KnowledgeCentralPage from "../pages/KnowledgeCentral";

export const knowledgeRoutes: RouteObject[] = [
  {
    path: "knowledge-central",
    element: <KnowledgeCentralPage />,
  },
  {
    path: "ilearn",
    element: <ILearnPage />,
  },
  {
    path:"iTicket",
    element: <ILearnPage />,
  },
  {
    path: "My-mails",
    element: <LandingPage />,
  },
];
