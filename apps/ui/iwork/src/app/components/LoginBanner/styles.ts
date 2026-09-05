import { styled } from "@mui/material/styles";

export const RootContainer = styled("div")(({ theme }) => ({
  height: "calc(100vh - 32px)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  width: "60%",
  overflowY: "scroll",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  // Hide scrollbar for Webkit browsers
  "&::-webkit-scrollbar": {
    display: "none",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: "auto",
  },
}));

export const LeftPanel = styled("div")<{ isMobile: boolean }>`
  width: 100%;
  background-image: linear-gradient(to bottom right, #fef7df, #ffefc9);
  padding: 12px 40px 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
`;

export const ContentWrapper = styled("div")`
  max-width: 672px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 2;
`;

export const Section = styled("div")`
  display: flex;
  flex-direction: column;
`;

export const LoginBannerSectionTitle = styled("h2")`
  font-size: 20px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #2b2b2b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  > span {
    height: 24px;
  }
`;

export const SectionSubtitle = styled("p")`
  color: #666666;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
`;

export const QuoteBox = styled("div")`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: #ffffff66;
  border-radius: 0.5rem;
  border: 1px solid #fff;
  display: inline-block;
  > span {
    font-size: 14px;
    font-style: italic;
  }
`;

export const TrustStats = styled("div")`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: space-between;
`;

export const PresenceText = styled("p")`
  margin-top: 12px;
  margin-bottom: 0;
  font-size: 0.95rem;
  color: #666666;
  span {
    font-weight: 500;
    color: #2b2b2b;
  }
`;
// ServiceCard styles
export const ServiceCardContainer = styled("div")`
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #fff;
  transition: all 0.3s;
  margin-bottom: 0.5rem;
  background-color: #ffffff66;

  > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    span {
      font-size: 1.25rem;
      color: #ffd600;
    }
    p {
      color: #2b2b2b;
      font-weight: 500;
      margin: 0;
    }
  }
`;

// StatsCounter styles
export const StatsCounterContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
export const StatsCounterIcon = styled("div")`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  color: #ffd600;
`;
export const StatsCounterValue = styled("div")`
  font-size: 1.25rem;
  font-weight: bold;
  color: #2b2b2b;
`;
export const StatsCounterLabel = styled("div")`
  font-size: 0.95rem;
  color: #666666;
`;

// ValueItem styles
export const ValueItemContainer = styled("div")`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
`;
export const ValueItemIcon = styled("span")`
  font-size: 1.1rem;
  color: #ffd600;
`;
export const ValueItemLabel = styled("span")`
  color: #666666;
`;

// Banner styles
export const BannerContainer = styled("div")`
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #fff;
  width: 100%;
  height: 100%;
  min-height: 113px;
  background-color: #ffffff66;
`;
export const BannerContent = styled("div")`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;
export const BannerIcon = styled("div")`
  font-size: 1.25rem;
  color: #ffd600;
`;
export const BannerTitle = styled("h3")`
  font-size: 18px;
  font-weight: 600;
  color: #2b2b2b;
  margin-bottom: 0.25rem;
  margin-top: 0;
`;
export const BannerDescription = styled("p")`
  color: #666666;
  margin: 0;
  font-size: 16px;
`;

// OfflineMessage styles
export const OfflineMessageContainer = styled("div")`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #ffd600;
  color: #2b2b2b;
  text-align: center;
  padding: 0.5rem;
  z-index: 100;
`;

// MainTitle styles
export const MainTitle = styled("h1")<{ isMobile: boolean }>(({ theme }) => ({
  color: theme.palette.text.black,
  fontSize: theme.typography.fontSizes.xxll,
  fontWeight: theme.typography.fontWeights.bold,
  letterSpacing: "-0.5px",
  margin: 0,

  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
}));

export const CarouselArrowButton = styled("button")<{
  left?: boolean;
  right?: boolean;
}>(({ left, right, theme }) => ({
  position: "absolute",
  top: "50%",
  left: left ? "-3.5rem" : undefined,
  right: right ? "-3.5rem" : undefined,
  transform: "translateY(-50%)",
  background: theme.palette.background.paper,
  border: "none",
  borderRadius: "50%",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 2,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  transition: "background 0.2s",

  [theme.breakpoints.down("lg")]: {
    left: left ? "-2.4rem" : undefined,
    right: right ? "-2.4rem" : undefined,
  },
}));

export const CarouselArrowIcon = styled("span")`
  height: 20px;
`;

export const ScrollButton = styled("div")`
  cursor: pointer;
`;

export const ScrollButtonWrapper = styled("button")<{
  bottomRight?: boolean;
}>(({ bottomRight, theme }) => ({
  position: "fixed",
  bottom: bottomRight ? 19 : undefined,
  right: bottomRight ? "calc(100% - 60%)" : undefined, // 32px for a more standard offset
  background: theme.palette.background.paper || "#ffffff",
  border: "none",
  borderRadius: "50%",
  width: 65,
  height: 65,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 999,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  transition: "background 0.2s, transform 0.3s",
  marginRight: 20,
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const ScrollIconWrapper = styled("img")<{ rotate: boolean }>`
  transform: ${({ rotate }) => (rotate ? "rotate(180deg)" : "rotate(0deg)")};
`;

export const ScrollIconlabel = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.chips.senary,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const CarouselWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  position: "relative",

  [theme.breakpoints.down("sm")]: {
    width: "92%",
    margin: "0 auto",
  },
}));
