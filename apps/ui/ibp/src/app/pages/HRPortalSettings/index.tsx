import { useState } from "react";
import { Box } from "@mui/material";
import {
  User,
  Shield,
  SlidersHorizontal,
  Users,
  CreditCard,
  Zap,
} from "lucide-react";
import {
  PortalControlBar,
  PortalHeroHeader,
  PortalTabItem,
} from "../HRPortal/controls";
import { SettingsProfileTab } from "../../components/SettingsProfileTab";
import { SettingsSecurityTab } from "../../components/SettingsSecurityTab";
import { SettingsPreferencesTab } from "../../components/SettingsPreferencesTab";
import { SettingsEmployeeTab } from "../../components/SettingsEmployeeTab";
import { SettingsSubscriptionTab } from "../../components/SettingsSubscriptionTab";
import { SettingsIntegrationsTab } from "../../components/SettingsIntegrationsTab";

type SettingsTab =
  | "profile"
  | "security"
  | "preferences"
  | "employee"
  | "subscription"
  | "integrations";

type TabMeta = { id: SettingsTab; label: string; Icon: React.ElementType };

const TABS: TabMeta[] = [
  { id: "profile", label: "Profile", Icon: User },
  { id: "security", label: "Security", Icon: Shield },
  { id: "preferences", label: "Preferences", Icon: SlidersHorizontal },
  { id: "employee", label: "Employee", Icon: Users },
  { id: "subscription", label: "Subscription", Icon: CreditCard },
  { id: "integrations", label: "Integrations", Icon: Zap },
];

export function HRPortalSettings() {
  const initialTab = (new URLSearchParams(window.location.search).get("tab") as SettingsTab) ?? "profile";
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    TABS.some(t => t.id === initialTab) ? initialTab : "profile",
  );

  return (
    <Box sx={{ mx: -3, mt: -0.25, minHeight: "100%", background: "#EBF6FF" }}>
      <PortalHeroHeader
        title="Settings"
        subtitle="Manage your account, security, and preferences."
        bleed={true}
      />

      <PortalControlBar bleed={true}>
        {TABS.map(({ id, label, Icon }) => (
          <PortalTabItem
            key={id}
            label={label}
            icon={<Icon size={13} />}
            active={activeTab === id}
            onClick={() => setActiveTab(id)}
          />
        ))}
      </PortalControlBar>

      <Box sx={{ px: 4, py: 4 }}>
        {activeTab === "profile" && <SettingsProfileTab />}
        {activeTab === "security" && <SettingsSecurityTab />}
        {activeTab === "preferences" && <SettingsPreferencesTab />}
        {activeTab === "employee" && <SettingsEmployeeTab />}
        {activeTab === "subscription" && <SettingsSubscriptionTab />}
        {activeTab === "integrations" && <SettingsIntegrationsTab />}
      </Box>
    </Box>
  );
}

export default HRPortalSettings;
