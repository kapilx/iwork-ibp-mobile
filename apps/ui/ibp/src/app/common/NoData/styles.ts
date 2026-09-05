import { Box, styled, Typography } from "@mui/material";

interface ContainerProps {
    compactView?: boolean;
}

export const Container = styled(Box)<ContainerProps>(({ theme, compactView }) => ({
    display: "flex",
    flexDirection: "column",
    minHeight: compactView ? "auto" : "100vh",
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2.5),
    paddingTop: compactView ? theme.spacing(10) : theme.spacing(25),
    [theme.breakpoints.down("md")]: {
        padding: theme.spacing(2),
        paddingTop: compactView ? theme.spacing(2) : theme.spacing(25),
    },
    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(1.5),
        paddingTop: compactView ? theme.spacing(1.5) : theme.spacing(25),
    },
}));

export const Breadcrumb = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    cursor: "pointer",
    width: "fit-content",
    marginLeft: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
    transition: "opacity 0.2s ease",
    "&:hover": {
        opacity: 0.7,
    },
    [theme.breakpoints.down("md")]: {
        marginLeft: theme.spacing(1.5),
        marginBottom: theme.spacing(1.5),
    },
    [theme.breakpoints.down("sm")]: {
        marginLeft: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

export const BreadcrumbArrow = styled("img")(({ theme }) => ({
    width: "24px",
    height: "24px",
    transform: "rotate(90deg)",
    [theme.breakpoints.down("md")]: {
        width: "20px",
        height: "20px",
    },
    [theme.breakpoints.down("sm")]: {
        width: "16px",
        height: "16px",
    },
}));

export const BreadcrumbText = styled("span")(({ theme }) => ({
    fontSize: "18px",
    color: "#222222",
    fontWeight: 500,
    [theme.breakpoints.down("md")]: {
        fontSize: "16px",
    },
    [theme.breakpoints.down("sm")]: {
        fontSize: "14px",
    },
}));

export const FlyingBirds = styled("img")(({ theme }) => ({
    position: "absolute",
    left: "150px",
    bottom: "200px",
    width: "90px",
    height: "auto",
    zIndex: 10,
    [theme.breakpoints.down("md")]: {
        left: "150px",
        bottom: "200px",
        width: "70px",
    },
    [theme.breakpoints.down("sm")]: {
        left: "80px",
        bottom: "60px",
        width: "50px",
    },
    [theme.breakpoints.down(400)]: {
        left: "70px",
        bottom: "100px",
        width: "40px",
    },
}));

export const Content = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center",
    padding: theme.spacing(3, 2),
    maxWidth: "100%",
    margin: "0 auto",
    width: "100%",
    [theme.breakpoints.down("md")]: {
        padding: theme.spacing(2, 1.5),
    },
    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(1.5, 1),
    },
}));

export const IllustrationContainer = styled(Box)(({ theme, removeMaxWidth }: { theme: any; removeMaxWidth?: boolean }) => ({
    width: "100%",
    maxWidth: removeMaxWidth ? "100%" : "600px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto",
    padding: theme.spacing(0, 1),
    position: "relative",
    [theme.breakpoints.down("md")]: {
        maxWidth: removeMaxWidth ? "100%" : "500px",
    },
    [theme.breakpoints.down("sm")]: {
        maxWidth: removeMaxWidth ? "100%" : "100%",
        padding: theme.spacing(0, 0.5),
    },
}));

export const IllustrationImage = styled("img")(({ theme }) => ({
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    objectFit: "contain",
    margin: 0,
}));

export const Divider = styled("hr")(({ theme }) => ({
    width: "100%",
    maxWidth: "650px",
    height: "0px",
    backgroundColor: "#000000",
    border: "1px solid #000000",
    position: "relative",
    bottom: "10px",
    [theme.breakpoints.down("md")]: {
        maxWidth: "550px",
        margin: theme.spacing(1.5, 0, 0.75, 0),
    },
    [theme.breakpoints.down("sm")]: {
        width: "100%",
        maxWidth: "100%",
        margin: theme.spacing(1, 0, 0.5, 0),
    },
}));

export const Title = styled(Typography)(({ theme }) => ({
    fontSize: "24px",
    fontWeight: 600,
    color: "#222222",
    margin: theme.spacing(1.5, 2, 1, 2),
    lineHeight: 1.4,
    maxWidth: "600px",
    [theme.breakpoints.down("md")]: {
        fontSize: "20px",
        margin: theme.spacing(1.25, 1.5, 0.75, 1.5),
    },
    [theme.breakpoints.down("sm")]: {
        fontSize: "18px",
        margin: theme.spacing(1, 1, 0.5, 1),
    },
    [theme.breakpoints.down(400)]: {
        fontSize: "16px",
    },
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
    fontSize: "16px",
    fontWeight: 400,
    color: "#222222",
    margin: theme.spacing(0, 2),
    lineHeight: 1.6,
    maxWidth: "600px",
    [theme.breakpoints.down("md")]: {
        fontSize: "14px",
        margin: theme.spacing(0, 1.5),
    },
    [theme.breakpoints.down("sm")]: {
        fontSize: "13px",
        lineHeight: 1.5,
        margin: theme.spacing(0, 1),
    },
    [theme.breakpoints.down(400)]: {
        fontSize: "12px",
    },
}));

export const SubtitleLink = styled("a")(({ theme }) => ({
    color: "#399BFC",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: 500,
    "&:hover": {
        color: "#399BFC",
    },
}));