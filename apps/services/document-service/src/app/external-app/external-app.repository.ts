import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { MstrExtAppResponseMapping } from "../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";

@Injectable()
export class ExternalAppRepository {
    constructor(
        @InjectRepository(MstrExtApplicationRef)
        private readonly extAppRepository: Repository<MstrExtApplicationRef>,
        @InjectRepository(MstrExtAppResponseMapping)
        private readonly responseMappingRepo: Repository<MstrExtAppResponseMapping>,
    ) {}

    async findByLabel(label: string): Promise<MstrExtApplicationRef | null> {
        return this.extAppRepository.findOne({
            where: { label, isActive: true }
        });
    }

    async findById(id: number): Promise<MstrExtApplicationRef | null> {
        return this.extAppRepository.findOne({ where: { id } });
    }

    findResponseMappings(appRefId: number): Promise<MstrExtAppResponseMapping[]> {
        return this.responseMappingRepo.find({
            where: { appRefId },
            order: { step: "ASC", displayOrder: "ASC" },
        });
    }

    // Prevents the file-proxy endpoint from being used as an open SSRF relay: only hosts on the
    // same base domain as a configured TPA app ref's own API URLs are allowed to be proxied.
    // Compares base domain (last two labels, e.g. "fhpl.net"), not the exact hostname, since a
    // TPA's actual file-download host commonly differs from its API host as a subdomain
    // (e.g. API on "bconnect-api.fhpl.net", downloads served from "www.fhpl.net").
    async isAllowedProxyHost(hostname: string): Promise<boolean> {
        const rows: { host: string }[] = await this.extAppRepository.manager.query(
            `SELECT DISTINCT
                lower(split_part(split_part(url, '://', 2), '/', 1)) AS host
             FROM (
                SELECT verification_token_api_url AS url FROM mstr_ext_application_ref WHERE verification_token_api_url IS NOT NULL
                UNION ALL
                SELECT magic_url_api_url AS url FROM mstr_ext_application_ref WHERE magic_url_api_url IS NOT NULL
             ) urls`,
        );
        const baseDomain = (host: string) => host.split(":")[0].split(".").slice(-2).join(".");
        const allowedBaseDomains = new Set(rows.map((r) => baseDomain(r.host)));
        return allowedBaseDomains.has(baseDomain(hostname));
    }

    async resolveFieldMappings(
        appRefId: number,
        context: { employeeId?: number; policyId?: number },
    ): Promise<Record<string, string>> {
        const rows: {
            external_field_name: string;
            source_type: string;
            source_field: string | null;
            static_value: string | null;
            date_format: string | null;
        }[] = await this.extAppRepository.manager.query(
            `SELECT DISTINCT ON (f.external_field_name)
                f.external_field_name, f.source_type, f.source_field, f.static_value, f.date_format
             FROM tpa_payload_field_mapping f
             JOIN tpa_external_feature_config c ON c.id = f.feature_config_id
             WHERE c.app_ref_id = $1`,
            [appRefId],
        );

        const result: Record<string, string> = {};

        for (const row of rows) {
            const key = row.external_field_name;
            let value: string | null = null;

            if (row.source_type === "STATIC") {
                value = row.static_value;
            } else if (row.source_type !== "USER_INPUT" && row.source_field) {
                // DB table lookup — source_type is the table name
                const contextId = this.getContextId(row.source_type, context);
                if (contextId) {
                    try {
                        const dbRows = await this.extAppRepository.manager.query(
                            `SELECT "${row.source_field}" FROM "${row.source_type}" WHERE id = $1 LIMIT 1`,
                            [contextId],
                        );
                        const raw = dbRows[0]?.[row.source_field] ?? null;
                        if (raw !== null) {
                            if (raw instanceof Date) {
                                // Normalise to YYYY-MM-DD so the date transform can parse it
                                const d = raw;
                                value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            } else {
                                value = String(raw);
                            }
                        }
                    } catch {
                        // column/table not found — leave value null
                    }
                }
            }

            if (value !== null && value !== undefined) {
                result[key] = value;
            }
        }

        return result;
    }

    private getContextId(
        sourceType: string,
        context: { employeeId?: number; policyId?: number },
    ): number | null {
        // Check for "employee" first — table names like "policy_enrollment_employee" start with
        // "policy" but are keyed by employee id, not policy id. Substring match here avoids
        // misclassifying them as policy-context tables based on the "policy" prefix below.
        if (/employee/i.test(sourceType)) return context.employeeId ?? null;
        if (/^(policy|endorsement|group_policy|tpa_external)/.test(sourceType)) return context.policyId ?? null;
        return null;
    }
}