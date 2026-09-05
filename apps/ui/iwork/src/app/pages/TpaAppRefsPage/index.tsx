import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommonBreadcrumb, endPoints, apiRequest } from "@ui/ui-lib";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  CircularProgress, FormControlLabel,
  Pagination, Switch, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HttpsIcon from "@mui/icons-material/Https";
import LinkIcon from "@mui/icons-material/Link";
import LockIcon from "@mui/icons-material/Lock";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppRef {
  configType?: "APP_REF";
  id: number;
  label: string;
  description: string | null;
  authType: string;
  payloadFormat: string | null;
  isActive: boolean;
  magicUrlApiUrl: string | null;
  magicUrlApiPayload: Record<string, any> | null;
  verificationTokenApiPayload: Record<string, any> | null;
}

interface SsoConfigRow {
  configType: "SSO";
  id: number;
  tpaId: number;
  portalUrl: string;
  ssoDeliveryMode: "LOCAL_REDIRECT" | "REMOTE_API_REDIRECT";
  remoteApiUrl: string | null;
  isActive: boolean;
  fieldMappings: { externalFieldName: string }[];
  tpa?: { tpaName?: string; displayName?: string };
}

type Row = AppRef | SsoConfigRow;

const isSso = (row: Row): row is SsoConfigRow => row.configType === "SSO";

const SSO_FEATURE_KEY = "TPA_PORTAL_LOGIN";

interface FeatureConfig {
  id: number;
  appRefId: number | null;
  featureType: { id: number; label: string; key?: string };
  tpaId: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  DIRECT: "default", JWT: "primary", SESSION: "secondary",
};

const PAGE_SIZE = 10;

