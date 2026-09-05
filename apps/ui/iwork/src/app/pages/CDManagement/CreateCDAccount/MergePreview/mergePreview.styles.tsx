import { Box, Chip, Dialog, styled, Typography } from "@mui/material";

export const StyledDialog = styled(Dialog)(() => ({
    "& .MuiDialog-paper": {
        borderRadius: "12px",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "90vh",
    },
}));

export const DialogHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(4, 5),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const DialogTitle = styled(Typography)(() => ({
    fontSize: "18px",
    fontWeight: 700,
}));

export const DialogBody = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4, 5),
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
}));

export const SectionLabel = styled(Typography)(({ theme }) => ({
    fontSize: "12px",
    fontWeight: 500,
    color: "#101828",
    letterSpacing: "0.6px",
    marginBottom: theme.spacing(2),
}));

export const SourceCard = styled(Box)(({ theme }) => ({
    background: "#fef2f2",
    border: "2px solid #ffc9c9",
    borderRadius: "8px",
    padding: theme.spacing(3, 4),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    "&:last-child": {
        marginBottom: 0,
    },
}));

export const TargetCard = styled(Box)(({ theme }) => ({
    // background: "#f0fdf4",
    background: "#f0fdf4",
    border: "2px solid #b9f8cf",
    borderRadius: "8px",
    padding: theme.spacing(3, 4),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
}));

export const CardHeader = styled(Box)(() => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
}));

export const AccountNumber = styled(Typography)(() => ({
    fontSize: "16px",
    fontWeight: 700,
    color: "#111827",
}));

export const SourceBadge = styled(Chip)(() => ({
    backgroundColor: "#ffe2e2",
    color: "#c10007",
    fontSize: "11px",
    height: "22px",
    border: "1px solid #c10007",
}));

export const TargetBadge = styled(Chip)(() => ({
    backgroundColor: "#dcfce7",
    color: "#008236",
    fontSize: "11px",
    height: "22px",
    border: "1px solid #008236",
}));

export const MetaRow = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(6),
    fontSize: "13px",
    color: theme.palette.text.secondary,
}));

export const MetaItem = styled(Typography)(() => ({
    fontSize: "13px",
    color: "#6b7280",
    "& strong": {
        color: "#111827",
        fontWeight: 600,
    },
}));

export const PolicyChipsRow = styled(Box)(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
}));

export const SourcePolicyChip = styled(Box)(() => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
}));

export const TargetPolicyChip = styled(Box)(() => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
}));

export const InfoGrid = styled(Box)(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2),
}));

export const InfoBox = styled(Box)(({ theme }) => ({
    background: "white",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "6px",
    padding: theme.spacing(2, 3),
}));

export const NewBalanceBox = styled(InfoBox)(() => ({
    border: "1px solid #86efac",
    background: "#f0fdf4",
}));

export const InfoBoxLabel = styled(Typography)(() => ({
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: 500,
    marginBottom: "4px",
}));

export const InfoBoxValue = styled(Typography)(() => ({
    fontSize: "16px",
    fontWeight: 700,
    color: "#111827",
}));

export const NewBalanceValue = styled(InfoBoxValue)(() => ({
    color: "#16a34a",
}));

export const AllPoliciesLabel = styled(Typography)(() => ({
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 500,
    marginBottom: "6px",
}));

export const ArrowContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(1, 0),
}));

export const ArrowCircle = styled(Box)(() => ({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "2px solid #e5e7eb",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "#6b7280",
}));

export const WarningBox = styled(Box)(({ theme }) => ({
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    padding: theme.spacing(3, 4),
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "flex-start",
}));

export const WarningTitle = styled(Typography)(() => ({
    fontSize: "14px",
    fontWeight: 700,
    color: "#92400e",
    marginBottom: "2px",
}));

export const WarningText = styled(Typography)(() => ({
    fontSize: "14px",
    color: "#92400e",
    fontWeight:500
}));

export const DialogFooter = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(3),
    padding: theme.spacing(3, 5),
    borderTop: `1px solid ${theme.palette.divider}`,
}));
