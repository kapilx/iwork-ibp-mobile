import { FormControl, FormControlLabel, Radio, styled } from "@mui/material";

export const CommonRadioButtonStyledFormControl = styled(FormControl)`
  width: 100%;
`;

export const StyledFormControlLabel = styled(FormControlLabel)<{
  customStyles?: React.CSSProperties;
}>`
  ${({ customStyles }) => customStyles && { ...customStyles }}
`;

export const StyledRadio = styled(Radio)<{
  customStyles?: React.CSSProperties;
}>`
  ${({ customStyles }) => customStyles && { ...customStyles }}
  color: ${({ theme }) => theme.palette.secondary.selected};
  &.Mui-checked {
    color: ${({ theme }) => theme.palette.secondary.selected};
  }
  .MuiSvgIcon-root {
    border-radius: ${({ theme }) => theme.shape.borderRadii.circle};
  }

  &:hover .MuiSvgIcon-root {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
`;
