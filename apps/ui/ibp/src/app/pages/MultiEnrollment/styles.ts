import styled from "styled-components";

export const PageContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent:"space-between",
  flexDirection: "column",
  width: "100%",
  minHeight: "100vh",
  position: "relative",
}));

export const StyledEnrollContainer = styled("div")<{ $fullWidth?: boolean }>(({ theme, $fullWidth }) => ({
  display: "flex",
  maxWidth: $fullWidth ? "100%" : "1920px",
  width:"100%",
  margin: "0 auto",
  alignItems: "start",
  justifyContent: "center",
  padding: "0 40px",
  "@media (min-width: 360px) and (max-width: 1024px)": {
    flexDirection: "column",
    padding: "0 16px",
    alignItems: "stretch",
  },
}));

export const FooterBannerWrapper = styled("div")(({ theme }) => ({
  position: "sticky",
  bottom: 0,
  left: 0,
  right: 0,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  minHeight: "fit-content",
  zIndex: 99,
  backgroundColor: "transparent",
  "@media (min-width: 360px) and (max-width: 768px)": {
    backgroundColor: "#ffffff",
    boxShadow: "0px -2px 12px rgba(0,0,0,0.08)",
    padding: "8px 12px",
  },
}));
export const CalculatorMainContainer = styled("div")(({ theme }) => ({
  position: "sticky",
  top: "90px",
  marginTop: "-225px",
  marginRight: "40px",
  "@media (min-width: 360px) and (max-width: 1024px)": {
    position: "relative",
    top: "auto",
    marginTop: "16px",
    marginRight: 0,
    width: "100%",
  },
}));
