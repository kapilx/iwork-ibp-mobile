import { Box, Typography } from "@mui/material";
import { ChevronDown, Download, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

import {
  SectionCard,
  StyledTable,
  StyledTd,
  StyledTh,
} from "../../pages/HRPortal/styles";

type Stage =
  | "Documents Submitted"
  | "Under Review"
  | "Medical Assessment"
  | "Approval Pending"
  | "Settlement";

type ProcessClaimItem = {
  claimNo: string;
  employee: string;
  employeeId: string;
  hospital: string;
  city: string;
  diagnosis: string;
  type: "Cashless" | "Reimbursement";
  amount: string;
  amountNote: string;
  stage: Stage;
  assignedTo: string;
  submitted: string;
  updated: string;
  pendingDocs: number;
};

const CLAIMS: ProcessClaimItem[] = [
  {
    claimNo: "CLM-2026-0934",
    employee: "Arjun Mehta",
    employeeId: "EMP019",
    hospital: "Narayana Health",
    city: "Bangalore",
    diagnosis: "Cardiac Surgery",
    type: "Cashless",
    amount: "₹5.1L",
    amountNote: "₹5,10,000",
    stage: "Medical Assessment",
    assignedTo: "Dr. Kapoor (TPA)",
    submitted: "22 Feb 2026",
    updated: "26 Feb 2026",
    pendingDocs: 2,
  },
  {
    claimNo: "CLM-2026-0935",
    employee: "Priya Sharma",
    employeeId: "EMP042",
    hospital: "Apollo Hospital",
    city: "Delhi",
    diagnosis: "Appendectomy",
    type: "Cashless",
    amount: "₹1.8L",
    amountNote: "₹1,80,000",
    stage: "Approval Pending",
    assignedTo: "Rohit Singh (TPA)",
    submitted: "14 Mar 2026",
    updated: "18 Mar 2026",
    pendingDocs: 1,
  },
  {
    claimNo: "CLM-2026-0936",
    employee: "Rajesh Kumar",
    employeeId: "EMP007",
    hospital: "Fortis Healthcare",
    city: "Mumbai",
    diagnosis: "Knee Replacement",
    type: "Reimbursement",
    amount: "₹3.4L",
    amountNote: "₹3,40,000",
    stage: "Documents Submitted",
    assignedTo: "Anita Das (TPA)",
    submitted: "02 Mar 2026",
    updated: "05 Mar 2026",
    pendingDocs: 3,
  },
  {
    claimNo: "CLM-2026-0937",
    employee: "Sneha Iyer",
    employeeId: "EMP088",
    hospital: "Yashoda Hospital",
    city: "Hyderabad",
    diagnosis: "Maternity",
    type: "Cashless",
    amount: "₹0.9L",
    amountNote: "₹90,000",
    stage: "Settlement",
    assignedTo: "Meera Nair (TPA)",
    submitted: "10 Jan 2026",
    updated: "28 Jan 2026",
    pendingDocs: 0,
  },
  {
    claimNo: "CLM-2026-0938",
    employee: "Vikram Nair",
    employeeId: "EMP031",
    hospital: "Max Hospital",
    city: "Gurugram",
    diagnosis: "Diabetes Complication",
    type: "Reimbursement",
    amount: "₹2.2L",
    amountNote: "₹2,20,000",
    stage: "Under Review",
    assignedTo: "Dr. Sharma (TPA)",
    submitted: "19 Mar 2026",
    updated: "22 Mar 2026",
    pendingDocs: 0,
  },
  {
    claimNo: "CLM-2026-0939",
    employee: "Kavya Reddy",
    employeeId: "EMP055",
    hospital: "Manipal Hospital",
    city: "Bangalore",
    diagnosis: "Fracture Treatment",
    type: "Cashless",
    amount: "₹1.2L",
    amountNote: "₹1,20,000",
    stage: "Documents Submitted",
    assignedTo: "Suresh Pillai (TPA)",
    submitted: "25 Mar 2026",
    updated: "25 Mar 2026",
    pendingDocs: 4,
  },
  {
    claimNo: "CLM-2026-0940",
    employee: "Amit Patel",
    employeeId: "EMP062",
    hospital: "Kokilaben Hospital",
    city: "Mumbai",
    diagnosis: "Hernia Repair",
    type: "Cashless",
    amount: "₹1.5L",
    amountNote: "₹1,50,000",
    stage: "Medical Assessment",
    assignedTo: "Dr. Joshi (TPA)",
    submitted: "08 Mar 2026",
    updated: "12 Mar 2026",
    pendingDocs: 1,
  },
  {
    claimNo: "CLM-2026-0941",
    employee: "Deepa Menon",
    employeeId: "EMP074",
    hospital: "Sakra World Hospital",
    city: "Bangalore",
    diagnosis: "Hypertension",
    type: "Reimbursement",
    amount: "₹0.6L",
    amountNote: "₹60,000",
    stage: "Approval Pending",
    assignedTo: "Priya Rao (TPA)",
    submitted: "01 Apr 2026",
    updated: "03 Apr 2026",
    pendingDocs: 0,
  },
  {
    claimNo: "CLM-2026-0942",
    employee: "Suresh Babu",
    employeeId: "EMP093",
    hospital: "KIMS Hospital",
    city: "Hyderabad",
    diagnosis: "Cataract Surgery",
    type: "Cashless",
    amount: "₹0.8L",
    amountNote: "₹80,000",
    stage: "Settlement",
    assignedTo: "Ravi Kumar (TPA)",
    submitted: "15 Feb 2026",
    updated: "02 Mar 2026",
    pendingDocs: 0,
  },
  {
    claimNo: "CLM-2026-0943",
    employee: "Neha Gupta",
    employeeId: "EMP028",
    hospital: "BLK Super Speciality",
    city: "Delhi",
    diagnosis: "Gallbladder Removal",
    type: "Reimbursement",
    amount: "₹2.7L",
    amountNote: "₹2,70,000",
    stage: "Under Review",
    assignedTo: "Anil Verma (TPA)",
    submitted: "28 Mar 2026",
    updated: "30 Mar 2026",
    pendingDocs: 2,
  },
  {
    claimNo: "CLM-2026-0944",
    employee: "Ravi Chandran",
    employeeId: "EMP016",
    hospital: "Aster CMI Hospital",
    city: "Bangalore",
    diagnosis: "Spinal Disc Surgery",
    type: "Cashless",
    amount: "₹4.3L",
    amountNote: "₹4,30,000",
    stage: "Medical Assessment",
    assignedTo: "Dr. Reddy (TPA)",
    submitted: "05 Apr 2026",
    updated: "07 Apr 2026",
    pendingDocs: 1,
  },
  {
    claimNo: "CLM-2026-0945",
    employee: "Ananya Singh",
    employeeId: "EMP049",
    hospital: "Cloudnine Hospital",
    city: "Chennai",
    diagnosis: "Normal Delivery",
    type: "Cashless",
    amount: "₹0.7L",
    amountNote: "₹70,000",
    stage: "Settlement",
    assignedTo: "Kavitha Nair (TPA)",
    submitted: "12 Feb 2026",
    updated: "25 Feb 2026",
    pendingDocs: 0,
  },
];

const STAGE_STYLES: Record<
  Stage,
  { bg: string; color: string; border: string }
> = {
  "Documents Submitted": { bg: "#f5f7fb", color: "#617282", border: "#d9e1ea" },
  "Under Review": { bg: "#eef5ff", color: "#2563eb", border: "#cfe0ff" },
  "Medical Assessment": { bg: "#fff5dd", color: "#d17d14", border: "#ffd58c" },
  "Approval Pending": { bg: "#f4edff", color: "#8056d6", border: "#dfd0ff" },
  Settlement: { bg: "#ecfbf0", color: "#19995a", border: "#b8e9c9" },
};

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        component="select"
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value)
        }
        sx={{
          height: 30,
          borderRadius: "6px",
          border: "1px solid #dce5ee",
          px: 1.2,
          pr: 3.5,
          fontSize: 10.5,
          color: "#64707e",
          background: "#fff",
          appearance: "none",
        }}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </Box>
      <ChevronDown
        size={12}
        color="#7c8795"
        style={{
          position: "absolute",
          right: 10,
          top: 9,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}

export function ProcessClaim() {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All years");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const visibleClaims = useMemo(() => {
    return CLAIMS.filter((claim) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        claim.claimNo.toLowerCase().includes(query) ||
        claim.employee.toLowerCase().includes(query) ||
        claim.hospital.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All status" || claim.stage === statusFilter;
      const matchesType =
        typeFilter === "All types" || claim.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleClaims.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleClaims.slice(start, start + pageSize);
  }, [currentPage, visibleClaims]);

  const kpis = [
    { label: "Total in process", value: "8", note: "ed" },
    { label: "Under review", value: "02", note: "All Submitted" },
    { label: "Medical asses", value: "2", note: "All Submitted" },
    { label: "Approval pending", value: "2", note: "All Submitted" },
    { label: "Settled", value: "1", note: "All Submitted" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.9 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 1.2,
        }}
      >
        {kpis.map((item) => (
          <SectionCard
            key={item.label}
            sx={{
              mb: 0,
              p: 1.5,
              borderRadius: "8px",
              border: "1px solid #FFF",
              background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
              boxShadow: "0 6px 100px 0 rgba(0, 0, 0, 0.10)",
            }}
          >
            <Typography sx={{ fontSize: 10, color: "#687686" }}>
              {item.label}
            </Typography>
            <Typography
              sx={{ mt: 0.55, fontSize: 26, fontWeight: 600, color: "#1f2937" }}
            >
              {item.value}
            </Typography>
            <Typography sx={{ mt: 0.35, fontSize: 9.6, color: "#8d99a6" }}>
              {item.note}
            </Typography>
          </SectionCard>
        ))}
      </Box>

      <SectionCard
        sx={{ mb: 0, p: 0, borderRadius: "10px", overflow: "hidden" }}
      >
        <Box
          sx={{
            px: 1.6,
            py: 1.2,
            borderBottom: "1px solid #edf1f6",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: 30,
              borderRadius: "6px",
              border: "1px solid #dce5ee",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: 1.2,
              background: "#fff",
            }}
          >
            <Search size={12} color="#97a2af" />
            <Box
              component="input"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              placeholder="Search employee, claim no..."
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 10.5,
                color: "#4b5563",
                background: "transparent",
              }}
            />
          </Box>
          <FilterSelect
            value={yearFilter}
            onChange={setYearFilter}
            options={["All years", "2026"]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              "All status",
              "Documents Submitted",
              "Under Review",
              "Medical Assessment",
              "Approval Pending",
              "Settlement",
            ]}
          />
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={["All types", "Cashless", "Reimbursement"]}
          />
          <Box
            sx={{
              height: 30,
              px: 1.45,
              borderRadius: "6px",
              background: "#1d57b7",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            <Download size={11} />
            Export
          </Box>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <StyledTable style={{ minWidth: 1120 }}>
            <thead>
              <tr>
                {[
                  "Claim Number",
                  "Employee",
                  "Hospital",
                  "Diagnosis",
                  "Type",
                  "Amount",
                  "Stage",
                  "Assigned To",
                  "Submitted",
                  "Last Updated",
                  "Pending Docs",
                ].map((heading) => (
                  <StyledTh
                    key={heading}
                    sx={{
                      py: 1,
                      fontSize: 12,
                      background: "#fff",
                      color: "#7d8794",
                      borderBottom: "1px solid #edf1f6",
                      textTransform: "none",
                    }}
                  >
                    {heading}
                  </StyledTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedClaims.map((claim, index) => {
                const stageStyle = STAGE_STYLES[claim.stage];

                return (
                  <tr key={`${claim.claimNo}-${index}`}>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#2a75d7",
                        }}
                      >
                        {claim.claimNo}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography sx={{ fontSize: 12, color: "#1f2937" }}>
                        {claim.employee}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 10, color: "#9aa6b2", mt: 0.2 }}
                      >
                        {claim.employeeId}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography sx={{ fontSize: 12, color: "#1f2937" }}>
                        {claim.hospital}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 10, color: "#9aa6b2", mt: 0.2 }}
                      >
                        {claim.city}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 12 }}>
                      {claim.diagnosis}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 0.9,
                          py: 0.35,
                          borderRadius: "6px",
                          background: "#f1edff",
                          color: "#7c5ce0",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {claim.type}
                      </Box>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        {claim.amount}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 10, color: "#9aa6b2", mt: 0.2 }}
                      >
                        {claim.amountNote}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 0.9,
                          py: 0.4,
                          borderRadius: "7px",
                          background: stageStyle.bg,
                          color: stageStyle.color,
                          border: `1px solid ${stageStyle.border}`,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {claim.stage}
                      </Box>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 12 }}>
                      {claim.assignedTo}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 12 }}>
                      {claim.submitted}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 12 }}>
                      {claim.updated}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          minWidth: 18,
                          justifyContent: "center",
                          px: 0.7,
                          py: 0.2,
                          borderRadius: "6px",
                          background: "#fff1f0",
                          color: "#ef4444",
                          border: "1px solid #ffd1d0",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {claim.pendingDocs}
                      </Box>
                    </StyledTd>
                  </tr>
                );
              })}
            </tbody>
          </StyledTable>
        </Box>

        <Box
          sx={{
            px: 1.6,
            py: 1,
            borderTop: "1px solid #edf1f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 9.5, color: "#8d99a6" }}>
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, visibleClaims.length)} of{" "}
            {visibleClaims.length} claims
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}>
            <Typography sx={{ fontSize: 10.5, color: "#7d8794" }}>
              Total value:{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "#1d57b7" }}>
                ₹16,52,000
              </Box>
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
              <Box
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "6px",
                  border: "1px solid #dbe3ee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#667085",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                {"<"}
              </Box>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNo = index + 1;
                const active = pageNo === currentPage;
                return (
                  <Box
                    key={pageNo}
                    onClick={() => setPage(pageNo)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "6px",
                      border: active ? "none" : "1px solid #dbe3ee",
                      background: active ? "#1d57b7" : "#fff",
                      color: active ? "#fff" : "#667085",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {pageNo}
                  </Box>
                );
              })}
              <Box
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "6px",
                  border: "1px solid #dbe3ee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#667085",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                {">"}
              </Box>
            </Box>
          </Box>
        </Box>
      </SectionCard>
    </Box>
  );
}

export default ProcessClaim;
