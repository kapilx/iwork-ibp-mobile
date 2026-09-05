import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, InputBase, Typography } from "@mui/material";
import { ArrowLeft, Search, Users } from "lucide-react";

const ALL_EMPLOYEES = [
  { id: "EMP-10042", name: "Ramesh Kumar",   dept: "Engineering", policy: "GMC", grade: "L3", location: "Bangalore",  status: "Active"   },
  { id: "EMP-10043", name: "Sunita Sharma",  dept: "Finance",     policy: "GMC", grade: "L4", location: "Mumbai",     status: "Active"   },
  { id: "EMP-10044", name: "Harish Verma",   dept: "HR",          policy: "GTL", grade: "L3", location: "Delhi",      status: "Active"   },
  { id: "EMP-10045", name: "Priya Nair",     dept: "Operations",  policy: "GPA", grade: "L2", location: "Hyderabad",  status: "Active"   },
  { id: "EMP-10046", name: "Kunal Kapoor",   dept: "Sales",       policy: "GMC", grade: "L3", location: "Mumbai",     status: "Active"   },
  { id: "EMP-10047", name: "Alok Mishra",    dept: "Product",     policy: "GTL", grade: "L4", location: "Bangalore",  status: "Active"   },
  { id: "EMP-10048", name: "Vivek Reddy",    dept: "Design",      policy: "GMC", grade: "L3", location: "Hyderabad",  status: "Active"   },
  { id: "EMP-10052", name: "Priya Nair",     dept: "Legal",       policy: "GPA", grade: "L5", location: "Chennai",    status: "Active"   },
  { id: "EMP-10055", name: "Ramesh Kumar",   dept: "Design",      policy: "GTL", grade: "L2", location: "Bangalore",  status: "Active"   },
  { id: "EMP-10061", name: "Sunita Sharma",  dept: "Product",     policy: "GPC", grade: "L4", location: "Delhi",      status: "Active"   },
  { id: "EMP-10067", name: "Priya Nair",     dept: "Finance",     policy: "GMC", grade: "L3", location: "Mumbai",     status: "Inactive" },
  { id: "EMP-10078", name: "Anjali Rentala", dept: "Engineering", policy: "GMC", grade: "L4", location: "Hyderabad",  status: "Active"   },
  { id: "EMP-10082", name: "Ravi Sharma",    dept: "Sales",       policy: "GMC", grade: "L3", location: "Mumbai",     status: "Active"   },
  { id: "EMP-10089", name: "Meena Iyer",     dept: "Operations",  policy: "GPA", grade: "L4", location: "Chennai",    status: "Active"   },
  { id: "EMP-10091", name: "Harish Verma",   dept: "Engineering", policy: "GMC", grade: "L2", location: "Bangalore",  status: "Active"   },
  { id: "EMP-10095", name: "Kunal Kapoor",   dept: "HR",          policy: "GTL", grade: "L5", location: "Delhi",      status: "Active"   },
  { id: "EMP-10099", name: "Ramesh Kumar",   dept: "Legal",       policy: "GMC", grade: "L3", location: "Chennai",    status: "Active"   },
  { id: "EMP-10103", name: "Sunita Sharma",  dept: "Engineering", policy: "GMC", grade: "L4", location: "Bangalore",  status: "Active"   },
  { id: "EMP-10108", name: "Vivek Reddy",    dept: "Sales",       policy: "GTL", grade: "L3", location: "Mumbai",     status: "Inactive" },
  { id: "EMP-10112", name: "Priya Nair",     dept: "HR",          policy: "GMC", grade: "L2", location: "Hyderabad",  status: "Active"   },
];

