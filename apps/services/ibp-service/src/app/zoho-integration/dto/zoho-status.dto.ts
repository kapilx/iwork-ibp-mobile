import { ZohoSyncResultDto } from "./zoho-sync-result.dto";

export class ZohoStatusDto {
  connected!: boolean;
  zohoDomain?: string;
  zohoOrganizationId?: string;
  lastSyncedAt?: Date;
  lastSyncStats?: ZohoSyncResultDto;
}
