import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CommonBreadcrumb } from "@ui/ui-lib";
import {
  Box, Divider, Tab, Tabs, Typography,
} from "@mui/material";
import ApiIcon from "@mui/icons-material/Api";
import TpaAppRefsPage from "../TpaAppRefsPage";

// ─── Tab definitions — add new admin tabs here ────────────────────────────────

const TABS = [
  {
    key: "external-api-configs",
    label: "External API Configs",
    icon: <ApiIcon fontSize="small" />,
    description: "Manage API configurations used for TPA integrations (Claims, E-Card, Hospital Network, Portal Login).",
    component: <TpaAppRefsPage embedded basePath="/admin-settings/external-api-configs" />,
  },
  // Future admin tabs go here:
  // { key: "feature-types", label: "Feature Types", ... }
  // { key: "roles", label: "Role Management", ... }
];

const breadcrumbs = [{ label: "Admin Settings" }];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabKey = searchParams.get("tab") ?? TABS[0].key;
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === tabKey));
  const activeTab = TABS[activeIndex];

  const handleTabChange = (_: React.SyntheticEvent, newIndex: number) => {
    setSearchParams({ tab: TABS[newIndex].key }, { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ── Page header ── */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 3, pt: 3, pb: 0 }}>
        <CommonBreadcrumb crumbs={breadcrumbs} />
        <Box mt={1.5} mb={0}>
          <Typography variant="body2" mt={0.3}>
            System-level configuration managed by administrators.
          </Typography>
        </Box>

        {/* ── Tabs ── */}
        <Tabs
          value={activeIndex}
          onChange={handleTabChange}
          sx={{ mt: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.key}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.88rem",
                minHeight: 48,
                gap: 0.5,
                color: "text.secondary",
                "&.Mui-selected": { color: "primary.main" },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* ── Tab description bar ── */}
      <Box sx={{ bgcolor: "action.hover", px: 3, py: 1.2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption">
          {activeTab.description}
        </Typography>
      </Box>

      {/* ── Tab content ── */}
      <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
        {TABS.map((tab, idx) => (
          <Box key={tab.key} hidden={idx !== activeIndex}
            role="tabpanel" aria-labelledby={`admin-tab-${tab.key}`}>
            {idx === activeIndex && tab.component}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AdminSettingsPage;
