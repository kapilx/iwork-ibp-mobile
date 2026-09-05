import { RouteObject } from "react-router-dom";
import { environment } from "@ui/ui-lib";
import Nl2sqlChatbotPage from "../pages/Nl2sqlChatbotPage/index.js";

export const nl2sqlChatBotRoutes: Array<
  RouteObject & { flag?: keyof typeof environment.featureFlag }
> = [
  {
    path: "ask-echo",
    element: <Nl2sqlChatbotPage />,
    flag: "FF_IWORK_NL2SQL_CHAT_BOT",
  },
];
