import styled from "styled-components";

export const ThumbnailBlock = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
}));

export const ThumbnailCard = styled("div")(({}) => ({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.15)",
  maxWidth: "345px",
}));

export const ThumbnailContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: "-100px",
  padding: "12px",
  paddingTop: "65px",
  borderRadius: "8px",
  background:
    "linear-gradient(359.25deg, #FFFFFF 56.24%, rgba(242, 242, 242, 0) 99.36%)",

  width: "100%",
}));

export const ThumbDate = styled("div")(({ theme }) => ({
  fontSize: "10px",

  fontWeight: 500,
  color: "#26262699",
  marginBottom: "10px",
}));
export const ThumbTitle = styled("div")(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 400,
  color: theme.palette.text.primary,
  marginBottom: "4px",
}));
export const ThumbDescription = styled("div")(({ theme }) => ({
  fontSize: "12px",
}));

export const Thumbnail = styled("div")(({ theme }) => ({
  width: "345px",
  height: "210px",
  objectFit: "cover",
  cursor: "pointer",
  marginTop: "auto",
}));
