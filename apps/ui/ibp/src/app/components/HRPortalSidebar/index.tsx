import { Box, Typography } from "@mui/material";
import {
  BarChart3,
  Briefcase,
  Building2,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Settings2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { environment } from "@ui/ui-lib";

import brandLogo from "../../assets/pngs/hr-portal-sidebar-logo.png";
import sidebarIllustration from "../../assets/pngs/completed-illustration.png";
import { SidebarContainer } from "../../pages/HRPortal/styles";

type NavItem = {
  id: string;
  label: string;
  path: string;
  Icon: typeof ChartLine;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    path: "/hr-portal/portfolio",
    Icon: Briefcase,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/hr-portal/dashboard",
    Icon: ChartLine,
  },
  {
    id: "enrollment-status",
    label: "Enrolment Status",
    path: "/hr-portal/enrollment-status",
    Icon: ClipboardCheck,
  },
  {
    id: "reports",
    label: "Reports",
    path: "/hr-portal/reports",
    Icon: BarChart3,
  },
  {
    id: "hospitals",
    label: "Hospitals",
    path: "/hr-portal/hospitals",
    Icon: Building2,
  },
  {
    id:"support-ticket",
    label: "Support Ticket",
    path: "/hr-portal/complaints",
    Icon: TrendingUp,
  },
  // {
  //   id: "insights",
  //   label: "Risk Watch",
  //   path: "/hr-portal/insights",
  //   Icon: TrendingUp,
  // },
  {
    id: "user-management",
    label: "User Mgmt",
    path: "/hr-portal/user-management",
    Icon: Settings2,
  },
];

interface HRPortalSidebarProps {
  onRefresh?: () => void;
}

export function HRPortalSidebar({
  onRefresh: _onRefresh,
}: HRPortalSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { roleKey } = JSON.parse(sessionStorage.getItem("user") || "{}");

  const EXTERNAL_HR_HIDDEN = new Set(["insights", "user-management"]);
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (
      item.id === "enrollment-status" &&
      !environment.featureFlag.FF_HR_PORTAL_ENROLMENT_STATUS
    ) {
      return false;
    }
    if (item.id === "user-management") return roleKey === "PORTAL_CRM";
    if (roleKey === "EXTERNAL_HR") return !EXTERNAL_HR_HIDDEN.has(item.id);
    return item.id !== "insights" || roleKey === "PORTAL_CRM";
  });

  return (
    <SidebarContainer collapsed={collapsed}>
      {/* Logo */}
      <Box
        sx={{
          height: 64,
          px: collapsed ? 0.5 : 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e4ebf3",
          background: "#fff",
          flexShrink: 0,
          transition: "padding 0.2s ease",
        }}
      >
        <Box
          component="img"
          src={brandLogo}
          alt="IIRM"
          sx={{
            height: collapsed ? 22 : 32,
            width: "auto",
            objectFit: "contain",
            maxWidth: collapsed ? 28 : 120,
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        />
      </Box>

      {/* Nav items */}
      <Box
        sx={{
          px: collapsed ? 0.65 : 1,
          py: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          background: "#fff",
          flex: 1,
          transition: "padding 0.2s ease",
        }}
      >
        {visibleNavItems.map((item) => {
          const active =
            location.pathname.startsWith(item.path) ||
            (item.id === "dashboard" &&
              (location.pathname.startsWith("/hr-portal/policies/") ||
                location.pathname.startsWith("/hr-portal/policy-summary/")));
          return (
            <Box
              key={item.id}
              onClick={() => navigate(item.path)}
              sx={{
                minHeight: 40,
                px: collapsed ? 0 : 1.4,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 1.1,
                cursor: "pointer",
                color: active ? "#fff" : "#5f6c7b",
                background: active ? "#1C57B8" : "transparent",
                boxShadow: active
                  ? "0 4px 12px rgba(28, 87, 184, 0.22)"
                  : "none",
                transition: "all 0.15s ease",
                "&:hover": {
                  background: active ? "#1C57B8" : "#f4f8fc",
                },
              }}
            >
              <item.Icon size={15} />
              {!collapsed && (
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: active ? 600 : 500,
                    color: "inherit",
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {item.label}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Bottom illustration — only in expanded state */}
      {!collapsed && (
        <Box
          sx={{
            px: 0.9,
            pb: 0.75,
            pt: 0.3,
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={sidebarIllustration}
            alt="Support"
            sx={{
              width: "100%",
              height: "auto",
              objectFit: "contain",
              opacity: 0.9,
            }}
          />
        </Box>
      )}

      {/* Collapse / Expand toggle button */}
      <Box
        onClick={() => setCollapsed(!collapsed)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 40,
          borderTop: "1px solid #E4EBF3",
          background: "#fff",
          cursor: "pointer",
          flexShrink: 0,
          color: "#6B7280",
          "&:hover": { bgcolor: "#F4F8FC", color: "#1C57B8" },
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </Box>
    </SidebarContainer>
  );
}
