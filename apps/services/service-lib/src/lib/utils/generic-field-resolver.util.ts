import { DataSource } from "typeorm";

/**
 * Resolves a single column's value from an arbitrary table for the current
 * employee/policy. Tries the most specific, best-understood relationship first and
 * only falls back to a bounded, heuristic multi-hop search for genuinely indirect
 * tables — see the priority order inside resolveTableColumnValue.
 *
 * Table/column names are validated against information_schema before being
 * interpolated into SQL (they can't be parameterized like values can), so a
 * malformed or malicious config row can't be used for SQL injection.
 */
export class GenericFieldResolverError extends Error {}

const MAX_HOPS = 3;

// The numeric `employeeId` threaded through this whole SSO flow is
// policy_enrollment_employee.id (see TpaSsoExecutorService callers) — NOT the unrelated
// `employee` table's id (a separate HR/org entity with its own id space).
const EMPLOYEE_ROOT_TABLE = "policy_enrollment_employee";
const POLICY_ROOT_TABLE = "policy";

interface ColumnInfo {
  columnName: string;
}

async function getTableColumns(dataSource: DataSource, tableName: string): Promise<ColumnInfo[]> {
  const rows: { column_name: string }[] = await dataSource.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  );
  return rows.map((r) => ({ columnName: r.column_name }));
}

async function directQuery(
  dataSource: DataSource,
  tableName: string,
  columnName: string,
  whereColumn: string,
  whereValue: number,
): Promise<string | null> {
  const rows: Record<string, unknown>[] = await dataSource.query(
    `SELECT "${columnName}" AS value FROM "${tableName}" WHERE "${whereColumn}" = $1 LIMIT 1`,
    [whereValue],
  );
  return rows[0]?.value != null ? String(rows[0].value) : null;
}

