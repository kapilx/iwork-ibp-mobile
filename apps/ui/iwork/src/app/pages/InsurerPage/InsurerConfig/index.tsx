import { CommonBreadcrumb } from "@ui/ui-lib";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import UtilityExcelUploadPage from "../../UtilityExcelUpload";
import { InsurerConfigContainer } from "./styles";
import { normalizeEntityType } from "../InsurerDetails";
import { EntityType } from "../../../constants/enum";
import { UTILITY_UPLOAD_ENTITY } from "../../../constants";

const InsurerConfig = () => {
  const { entityType: rawEntityType, id: entityId } = useParams();

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const entityType = normalizeEntityType(rawEntityType);

  const defaultConfigEntityName =
    entityType === EntityType.TPA ? UTILITY_UPLOAD_ENTITY.TPA_UPLOAD : UTILITY_UPLOAD_ENTITY.SEND_TO_INSURER;

  const configEntityName =
    searchParams.get("entityName") ||
    location.state?.configEntityName ||
    defaultConfigEntityName;

  const shouldUseConfigEntityName =
    entityType === EntityType.TPA && configEntityName === UTILITY_UPLOAD_ENTITY.UPLOAD_CLAIM;

  const uploadEntity = shouldUseConfigEntityName
    ? UTILITY_UPLOAD_ENTITY.UPLOAD_CLAIM
    : entityType === EntityType.TPA
      ? UTILITY_UPLOAD_ENTITY.TPA_UPLOAD
      : UTILITY_UPLOAD_ENTITY.SEND_TO_INSURER;

  const breadcrumbs = [
    {
      label: `Manage ${entityType || 'entity'}`,
      path: `/${entityType}`,
    },
    {
      label: location.state?.entityName || 'Entity Details',
      path: `/${entityType}/${entityId}`,
    },
    {
      label: 'Configuration',
    },
  ];

  return (
    <InsurerConfigContainer>
      <CommonBreadcrumb crumbs={breadcrumbs} />
      <UtilityExcelUploadPage entity={uploadEntity} />
    </InsurerConfigContainer>
  );
};

export default InsurerConfig;
