import { IsObject, IsOptional } from "class-validator";

// Lets an admin test a config with hand-entered sample values instead of a real
// employee's data, e.g. { "POLICY": { "externalTpaPolicyId": "POL123" },
// "EMPLOYEE": { "companyEmployeeId": "EMP456" } }
export class PreviewSsoUrlDto {
  @IsObject()
  @IsOptional()
  context?: Record<string, Record<string, unknown>>;
}
