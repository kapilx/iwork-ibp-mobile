import { Box, Typography } from "@mui/material";
import { ArrowLeft, FileText, CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { CLAIMS, type Claim } from "../../mock-data/hr-portal/claims";

const HOSPITALS = [
  { name: "Apollo Hospitals", city: "Mumbai" },
  { name: "Fortis Healthcare", city: "Delhi" },
  { name: "Manipal Hospitals", city: "Bangalore" },
  { name: "Narayana Health", city: "Bangalore" },
  { name: "Max Hospitals", city: "Delhi" },
];

const AILMENTS: Record<string, string> = {
  Self: "Appendicitis",
  Spouse: "Maternity Care",
  Child: "Respiratory Infection",
  Parent: "Orthopedic Treatment",
};

function parseClaimDate(value: string) {
  const [day, month, year] = value.split(" ");
  return new Date(`${month} ${day}, ${year}`);
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildDetail(claim: Claim) {
  const date = parseClaimDate(claim.claimDate);
  const hospital =
    HOSPITALS[
      Number.parseInt(claim.id.replace(/\D/g, ""), 10) % HOSPITALS.length
    ];
  const isPaid = claim.status === "Paid";

  return {
    beneficiaryName: claim.empName,
    proposerName: claim.empName,
    proposerNumber: claim.empId,
    relation: claim.relation,
    gender: claim.relation === "Self" ? "Male" : "Female",
    insuranceCompany: "Bajaj Allianz General Insurance Company Ltd.",
    policyPeriod: "01/04/2025 To 31/03/2026",
    policyNumber: `OG-24-1919-8403-${claim.empId
      .replace(/\D/g, "")
      .padStart(8, "0")}`,
    groupName: "Demo Corporate Private Limited",
    claimNumber: claim.id,
    dateOfAdmission: claim.claimDate,
    dateOfDischarge: formatLongDate(addDays(date, 2)),
    claimExtension: "-",
    providerName: `${hospital.name}, ${hospital.city}`,
    ailment: AILMENTS[claim.relation] ?? "General Medical Condition",
    cashlessAmount: claim.claimType === "Cashless" ? "₹ 76,500" : "₹ 0",
    denialDate:
      claim.status === "Denied" ? formatLongDate(addDays(date, 5)) : "-",
    billReceivedDate: isPaid ? formatLongDate(addDays(date, 7)) : "-",
    paymentDate: isPaid ? formatLongDate(addDays(date, 12)) : "-",
    tdsAmount: "-",
    hospital: hospital.name,
    city: hospital.city,
    diagnosis: AILMENTS[claim.relation] ?? "General Medical Condition",
  };
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: 10, color: "#7d8794", fontWeight: 400, mb: 0.7 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#1f2937" }}>
        {value}
      </Typography>
    </Box>
  );
}

const CARD_SX = {
  background: "linear-gradient(247deg, #EDEDED 6.94%, #FEFEFE 84.91%)",
  borderRadius: "8px",
  boxShadow: "0 6px 100px 0 rgba(0,0,0,0.10)",
  border: "1px solid #FFF",
  overflow: "hidden",
  mb: 0,
} as const;

function DetailCard({
  title,
  badge,
  fields,
}: {
  title: string;
  badge?: { label: string; bg: string; color: string };
  fields: { label: string; value: string }[];
}) {
  return (
    <Box sx={CARD_SX}>
      <Box
        sx={{
          px: 2.5,
          py: 1.8,
          borderBottom: "1px solid #E4EAF3",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
          {title}
        </Typography>
        {badge ? (
          <Box
            sx={{
              px: 1.4,
              py: 0.5,
              borderRadius: "7px",
              background: badge.bg,
              color: badge.color,
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            {badge.label}
          </Box>
        ) : null}
      </Box>
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 4,
          rowGap: 2.2,
        }}
      >
        {fields.map((field) => (
          <InfoPair key={field.label} label={field.label} value={field.value} />
        ))}
      </Box>
    </Box>
  );
}

export function ClaimDetailPage() {
  const navigate = useNavigate();
  const { claimId } = useParams();

  const claim = useMemo(
    () => CLAIMS.find((item) => item.id === claimId) ?? CLAIMS[0],
    [claimId]
  );

  const detail = useMemo(() => buildDetail(claim), [claim]);

  return (
    <Box sx={{ mx: -3, mt: -0.5, minHeight: "100%", background: "#eaf4ff" }}>
      <Box
        sx={{
          minHeight: 64,
          px: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.6,
          background: "linear-gradient(90deg, #2556a6 0%, #1f88c6 100%)",
          color: "#fff",
          width: "calc(100% + 96px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Box
          onClick={() => navigate("/hr-portal/claims")}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.8,
            px: 1.2,
            py: 0.5,
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: 10.5,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={12} />
          Back
        </Box>
        <Typography sx={{ fontSize: 13, opacity: 0.74 }}>/</Typography>
        <Typography sx={{ fontSize: 14, opacity: 0.82 }}>Claims</Typography>
        <Typography sx={{ fontSize: 13, opacity: 0.74 }}>/</Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
          {claim.id}
        </Typography>
      </Box>

      <Box sx={{ p: 2.4, display: "flex", flexDirection: "column", gap: 2.1 }}>
        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "34px minmax(0, 1fr) auto",
              columnGap: 1.6,
              alignItems: "flex-start",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1e5db8",
                color: "#fff",
              }}
            >
              <FileText size={15} />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 25, fontWeight: 600, color: "#111827" }}
              >
                {claim.id}
              </Typography>
              <Typography sx={{ fontSize: 10, color: "#7d8794", mt: 0.35 }}>
                Claim ID
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  px: 1.35,
                  py: 0.5,
                  borderRadius: "7px",
                  background: "#edfdf1",
                  border: "1px solid #b7efc5",
                  color: "#12934f",
                  fontSize: 10.5,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <CircleCheck size={11} />
                {claim.status}
              </Box>
              <Box
                sx={{
                  px: 1.35,
                  py: 0.5,
                  borderRadius: "7px",
                  background:
                    claim.claimType === "Cashless" ? "#eef4ff" : "#fff4e8",
                  border: "1px solid #d6e6ff",
                  color: claim.claimType === "Cashless" ? "#1f5db8" : "#c46a0c",
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                {claim.claimType}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 2,
              ml: "calc(34px + 12.8px)",
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 2,
            }}
          >
            <InfoPair label="Employee" value={claim.empName} />
            <InfoPair label="ID" value={claim.empId} />
            <InfoPair label="Hospital" value={detail.hospital} />
            <InfoPair label="Amount" value={claim.claimAmount} />
            <InfoPair label="TPA" value={claim.tpaId} />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <DetailCard
            title="Member Information"
            fields={[
              { label: "Name of Beneficiary", value: detail.beneficiaryName },
              { label: "Name of Insurance Co", value: detail.insuranceCompany },
              {
                label: "Proposer / Employee Number",
                value: detail.proposerNumber,
              },
              { label: "Policy Period", value: detail.policyPeriod },
              { label: "TPA ID", value: claim.tpaId },
              { label: "Group Name", value: detail.groupName },
              { label: "Relation", value: detail.relation },
              { label: "Policy Number", value: detail.policyNumber },
              { label: "Gender", value: detail.gender },
              {
                label: "Name of Proposer / Employee",
                value: detail.proposerName,
              },
            ]}
          />

          <DetailCard
            title={`Cashless Reported on (${claim.claimDate})`}
            fields={[
              { label: "Claim Number", value: detail.claimNumber },
              { label: "Date of Admission", value: detail.dateOfAdmission },
              { label: "Claim Extension", value: detail.claimExtension },
              { label: "Date of Discharge", value: detail.dateOfDischarge },
              { label: "Cashless Status", value: claim.status },
              { label: "Name of Provider", value: detail.providerName },
              {
                label: "Estimated / Reported Amount",
                value: claim.claimAmountExact,
              },
              { label: "Ailment", value: detail.ailment },
              { label: "Cashless Denial Date", value: detail.denialDate },
              { label: "Cashless Amount", value: detail.cashlessAmount },
            ]}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <DetailCard
            title="Claim Paid on -"
            badge={{ label: "Pending", bg: "#fff1dc", color: "#c57a12" }}
            fields={[
              { label: "Bill Received Date", value: detail.billReceivedDate },
              { label: "Service Tax Amount", value: "₹ 0" },
              {
                label: "Date of Payment to Provider",
                value: detail.paymentDate,
              },
              { label: "TDS Amount", value: detail.tdsAmount },
              {
                label: "Amount Paid to Provider",
                value: claim.settledAmountExact,
              },
              { label: "Cheque / UTR Number", value: "-" },
            ]}
          />

          <DetailCard
            title="Provider & Financials"
            fields={[
              { label: "Hospital", value: detail.hospital },
              { label: "City", value: detail.city },
              { label: "Department", value: claim.dept },
              { label: "Diagnosis", value: detail.diagnosis },
              { label: "Claim Type", value: claim.claimType },
              { label: "TAT / Aging", value: `${claim.tat} days` },
            ]}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ClaimDetailPage;
