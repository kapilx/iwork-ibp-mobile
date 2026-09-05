import { Step } from "@ui/ui-lib";
import { CLAIMS_STEP_KEYS } from "../../../constants";
import { StateEnum } from "../../../components/NestedStepper/RenderComponent";
import { ClaimsDataUploadConfig } from "../ClaimsDataUpload/config";

export const claimUploadConfig: Step[] = [
  {
    key: CLAIMS_STEP_KEYS.UPLOAD_CLAIMS,
    title: "Upload claims",
    config: { ClaimsDataUploadConfig },
    checked: false,
    stepState: StateEnum.DRAFT,
  },
];
