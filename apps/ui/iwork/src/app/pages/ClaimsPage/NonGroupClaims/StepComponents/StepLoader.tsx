import { CircularProgress } from "@mui/material";

import { LoaderContainer } from "../../styles";

const StepLoader = () => (
  <LoaderContainer>
    <CircularProgress color="secondary" />
  </LoaderContainer>
);

export default StepLoader;
