import React from "react";
import { Box, Skeleton } from "@mui/material";

// Shared first-load placeholders for the dashboard sections. Each one mirrors the
// row count and proportions of the real content so nothing shifts on swap-in.
// Refetches (filter changes) keep their existing spinner — a skeleton reappearing
// on every filter change reads as a page reset rather than an update.

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <Box sx={{ width: "100%" }}>
    <Box sx={{ display: "flex", gap: "12px", mb: "10px" }}>
      {range(cols).map((c) => (
        <Skeleton key={c} variant="text" height={18} sx={{ flex: 1 }} />
      ))}
    </Box>
    {range(rows).map((r) => (
      <Box key={r} sx={{ display: "flex", gap: "12px", mb: "8px" }}>
        {range(cols).map((c) => (
          <Skeleton
            key={c}
            variant="rounded"
            height={14}
            sx={{ flex: 1, borderRadius: "4px" }}
          />
        ))}
      </Box>
    ))}
  </Box>
);

export const ListSkeleton: React.FC<{ items?: number; height?: number }> = ({
  items = 4,
  height = 64,
}) => (
  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
    {range(items).map((i) => (
      <Skeleton
        key={i}
        variant="rounded"
        height={height}
        sx={{ borderRadius: "8px" }}
      />
    ))}
  </Box>
);

// Mirrors My Actionable's kanban layout: ListingFlex > N x ListingColumn, each a
// header ("Overdue & Today (4)") over stacked cards. Card counts taper across the
// columns because the real board is fullest on the left.
export const ColumnsSkeleton: React.FC<{
  columns?: number;
  cardsPerColumn?: number[];
  cardHeight?: number;
  showTabs?: boolean;
  // Breathing room under the section heading, which the real tab strip would
  // otherwise provide.
  marginTop?: string;
}> = ({
  columns = 3,
  cardsPerColumn = [3, 2, 1],
  cardHeight = 96,
  showTabs = false,
  marginTop = "24px",
}) => (
  <Box sx={{ width: "100%", mt: marginTop }}>
    {showTabs && (
      <Box sx={{ display: "flex", gap: "24px", mb: "20px" }}>
        {range(6).map((t) => (
          <Skeleton key={t} variant="text" height={18} sx={{ width: "72px" }} />
        ))}
      </Box>
    )}
    <Box sx={{ display: "flex", gap: "16px", width: "100%" }}>
      {range(columns).map((c) => (
        <Box
          key={c}
          sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <Skeleton variant="text" height={20} sx={{ width: "60%", mb: "4px" }} />
          {range(cardsPerColumn[c] ?? 2).map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={cardHeight}
              sx={{ borderRadius: "8px" }}
            />
          ))}
        </Box>
      ))}
    </Box>
  </Box>
);

export const BarRowsSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
    {range(rows).map((r) => (
      <Box key={r} sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Skeleton variant="text" height={14} sx={{ width: "18%" }} />
        <Skeleton
          variant="rounded"
          height={20}
          sx={{ width: `${90 - r * 15}%`, borderRadius: "4px" }}
        />
      </Box>
    ))}
  </Box>
);

export const FunnelSkeleton: React.FC<{ steps?: number }> = ({ steps = 5 }) => (
  <Box
    sx={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }}
  >
    {range(steps).map((s) => (
      <Skeleton
        key={s}
        variant="rounded"
        height={26}
        sx={{ width: `${92 - s * 14}%`, borderRadius: "4px" }}
      />
    ))}
  </Box>
);

export const PieSkeleton: React.FC<{ legendItems?: number }> = ({
  legendItems = 4,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "24px", width: "100%" }}>
    <Skeleton variant="circular" width={160} height={160} sx={{ flexShrink: 0 }} />
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
      {range(legendItems).map((i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Skeleton variant="rounded" width={12} height={12} />
          <Skeleton variant="text" height={14} sx={{ flex: 1, maxWidth: "70%" }} />
        </Box>
      ))}
    </Box>
  </Box>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 260 }) => (
  <Skeleton
    variant="rounded"
    height={height}
    sx={{ width: "100%", borderRadius: "8px" }}
  />
);