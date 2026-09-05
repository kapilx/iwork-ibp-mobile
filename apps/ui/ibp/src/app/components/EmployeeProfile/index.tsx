import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { capitalizeFirst } from "../../utils";
import { useLocalization, formatAmountWithCurrency, getCurrencySymbolPrefix, type LocalizationConfig } from "@ui/ui-lib";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Building2,
    Calendar,
    Shield,
    FileText,
    User,
    Users,
    Activity,
    Download,
    Upload,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { DrawerEmployee } from "../EmployeeDetailDrawer";
import {
    SectionCard,
    TabBar,
    TabItem,
    StyledTable,
    StyledTh,
    StyledTd,
    ActionButton,
} from "../../pages/HRPortal/styles";
import {
    BackButton,
    ProfileAvatarBox,
    ProfileAvatarText,
    ProfileName,
    ProfileSubline,
    ProfileEnrollChip,
    ProfilePolicyChip,
    ProfileMetaIconBox,
    ProfileMetaValue,
    ProfileMetaSub,
    InfoGrid,
    InfoCell,
    InfoCellIconBox,
    InfoCellLabel,
    InfoCellValue,
    DependentGrid,
    DependentCard,
    DependentCardAvatar,
    DependentCardAvatarText,
    DependentRelBadge,
    DependentDataCell,
    DependentDataLabel,
    DependentDataValue,
    DependentCovValue,
    ClaimsTableWrap,
    ClaimStatusBadge,
    ClaimTypeBadge,
    DocRow,
    DocIconBox,
    DocName,
    DocMeta,
    DocTypeBadge,
    DocDownloadBtn,
    ActivityTimelineRoot,
    ActivityTimelineLine,
    ActivityBullet,
    ActivityText,
    ActivityMeta,
    EnrollmentActivityRow,
    EnrollmentActivityText,
    EnrollmentActivityMeta,
    TabSectionTitle,
} from "./styles";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtK = (v: number, localization?: LocalizationConfig) => {
    const sym = getCurrencySymbolPrefix(localization);
    return v >= 100000 ? `${sym}${(v / 100000).toFixed(1)}L` : `${sym}${(v / 1000).toFixed(0)}k`;
};
const fmtDate = (d: string) => {
    if (!d || d === "—") return "—";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const MOCK_DOCS = [
    {
        name: "Policy Certificate FY 2025-26.pdf",
        size: "284 KB",
        date: "2025-04-01",
        type: "Policy",
    },
    {
        name: "ID Proof – Aadhaar Card.pdf",
        size: "156 KB",
        date: "2024-09-10",
        type: "KYC",
    },
    {
        name: "Claim Docs – Medical Report.pdf",
        size: "1.2 MB",
        date: "2025-06-15",
        type: "Claim",
    },
    {
        name: "Enrollment Form Signed.pdf",
        size: "98 KB",
        date: "2025-04-01",
        type: "Enrollment",
    },
];

type ProfileTab =
    | "personal"
    | "dependents"
    | "enrollment"
    | "claims"
    | "documents"
    | "activity";

interface EmployeeProfileProps {
    employee: DrawerEmployee;
    onBack: () => void;
}

export function EmployeeProfile({ employee, onBack }: EmployeeProfileProps) {
    const { localizationData } = useLocalization();
    const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

    const initials = employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2);

    const tenureStr =
        employee.tenureYears >= 1
            ? `${employee.tenureYears.toFixed(1)} yrs`
            : `${Math.round(employee.tenureYears * 12)} months`;

    const metaCards = [
        {
            icon: FileText,
            val: `${employee.totalClaims} Claims`,
            sub: fmtK(employee.claimAmount, localizationData?.data),
        },
        {
            icon: Users,
            val: `${employee.dependents.length} Dependents`,
            sub: "enrolled",
        },
        { icon: Calendar, val: tenureStr, sub: "tenure" },
        {
            icon: Shield,
            val: fmtK(employee.sumInsured, localizationData?.data),
            sub: "sum insured",
        },
    ];

    const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
        { id: "personal", label: "Personal Info", icon: User },
        { id: "dependents", label: "Dependents", icon: Users },
        { id: "enrollment", label: "Policy Enrollment", icon: Shield },
        { id: "claims", label: "Claims History", icon: FileText },
        { id: "documents", label: "Documents", icon: Download },
        { id: "activity", label: "Activity Log", icon: Activity },
    ];

    return (
        <Box>
            {/* Back button */}
            <BackButton onClick={onBack}>
                <ArrowLeft size={16} />
                Back to Enrollment
            </BackButton>

            {/* Profile Header */}
            <SectionCard sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 2.5 }}>
                    <ProfileAvatarBox>
                        <ProfileAvatarText>{initials}</ProfileAvatarText>
                    </ProfileAvatarBox>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
                            <Box>
                                <ProfileName>{employee.name}</ProfileName>
                                <ProfileSubline>{employee.id} · {employee.gender} · Age {employee.age}</ProfileSubline>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ProfileEnrollChip enrollStatus={employee.enrollmentStatus}>
                                    {employee.enrollmentStatus === "Enrolled" ? (
                                        <CheckCircle size={12} />
                                    ) : employee.enrollmentStatus === "Not Enrolled" ? (
                                        <XCircle size={12} />
                                    ) : (
                                        <AlertCircle size={12} />
                                    )}
                                    {employee.enrollmentStatus}
                                </ProfileEnrollChip>
                                <ProfilePolicyChip policyStatus={employee.policyStatus}>
                                    <Shield size={12} />
                                    {employee.policyStatus} Policy
                                </ProfilePolicyChip>
                            </Box>
                        </Box>
                        {/* Meta stats row */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
                            {metaCards.map((m) => (
                                <Box key={m.sub} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <ProfileMetaIconBox>
                                        <m.icon size={14} />
                                    </ProfileMetaIconBox>
                                    <Box>
                                        <ProfileMetaValue>{m.val}</ProfileMetaValue>
                                        <ProfileMetaSub>{m.sub}</ProfileMetaSub>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </SectionCard>

            {/* Tabs */}
            <TabBar sx={{ mb: 2 }}>
                {tabs.map((t) => (
                    <TabItem
                        key={t.id}
                        active={activeTab === t.id}
                        onClick={() => setActiveTab(t.id)}
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                        <t.icon size={13} />
                        {t.label}
                    </TabItem>
                ))}
            </TabBar>

            {/* Tab content */}
            <SectionCard>
                {/* ── Personal Info ── */}
                {activeTab === "personal" && (
                    <Box>
                        <TabSectionTitle>Personal Information</TabSectionTitle>
                        <InfoGrid>
                            {[
                                { icon: User, label: "Full Name", value: employee.name },
                                { icon: FileText, label: "Employee ID", value: employee.id },
                                // { icon: Calendar, label: "Date of Joining", value: fmtDate(employee.doj) },
                                { icon: Building2, label: "Department", value: employee.department },
                                { icon: MapPin, label: "Location", value: employee.location },
                                { icon: Mail, label: "Email", value: employee.email },
                                { icon: Phone, label: "Phone", value: employee.phone },
                                { icon: User, label: "Age / Gender", value: `${employee.age} years · ${employee.gender}` },
                                { icon: Calendar, label: "Date of Birth", value: fmtDate(employee.dob) },
                                { icon: Activity, label: "Tenure", value: tenureStr },
                            ].map((f) => (
                                <InfoCell key={f.label}>
                                    <InfoCellIconBox>
                                        <f.icon size={14} />
                                    </InfoCellIconBox>
                                    <Box>
                                        <InfoCellLabel>{f.label}</InfoCellLabel>
                                        <InfoCellValue>{f.value}</InfoCellValue>
                                    </Box>
                                </InfoCell>
                            ))}
                        </InfoGrid>
                    </Box>
                )}

                {/* ── Dependents ── */}
                {activeTab === "dependents" && (
                    <Box>
                        <TabSectionTitle>
                            Family & Dependents{" "}
                            <Box component="span" sx={{ color: "#555555", fontWeight: 400 }}>
                                ({employee.dependents.length})
                            </Box>
                        </TabSectionTitle>
                        {employee.dependents.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 5, color: "#9CA3AF" }}>
                                <Users size={40} color="#D1D5DB" />
                                <Typography sx={{ fontSize: 13, mt: 1 }}>No dependents enrolled.</Typography>
                            </Box>
                        ) : (
                            <DependentGrid>
                                {employee.dependents.map((dep) => (
                                    <DependentCard key={dep.id}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                                            <DependentCardAvatar>
                                                <DependentCardAvatarText>{dep.name[0]}</DependentCardAvatarText>
                                            </DependentCardAvatar>
                                            <Box>
                                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>
                                                    {dep.name}
                                                </Typography>
                                                <DependentRelBadge relation={dep.relation}>
                                                    {capitalizeFirst(dep.relation)}
                                                </DependentRelBadge>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                            <DependentDataCell>
                                                <DependentDataLabel>Age</DependentDataLabel>
                                                <DependentDataValue>{dep.age} yrs</DependentDataValue>
                                            </DependentDataCell>
                                            <DependentDataCell>
                                                <DependentDataLabel>Coverage</DependentDataLabel>
                                                <DependentCovValue>{fmtK(dep.coverage, localizationData?.data)}</DependentCovValue>
                                            </DependentDataCell>
                                        </Box>
                                    </DependentCard>
                                ))}
                            </DependentGrid>
                        )}
                    </Box>
                )}

                {/* ── Policy Enrollment ── */}
                {activeTab === "enrollment" && (
                    <Box>
                        <TabSectionTitle>Policy Enrollment Details</TabSectionTitle>
                        <InfoGrid sx={{ mb: 3 }}>
                            {[
                                { label: "Policy Name", value: employee.policyName },
                                { label: "Sum Insured", value: `${formatAmountWithCurrency(employee.sumInsured, localizationData?.data)}` },
                                { label: "Effective Date", value: fmtDate(employee.policyEffectiveDate) },
                                { label: "Expiry Date", value: fmtDate(employee.policyExpiryDate) },
                                { label: "Policy Status", value: employee.policyStatus },
                                { label: "Enrollment Status", value: employee.enrollmentStatus },
                                { label: "E-Card No", value: employee.ecardNo },
                                { label: "Addition Type", value: employee.additionType },
                            ].map((f) => (
                                <InfoCell key={f.label}>
                                    <Box>
                                        <InfoCellLabel>{f.label}</InfoCellLabel>
                                        <InfoCellValue>{f.value}</InfoCellValue>
                                    </Box>
                                </InfoCell>
                            ))}
                        </InfoGrid>
                        {/* Enrollment activity */}
                        {employee.activityLog.filter((a) => a.type === "enrollment").length > 0 && (
                            <Box>
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#555555", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                                    Enrollment History
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    {employee.activityLog
                                        .filter((a) => a.type === "enrollment")
                                        .map((a) => (
                                            <EnrollmentActivityRow key={a.id}>
                                                <Shield size={14} color="#338CE5" />
                                                <Box>
                                                    <EnrollmentActivityText>{a.action}</EnrollmentActivityText>
                                                    <EnrollmentActivityMeta>{fmtDate(a.date)} · {a.by}</EnrollmentActivityMeta>
                                                </Box>
                                            </EnrollmentActivityRow>
                                        ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── Claims History ── */}
                {activeTab === "claims" && (
                    <Box>
                        <TabSectionTitle>
                            Claims History{" "}
                            <Box component="span" sx={{ color: "#555555", fontWeight: 400 }}>
                                ({employee.claims.length})
                            </Box>
                        </TabSectionTitle>
                        {employee.claims.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 5, color: "#9CA3AF" }}>
                                <FileText size={40} color="#D1D5DB" />
                                <Typography sx={{ fontSize: 13, mt: 1 }}>No claims filed yet.</Typography>
                            </Box>
                        ) : (
                            <ClaimsTableWrap>
                                <StyledTable>
                                    <thead>
                                        <tr>
                                            {["Claim ID", "Type", "Relation", "Hospital", "Disease", "Date", "Status", "Amount"].map((h) => (
                                                <StyledTh key={h}>{h}</StyledTh>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employee.claims.map((c) => (
                                            <tr key={c.id}>
                                                <StyledTd sx={{ fontFamily: "monospace", fontSize: 11.5, color: "#338CE5" }}>
                                                    {c.id}
                                                </StyledTd>
                                                <StyledTd>
                                                    <ClaimTypeBadge claimType={c.type}>{c.type}</ClaimTypeBadge>
                                                </StyledTd>
                                                <StyledTd sx={{ fontSize: 12 }}>{capitalizeFirst(c.relation)}</StyledTd>
                                                <StyledTd sx={{ fontSize: 12 }}>{c.hospital}</StyledTd>
                                                <StyledTd sx={{ fontSize: 12 }}>{c.disease}</StyledTd>
                                                <StyledTd sx={{ fontSize: 12, color: "#555555", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</StyledTd>
                                                <StyledTd>
                                                    <ClaimStatusBadge claimStatus={c.status}>{c.status}</ClaimStatusBadge>
                                                </StyledTd>
                                                <StyledTd sx={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>{fmtK(c.amount, localizationData?.data)}</StyledTd>
                                            </tr>
                                        ))}
                                    </tbody>
                                </StyledTable>
                            </ClaimsTableWrap>
                        )}
                    </Box>
                )}

                {/* ── Documents ── */}
                {activeTab === "documents" && (
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                            <TabSectionTitle sx={{ mb: 0 }}>Documents</TabSectionTitle>
                            <ActionButton sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12 }}>
                                <Upload size={13} />
                                Upload New
                            </ActionButton>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {MOCK_DOCS.map((doc) => (
                                <DocRow key={doc.name}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <DocIconBox>
                                            <FileText size={16} color="#DC2626" />
                                        </DocIconBox>
                                        <Box>
                                            <DocName>{doc.name}</DocName>
                                            <DocMeta>{doc.size} · Uploaded {fmtDate(doc.date)}</DocMeta>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <DocTypeBadge docType={doc.type}>{doc.type}</DocTypeBadge>
                                        <DocDownloadBtn>
                                            <Download size={14} />
                                        </DocDownloadBtn>
                                    </Box>
                                </DocRow>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ── Activity Log ── */}
                {activeTab === "activity" && (
                    <Box>
                        <TabSectionTitle>Activity Log</TabSectionTitle>
                        <ActivityTimelineRoot>
                            <ActivityTimelineLine />
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {employee.activityLog.map((log) => (
                                    <Box key={log.id} sx={{ display: "flex", alignItems: "flex-start", gap: 2, pl: 0.5, position: "relative" }}>
                                        <ActivityBullet dotColor={
                                            log.type === "enrollment" ? "#338CE5" :
                                            log.type === "claim" ? "#079F92" :
                                            log.type === "document" ? "#8B5CF6" :
                                            "#D97706"
                                        }>
                                            <Activity size={13} />
                                        </ActivityBullet>
                                        <Box sx={{ flex: 1, pb: 2 }}>
                                            <ActivityText>{log.action}</ActivityText>
                                            <ActivityMeta>{fmtDate(log.date)} · {log.by}</ActivityMeta>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </ActivityTimelineRoot>
                    </Box>
                )}
            </SectionCard>
        </Box>
    );
}
