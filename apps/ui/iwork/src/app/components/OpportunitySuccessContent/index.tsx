import { MODAL_CONTENT } from "@ui/ui-lib";
import { Box, Typography } from "@mui/material";
import modelImage from "../../assets/svgs/modal-content-image.svg";
import { Content, ContentImage } from "./styles.js";

const OpportunitySuccessContent = () => {
  return (
    <Box>
      <Typography>{MODAL_CONTENT}</Typography>
      <Content>
        <ContentImage src={modelImage} />
      </Content>
    </Box>
  );
};

export default OpportunitySuccessContent;
