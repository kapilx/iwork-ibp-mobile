/**
 * Manual/regression test script for the HCL inbound endpoint
 * (POST /integrations/hcl/process-enroll-data), served by
 * external-integration-service.
 *
 * Posts every one of HCL Interface Document v1.4's own sample payloads
 * (../fixtures/*.json — read from disk, not duplicated here, so this script
 * never drifts from the fixtures the doc itself was validated against),
 * prints the response next to the message the document says to expect, and
 * (optionally) lists what actually landed in hcl_employee_intake afterward.
 *
 * Usage:
 *   npx ts-node apps/services/external-integration-service/src/app/hcl-integration/scripts/test-hcl-endpoint.ts
 *
 * Env overrides (all optional):
 *   HCL_TEST_BASE_URL     default: http://localhost:3027            (external-integration-service directly)
 *                          e.g. http://localhost:3000/iirm/external-integration-service  (through the gateway)
 *   HCL_TEST_COMPANY_ID   if set, also GETs /integrations/hcl/company/:id/intake
 *                          afterward and prints what's there (see the
 *                          policyno-resolution caveat in fixtures/README.md —
 *                          the sample payloads' placeholder policy numbers
 *                          won't resolve to a real company/policy unless you
 *                          edit them first).
 *
 * Requires HCL_USERNAME / HCL_PASSWORD to be set in external-integration-
 * service's own env to match the credentials the fixtures carry
 * (iirmhclwebservice / iirmhcl$123 for every fixture except
 * dependent-delete.json, which sends both as empty strings per the
 * document's own sample).
 *
 * ⚠️ Every fixture's "policyno" is HCL's own placeholder ("900020001111" /
 * "NA") and is now REJECTED outright (400, "Policy number ... is not
 * available in IIRM database") — the endpoint requires policyno to resolve
 * to a real policy.insurer_policy_number. Edit each fixture's policyno
 * (root-level and the one nested under E_EMP_HCL) to a real value in your
 * target DB before expecting these cases to pass; otherwise every ❌ below
 * is expected, not a regression.
 */
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const BASE_URL = process.env.HCL_TEST_BASE_URL ?? "http://localhost:3027";
const ENDPOINT = `${BASE_URL}/integrations/hcl/process-enroll-data`;
const COMPANY_ID = process.env.HCL_TEST_COMPANY_ID;

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

// [fixture file, expected returnMessage — per the document's sample OUTPUT
// Response for that case; see fixtures/README.md for the same table]
const CASES: Array<[string, string]> = [
  ["ad-emcp-activate.json", "Employee EMCP activated successfully."],
  ["ad-ghmi-activate.json", "Employee GHMI activated successfully."],
  ["ad-emcp-deactivate.json", "Employee EMCP de-activated successfully."],
  ["ad-ghmi-deactivate.json", "Employee GHMI de-activated successfully."],
  ["bulk-insert.json", "Employee and dependents successfully updated"], // first GetEmpStatus[] entry
  ["dependent-delete.json", "Employee dependents deleted successfully"], // GetEmpStatus[] entry
  ["employee-demise.json", "Employee deleted successfully."],
  ["employee-separation.json", "Employee deleted successfully."],
  ["employee-transfer.json", "Employee Transferred TO EMCP Successfully"],
  ["natural-addition.json", "Natural addition added successfully."],
];

function loadFixture(fileName: string): unknown {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, fileName), "utf8");
  return JSON.parse(raw);
}

// Pulls the message out regardless of whether this operation type responds
// via top-level GetStatus (AD/ED/ES/ET/NA) or per-entry GetEmpStatus[]
// (BI/DD) — see hcl-integration.service.ts's BATCH_STYLE_OPERATIONS.
function actualMessage(responseBody: any): string {
  return (
    responseBody?.GetEmpStatus?.[0]?.returnMessage ??
    responseBody?.GetStatus?.returnMessage ??
    "(no message found in response)"
  );
}

async function runCase(fileName: string, expectedMessage: string): Promise<boolean> {
  const payload = loadFixture(fileName);
  try {
    const res = await axios.post(ENDPOINT, payload, {
      validateStatus: () => true, // inspect non-2xx ourselves instead of throwing
    });
    const message = actualMessage(res.data);
    const pass = message === expectedMessage;
    console.log(
      `${pass ? "✅" : "❌"} ${fileName.padEnd(26)} status=${res.status}  message="${message}"`,
    );
    if (!pass) {
      console.log(`   expected: "${expectedMessage}"`);
      console.log(`   full response: ${JSON.stringify(res.data)}`);
    }
    return pass;
  } catch (err: any) {
    console.log(`❌ ${fileName.padEnd(26)} request failed: ${err.message}`);
    return false;
  }
}

async function listIntake(companyId: string): Promise<void> {
  const url = `${BASE_URL}/integrations/hcl/company/${companyId}/intake`;
  try {
    const res = await axios.get(url, { headers: { userid: "1" } });
    const records = res.data?.data?.records ?? [];
    console.log(`\nIntake records for company ${companyId}: ${records.length}`);
    for (const r of records) {
      console.log(
        `  #${r.id}  ein=${r.ein}  op=${r.flagOperationType}  status=${r.status}  policyId=${r.policyId}`,
      );
    }
  } catch (err: any) {
    console.log(`\nCould not fetch intake list: ${err.message}`);
  }
}

async function main() {
  console.log(`Testing HCL endpoint at ${ENDPOINT}\n`);

  let passed = 0;
  for (const [fileName, expectedMessage] of CASES) {
    const ok = await runCase(fileName, expectedMessage);
    if (ok) passed++;
  }

  console.log(`\n${passed}/${CASES.length} cases matched the documented response.`);

  // Re-run the first case to confirm dedup — same EIN + CHECK_SUM should not
  // create a second intake row (see hcl-integration.repository.ts findExisting).
  console.log("\nRe-posting ad-emcp-activate.json to check idempotency…");
  await runCase(...CASES[0]);

  if (COMPANY_ID) {
    await listIntake(COMPANY_ID);
  } else {
    console.log(
      "\n(Set HCL_TEST_COMPANY_ID to also list what landed in hcl_employee_intake — " +
        "note the fixtures' placeholder policyno won't resolve to a real company unless edited first.)",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
