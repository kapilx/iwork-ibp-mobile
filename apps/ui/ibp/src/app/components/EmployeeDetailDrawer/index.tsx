import React, { useEffect } from "react";
import { Box, Typography, Drawer, IconButton } from "@mui/material";
import { capitalizeFirst } from "../../utils";
import {
    useLocalization,
    formatAmountWithCurrency,
    getCurrencySymbolPrefix,
    type LocalizationConfig,
} from "@ui/ui-lib";
import {
    X,
    User,
    Shield,
    CheckCircle2,
    FileText,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Calendar,
    Banknote,
    CreditCard,
    Activity,
    BadgeCheck,
    Wallet,
    LayoutList,
    IndianRupee,
    Building2,
    ExternalLink,
    type LucideIcon,
} from "lucide-react";
import {
    DrawerHeaderRoot,
    DrawerAvatarBox,
    DrawerAvatarText,
    DrawerEmpProfileLabel,
    DrawerEmpNameText,
    EnrollStatusChip,
    StepperRoot,
    StepperTitle,
    StepCircle,
    StepNumberText,
    StepLabelText,
    StepConnectorLine,
    KPIStripRoot,
    KPICardRoot,
    KPICardIconBox,
    KPICardValue,
    KPICardLabel,
    KPICardSubLabel,
    ViewProfileButton,
    SectionBlockRoot,
    SectionBlockHeader,
    SectionBlockTitle,
    InfoRowRoot,
    InfoIconBox,
    InfoFieldLabel,
    InfoFieldValue,
    DependentRowRoot,
    DependentAvatar,
    DependentAvatarText,
    DependentName,
    DependentMeta,
    DependentCovLabel,
    DependentCovValue,
    ClaimsCardRoot,
    ClaimsCardHeader,
    ClaimsCardTitle,
    ClaimsTotalLabel,
    ClaimTableTh,
    ClaimTableTd,
    ClaimPolicyNo,
    ClaimHospitalIconBox,
    ClaimHospitalName,
    ClaimHospitalDisease,
    ClaimTypeBadge,
    ClaimStatusBadge,
    ClaimAmountText,
    ClaimSettledText,
    ActivityDot,
    ActivityAction,
    ActivityMeta,
} from "./styles";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DrawerDependent {
    id: string;
    name: string;
    relation: string;
    age: number;
    coverage: number;
}

export interface DrawerClaimRecord {
    id: string;
    type: "Cashless" | "Reimbursement";
    status: string;
    amount: number;
    hospital: string;
    date: string;
    disease: string;
    relation: string;
}

export interface DrawerActivityEntry {
    id: string;
    date: string;
    action: string;
    by: string;
    type: string;
}

