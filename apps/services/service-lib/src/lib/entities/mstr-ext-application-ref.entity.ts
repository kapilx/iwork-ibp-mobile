import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * Entity representing external application reference configuration
 * Used for dynamic SSO link generation with verification and magic URL flow
 */
// @ts-ignore - TypeORM decorators
@Entity({ name: "mstr_ext_application_ref" })
export class MstrExtApplicationRef {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "label", type: "text" })
    label: string;

    @Column({ name: "description", type: "text", nullable: true })
    description: string;

    @Column({ name: "verification_token_api_url", type: "text", nullable: true })
    verificationTokenApiUrl: string | null;

    @Column({ name: "verification_token_api_method", type: "varchar", length: 10, nullable: true })
    verificationTokenApiMethod: string | null;

    @Column({ name: "verification_token_api_payload", type: "jsonb", nullable: true })
    verificationTokenApiPayload: Record<string, any>;

    @Column({ name: "verification_token_api_headers", type: "jsonb", nullable: true })
    verificationTokenApiHeaders: Record<string, any> | null;

    @Column({ name: "magic_url_api_url", type: "text", nullable: true })
    magicUrlApiUrl: string | null;

    @Column({ name: "magic_url_api_method", type: "varchar", length: 10, nullable: true })
    magicUrlApiMethod: string | null;

    @Column({ name: "magic_url_api_payload", type: "jsonb", nullable: true })
    magicUrlApiPayload: Record<string, any>;

    @Column({ name: "magic_url_api_headers", type: "jsonb", nullable: true })
    magicUrlApiHeaders: Record<string, any> | null;

    @Column({ name: "container_category", type: "text" })
    containerCategory: string;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive: boolean;

    @Column({ name: "iss", type: "text", nullable: true, default: null })
    iss: string | null;

    @Column({ name: "expires_in", type: "varchar", length: 20, default: "10m" })
    expiresIn: string;

    @Column({ name: "auth_type", type: "varchar", length: 20, default: "JWT" })
    authType: string;

    @Column({ name: "step1_response_token_key", type: "varchar", length: 100, default: "verificationToken" })
    step1ResponseTokenKey: string;

    @Column({ name: "step2_response_data_key", type: "varchar", length: 100, default: "magicLink" })
    step2ResponseDataKey: string;

    // Per-placeholder hints tagged in the API config form
    // e.g. { "policyNo": { type: "DYNAMIC" }, "userName": { type: "STATIC", staticValue: "IIRMHO" } }
    @Column({ name: "field_hints", type: "jsonb", nullable: true })
    fieldHints: Record<string, { type: "STATIC" | "DYNAMIC"; staticValue?: string }> | null;

    @Column({ name: "payload_format", type: "varchar", length: 10, default: "JSON", nullable: true })
    payloadFormat: string | null;

    // REDIRECT | DISPLAY | SYNC | DIRECT_CALL (default REDIRECT for backward compat with existing configs)
    @Column({ name: "flow_type", type: "varchar", length: 20, default: "REDIRECT" })
    flowType: string;

    // SYNC flow — primary DB table to write fetched data into, e.g. "mstr_hospital"
    @Column({ name: "sync_target_table", type: "varchar", length: 100, nullable: true })
    syncTargetTable: string | null;

    // SYNC flow — column used for ON CONFLICT upsert deduplication, e.g. "external_hospital_id"
    @Column({ name: "sync_dedup_column", type: "varchar", length: 100, nullable: true })
    syncDedupColumn: string | null;

    // SYNC flow — PER_POLICY | PER_TPA | GLOBAL
    @Column({ name: "sync_scope", type: "varchar", length: 20, nullable: true })
    syncScope: string | null;

    // SYNC flow — cron expression driving the scheduler, e.g. "30 13 * * *"
    @Column({ name: "sync_schedule", type: "varchar", length: 50, nullable: true })
    syncSchedule: string | null;

    // SYNC flow — skip sync run if last successful run was within this many hours (default 24)
    @Column({ name: "sync_ttl_hours", type: "integer", nullable: true, default: 24 })
    syncTtlHours: number | null;

    // SYNC flow — all DB tables this sync writes to (multi-table support, stored as JSON array)
    @Column({ name: "sync_tables", type: "jsonb", nullable: true })
    syncTables: string[] | null;

    // BASIC_AUTH — username and password stored directly (used when authType = "BASIC_AUTH")
    @Column({ name: "basic_auth_user", type: "varchar", length: 200, nullable: true })
    basicAuthUser: string | null;

    @Column({ name: "basic_auth_password", type: "varchar", length: 500, nullable: true })
    basicAuthPassword: string | null;
    // New columns for extended TPA auth types
    @Column({ name: "token_placement", type: "varchar", length: 20, default: "BEARER_HEADER", nullable: true })
    tokenPlacement: string;

    // The word placed before the token in the Authorization header (e.g. "Bearer", "Token",
    // "JWT") — some TPAs use a non-standard prefix instead of the conventional "Bearer".
    @Column({ name: "token_header_prefix", type: "varchar", length: 20, default: "Bearer", nullable: true })
    tokenHeaderPrefix: string | null;

    @Column({ name: "step2_header_template", type: "jsonb", nullable: true })
    step2HeaderTemplate: Record<string, any> | null;

    @Column({ name: "token_body_key", type: "varchar", length: 100, nullable: true })
    tokenBodyKey: string | null;

    // Content-Type for the data API call. Defaults to JSON; set to
    // 'application/x-www-form-urlencoded' for TPAs like FHPL.
    @Column({ name: "step2_content_type", type: "varchar", length: 50, nullable: true })
    step2ContentType: string | null;

    // Shared Step 1: points to another app ref whose Step 1 auth config this ref reuses.
    // NULL = this app ref owns its own Step 1 (existing behavior unchanged).
    @Column({ name: "auth_app_ref_id", type: "integer", nullable: true })
    authAppRefId: number | null = null;

    // E-card only: for TPAs with two separate APIs (family vs individual, e.g. Health India),
    // set on the FAMILY config to point at the INDIVIDUAL config's id. NULL when one API serves
    // both via a param (Good Health) or only a family card exists (FHPL) -- those need no link.
    @Column({ name: "individual_ecard_app_ref_id", type: "integer", nullable: true })
    individualEcardAppRefId: number | null = null;

    // E-card only: for TPAs whose single API returns ALL covered members in one array response
    // (e.g. Vidal Health -- {"data":[{relationship,ecardUrl},...]}). Dot-notation path to that
    // array within the raw response, e.g. "data". NULL for TPAs returning one card per call.
    @Column({ name: "ecard_array_response_key", type: "varchar", length: 200, nullable: true })
    ecardArrayResponseKey: string | null = null;

    // Field name within each array element (set via ecardArrayResponseKey) holding that member's
    // relation, e.g. "relationship" -- matched case-insensitively against the requested member's
    // relation to pick the right element before applying the usual STANDARD_KEY mapping.
    @Column({ name: "ecard_relation_match_field", type: "varchar", length: 200, nullable: true })
    ecardRelationMatchField: string | null = null;

    // E-card only: FAMILY_ONLY | PARAM_DRIVEN | ARRAY_ALL_MEMBERS | SEPARATE_APIS -- which of the
    // four known e-card architectures this TPA uses. Drives which iWork fields are shown; not
    // read by the actual SSO/mapping logic itself (that just checks whether the relevant fields
    // -- individualEcardAppRefId, ecardArrayResponseKey -- are set, regardless of this label).
    @Column({ name: "ecard_response_mode", type: "varchar", length: 30, nullable: true })
    ecardResponseMode: string | null = null;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;

    @Column({ name: "created_by", type: "integer", nullable: true })
    createdBy: number;

    @Column({ name: "updated_by", type: "integer", nullable: true })
    updatedBy: number;
}
