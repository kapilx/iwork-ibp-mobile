import React, { useEffect, useState } from "react";
import { ibpTheme } from "@ui/ui-lib";

/**
 * WELL-BEING — illustration helpers.
 * The refreshed module uses real 16:9 photography for media cards and the
 * gradient "Explore by need" tiles carry inline icons, so the only shared
 * illustration left is the wellness-score ring for KPI 1 (§9).
 */

/* ── Wellness-score ring (KPI 1, §9) ───────────────────────────────────── */

export const ScoreRing: React.FC<{
  value: number;
  max?: number;
  size?: number;
  /** Arc colour — defaults to the wellness green; the KPI passes its tint. */
  color?: string;
  /** Hide the number inside the arc when the value is printed beside it. */
  showValue?: boolean;
  /** Suffix rendered after the value inside the arc, e.g. "%". */
  unit?: string;
}> = ({ value, max = 100, size = 72, color = ibpTheme.palette.text.lightGreen, showValue = true, unit }) => {
  const r = 32;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const f = requestAnimationFrame(() => setOffset(c * (1 - pct / 100)));
    return () => cancelAnimationFrame(f);
  }, [c, pct]);
  return (
    <svg width={size} height={size} viewBox="0 0 76 76" aria-hidden="true">
      <circle cx="38" cy="38" r={r} fill="none" stroke={ibpTheme.palette.neutral.tableBorder} strokeWidth="4" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 38 38)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
      />
      {showValue && (
        <text
          x="38"
          y="44"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={ibpTheme.palette.text.primary}
          fontFamily="inherit"
        >
          {value}
          {unit && <tspan fontSize="14">{unit}</tspan>}
        </text>
      )}
    </svg>
  );
};
