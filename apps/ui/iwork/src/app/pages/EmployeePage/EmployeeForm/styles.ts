import { Box, Paper, styled, Typography } from "@mui/material";

export const EmployeeFormContainer = styled("div")`
  width: 100%;
  margin: auto;
`;

export const FormWrapper = styled(Paper)`
  padding: ${({ theme }) => theme.spacing?.(3) || "24px"};
  margin: ${({ theme }) => theme.spacing?.(2) || "16px"};
  border-radius: ${({ theme }) => theme.spacing?.(1) || "8px"};
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
`;

export const EmployeeFormStyledBox = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing?.(2) || "16px"};
  margin-top: ${({ theme }) => theme.spacing?.(2) || "16px"};
  padding: ${({ theme }) => theme.spacing?.(2) || "16px"};
  margin-right: ${({ theme }) => theme.spacing?.(2) || "12px"};
  justify-content: flex-end;
`;

export const TitleContainer = styled(Typography)(({ theme }) => ({
  maxWidth: "1254px",
  margin: "0 auto",
}));

export const AccessWarningModalContent = styled("div")(({ theme }) => ({
  padding: theme.spacing(2, 0),
}));
