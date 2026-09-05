// Some TPAs prefix their JSON responses with an anti-JSON-hijacking token
// (Google/AngularJS-style ")]}',\n") and/or don't send a proper
// "Content-Type: application/json" header, so axios leaves response.data as a
// raw string instead of auto-parsing it. This strips that prefix (if present)
// and parses the remainder, so downstream code (flattening, field mapping,
// business-failure checks) always sees a real object.
export function normalizeTpaResponseData(data: unknown): unknown {
  if (typeof data !== "string") return data;
  const trimmed = data.replace(/^\)\]\}',?\s*/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return data;
  }
}
