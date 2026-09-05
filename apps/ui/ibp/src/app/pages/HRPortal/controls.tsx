import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { ArrowLeft, ChevronDown } from "lucide-react";

export const PORTAL_HEADER_GRADIENT =
  "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)";

export const PORTAL_HEADER_TITLE_SX = {
  fontSize: 24,
  fontWeight: 600,
  lineHeight: 1.1,
} as const;

export const PORTAL_DATE_OPTIONS = [
  "Apr 2025 - Mar 2026",
  "Jan 2025 - Dec 2025",
  "Apr 2024 - Mar 2025",
];

export const downloadMockFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function formatLastSynced(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${day} ${month} ${year}, ${displayHour}:${minutes} ${ampm}`;
}

export function PortalHeroHeader({
  title,
  subtitle,
  action,
  onBack,
  noBorder = false,
  lastSyncedAt,
  showLastSynced = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
  noBorder?: boolean;
  lastSyncedAt?: Date;
  showLastSynced?: boolean;
}) {
  const [mountedAt] = useState(() => new Date());
  const syncLabel = formatLastSynced(lastSyncedAt ?? mountedAt);

  return (
    <Box
      sx={{
        position: "sticky",
        top: -1,
        zIndex: 3,
        bgcolor: "#ffffff",
        pt: 3.5,
        // pb: 3,
        // mx: -3,
        px: 3,
        borderBottom: noBorder ? "none" : "1px solid #E8EFF6",
        boxShadow: noBorder ? "none" : "0 2px 12px rgba(28,87,184,0.07)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "stretch", gap: 2, flex: 1, minWidth: 0 }}>
          {onBack && (
            <>
              <Box
                onClick={onBack}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  height: 36,
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  bgcolor: "#fff",
                  color: "#374151",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                  alignSelf: "flex-start",
                  "&:hover": { bgcolor: "#F9FAFB" },
                  transition: "background 0.12s",
                }}
              >
                <ArrowLeft size={15} />
                Back
              </Box>
              <Box sx={{ width: "1px", bgcolor: "#E5E7EB" }} />
            </>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{title}</Typography>
            <Box sx={{display: "flex", flexDirection: "column", gap: 2, mb: 2}}>
            {subtitle && (
              <Typography sx={{ fontSize: 15, color: "#6B7280", mt: 0.75 }}>{subtitle}</Typography>
            )}
            {showLastSynced && (
              <Typography sx={{ fontSize: 15, color: "#093f84", fontWeight: 600 }}>
                Last synced at: {syncLabel}
              </Typography>
            )}
              </Box>
          </Box>
        </Box>
        {action}
      </Box>
    </Box>
  );
}

export function PortalActionButton({
  label,
  icon,
  onClick,
  variant = "solid",
}: {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "light";
}) {
  return (
    <Button
      onClick={onClick}
      startIcon={icon}
      sx={{
        textTransform: "none",
        height: 38,
        px: 1.8,
        borderRadius: "10px",
        border:
          variant === "light"
            ? "1px solid rgba(255,255,255,0.25)"
            : "1px solid #184C97",
        background: variant === "light" ? "#FFFFFF" : "#184C97",
        color: variant === "light" ? "#344054" : "#FFFFFF",
        fontSize: 12.5,
        fontWeight: 600,
        boxShadow: "none",
        "&:hover": {
          background: variant === "light" ? "#F8FAFC" : "#143F7D",
          boxShadow: "none",
        },
      }}
    >
      {label}
    </Button>
  );
}

export function PortalControlBar({
  children,
  rightSlot,
  bleed = true,
}: {
  children?: ReactNode;
  rightSlot?: ReactNode;
  bleed?: boolean;
}) {
  return (
    <Box
      sx={{
        minHeight: 48,
        pl: 3,
        pr: bleed ? 10 : 3,
        width: bleed ? "calc(100% + 96px)" : "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        background: "#FFFFFF",
        borderBottom: "1px solid #E3EDF7",
        position: "relative",
        zIndex: 0,
        paddingRight: "80px"
        
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.85,
          flexWrap: "wrap",
          py: 0.5,
        }}
      >
        {children}
      </Box>
      {rightSlot ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: bleed ? 6 : 0 }}>
          {rightSlot}
        </Box>
      ) : null}
    </Box>
  );
}

export function PortalTabItem({
  active,
  icon,
  label,
  onClick,
  trailing,
}: {
  active?: boolean;
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        minHeight: 47,
        px: 2.1,
        display: "flex",
        alignItems: "center",
        gap: 0.8,
        borderBottom: active ? "2px solid #2F74D6" : "2px solid transparent",
        color: active ? "#2F74D6" : "#5B677A",
        fontSize: 12.5,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
      {trailing}
    </Box>
  );
}

type SelectOption = string | { label: string; value: string };

export function PortalSelectControl({
  value,
  onChange,
  options,
  width,
  leadingIcon,
  height = 38,
  borderRadius = "10px",
  fontSize = 12.5,
  minWidth,
  highlighted = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  width: number;
  leadingIcon?: ReactNode;
  height?: number;
  borderRadius?: number | string;
  fontSize?: number;
  minWidth?: number;
  highlighted?: boolean;
}) {
  return (
    <Box sx={{ position: "relative" }}>
      {leadingIcon ? (
        <Box
          sx={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: highlighted ? "#2556A6" : "#667281",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {leadingIcon}
        </Box>
      ) : null}
      <Box
        component="select"
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value)
        }
        sx={{
          width,
          minWidth,
          height,
          borderRadius,
          border: highlighted ? "1.5px solid #2556A6" : "1px solid #dbe3ee",
          pl: leadingIcon ? 9.15 : 1.65,
          pr: 3.9,
          fontSize,
          fontWeight: highlighted ? 600 : 500,
          color: highlighted ? "#1C57B8" : "#344054",
          background: highlighted ? "#EBF3FF" : "#FFFFFF",
          appearance: "none",
          outline: "none",
          lineHeight: "20px",
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      >
        {options.map((option) => {
          const label = typeof option === "string" ? option : option.label;
          const val = typeof option === "string" ? option : option.value;
          return <option key={val} value={val}>{label}</option>;
        })}
      </Box>
      <Box
        sx={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          color: highlighted ? "#2556A6" : "#667281",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronDown size={16} />
      </Box>
    </Box>
  );
}

export function PortalSearchField({
  value,
  onChange,
  placeholder,
  icon,
  width = 320,
  height = 38,
  borderRadius = "10px",
  fontSize = 12.5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  width?: number;
  height?: number;
  borderRadius?: number | string;
  fontSize?: number;
}) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        border: "1px solid #D7E2EE",
        display: "flex",
        alignItems: "center",
        gap: 0.9,
        px: 1.3,
        background: "#FFFFFF",
      }}
    >
      {icon}
      <Box
        component="input"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        sx={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize,
          color: "#344054",
          background: "transparent",
        }}
      />
    </Box>
  );
}

export function PortalPageIntro({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <Box sx={{ px: 0, pt: 1.5, mb: 0.5 }}>
      <Typography sx={{ fontSize: 24, fontWeight: 600, color: "#111827" }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: "#667085", mt: 0.4 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}