export interface DrawerEmployee {
    id: string;
    name: string;
    initials: string;
    email: string;
    phone: string;
    department: string;
    location: string;
    doj: string;
    dob: string;
    age: number;
    gender: string;
    tenureYears: number;
    policyStatus: string;
    enrollmentStatus: string;
    status: string;
    totalClaims: number;
    claimAmount: number;
    dependents: DrawerDependent[];
    claims: DrawerClaimRecord[];
    activityLog: DrawerActivityEntry[];
    lastActivity: string;
    policyName: string;
    sumInsured: number;
    policyEffectiveDate: string;
    policyExpiryDate: string;
    ecardNo: string;
    additionType: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
    d && d !== "—"
        ? new Date(d).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";
const fmtINR = (n: number, localization?: LocalizationConfig) => {
    const sym = getCurrencySymbolPrefix(localization);
    return n >= 100000 ? `${sym}${(n / 100000).toFixed(1)}L` : `${sym}${(n / 1000).toFixed(0)}K`;
};
const fmtINRFull = (n: number, localization?: LocalizationConfig) =>
    `${formatAmountWithCurrency(n, localization)}`;

const mockPolicyNo = (empId: string, idx: number) =>
    `GHI-${empId.replace("EMP", "")}-${2025 + (idx % 2)}`;

const mockSettled = (clm: DrawerClaimRecord): number => {
    if (["Rejected", "Denied", "Outstanding", "Pending"].includes(clm.status))
        return 0;
    return Math.round(clm.amount * 0.88);
};

// ─── Enrollment Steps ──────────────────────────────────────────────────────────
const ENROLLMENT_STEPS = [
    {
        id: 1,
        label: "Application Initiated",
        desc: "Employee enrollment application submitted.",
        color: "#338CE5",
    },
    {
        id: 2,
        label: "Document Submission",
        desc: "Employee uploads required KYC documents.",
        color: "#8B5CF6",
    },
    {
        id: 3,
        label: "HR Verification",
        desc: "HR team reviews and verifies submissions.",
        color: "#F97316",
    },
    {
        id: 4,
        label: "Insurer Approval",
        desc: "Insurance provider approves the policy request.",
        color: "#10B981",
    },
    {
        id: 5,
        label: "E-Card Generated",
        desc: "Digital insurance card issued to employee.",
        color: "#6366F1",
    },
    {
        id: 6,
        label: "Coverage Active",
        desc: "Policy is live — employee can avail benefits.",
        color: "#10B981",
    },
];

function getActiveStep(enrollmentStatus: string): number {
    switch (enrollmentStatus) {
        case "Enrolled":
            return 6;
        case "Pending":
            return 2;
        case "Expired":
            return 6;
        default:
            return 1;
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon?: LucideIcon;
}) {
    return (
        <InfoRowRoot>
            {Icon && (
                <InfoIconBox>
                    <Icon size={14} />
                </InfoIconBox>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <InfoFieldLabel>{label}</InfoFieldLabel>
                <InfoFieldValue>{value}</InfoFieldValue>
            </Box>
        </InfoRowRoot>
    );
}

// ─── Enrollment Stepper ───────────────────────────────────────────────────────
function EnrollmentStepper({ enrollmentStatus }: { enrollmentStatus: string }) {
    const activeStep = getActiveStep(enrollmentStatus);

    return (
        <StepperRoot>
            <StepperTitle>Enrollment Journey</StepperTitle>
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                {ENROLLMENT_STEPS.map((step, idx) => {
                    const isDone = step.id < activeStep;
                    const isCurrent = step.id === activeStep;
                    const isFuture = step.id > activeStep;
                    const isLast = idx === ENROLLMENT_STEPS.length - 1;
                    return (
                        <Box
                            key={step.id}
                            sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}
                        >
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                                <StepCircle isDone={isDone} isCurrent={isCurrent} stepColor={step.color}>
                                    {isDone ? (
                                        <BadgeCheck size={14} color="#FFFFFF" />
                                    ) : (
                                        <StepNumberText isFuture={isFuture} stepColor={step.color}>
                                            {step.id}
                                        </StepNumberText>
                                    )}
                                </StepCircle>
                                <StepLabelText isFuture={isFuture} isCurrent={isCurrent} stepColor={step.color}>
                                    {step.label}
                                </StepLabelText>
                            </Box>
                            {!isLast && (
                                <StepConnectorLine isDone={isDone} fromColor={step.color} />
                            )}
                        </Box>
                    );
                })}
            </Box>
        </StepperRoot>
    );
}

// ─── Section Block ─────────────────────────────────────────────────────────────
function SectionBlock({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <SectionBlockRoot>
            <SectionBlockHeader>
                <SectionBlockTitle>{title}</SectionBlockTitle>
            </SectionBlockHeader>
            <Box sx={{ px: 2.5, py: 2 }}>{children}</Box>
        </SectionBlockRoot>
    );
}



// ─── EmployeeDetailDrawer ─────────────────────────────────────────────────────
interface EmployeeDetailDrawerProps {
    employee: DrawerEmployee | null;
    open: boolean;
    onClose: () => void;
    onViewProfile: (employee: DrawerEmployee) => void;
}

export function EmployeeDetailDrawer({
    employee,
    open,
    onClose,
    onViewProfile,
}: EmployeeDetailDrawerProps) {
    const { localizationData } = useLocalization();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!employee) return null;

    const totalSumInsured =
        employee.sumInsured +
        (employee.status === "Active" ? 1_000_000 : 0);
    const availableBalance = Math.max(
        0,
        employee.sumInsured - employee.claimAmount,
    );

    const kpiCards = [
        {
            label: "Enrolled Policies",
            value: employee.status === "Active" ? "2" : "1",
            sub: "GMC · GPA",
            icon: <LayoutList size={14} />,
            color: "#7C3AED",
            bg: "#F5F3FF",
            border: "#EDE9FE",
        },
        {
            label: "Total Sum Insured",
            value: fmtINR(totalSumInsured, localizationData?.data),
            sub: "Aggregated",
            icon: <IndianRupee size={14} />,
            color: "#079F92",
            bg: "#F0FDFA",
            border: "#CCFBF1",
        },
        {
            label: "Available Balance",
            value: fmtINR(availableBalance, localizationData?.data),
            sub: "SI − claimed",
            icon: <Wallet size={14} />,
            color: "#059669",
            bg: "#ECFDF5",
            border: "#A7F3D0",
        },
    ];

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100vw", sm: "52vw" },
                    maxWidth: 760,
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#F8F9FB",
                },
            }}
        >
            {/* ── Header ── */}
            <DrawerHeaderRoot>
                <DrawerAvatarBox>
                    <DrawerAvatarText>{employee.initials}</DrawerAvatarText>
                </DrawerAvatarBox>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <DrawerEmpProfileLabel>Employee Profile</DrawerEmpProfileLabel>
                    <DrawerEmpNameText>{employee.name}</DrawerEmpNameText>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                    <EnrollStatusChip enrollStatus={employee.enrollmentStatus}>
                        {employee.enrollmentStatus}
                    </EnrollStatusChip>
                    <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{
                            width: 32,
                            height: 32,
                            border: "1px solid #EAEAEA",
                            borderRadius: 1.5,
                            color: "#555555",
                            "&:hover": { bgcolor: "#FEF2F2", color: "#DC2626" },
                        }}
                    >
                        <X size={15} />
                    </IconButton>
                </Box>
            </DrawerHeaderRoot>

            {/* ── Enrollment Stepper ── */}
            <EnrollmentStepper enrollmentStatus={employee.enrollmentStatus} />

            {/* ── KPI Strip ── */}
            <KPIStripRoot>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                    {kpiCards.map((k) => (
                        <KPICardRoot key={k.label} cardBg={k.bg} cardBorder={k.border}>
                            <KPICardIconBox iconColor={k.color}>
                                {k.icon}
                            </KPICardIconBox>
                            <Box sx={{ minWidth: 0 }}>
                                <KPICardValue valueColor={k.color}>{k.value}</KPICardValue>
                                <KPICardLabel>{k.label}</KPICardLabel>
                                <KPICardSubLabel>{k.sub}</KPICardSubLabel>
                            </Box>
                        </KPICardRoot>
                    ))}
                </Box>
            </KPIStripRoot>

            {/* ── Scrollable body ── */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
                {/* View Full Profile CTA */}
                <ViewProfileButton onClick={() => onViewProfile(employee)}>
                    <ExternalLink size={14} />
                    View Full Profile
                </ViewProfileButton>

                {/* 1. Employee Details */}
                <SectionBlock title="Employee Details">
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2,
                        }}
                    >
                        <InfoRow label="Full Name" value={employee.name} icon={User} />
                        <InfoRow label="Employee ID" value={employee.id} icon={FileText} />
                        <InfoRow label="Date of Birth" value={employee.dob} icon={Calendar} />
                        <InfoRow
                            label="Age"
                            value={`${employee.age} years`}
                            icon={Activity}
                        />
                        <InfoRow label="Gender" value={employee.gender} icon={User} />
                        <InfoRow
                            label="Department"
                            value={employee.department}
                            icon={Briefcase}
                        />
                        <InfoRow
                            label="Location"
                            value={employee.location}
                            icon={MapPin}
                        />
                        {/* <InfoRow
                            label="Date of Joining"
                            value={fmtDate(employee.doj)}
                            icon={Calendar}
                        /> */}
                        <InfoRow label="Email" value={employee.email} icon={Mail} />
                        <InfoRow label="Phone" value={employee.phone} icon={Phone} />
                        <InfoRow
                            label="Addition Type"
                            value={employee.additionType}
                            icon={Activity}
                        />
                        <InfoRow
                            label="E-Card No"
                            value={employee.ecardNo}
                            icon={CreditCard}
                        />
                    </Box>
                </SectionBlock>

                {/* 2. Insurance & Policy Details */}
                <SectionBlock title="Insurance & Policy Details">
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2,
                        }}
                    >
                        <InfoRow
                            label="Policy Name"
                            value={employee.policyName}
                            icon={FileText}
                        />
                        <InfoRow
                            label="Policy Status"
                            value={employee.policyStatus}
                            icon={Shield}
                        />
                        <InfoRow
                            label="Enrollment Status"
                            value={employee.enrollmentStatus}
                            icon={CheckCircle2}
                        />
                        <InfoRow
                            label="Sum Insured"
                            value={`${formatAmountWithCurrency(employee.sumInsured, localizationData?.data)}`}
                            icon={Banknote}
                        />
                        <InfoRow
                            label="Effective Date"
                            value={fmtDate(employee.policyEffectiveDate)}
                            icon={Calendar}
                        />
                        <InfoRow
                            label="Expiry Date"
                            value={fmtDate(employee.policyExpiryDate)}
                            icon={Calendar}
                        />
                    </Box>
                </SectionBlock>

                {/* 3. Dependents */}
                {employee.dependents.length > 0 && (
                    <SectionBlock title={`Dependents (${employee.dependents.length})`}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                            {employee.dependents.map((dep) => (
                                <DependentRowRoot key={dep.id}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <DependentAvatar>
                                            <DependentAvatarText>
                                                {dep.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </DependentAvatarText>
                                        </DependentAvatar>
                                        <Box>
                                            <DependentName>{dep.name}</DependentName>
                                            <DependentMeta>{capitalizeFirst(dep.relation)} · Age {dep.age}</DependentMeta>
                                        </Box>
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                        <DependentCovLabel>Coverage</DependentCovLabel>
                                        <DependentCovValue>{fmtINR(dep.coverage, localizationData?.data)}</DependentCovValue>
                                    </Box>
                                </DependentRowRoot>
                            ))}
                        </Box>
                    </SectionBlock>
                )}

                {/* 4. Claims History */}
                {employee.claims.length > 0 && (
                    <ClaimsCardRoot>
                        <ClaimsCardHeader>
                            <ClaimsCardTitle>Claims History ({employee.claims.length})</ClaimsCardTitle>
                            <ClaimsTotalLabel>
                                Total:{" "}
                                <Box component="span" sx={{ color: "#111111" }}>
                                    {fmtINRFull(employee.claimAmount, localizationData?.data)}
                                </Box>
                            </ClaimsTotalLabel>
                        </ClaimsCardHeader>
                        <Box sx={{ overflowX: "auto" }}>
                            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                                <Box component="thead">
                                    <Box component="tr" sx={{ bgcolor: "#F8FAFC" }}>
                                        {["Policy No", "Hospital", "Type", "Date", "Claimed", "Settled", "Status"].map((h) => (
                                            <ClaimTableTh key={h}>{h}</ClaimTableTh>
                                        ))}
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {employee.claims.map((clm, idx) => {
                                        const settled = mockSettled(clm);
                                        return (
                                            <Box
                                                key={clm.id}
                                                component="tr"
                                                sx={{ "&:hover": { bgcolor: "#F8FAFC" }, borderBottom: "1px solid #F3F4F6" }}
                                            >
                                                <ClaimTableTd>
                                                    <ClaimPolicyNo>{mockPolicyNo(employee.id, idx)}</ClaimPolicyNo>
                                                </ClaimTableTd>
                                                <ClaimTableTd>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <ClaimHospitalIconBox>
                                                            <Building2 size={11} color="#059669" />
                                                        </ClaimHospitalIconBox>
                                                        <Box>
                                                            <ClaimHospitalName>{clm.hospital}</ClaimHospitalName>
                                                            <ClaimHospitalDisease>{clm.disease}</ClaimHospitalDisease>
                                                        </Box>
                                                    </Box>
                                                </ClaimTableTd>
                                                <ClaimTableTd>
                                                    <ClaimTypeBadge claimType={clm.type}>{clm.type}</ClaimTypeBadge>
                                                </ClaimTableTd>
                                                <ClaimTableTd sx={{ fontSize: 10, color: "#555555", whiteSpace: "nowrap" }}>
                                                    {fmtDate(clm.date)}
                                                </ClaimTableTd>
                                                <ClaimTableTd sx={{ textAlign: "right" as const }}>
                                                    <ClaimAmountText>{fmtINRFull(clm.amount, localizationData?.data)}</ClaimAmountText>
                                                </ClaimTableTd>
                                                <ClaimTableTd sx={{ textAlign: "right" as const }}>
                                                    {settled > 0 ? (
                                                        <ClaimSettledText>{fmtINRFull(settled, localizationData?.data)}</ClaimSettledText>
                                                    ) : (
                                                        <Typography sx={{ fontSize: 10, color: "#9CA3AF" }}>—</Typography>
                                                    )}
                                                </ClaimTableTd>
                                                <ClaimTableTd>
                                                    <ClaimStatusBadge claimStatus={clm.status}>{clm.status}</ClaimStatusBadge>
                                                </ClaimTableTd>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    </ClaimsCardRoot>
                )}

                {/* 5. Activity Log */}
                {employee.activityLog.length > 0 && (
                    <SectionBlock title="Activity Log">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {employee.activityLog.slice(0, 5).map((log) => (
                                <Box key={log.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                    <ActivityDot />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <ActivityAction>{log.action}</ActivityAction>
                                        <ActivityMeta>By {log.by} · {fmtDate(log.date)}</ActivityMeta>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </SectionBlock>
                )}
            </Box>
        </Drawer>
    );
}
