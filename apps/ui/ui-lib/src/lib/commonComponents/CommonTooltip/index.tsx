import React from "react";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import { SxProps } from "@mui/system";
import { theme } from "@ui/ui-lib/styles/Theme";

interface CommonTooltipProps extends Omit<TooltipProps, "title"> {
  title: React.ReactNode;
  tooltipSx?: SxProps;
  arrow?: boolean;
  children: React.ReactElement;
}

const CommonTooltip: React.FC<CommonTooltipProps> = ({
  title,
  tooltipSx = {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2.5),
    width: "max-content",
  },
  children,
  ...rest
}) => {
  return (
    <Tooltip
      title={title}
      componentsProps={{
        tooltip: {
          sx: tooltipSx,
        },
      }}
      {...rest}
    >
      {children}
    </Tooltip>
  );
};

export default CommonTooltip;
