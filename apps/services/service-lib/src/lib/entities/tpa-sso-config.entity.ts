import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Tpa } from "./tpa.entity";
import { TpaSsoFieldMapping } from "./tpa-sso-field-mapping.entity";

// Per-TPA config for the "encrypt-and-redirect" style SSO (WebAce/GHPL, FHPL, Vidal, HITPA, ...).
// One row per TPA. The actual secret values never live here — only the *names* of the
// environment variables that hold them (sso_key_env_name / sso_iv_env_name); IT provisions
// the real values on the server. See docs/... SSO integration notes for the per-TPA matrix.
@Entity({ name: "tpa_sso_config" })
export class TpaSsoConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tpa_id", type: "int", unique: true })
  tpaId: number;

  // Base portal/redirect URL, e.g. https://webace.goodhealthtpa.in/PrudentSSO.aspx —
  // any constant query params can be typed directly into this string. Each
  // tpa_sso_field_mapping row is appended automatically as its own `key=value` pair.
  @Column({ name: "portal_url", type: "text" })
  portalUrl: string;

  // Name of the env var holding the real symmetric key, e.g. "WEBACE_SSO_KEY". Never the key itself.
  @Column({ name: "sso_key_env_name", type: "varchar", length: 100 })
  ssoKeyEnvName: string;

  // Name of the env var holding the fixed IV, if this TPA uses one. Null when iv_mode is
  // KEY_AS_IV or RANDOM_EMBEDDED (no separate stored IV needed in either case).
  @Column({ name: "sso_iv_env_name", type: "varchar", length: 100, nullable: true })
  ssoIvEnvName: string | null;

  // How the raw string from sso_key_env_name should be turned into key bytes.
  // utf8 = raw ASCII/UTF-8 string (GHPL, FHPL, HITPA) | base64 = base64-encoded key (Vidal)
  @Column({ name: "sso_key_encoding", type: "varchar", length: 20, default: "utf8" })
  ssoKeyEncoding: "utf8" | "base64";

  // PKCS7 (Node default auto-padding) | ISO10126 (some .NET TPAs — implemented manually,
  // Node has no native support)
  @Column({ name: "sso_padding", type: "varchar", length: 20, default: "PKCS7" })
  ssoPadding: "PKCS7" | "ISO10126";

  // Where the IV comes from:
  //   FIXED         — read from sso_iv_env_name (GHPL, HITPA)
  //   KEY_AS_IV      — first 16 bytes of the key itself, no separate IV (FHPL AES-256)
  //   RANDOM_EMBEDDED — fresh random IV per call, prepended to the ciphertext (Vidal)
  @Column({ name: "sso_iv_mode", type: "varchar", length: 20 })
  ssoIvMode: "FIXED" | "KEY_AS_IV" | "RANDOM_EMBEDDED";

  // How plaintext is turned into bytes before encrypting. utf8 (GHPL, Vidal) | utf16le
  // (.NET "Unicode" encoding — FHPL AES-256, HITPA)
  @Column({ name: "sso_text_encoding", type: "varchar", length: 20, default: "utf8" })
  ssoTextEncoding: "utf8" | "utf16le";

  // SEPARATE_FIELDS — each mapped field encrypted independently, one query param each
  //   (GHPL, FHPL AES-256, HITPA)
  // COMBINED_JSON — all mapped fields bundled into one JSON object, encrypted once,
  //   sent as a single query param (Vidal)
  // COMBINED_QUERYSTRING — all mapped fields bundled into one `key=value&key=value`
  //   string (not JSON), encrypted once, typically placed in the URL PATH via portalUrl's
  //   `{{token}}` placeholder rather than a query param (Volo)
  @Column({ name: "sso_token_shape", type: "varchar", length: 20, default: "SEPARATE_FIELDS" })
  ssoTokenShape: "SEPARATE_FIELDS" | "COMBINED_JSON" | "COMBINED_QUERYSTRING";

  // Only used when sso_token_shape = COMBINED_JSON — the single output query param name.
  @Column({ name: "sso_token_param_name", type: "varchar", length: 100, nullable: true })
  ssoTokenParamName: string | null;

  // Character-replacement rules applied to the base64 ciphertext before it goes in the URL,
  // e.g. {"+":"@"} for GHPL's WebAce quirk. Null = no transform.
  @Column({ name: "sso_output_transform", type: "jsonb", nullable: true })
  ssoOutputTransform: Record<string, string> | null;

  // Separator joining the random IV to the ciphertext when sso_iv_mode = RANDOM_EMBEDDED.
  @Column({ name: "sso_iv_envelope_separator", type: "varchar", length: 5, default: ":" })
  ssoIvEnvelopeSeparator: string;

  // true (default) — encrypted field values are percent-encoded in the redirect URL, correct for
  //   TPAs whose SSO server URL-decodes the query (GHPL, FHPL, Vidal).
  // false — values are appended as RAW base64 (+, /, =), exactly as the TPA's own kit builds the
  //   link. Only for TPAs whose SSO page reads the raw query string without URL-decoding
  //   (HealthIndia HISSO.aspx), where %2F/%3D would otherwise corrupt the token.
  @Column({ name: "sso_url_encode", type: "boolean", default: true })
  ssoUrlEncode: boolean;

  // LOCAL_REDIRECT — everything above builds the redirect URL ourselves (GHPL, FHPL, HITPA,
  //   and Vidal's own earlier "just insert the token in our URL" reading).
  // REMOTE_API_REDIRECT — we still encrypt the payload ourselves using everything above,
  //   but instead of building the URL locally, we POST that encrypted payload to the TPA's
  //   own API, decrypt what THEY send back, and use the redirectUrl found inside that as the
  //   final destination — e.g. Vidal's real SSO API (sso-v2), which requires this.
  @Column({ name: "sso_delivery_mode", type: "varchar", length: 30, default: "LOCAL_REDIRECT" })
  ssoDeliveryMode: "LOCAL_REDIRECT" | "REMOTE_API_REDIRECT";

  // The TPA's own SSO API endpoint. Only used when sso_delivery_mode = REMOTE_API_REDIRECT.
  @Column({ name: "remote_api_url", type: "text", nullable: true })
  remoteApiUrl: string | null;

  @Column({ name: "remote_api_method", type: "varchar", length: 10, default: "POST" })
  remoteApiMethod: string;

  // Request headers, e.g. { "Ocp-Apim-Subscription-Key": "{{env:VIDAL_API_KEY}}", "apiver": "1",
  // "mode": "encrypt" }. Values wrapped in {{env:KEY}} are resolved from process.env at call
  // time (same convention already used elsewhere in this app) — the real key never sits here.
  @Column({ name: "remote_api_headers", type: "jsonb", nullable: true })
  remoteApiHeaders: Record<string, string> | null;

  // Our encrypted payload is sent as one field of the request body alongside these — mostly
  // constant per TPA (Vidal's "source"/"subPartnerId"), so kept as plain config here rather
  // than routed through the field-mapping table.
  @Column({ name: "remote_request_payload_key", type: "varchar", length: 100, default: "payload" })
  remoteRequestPayloadKey: string;

  @Column({ name: "remote_request_extra_fields", type: "jsonb", nullable: true })
  remoteRequestExtraFields: Record<string, string> | null;

  // Dot-notation path into the TPA's JSON response to find the encrypted blob, e.g. "data".
  @Column({ name: "remote_response_data_path", type: "varchar", length: 100, default: "data" })
  remoteResponseDataPath: string;

  // Env var holding the key used to decrypt the TPA's response (may differ from our own
  // outbound sso_key_env_name). Assumed to be the same AES-CBC / random-IV-prepended format
  // the TPA used for their own sample code, until they specify otherwise — see gaps doc.
  @Column({ name: "remote_response_decrypt_key_env_name", type: "varchar", length: 255, nullable: true })
  remoteResponseDecryptKeyEnvName: string | null;

  // Dot-notation path into the DEcrypted JSON to find the final redirect URL, e.g. "redirectUrl".
  @Column({ name: "remote_response_redirect_url_path", type: "varchar", length: 100, default: "redirectUrl" })
  remoteResponseRedirectUrlPath: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number | null;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number | null;

  @ManyToOne(() => Tpa, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tpa_id" })
  tpa: Relation<Tpa>;

  @OneToMany(() => TpaSsoFieldMapping, (m) => m.ssoConfig, { cascade: true })
  fieldMappings: Relation<TpaSsoFieldMapping[]>;
}
