/**
 * Shared "light-up" hover treatment for the dashboard banner CTAs.
 * - a glossy sheen streak sweeps across the button
 * - the button lifts + scales slightly
 * - a colored glow blooms behind it
 * All on fluid easeOutExpo timing, disabled under prefers-reduced-motion.
 *
 * Spread the result into a styled(Button) definition:
 *   ...fluidCtaHover({ hover: "#37601F", glow: "rgba(46,77,31,.45)" })
 */
const EASE = "cubic-bezier(.19,1,.22,1)"; // easeOutExpo — very fluid

export const fluidCtaHover = (opts: {
  hover: string; // background on hover (slightly brighter = "lights up")
  glow: string; // rgba glow color
  sheen?: string; // optional override for the sheen gradient
}) => ({
  position: "relative" as const,
  overflow: "hidden" as const,
  willChange: "transform",
  transition: `transform .5s ${EASE}, box-shadow .5s ${EASE}, background-color .35s ease`,
  "&::before": {
    content: '""',
    position: "absolute" as const,
    top: 0,
    left: "-150%",
    width: "70%",
    height: "100%",
    background:
      opts.sheen ||
      "linear-gradient(120deg, transparent 0%, rgba(255,255,255,.55) 50%, transparent 100%)",
    transform: "skewX(-20deg)",
    transition: `left .8s ${EASE}`,
    pointerEvents: "none" as const,
  },
  "&:hover": {
    background: opts.hover,
    transform: "translateY(-2px) scale(1.035)",
    boxShadow: `0 10px 26px ${opts.glow}`,
  },
  "&:hover::before": {
    left: "150%",
  },
  "&:active": {
    transform: "translateY(0) scale(.99)",
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "background-color .2s ease",
    "&::before": { display: "none" },
    "&:hover": { transform: "none", boxShadow: `0 0 0 ${opts.glow}` },
  },
});
