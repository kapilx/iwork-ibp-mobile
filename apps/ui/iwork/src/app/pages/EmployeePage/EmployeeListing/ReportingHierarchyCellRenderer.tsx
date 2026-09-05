import { ICellRendererParams } from "ag-grid-community";
import { Avatar, Tooltip, styled } from "@mui/material";
import { ReportingChainEntry } from "./types";

// ─── Styled helpers ───────────────────────────────────────────────────────────

const CellWrapper = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 4,
  width: "100%",
  overflow: "hidden",
});

const Link = styled("span")({
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
});

const Separator = styled("span")({
  flexShrink: 0,
  color: "#9CA3AF",
  fontSize: 12,
  lineHeight: 1,
});

const avatarSx = {
  width: 26,
  height: 26,
  fontSize: 11,
  fontWeight: 600,
  bgcolor: "#EEF2FF",
  color: "#4338CA",
  border: "1px solid #E0E7FF",
};

const selfAvatarSx = {
  ...avatarSx,
  bgcolor: "#0A73E9",
  color: "#fff",
  border: "1px solid #0A73E9",
};

const ellipsisAvatarSx = {
  ...avatarSx,
  bgcolor: "#F3F4F6",
  color: "#6B7280",
  cursor: "default",
};

const formatName = (entry: ReportingChainEntry) =>
  `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim() || "Unknown";

const getInitials = (entry: ReportingChainEntry) => {
  const first = entry.firstName?.trim()?.[0] ?? "";
  const last = entry.lastName?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// `highlight` marks the terminal node (the row's own employee, not an
// ancestor) so it's visually distinguishable at a glance from the managers
// above it in the chain.
const PersonAvatar = ({
  entry,
  highlight,
}: {
  entry: ReportingChainEntry;
  highlight?: boolean;
}) => (
  <Tooltip title={formatName(entry)} placement="bottom">
    <Avatar sx={highlight ? selfAvatarSx : avatarSx}>{getInitials(entry)}</Avatar>
  </Tooltip>
);

const CollapsedAvatar = ({ names }: { names: ReportingChainEntry[] }) => (
  <Tooltip
    placement="bottom"
    title={<span style={{ whiteSpace: "pre-line" }}>{names.map(formatName).join("\n")}</span>}
  >
    <Avatar sx={ellipsisAvatarSx}>…</Avatar>
  </Tooltip>
);

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AG Grid cell renderer for the "Reporting Hierarchy" column — shows an
 * employee's ordered reporting chain (root manager -> ... -> the employee) as
 * a compact row of initials avatars, hover-to-reveal the full name.
 *
 * v1/interim behaviour, per requirement: chains of 10 or fewer entries render
 * fully inline (the column has room for it); longer chains compress to
 * first-5 -> "…" -> last-5, with the collapsed middle names shown as plain
 * text in a hover tooltip on the "…" avatar.
 *
 * Usage in tableConfig:
 *   cellRenderer: ReportingHierarchyCellRenderer
 */
const FULL_CHAIN_THRESHOLD = 10;
const EDGE_COUNT = 5;

const ReportingHierarchyCellRenderer = (params: ICellRendererParams) => {
  const chain: ReportingChainEntry[] | undefined = params.value;

  if (!chain || !chain.length) {
    return <CellWrapper>—</CellWrapper>;
  }

  if (chain.length <= FULL_CHAIN_THRESHOLD) {
    return (
      <CellWrapper>
        {chain.map((entry, index) => (
          <Link key={entry.userId}>
            <PersonAvatar entry={entry} highlight={index === chain.length - 1} />
            {index < chain.length - 1 && <Separator>→</Separator>}
          </Link>
        ))}
      </CellWrapper>
    );
  }

  const firstFive = chain.slice(0, EDGE_COUNT);
  const middle = chain.slice(EDGE_COUNT, -EDGE_COUNT);
  const lastFive = chain.slice(-EDGE_COUNT);

  return (
    <CellWrapper>
      {firstFive.map((entry) => (
        <Link key={entry.userId}>
          <PersonAvatar entry={entry} />
          <Separator>→</Separator>
        </Link>
      ))}
      <Link>
        <CollapsedAvatar names={middle} />
        <Separator>→</Separator>
      </Link>
      {lastFive.map((entry, index) => (
        <Link key={entry.userId}>
          <PersonAvatar entry={entry} highlight={index === lastFive.length - 1} />
          {index < lastFive.length - 1 && <Separator>→</Separator>}
        </Link>
      ))}
    </CellWrapper>
  );
};

export default ReportingHierarchyCellRenderer;
