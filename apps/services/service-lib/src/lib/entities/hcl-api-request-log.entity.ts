import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

// One row PER INBOUND HTTP CALL to the HCL integration (not per employee —
// that's what hcl_employee_intake already does, and a single call carrying
// multiple employees/dependents duplicates the same raw payload across each
// of those rows on purpose, for per-record traceability; that's staying as-
// is). This table exists to answer a different question: what did HCL
// actually send us, on the wire, for a given call — endpoint, method,
// caller IP, whatever credentials/headers came with it, our full response,
// and when — independent of whether that call parsed into 0, 1, or 50
// hcl_employee_intake rows. See:
// docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §16.
@Entity({ name: "hcl_api_request_log" })
@Index(["createdAt"])
export class HclApiRequestLog {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // e.g. "/integrations/hcl/process-enroll-data" — the route actually hit,
  // not a hardcoded constant, so this table stays accurate if/when a second
  // HCL route (or a future TPA's route, if this table is ever reused) is
  // added under external-integration-service.
  @Column({ name: "endpoint", type: "varchar", length: 255 })
  endpoint!: string;

  @Column({ name: "http_method", type: "varchar", length: 10 })
  httpMethod!: string;

  // req.ip (respects Express's trust-proxy setting, so this is the real
  // client IP behind api-gateway when that's configured, not just the
  // gateway's own address) — nullable since it's best-effort.
  @Column({ name: "request_ip", type: "varchar", length: 64, nullable: true })
  requestIp?: string | null;

  // Full incoming request headers, verbatim. Deliberately includes
  // Authorization / whatever the caller sent — this route is on
  // AuthGuard's bypass list (unauthenticated inbound push), so this is the
  // ONLY record of what credentials (if any) actually arrived; HCL's
  // documented UserName/Password fields also live inside requestPayload
  // itself (body-level, not headers), captured there too.
  @Column({ name: "request_headers", type: "jsonb", nullable: true })
  requestHeaders?: Record<string, unknown> | null;

  // Full request body, verbatim — the exact same raw payload
  // hcl_employee_intake also stores per-row, but here exactly once per call.
  @Column({ name: "request_payload", type: "jsonb", nullable: true })
  requestPayload?: unknown;

  @Column({ name: "response_status", type: "int", nullable: true })
  responseStatus?: number | null;

  // The exact JSON body we sent back (HCL's documented GetEmpDetails/
  // GetEmpStatus/GetStatus shape, or the generic failure shape on an
  // unexpected throw).
  @Column({ name: "response_payload", type: "jsonb", nullable: true })
  responsePayload?: unknown;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
