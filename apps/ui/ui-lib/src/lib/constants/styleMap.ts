import { theme } from "@ui/ui-lib/styles/Theme";
import redImage from "../assets/svgs/red.svg";
import greenImage from "../assets/svgs/green.svg";
import yellowImage from "../assets/svgs/yellow.svg";

export const sentimentStyleMap = {
  green: {
    backgroundColor: "transparent",
    color: theme.palette.text.primary,
    imageSrc: greenImage,
  },
  red: {
    backgroundColor: "transparent",
    color: theme.palette.text.primary,
    imageSrc: redImage,
  },
  yellow: {
    backgroundColor: "transparent",
    color: theme.palette.text.primary,
    imageSrc: yellowImage,
  },
};