const breadcrumbs = [
  { label: "Admin Settings", path: "/admin-settings" },
  { label: "External API Configs" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const payloadToRows = (payload: Record<string, any> | null) => {
  if (!payload || Object.keys(payload).length === 0) return [];
  return Object.entries(payload).map(([key, value]) => {
    const strVal = typeof value === "string" ? value : String(value);
    const dynMatch = strVal.match(/^\{\{(\w+)\}\}$/);
    return { key, isDynamic: Boolean(dynMatch), placeholderName: dynMatch?.[1] ?? key };
  });
};

const getDynamicFields = (ref: AppRef): string[] => {
  const rows = [
    ...payloadToRows(ref.verificationTokenApiPayload),
    ...payloadToRows(ref.magicUrlApiPayload),
  ];
  const names = rows.filter((r) => r.isDynamic).map((r) => r.placeholderName.trim()).filter(Boolean);
  return [...new Set(names)];
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  embedded?: boolean;
  basePath?: string;
}

// ─── Page component ───────────────────────────────────────────────────────────

const TpaAppRefsPage = ({ embedded = false, basePath = "/tpa/external-api-configs" }: Props) => {
  const navigate = useNavigate();
  const [rows, setRows]                   = useState<Row[]>([]);
  const [featureConfigs, setFeatureConfigs] = useState<FeatureConfig[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [page, setPage]                   = useState(1);

  // ── Data ──────────────────────────────────────────────────────

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [refsRes, cfgRes] = await Promise.allSettled([
        apiRequest(endPoints.tpaFeatureAppRefs, { method: "GET" }),
        apiRequest(endPoints.tpaFeatureAllConfigs, { method: "GET" }),
      ]);
      // /app-refs now returns both AppRefs and SSO configs in one array, each tagged
      // with configType ("APP_REF" default/missing, or "SSO") — kept together here so
      // this list and its pagination cover both kinds.
      if (refsRes.status === "fulfilled") setRows(refsRes.value?.data ?? []);
      if (cfgRes.status === "fulfilled")  setFeatureConfigs(cfgRes.value?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggle = async (row: Row, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSso(row)) {
        await apiRequest(endPoints.tpaSsoConfigById(row.id), { method: "PUT", data: { isActive: !row.isActive } });
      } else {
        await apiRequest(endPoints.tpaFeatureAppRefById(row.id), { method: "PUT", data: { isActive: !row.isActive } });
      }
      setRows((prev) => prev.map((r) => (r.configType === row.configType && r.id === row.id) ? { ...r, isActive: !r.isActive } : r));
    } catch { /* ignore */ }
  };

  const handleOpen = (row: Row) => {
    if (isSso(row)) {
      // TpaAppRefForm's :refId route normally means an AppRef id — SSO configs have no
      // AppRef at all, so ?type=sso tells the form to instead load refId as the paired
      // tpa_external_feature_config id ("Access Portal" button row) and go straight to
      // the SSO fields. This keeps SSO rows on the exact same basePath route tree as
      // every other card here, instead of jumping to a different part of the app.
      const paired = featureConfigs.find((c) => c.tpaId === row.tpaId && c.featureType?.key === SSO_FEATURE_KEY);
      if (paired) {
        navigate(basePath + '/' + paired.id + '/view?type=sso');
      } else {
        // No "Access Portal" button saved yet for this TPA (SSO config exists on its
        // own) — nothing to open under basePath yet, so fall back to where it can be
        // created/completed instead of a dead link.
        navigate(`/tpa/${row.tpaId}/external-features`, { state: { entityName: row.tpa?.displayName ?? row.tpa?.tpaName } });
      }
    } else {
      navigate(basePath + '/' + row.id + '/view');
    }
  };

  // ── Render ────────────────────────────────────────────────────

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );

  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  return (
    <Box sx={{ p: embedded ? 0 : "48px 36px" }}>
      {!embedded && <CommonBreadcrumb crumbs={breadcrumbs} />}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start"
        mt={embedded ? 0 : 2} mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ color: "#1a1a1a" }}>
            External API Configs
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
            Configure API details for each TPA integration. Once added, select them when setting up External Features on a TPA.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(basePath + '/new')}
          sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap", ml: 2 }}>
          Add API Config
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Pagination info */}
      {rows.length > 0 && (
        <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1.5 }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, rows.length)}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
        </Typography>
      )}

      {/* Empty state */}
      {rows.length === 0 ? (
        <Box sx={{
          border: "1.5px dashed #d0d0d0", borderRadius: 2,
          p: 6, textAlign: "center", bgcolor: "#fff",
        }}>
          <HttpsIcon sx={{ fontSize: 40, color: "#bbb", mb: 1 }} />
          <Typography variant="h6" sx={{ color: "#666" }} gutterBottom>
            No API configs yet
          </Typography>
          <Typography variant="body2" sx={{ color: "#999", mb: 3 }}>
            Add the first config — fill in the details from your TPA's API documentation.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate(basePath + '/new')}
            sx={{ textTransform: "none" }}>
            Add First Config
          </Button>
        </Box>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2}>
            {pagedRows.map((row) => {
              if (isSso(row)) {
                const fieldNames = (row.fieldMappings ?? []).map((m) => m.externalFieldName);
                const title = row.tpa?.displayName ?? row.tpa?.tpaName ?? `TPA ${row.tpaId}`;
                const modeLabel = row.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? "Remote API" : "Local Redirect";
                const urlLine = row.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? row.remoteApiUrl : row.portalUrl;

                return (
                  <Card key={`sso-${row.id}`} variant="outlined"
                    onClick={() => handleOpen(row)}
                    sx={{
                      borderRadius: 2, bgcolor: "#fff",
                      opacity: row.isActive ? 1 : 0.6, transition: "opacity 0.2s",
                      cursor: "pointer",
                      "&:hover": { boxShadow: 3, borderColor: "secondary.main" },
                    }}>
                    <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Box sx={{
                          mt: 0.5, p: 1, borderRadius: 1.5, bgcolor: "#f3e5f5",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <LockIcon fontSize="small" sx={{ color: "#7b1fa2" }} />
                        </Box>

                        <Box flex={1} minWidth={0}>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.3}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                              {title}
                            </Typography>
                            <Chip label="SSO" size="small" sx={{ fontWeight: 600, fontSize: "0.7rem", bgcolor: "#f3e5f5", color: "#7b1fa2" }} />
                            <Chip label={modeLabel} size="small" variant="outlined" sx={{ fontSize: "0.68rem", color: "#666" }} />
                            {!row.isActive && (
                              <Chip label="Inactive" size="small" variant="outlined"
                                sx={{ fontSize: "0.7rem", color: "#777" }} />
                            )}
                          </Box>

                          {urlLine && (
                            <Typography variant="body2" sx={{ color: "#555", mb: 0.3, wordBreak: "break-all" }}>
                              {urlLine}
                            </Typography>
                          )}

                          {fieldNames.length > 0 && (
                            <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5} alignItems="center">
                              <Typography variant="caption" sx={{ color: "#888" }}>Fields:</Typography>
                              {fieldNames.map((f) => (
                                <Box key={f} component="code" style={{
                                  background: "#f3e5f5", color: "#7b1fa2", padding: "1px 6px",
                                  borderRadius: 3, fontFamily: "monospace", fontSize: "0.72rem",
                                  border: "1px solid #e1bee7",
                                }}>
                                  {`{{${f}}}`}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>

                        <Box display="flex" alignItems="center" flexShrink={0}
                          onClick={(e) => e.stopPropagation()}>
                          <FormControlLabel
                            control={
                              <Switch checked={row.isActive} size="small" color="primary"
                                onChange={(e2) => handleToggle(row, e2 as any)} />
                            }
                            label={
                              <Typography variant="caption" sx={{ color: "#666" }}>
                                {row.isActive ? "Active" : "Inactive"}
                              </Typography>
                            }
                            sx={{ mr: 0 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              }

              const ref = row;
              const dynFields = getDynamicFields(ref);
              const assignedConfigs = featureConfigs.filter((c) => c.appRefId === ref.id);

              return (
                <Card key={`ref-${ref.id}`} variant="outlined"
                  onClick={() => handleOpen(ref)}
                  sx={{
                    borderRadius: 2, bgcolor: "#fff",
                    opacity: ref.isActive ? 1 : 0.6, transition: "opacity 0.2s",
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3, borderColor: "primary.main" },
                  }}>
                  <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Box sx={{
                        mt: 0.5, p: 1, borderRadius: 1.5, bgcolor: "#f0f4ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <LinkIcon fontSize="small" sx={{ color: "#1976d2" }} />
                      </Box>

                      <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.3}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                            {ref.label}
                          </Typography>
                          <Chip label={ref.authType} size="small"
                            color={AUTH_COLOR[ref.authType] ?? "default"}
                            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          {ref.payloadFormat && ref.payloadFormat !== "JSON" && (
                            <Chip label={ref.payloadFormat} size="small" variant="outlined"
                              sx={{ fontSize: "0.68rem", color: "#666" }}
                            />
                          )}
                          {!ref.isActive && (
                            <Chip label="Inactive" size="small" variant="outlined"
                              sx={{ fontSize: "0.7rem", color: "#777" }} />
                          )}
                        </Box>

                        {ref.description && (
                          <Typography variant="body2" sx={{ color: "#555", mb: 0.3 }}>
                            {ref.description}
                          </Typography>
                        )}

                        {/* Feature assignments */}
                        {assignedConfigs.length > 0 && (
                          <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5} alignItems="center">
                            <Typography variant="caption" sx={{ color: "#888" }}>Used for:</Typography>
                            {assignedConfigs.map((c) => (
                              <Chip key={c.id} size="small" label={c.featureType?.label ?? "—"}
                                variant="outlined" color="secondary"
                                sx={{ fontSize: "0.68rem", fontWeight: 600 }}
                              />
                            ))}
                          </Box>
                        )}

                        {dynFields.length > 0 && (
                          <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5} alignItems="center">
                            <Typography variant="caption" sx={{ color: "#888" }}>Dynamic:</Typography>
                            {dynFields.map((f) => (
                              <Box key={f} component="code" style={{
                                background: "#fff3e0", color: "#e65100", padding: "1px 6px",
                                borderRadius: 3, fontFamily: "monospace", fontSize: "0.72rem",
                                border: "1px solid #ffcc80",
                              }}>
                                {`{{${f}}}`}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" flexShrink={0}
                        onClick={(e) => e.stopPropagation()}>
                        <FormControlLabel
                          control={
                            <Switch checked={ref.isActive} size="small" color="primary"
                              onChange={(e2) => handleToggle(ref, e2 as any)} />
                          }
                          label={
                            <Typography variant="caption" sx={{ color: "#666" }}>
                              {ref.isActive ? "Active" : "Inactive"}
                            </Typography>
                          }
                          sx={{ mr: 0 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                color="primary"
                onChange={(_, p) => setPage(p)}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TpaAppRefsPage;