// One join step already anchored to a table earlier in the path (`fromTable`), landing on a
// new table (`toTable`) via `fromAlias.fromColumn = toAlias.toColumn`.
interface JoinEdge {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

// Bounded breadth-first search over the "<x>_id" naming convention, used ONLY as a
// fallback for tables that aren't the employee/policy roots themselves and don't have a
// literal employee_id/policy_id column (e.g. `company`, two hops from the employee root
// via its own company_id). Deliberately NOT used for anything closer than that — see the
// priority order in resolveTableColumnValue and the correctness note below.
async function findJoinPath(
  dataSource: DataSource,
  rootTable: string,
  targetTable: string,
): Promise<JoinEdge[] | null> {
  if (rootTable === targetTable) return [];

  const visited = new Set([rootTable]);
  let frontier: { table: string; path: JoinEdge[] }[] = [{ table: rootTable, path: [] }];

  for (let hop = 0; hop < MAX_HOPS && frontier.length; hop++) {
    const nextFrontier: { table: string; path: JoinEdge[] }[] = [];

    for (const node of frontier) {
      const columns = await getTableColumns(dataSource, node.table);

      // Forward: node.table itself references another table via a "<candidate>_id" column.
      for (const col of columns) {
        if (!col.columnName.endsWith("_id") || col.columnName === "id") continue;
        const candidate = col.columnName.slice(0, -"_id".length);
        if (visited.has(candidate)) continue;
        const candidateColumns = await getTableColumns(dataSource, candidate);
        if (!candidateColumns.some((c) => c.columnName === "id")) continue;

        const edge: JoinEdge = { fromTable: node.table, fromColumn: col.columnName, toTable: candidate, toColumn: "id" };
        if (candidate === targetTable) return [...node.path, edge];
        visited.add(candidate);
        nextFrontier.push({ table: candidate, path: [...node.path, edge] });
      }

      // Reverse: some other table references node.table via a "<node.table>_id" column.
      const refColumn = `${node.table}_id`;
      const referencing: { table_name: string }[] = await dataSource.query(
        `SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = $1`,
        [refColumn],
      );
      for (const ref of referencing) {
        if (visited.has(ref.table_name) || ref.table_name === node.table) continue;

        const edge: JoinEdge = { fromTable: node.table, fromColumn: "id", toTable: ref.table_name, toColumn: refColumn };
        if (ref.table_name === targetTable) return [...node.path, edge];
        visited.add(ref.table_name);
        nextFrontier.push({ table: ref.table_name, path: [...node.path, edge] });
      }
    }

    frontier = nextFrontier;
  }

  return null;
}

async function runJoinedQuery(
  dataSource: DataSource,
  rootTable: string,
  rootValue: number,
  path: JoinEdge[],
  targetColumn: string,
): Promise<string | null> {
  const tables = [rootTable, ...path.map((e) => e.toTable)];
  const aliases = tables.map((_, i) => `t${i}`);
  const targetAlias = aliases[aliases.length - 1];

  let sql = `SELECT "${targetAlias}"."${targetColumn}" AS value FROM "${tables[0]}" "${aliases[0]}"`;
  path.forEach((edge, i) => {
    sql += ` INNER JOIN "${edge.toTable}" "${aliases[i + 1]}" ON "${aliases[i]}"."${edge.fromColumn}" = "${aliases[i + 1]}"."${edge.toColumn}"`;
  });
  sql += ` WHERE "${aliases[0]}"."id" = $1 LIMIT 1`;

  const rows: Record<string, unknown>[] = await dataSource.query(sql, [rootValue]);
  return rows[0]?.value != null ? String(rows[0].value) : null;
}

export async function resolveTableColumnValue(
  dataSource: DataSource,
  tableName: string,
  columnName: string,
  employeeId: number | null,
  policyId: number | null,
): Promise<string | null> {
  const columns = await getTableColumns(dataSource, tableName);
  if (!columns.length) {
    throw new GenericFieldResolverError(`Table "${tableName}" does not exist`);
  }
  if (!columns.some((c) => c.columnName === columnName)) {
    throw new GenericFieldResolverError(`Column "${columnName}" does not exist on table "${tableName}"`);
  }
  const columnNames = new Set(columns.map((c) => c.columnName));

  // 1. The target table IS the employee/policy root itself — the correct, already-known
  //    answer, 0 hops. Always wins over anything below; nothing is more specific than this.
  if (tableName === EMPLOYEE_ROOT_TABLE && employeeId != null) {
    return directQuery(dataSource, tableName, columnName, "id", employeeId);
  }
  if (tableName === POLICY_ROOT_TABLE && policyId != null) {
    return directQuery(dataSource, tableName, columnName, "id", policyId);
  }

  // 2. The target table has BOTH employee_id and policy_id (the enrollment/junction
  //    shape, e.g. policy_enrollment_employee_policy_map) — anchor on both, not just one.
  //    An employee can have more than one policy enrollment row; filtering on employee_id
  //    alone risks picking an arbitrary one instead of the specific employee+policy
  //    pairing already resolved upstream for this SSO request.
  if (columnNames.has("employee_id") && columnNames.has("policy_id") && employeeId != null && policyId != null) {
    const rows: Record<string, unknown>[] = await dataSource.query(
      `SELECT "${columnName}" AS value FROM "${tableName}" WHERE "employee_id" = $1 AND "policy_id" = $2 LIMIT 1`,
      [employeeId, policyId],
    );
    return rows[0]?.value != null ? String(rows[0].value) : null;
  }

  // 3. The target table has just one of employee_id/policy_id directly.
  if (columnNames.has("employee_id") && employeeId != null) {
    return directQuery(dataSource, tableName, columnName, "employee_id", employeeId);
  }
  if (columnNames.has("policy_id") && policyId != null) {
    return directQuery(dataSource, tableName, columnName, "policy_id", policyId);
  }

  // 4. Anything else: a genuinely indirect table (e.g. `company`, two hops away) — bounded
  //    heuristic search from both roots, keeping the shortest path found. This is reached
  //    only when none of the precise, well-understood relationships above apply.
  const roots: { table: string; value: number | null }[] = [
    { table: EMPLOYEE_ROOT_TABLE, value: employeeId },
    { table: POLICY_ROOT_TABLE, value: policyId },
  ];
  let best: { root: (typeof roots)[number]; path: JoinEdge[] } | null = null;
  for (const root of roots) {
    if (root.value == null) continue;
    const path = await findJoinPath(dataSource, root.table, tableName);
    if (path && (!best || path.length < best.path.length)) {
      best = { root, path };
    }
  }
  if (best) {
    return runJoinedQuery(dataSource, best.root.table, best.root.value as number, best.path, columnName);
  }

  throw new GenericFieldResolverError(
    `Could not find a join path from employee/policy to table "${tableName}" within ${MAX_HOPS} hops — ` +
      `this generic resolver walks "<x>_id"-style foreign keys automatically, but gives up rather ` +
      `than guess beyond that limit`,
  );
}
