import { Injectable } from "@nestjs/common";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { ENV } from "../../../../service-lib/src/lib/environment";
import axios from "axios";

export interface ZohoEmployee {
  employeeId: string;       // EmployeeID
  firstName: string;        // FirstName
  lastName: string;         // LastName
  email: string;            // EmailID
  mobile: string;           // Mobile
  dateOfBirth: string;      // Date_of_birth (DD-MMM-YYYY)
  gender: string;           // Gender
  designation: string;      // Designation
  department: string;       // Department
  dateOfJoining: string;    // Dateofjoining
  employmentStatus: string; // Employeestatus
  ctc: string;              // Annual_Salary (may be empty)
}

@Injectable()
export class ZohoPeopleApiService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly baseUrl: string;

  constructor(private readonly traceIdService: TraceIdService) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
    this.baseUrl = ENV.ZOHO_BASE_URL ?? "https://people.zohoapis.in";
  }

  async getAllEmployees(accessToken: string): Promise<ZohoEmployee[]> {
    const employees: ZohoEmployee[] = [];
    let sindex = 1;
    const limit = 200;

    while (true) {
      const batch = await this.fetchPage(accessToken, sindex, limit);
      if (!batch.length) break;
      employees.push(...batch);
      if (batch.length < limit) break;
      sindex += limit;
      // Respect Zoho rate limit: 25 req/min
      await new Promise(r => setTimeout(r, 400));
    }

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ZohoPeopleApiService",
        method: "getAllEmployees",
        messageData: `Fetched ${employees.length} employees from Zoho`,
      }),
    });

    return employees;
  }

  private async fetchPage(
    accessToken: string,
    sindex: number,
    limit: number,
  ): Promise<ZohoEmployee[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/forms/employee/getRecords`,
        {
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
          params: { sindex, limit },
          timeout: 30_000,
        },
      );

      // Zoho response shape:
      // { response: { result: [ { "<ZohoRecordId>": [employeeObj] }, ... ] } }
      // Each element in result is a single-key object; the value is a 1-item array.
      const rawResult: any[] = response.data?.response?.result ?? [];
      const records = rawResult.flatMap((item: any) => {
        const key = Object.keys(item)[0];
        return Array.isArray(item[key]) ? item[key] : [];
      });
      return records.map((r: any) => this.mapRecord(r));
    } catch (error: any) {
      if (error?.response?.status === 429) {
        // Rate limited — wait 60 seconds and retry once
        await new Promise(r => setTimeout(r, 60_000));
        return this.fetchPage(accessToken, sindex, limit);
      }
      const statusCode = error?.response?.status;
      const zohoBody = error?.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ZohoPeopleApiService",
          method: "fetchPage",
          messageData: `Zoho API ${statusCode ?? "network"} error: ${error?.message} — response body: ${JSON.stringify(zohoBody ?? null)}`,
        }),
      });
      // Zoho's error shape: { response: { errors: { code, message } } } — surface just
      // that human-readable message rather than the full raw JSON to the caller. The
      // complete body is still captured in the log above for debugging.
      const zohoMessage: string | undefined = zohoBody?.response?.errors?.message ?? zohoBody?.message;
      if (zohoMessage) {
        throw new Error(zohoMessage.trim().replace(/\.+$/, ""));
      }
      if (zohoBody) {
        const detail = typeof zohoBody === "string" ? zohoBody : JSON.stringify(zohoBody);
        throw new Error(`Zoho People API returned ${statusCode}: ${detail}`);
      }
      throw error;
    }
  }

  private mapRecord(r: Record<string, any>): ZohoEmployee {
    const get = (key: string): string => (r[key] ?? "").toString().trim();
    return {
      employeeId:       get("EmployeeID"),
      firstName:        get("FirstName"),
      lastName:         get("LastName"),
      email:            get("EmailID"),
      mobile:           get("Mobile"),
      dateOfBirth:      get("Date_of_birth"),
      gender:           get("Gender"),
      designation:      get("Designation"),
      department:       get("Department"),
      dateOfJoining:    get("Dateofjoining"),
      employmentStatus: get("Employeestatus"),
      ctc:              get("Annual_Salary"),
    };
  }
}
