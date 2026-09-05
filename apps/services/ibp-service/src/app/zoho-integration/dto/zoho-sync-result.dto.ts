import type { ZohoEmployee } from "../zoho-people-api.service";

export class ZohoSyncResultDto {
  synced!: number;
  created!: number;
  updated!: number;
  skipped!: number;
  errors!: string[];
  durationMs!: number;
  employees!: ZohoEmployee[];
}
