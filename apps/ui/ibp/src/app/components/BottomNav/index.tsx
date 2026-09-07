import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DashboardRounded,
  ShieldRounded,
  AssignmentRounded,
  FolderRounded,
  PersonRounded,
} from "@mui/icons-material";
import { BottomNavContainer, BottomNavAction } from "./styles";

const TABS = [
  { key: "dashboard", label: "Home", path: "/", icon: <DashboardRounded /> },
  { key: "my-insurance", label: "Insurance", path: "/my-insurance", icon: <ShieldRounded /> },
  { key: "claims-corner", label: "Claims", path: "/claims-corner", icon: <AssignmentRounded /> },
  { key: "my-documents", label: "Documents", path: "/my-documents", icon: <FolderRounded /> },
  { key: "profile", label: "Profile", path: "/profile", icon: <PersonRounded /> },
] as const;

/**
 * Primary mobile/tablet navigation (< 768px) — a thumb-reachable, always-visible
 * bottom tab bar surfacing the 5 most-used employee destinations. Complements
 * (doesn't replace) the Header's hamburger drawer, which still covers the full
 * nav item list for less-common destinations.
 */
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey =
    TABS.find((tab) => tab.path === location.pathname)?.key ?? false;

  return (
    <BottomNavContainer
      showLabels
      value={activeKey}
      onChange={(_event, newValue) => {
        const tab = TABS.find((t) => t.key === newValue);
        if (tab) navigate(tab.path);
      }}
    >
      {TABS.map((tab) => (
        <BottomNavAction
          key={tab.key}
          label={tab.label}
          value={tab.key}
          icon={tab.icon}
          aria-label={tab.label}
        />
      ))}
    </BottomNavContainer>
  );
};

export default BottomNav;
