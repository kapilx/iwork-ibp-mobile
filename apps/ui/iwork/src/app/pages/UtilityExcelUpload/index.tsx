
import { useParams } from "react-router-dom";
import { GenericExcelUploader } from "./GenericExcelUploader";
import { DIRECTION } from "./constants";
import { UTILITY_UPLOAD_ENTITY } from "../../constants";

const UtilityExcelUploadPage = ({ entity, showDownloadIcon }: { entity: string; showDownloadIcon?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const direction = (entity === UTILITY_UPLOAD_ENTITY.SEND_TO_INSURER || entity === UTILITY_UPLOAD_ENTITY.SEND_TO_CLIENT)
    ? DIRECTION.OUTBOUND
    : DIRECTION.INBOUND;
  return (
    <GenericExcelUploader
      companyId={id || null}
      entity={entity}
      direction={direction}
      showDownloadIcon={showDownloadIcon}
    />
  );
};

export default UtilityExcelUploadPage;