export function HRPortalEmployeeSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const initQuery = (location.state as { query?: string } | null)?.query ?? "";
  const [searchQuery, setSearchQuery] = useState(initQuery);
  const [policyFilter, setPolicyFilter] = useState("All");

  const filtered = useMemo(() => ALL_EMPLOYEES.filter((emp) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQ = !q || emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.dept.toLowerCase().includes(q);
    const matchP = policyFilter === "All" || emp.policy === policyFilter;
    return matchQ && matchP;
  }), [searchQuery, policyFilter]);

  const dupNames = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_EMPLOYEES.forEach((e) => { counts[e.name] = (counts[e.name] ?? 0) + 1; });
    return new Set(Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k));
  }, []);

  return (
    <Box sx={{ mx: -3, height: "100%", background: "#EBF6FF", display: "flex", flexDirection: "column" }}>
      {/* Gradient header */}
      <Box sx={{ minHeight: 60, display: "flex", alignItems: "center", gap: 1.5, pl: 3, pr: 4, background: "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)", flexShrink: 0 }}>
        <Box onClick={() => navigate(-1)} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, height: 34, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 500, cursor: "pointer", "&:hover": { background: "rgba(255,255,255,0.12)" } }}>
          <ArrowLeft size={13} /> Back
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Users size={16} color="rgba(255,255,255,0.85)" />
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff" }}>Employee Search</Typography>
        </Box>
        <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, bgcolor: "rgba(255,255,255,0.18)" }}>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#fff" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 3, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { background: "#D1D5DB", borderRadius: 4 } }}>
        {/* Search + filter card */}
        <Box sx={{ borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", mb: 2 }}>
          {/* Toolbar */}
          <Box sx={{ px: 2.5, py: 1.75, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid #F3F4F6" }}>
            {/* Search input */}
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, px: 1.5, height: 38, border: "1px solid #E5E7EB", borderRadius: "10px", bgcolor: "#F9FAFB", "&:focus-within": { borderColor: "#2556A6", bgcolor: "#fff" }, transition: "all 0.15s" }}>
              <Search size={14} color="#9CA3AF" />
              <InputBase
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, employee ID or department..."
                autoFocus
                sx={{ flex: 1, fontSize: 15, lineHeight: 1.7, "& input": { p: 0 } }}
              />
            </Box>
          </Box>

          {/* Table */}
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 15, lineHeight: 1.7 }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: "#4B6B8A" }}>
                  {["Employee", "ID", "Department", "Policy", "Grade", "Location", "Status"].map((h) => (
                    <Box component="th" key={h} sx={{ px: 3, py: 1.5, textAlign: "left", fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", bgcolor: "#4B6B8A" }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {filtered.length === 0 ? (
                  <Box component="tr">
                    <Box component="td" colSpan={7} sx={{ textAlign: "center", py: 8 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 500 }}>No employees found</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#D1D5DB", mt: 0.75 }}>Try a different name or ID</Typography>
                    </Box>
                  </Box>
                ) : filtered.map((emp, i) => {
                  const isDup = dupNames.has(emp.name);
                  return (
                    <Box component="tr" key={emp.id} onClick={() => navigate(`/hr-portal/enrollment/${emp.id}`)} sx={{ borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none", cursor: "pointer", "&:hover": { bgcolor: "#EBF3FF" }, transition: "background 0.1s" }}>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#2556A6" }}>
                            {emp.name.split(" ").map((n) => n[0]).join("")}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{emp.name}</Typography>
                            {isDup && (
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#F59E0B", fontWeight: 600 }}>Multiple records</Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", fontFamily: "monospace" }}>{emp.id}</Typography>
                      </Box>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151" }}>{emp.dept}</Typography>
                      </Box>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, bgcolor: "#EBF3FF", display: "inline-block" }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1C57B8" }}>{emp.policy}</Typography>
                        </Box>
                      </Box>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151" }}>{emp.grade}</Typography>
                      </Box>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{emp.location}</Typography>
                      </Box>
                      <Box component="td" sx={{ px: 3, py: 1.75 }}>
                        <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, bgcolor: emp.status === "Active" ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${emp.status === "Active" ? "#A7F3D0" : "#E5E7EB"}`, display: "inline-block" }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: emp.status === "Active" ? "#059669" : "#9CA3AF" }}>{emp.status}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
