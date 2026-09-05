import { Box, styled, Typography } from "@mui/material";

export const BannerContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",

}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing(4),
    color: theme.palette.text.LightDark,
}));

export const BannerBox = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
    height: "200px",
    background: "linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)",
    [theme.breakpoints.between("sm", "md")]: {
        height: "auto",
        minHeight: "120px",
        marginTop: theme.spacing(-2),
    },
    [theme.breakpoints.down("sm")]: {
        height: "auto",
        minHeight: "auto",
        marginTop: theme.spacing(-2),

    },
}));

export const LeftSection = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    overflow: "hidden",
}));

export const BackgroundImg = styled("img")(({ theme }) => ({
    width: "462px",
    height: "100%",
    objectFit: "cover",
    objectPosition: "bottom",
    flexShrink: 0,
    [theme.breakpoints.between("sm", "md")]: {
        width: "160px",
        height: "auto",
    },
    [theme.breakpoints.down("sm")]: {
        display: "none",
    },
}));

export const RightSection = styled(Box)(({ theme }) => ({
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: theme.spacing(4, 6),
    gap: theme.spacing(5),
    [theme.breakpoints.between("sm", "md")]: {
        padding: theme.spacing(3, 4),
        gap: theme.spacing(3),
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(3),
        gap: theme.spacing(2.5),
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    "@media (max-width: 768px)": {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        padding: theme.spacing(2, 2.5),
        gap: theme.spacing(2),
        alignItems: "start",
        justifyContent: "unset",
    },
}));

export const InfoItem = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(3),
    "@media (max-width: 768px)": {
        gap: theme.spacing(1.5),
        alignItems: "flex-start",
    },
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    "@media (max-width: 768px)": {
        "& img": {
            width: "36px",
            height: "36px",
        },
    },
    "@media (max-width: 480px)": {
        "& img": {
            width: "28px",
            height: "28px",
        },
    },
}));

export const InfoContent = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    minWidth: 0,
    overflow: "hidden",
}));

export const ValueTypography = styled(Typography)(({ theme }) => ({
    fontWeight: theme.typography.fontWeights.medium,
    fontSize: "28px",
    lineHeight: "100%",
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.background.paper,
    wordBreak: "break-word",
    [theme.breakpoints.between("sm", "md")]: {
        fontSize: "20px",
    },
    [theme.breakpoints.down("sm")]: {
        fontSize: "18px",
    },
    "@media (max-width: 768px)": {
        fontSize: "16px",
    },
    "@media (max-width: 480px)": {
        fontSize: "11px",
    },
    "@media (max-width: 360px)": {
        fontSize: "11px",
    },
}));

export const LabelTypography = styled(Typography)(({ theme }) => ({
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.background.paper,
    "@media (max-width: 768px)": {
        fontSize: "12px",
    },
    "@media (max-width: 480px)": {
        fontSize: "11px",
    },
}));

export const GstLabelTypography = styled(Typography)(({ theme }) => ({
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: "10px",
    fontFamily: theme.typography.fontFamily,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: "2px",
    "@media (max-width: 480px)": {
        fontSize: "9px",
    },
}));

export const Separator = styled("img")(({ theme }) => ({
    height: "60px",
    width: "auto",
    margin: theme.spacing(0, 2),
    [theme.breakpoints.between("sm", "md")]: {
        display: "none",
    },
    [theme.breakpoints.down("sm")]: {
        display: "none",
    },
}));
