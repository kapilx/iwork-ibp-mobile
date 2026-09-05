import { useEffect, useState } from "react";
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from "@mui/material";
import { Download, ExternalLink, FilePlus, Inbox, RefreshCw, Unlink, Zap } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setToastMessage } from "../../redux/slice";
import { getCompanyId } from "../../utils/companyConfig";
import {
  endPoints,
  useApiQuery,
  useApiMutation,
  useLocalization,
  formatAmountWithCurrency,
} from "@ui/ui-lib";
import { HclIntakeDialog } from "./HclIntakeDialog";

interface ZohoEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  employmentStatus: string;
  ctc: string;
}

interface SyncStats {
  synced: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  durationMs: number;
  employees?: ZohoEmployee[];
}

interface ZohoStatus {
  connected: boolean;
  zohoDomain?: string;
  lastSyncedAt?: string;
  lastSyncStats?: SyncStats;
}

export function SettingsIntegrationsTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { localizationData } = useLocalization();

  const rawCompanyId = getCompanyId();
  const companyId =
    typeof rawCompanyId === "number"
      ? rawCompanyId
      : rawCompanyId
        ? parseInt(String(rawCompanyId), 10)
        : null;

  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEmployees, setPreviewEmployees] = useState<ZohoEmployee[]>([]);

  // HCL intake dialog state
  const [hclDialogOpen, setHclDialogOpen] = useState(false);

  // Read ?zoho=connected / ?zoho=error from URL after OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zoho = params.get("zoho");
    const reason = params.get("reason");
    if (zoho === "connected") {
      dispatch(setToastMessage("Zoho People connected successfully"));
      window.history.replaceState({}, "", window.location.pathname + "?tab=integrations");
    } else if (zoho === "error") {
      dispatch(setToastMessage({ message: `Zoho connection failed: ${reason ?? "unknown error"}`, duration: 6000 }));
      window.history.replaceState({}, "", window.location.pathname + "?tab=integrations");
    }
  }, [dispatch]);

  const {
    data: statusResponse,
    isLoading: loadingStatus,
    refetch: refetchStatus,
  } = useApiQuery({
    queryKey: ["zohoStatus", companyId],
    url: companyId ? endPoints.zohoStatus(companyId) : "",
    enabled: Boolean(companyId),
  });
  const status: ZohoStatus = statusResponse?.data ?? { connected: false };

  const { refetch: fetchAuthUrl } = useApiQuery({
    queryKey: ["zohoAuthUrl", companyId],
    url: companyId ? endPoints.zohoAuthUrl(companyId, window.location.origin) : "",
    enabled: false,
    config: { retry: 0 },
  });

  const { refetch: fetchPortalUrl } = useApiQuery({
    queryKey: ["zohoPortalUrl", companyId],
    url: companyId ? endPoints.zohoPortalUrl(companyId) : "",
    enabled: false,
    config: { retry: 0 },
  });

  const { mutate: syncZoho } = useApiMutation({});
  const { mutate: disconnectZoho } = useApiMutation({});

  const { data: hclReceivedResponse } = useApiQuery({
    queryKey: ["hclIntake", companyId, "RECEIVED"],
    url: companyId ? endPoints.hclIntakeForCompany(companyId, "RECEIVED") : "",
    enabled: Boolean(companyId),
  });
  const { data: hclFailedResponse } = useApiQuery({
    queryKey: ["hclIntake", companyId, "FAILED"],
    url: companyId ? endPoints.hclIntakeForCompany(companyId, "FAILED") : "",
    enabled: Boolean(companyId),
  });
  const hclPendingCount =
    (hclReceivedResponse?.data?.records?.length ?? 0) +
    (hclFailedResponse?.data?.records?.length ?? 0);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await fetchAuthUrl();
      const url = (result?.data as any)?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        const msg = (result?.failureReason as any)?.message ?? "Failed to get Zoho authorization URL. Check server config.";
        dispatch(setToastMessage({ message: msg, duration: 5000 }));
      }
    } catch {
      dispatch(setToastMessage({ message: "Failed to get Zoho authorization URL. Check server config.", duration: 5000 }));
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = () => {
    if (!companyId) {
      dispatch(setToastMessage({ message: "Company not identified. Please refresh and try again.", duration: 5000 }));
      return;
    }
    setSyncing(true);
    syncZoho(
      { endpoint: endPoints.zohoSync(companyId), method: "POST", data: undefined },
      {
        onSuccess: (response: any) => {
          const result: SyncStats = response?.data;
          if (result?.employees?.length) {
            setPreviewEmployees(result.employees);
            setPreviewOpen(true);
          } else {
            dispatch(setToastMessage("Sync returned no employee records."));
          }
          refetchStatus();
        },
        onError: (err: any) => {
          const httpStatus = err?.statusCode;
          const serverMessage = err?.message;
          let displayMessage: string;
          if (httpStatus === 401) {
            displayMessage = "Your session has expired. Please log in again.";
          } else if (httpStatus === 403) {
            displayMessage = "This company is not authorized to access Zoho People. Please connect from Settings → Integrations.";
          } else {
            displayMessage = serverMessage ?? "Sync failed. Try again.";
          }
          dispatch(setToastMessage({ message: displayMessage, duration: 6000 }));
        },
        onSettled: () => setSyncing(false),
      },
    );
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Employee ID", "First Name", "Last Name", "Email", "Mobile",
      "Date of Birth", "Gender", "Designation", "Department",
      "Date of Joining", "Status", "CTC",
    ];
    const rows = previewEmployees.map(e => [
      e.employeeId, e.firstName, e.lastName, e.email, e.mobile,
      e.dateOfBirth, e.gender, e.designation, e.department,
      e.dateOfJoining, e.employmentStatus, e.ctc,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zoho-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDisconnect = () => {
    if (!companyId) return;
    if (!window.confirm("Disconnect Zoho People? Already-synced employee data will not be deleted.")) return;
    setDisconnecting(true);
    disconnectZoho(
      { endpoint: endPoints.zohoDisconnect(companyId), method: "DELETE", data: undefined },
      {
        onSuccess: () => {
          dispatch(setToastMessage("Zoho People disconnected"));
          refetchStatus();
        },
        onError: (err: any) => {
          const msg = err?.statusCode === 401
            ? "Your session has expired. Please log in again."
            : "Disconnect failed. Try again.";
          dispatch(setToastMessage({ message: msg, duration: 5000 }));
        },
        onSettled: () => setDisconnecting(false),
      },
    );
  };

  const handleOpenPortal = async () => {
    try {
      const result = await fetchPortalUrl();
      const url = (result?.data as any)?.data?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const msg = (result?.failureReason as any)?.message ?? "Could not get Zoho People URL.";
        dispatch(setToastMessage({ message: msg, duration: 5000 }));
      }
    } catch {
      dispatch(setToastMessage({ message: "Could not get Zoho People URL.", duration: 5000 }));
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loadingStatus) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 560 }}>
        <Typography variant="h6" fontWeight={600} mb={0.5}>
          Integrations
        </Typography>
        <Typography variant="body2" mb={3}>
          Connect third-party services to sync data with the HR Portal.
        </Typography>

        {/* ── Zoho People card ── */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: status?.connected ? "success.light" : "divider",
            borderRadius: 2,
            p: 2.5,
            bgcolor: status?.connected ? "#F0FDF4" : "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: 1.5,
                  bgcolor: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Zap size={20} color="#2E7D32" />
              </Box>
              <Box>
                <Typography fontWeight={600} fontSize={14}>Zoho People</Typography>
                <Typography variant="caption">
                  {status?.connected
                    ? `Connected · ${status.zohoDomain ?? "zoho.in"}`
                    : "Sync employees from your Zoho People account"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                px: 1, py: 0.4, borderRadius: 1, fontSize: 11, fontWeight: 700,
                bgcolor: status?.connected ? "#DCFCE7" : "#F3F4F6",
                color: status?.connected ? "#166534" : "#6B7280",
                border: "1px solid",
                borderColor: status?.connected ? "#A7F3D0" : "#E5E7EB",
                whiteSpace: "nowrap",
              }}
            >
              {status?.connected ? "● Connected" : "Not connected"}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {status?.connected ? (
            <>
              {/* Sync stats */}
              {status.lastSyncStats && (
                <Box
                  sx={{
                    bgcolor: "white", border: "1px solid", borderColor: "divider",
                    borderRadius: 1.5, p: 1.5, mb: 2,
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
                  }}
                >
                  {[
                    { label: "Synced", value: status.lastSyncStats.synced },
                    { label: "Added", value: status.lastSyncStats.created },
                    { label: "Updated", value: status.lastSyncStats.updated },
                    { label: "Skipped", value: status.lastSyncStats.skipped },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ textAlign: "center" }}>
                      <Typography fontWeight={700} fontSize={18} lineHeight={1.2}>{value}</Typography>
                      <Typography variant="caption">{label}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Typography variant="caption" display="block" mb={2}>
                Last synced: {formatDate(status.lastSyncedAt)}
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />}
                  onClick={handleSync}
                  disabled={syncing || disconnecting}
                  sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
                >
                  {syncing ? "Fetching…" : "Sync Now"}
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExternalLink size={14} />}
                  onClick={handleOpenPortal}
                  disabled={syncing || disconnecting}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Go to Zoho People
                </Button>

                <Button
                  variant="text"
                  size="small"
                  color="error"
                  startIcon={disconnecting ? <CircularProgress size={14} color="inherit" /> : <Unlink size={14} />}
                  onClick={handleDisconnect}
                  disabled={syncing || disconnecting}
                  sx={{ textTransform: "none", ml: "auto" }}
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
              </Box>
            </>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={connecting ? <CircularProgress size={14} color="inherit" /> : <Zap size={14} />}
              onClick={handleConnect}
              disabled={connecting}
              sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
            >
              {connecting ? "Redirecting to Zoho…" : "Connect Zoho People"}
            </Button>
          )}
        </Box>

        {/* ── HCL Employee Interface card ── */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: hclPendingCount > 0 ? "warning.light" : "divider",
            borderRadius: 2,
            p: 2.5,
            mt: 2.5,
            bgcolor: hclPendingCount > 0 ? "#FFFBEB" : "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: 1.5,
                  bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Inbox size={20} color="#4338CA" />
              </Box>
              <Box>
                <Typography fontWeight={600} fontSize={14}>HCL Employee Interface</Typography>
                <Typography variant="caption">
                  Receives employee/dependent lifecycle changes pushed by HCL's HRMS
                </Typography>
              </Box>
            </Box>

            {hclPendingCount > 0 && (
              <Box
                sx={{
                  px: 1, py: 0.4, borderRadius: 1, fontSize: 11, fontWeight: 700,
                  bgcolor: "#FEF3C7", color: "#92400E", border: "1px solid", borderColor: "#FDE68A",
                  whiteSpace: "nowrap",
                }}
              >
                {hclPendingCount} pending
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Button
            variant="contained"
            size="small"
            startIcon={<Inbox size={14} />}
            onClick={() => setHclDialogOpen(true)}
            sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
          >
            View Received Records
          </Button>
        </Box>
      </Box>

      {/* ── Employee Preview Modal ── */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700} fontSize={16}>Employee Preview</Typography>
            <Box
              sx={{
                ml: 1, px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 600,
                bgcolor: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid",
                borderColor: "#BFDBFE",
              }}
            >
              {previewEmployees.length} record{previewEmployees.length !== 1 ? "s" : ""}
            </Box>
          </Box>
          <Typography variant="body2" mt={0.5}>
            Review the employee data below. Click <strong>Confirm & Import</strong> to save to the database.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflowX: "auto" }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#F8FAFC", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" } }}>
                  <TableCell>#</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Date of Joining</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>CTC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewEmployees.map((emp, idx) => (
                  <TableRow
                    key={emp.employeeId || idx}
                    sx={{ "&:nth-of-type(even)": { bgcolor: "#FAFAFA" }, "& td": { fontSize: 12, whiteSpace: "nowrap" } }}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{emp.employeeId}</TableCell>
                    <TableCell>{emp.firstName}</TableCell>
                    <TableCell>{emp.lastName}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.mobile}</TableCell>
                    <TableCell>{emp.dateOfBirth}</TableCell>
                    <TableCell>{emp.gender}</TableCell>
                    <TableCell>{emp.designation}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.dateOfJoining}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          px: 0.8, py: 0.2, borderRadius: 0.8, fontSize: 11, fontWeight: 600,
                          bgcolor: emp.employmentStatus === "Active" ? "#DCFCE7" : "#F3F4F6",
                          color: emp.employmentStatus === "Active" ? "#166534" : "#6B7280",
                        }}
                      >
                        {emp.employmentStatus}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {emp.ctc ? `${formatAmountWithCurrency(Number(emp.ctc), localizationData?.data)}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setPreviewOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={14} />}
            onClick={handleDownloadCSV}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Download CSV
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<FilePlus size={14} />}
            onClick={() => {
              setPreviewOpen(false);
              navigate("/hr-portal/zoho-endorsement", { state: { employees: previewEmployees } });
            }}
            sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
          >
            Create Endorsement
          </Button>
        </DialogActions>
      </Dialog>

      {companyId != null && (
        <HclIntakeDialog
          open={hclDialogOpen}
          onClose={() => setHclDialogOpen(false)}
          companyId={companyId}
        />
      )}
    </>
  );
}
