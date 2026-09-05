import styled from "styled-components";

export const Content = styled('div')(({theme}) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const ContentImage = styled('img')(({theme}) => ({
  height:"206px",
  width:"306px"
}));