import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CommonBreadcrumb, endPoints, apiRequest } from "@ui/ui-lib";
import {
  Alert, Box, Button, Card, CardContent,
  Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel,
  Pagination, Switch, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureType { id: number; key: string; label: string; }
interface AppRef { id: number; label: string; authType: string | null; isActive: boolean; }
interface FieldMapping {
  id?: number; externalFieldName: string;
  sourceType: string; sourceField: string | null; staticValue: string | null; isRequired: boolean;
}
interface FeatureConfig {
  id: number; featureTypeId: number; appRefId: number | null;
  label: string; buttonLabel: string; displayOrder: number; isActive: boolean;
  featureType: FeatureType; appRef: AppRef | null; fieldMappings: FieldMapping[];
}

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

const TpaExternalFeatures = () => {
  const { id: tpaId } = useParams<{ id: string }>();
  const location = useLocation();
  const tpaName = location.state?.entityName ?? "TPA";
  const numericTpaId = Number(tpaId);
  const navigate = useNavigate();

  const [configs, setConfigs]           = useState<FeatureConfig[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [page, setPage]                 = useState(1);

  // ── Fetch ────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const res = await apiRequest(endPoints.tpaFeatureConfigs(numericTpaId), { method: "GET" });
      if (res?.data) setConfigs(res.data);
      else setError("Failed to load external features.");
      setLoading(false);
    };
    if (numericTpaId) init();
  }, [numericTpaId]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleToggle = async (config: FeatureConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(endPoints.tpaFeatureConfigById(config.id), { method: "PUT", data: { isActive: !config.isActive } });
      setConfigs((prev) => prev.map((c) => c.id === config.id ? { ...c, isActive: !c.isActive } : c));
    } catch { /* ignore */ }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.id) return;
    try {
      await apiRequest(endPoints.tpaFeatureConfigById(deleteDialog.id), { method: "DELETE" });
      setConfigs((prev) => prev.filter((c) => c.id !== deleteDialog.id));
    } catch { /* ignore */ }
    setDeleteDialog({ open: false, id: null });
  };

  // ── Render ────────────────────────────────────────────────────

  const breadcrumbs = [
    { label: "Manage TPA", path: "/tpa" },
    { label: tpaName, path: `/tpa/${tpaId}` },
    { label: "External Features" },
  ];

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  const pagedConfigs = configs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(configs.length / PAGE_SIZE);

  return (
    <Box sx={{ p: "48px 36px" }}>
      <CommonBreadcrumb crumbs={breadcrumbs} />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} style={{ color: "#1a1a1a" }}>
            External Feature Integrations
          </Typography>
          <Typography variant="body2" style={{ color: "#666", marginTop: 4 }}>
            Configure buttons employees see in IBP — e-card, claims, hospital network, TPA portal, etc.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => navigate('/tpa/' + tpaId + '/external-features/new', { state: { entityName: tpaName } })}
          sx={{ textTransform: "none", fontWeight: 600 }}>
          Add Feature
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Pagination info */}
      {configs.length > 0 && (
        <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1.5 }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, configs.length)}–{Math.min(page * PAGE_SIZE, configs.length)} of {configs.length}
        </Typography>
      )}

      {/* Config list */}
      {configs.length === 0 ? (
        <Box sx={{ p: 6, textAlign: "center", borderRadius: 2, border: "1.5px dashed #d0d0d0", bgcolor: "#fff" }}>
          <Typography variant="h6" style={{ color: "#555", marginBottom: 8 }}>No external features configured yet</Typography>
          <Typography variant="body2" style={{ color: "#888", marginBottom: 24 }}>
            Add your first feature or configure one from{" "}
            <Box component="a" href="/admin-settings?tab=external-api-configs"
              style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}>
              Admin Settings
            </Box>.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />}
            onClick={() => navigate('/tpa/' + tpaId + '/external-features/new', { state: { entityName: tpaName } })}
            sx={{ textTransform: "none" }}>
            Add Feature
          </Button>
        </Box>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2}>
            {pagedConfigs.map((config) => (
              <Card key={config.id} variant="outlined"
                onClick={() => navigate('/tpa/' + tpaId + '/external-features/' + config.id + '/view', { state: { entityName: tpaName } })}
                sx={{
                  borderRadius: 2, bgcolor: "#fff",
                  opacity: config.isActive ? 1 : 0.6, transition: "opacity 0.2s",
                  cursor: "pointer",
                  "&:hover": { boxShadow: 3, borderColor: "primary.main" },
                }}>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={700} style={{ color: "#1a1a1a" }}>
                          {config.label}
                        </Typography>
                        <Chip label={config.featureType?.label ?? "—"} size="small" color="primary" variant="outlined"
                          sx={{ fontWeight: 600 }} />
                        {!config.isActive && <Chip label="Inactive" size="small" variant="outlined" style={{ color: "#777" }} />}
                      </Box>
                      <Typography variant="body2" style={{ color: "#555", marginTop: 4 }}>
                        Button: <strong>{config.buttonLabel}</strong>
                      </Typography>
                      {config.appRef && (
                        <Typography variant="body2" style={{ color: "#777", marginTop: 2 }}>
                          API:{" "}
                          <Box component="code" style={{ background: "#f5f5f5", padding: "1px 6px", borderRadius: 3, fontSize: "0.8em", color: "#333" }}>
                            {config.appRef.label}
                          </Box>
                        </Typography>
                      )}
                      {config.fieldMappings.length > 0 && (
                        <Box mt={0.8} display="flex" gap={0.5} flexWrap="wrap">
                          {config.fieldMappings.map((m, i) => (
                            <Chip key={i} size="small"
                              label={`${m.externalFieldName} → ${m.sourceType}`}
                              style={{ fontSize: "0.7rem", background: "#f0f4ff", color: "#333" }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}
                      onClick={(e) => e.stopPropagation()}>
                      <FormControlLabel
                        control={<Switch checked={config.isActive} size="small" color="primary" onChange={(e) => handleToggle(config, e as any)} />}
                        label={<Typography variant="caption" style={{ color: "#666" }}>{config.isActive ? "Active" : "Inactive"}</Typography>}
                        sx={{ mr: 0 }}
                      />
                      <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: config.id }); }}
                        sx={{ textTransform: "none", minWidth: "auto" }}>
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
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

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle><Typography fontWeight={700} style={{ color: "#1a1a1a" }}>Delete Feature Config?</Typography></DialogTitle>
        <DialogContent>
          <Typography variant="body2" style={{ color: "#555" }}>
            This will permanently remove this integration. Employees will no longer see this button in IBP.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ textTransform: "none" }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TpaExternalFeatures;
