import { Box, Typography } from "@mui/material";
import styled from "styled-components";

export const FormTitle = styled(Typography)`
  margin-bottom: ${({ theme }) => theme.spacing?.(3) || "24px"};
  color: ${({ theme }) => theme.palette?.primary?.main || "black"};
  font-weight: bold;
`;
