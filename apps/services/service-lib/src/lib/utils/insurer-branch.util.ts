import { DataSource } from "typeorm";
import { Address } from "../entities";

/**
 * Resolves the set of insurer-branch (address) ids to filter by.
 * - "branch": just the selected branch.
 * - "branchWithSub": the selected branch plus its entire descendant subtree
 *   (children, grandchildren, ... via address.parent_branch_id), so nested
 *   sub-branches like HQ -> CO -> BO are all included.
 *
 * Shared across services (policy report, policy listing, RO listing) so
 * "branch + sub-branches" means the same thing everywhere.
 */
export async function resolveInsurerBranchIds(
  dataSource: DataSource,
  insurerBranchId?: number,
  branchViewBy?: string
): Promise<number[] | undefined> {
  if (!insurerBranchId) return undefined;
  if (branchViewBy !== "branchWithSub") return [insurerBranchId];

  const addressRepository = dataSource.getRepository(Address);
  const collectedIds = new Set<number>([insurerBranchId]);
  let frontier: number[] = [insurerBranchId];

  // Walk the branch tree level by level via parent_branch_id until no new
  // descendants are found. The collectedIds guard makes this cycle-safe.
  while (frontier.length > 0) {
    const children = await addressRepository
      .createQueryBuilder("address")
      .select("address.id", "id")
      .where("address.parentBranchId IN (:...frontier)", { frontier })
      .getRawMany();

    frontier = children
      .map((child: { id: number }) => Number(child.id))
      .filter((id) => !collectedIds.has(id));
    frontier.forEach((id) => collectedIds.add(id));
  }

  return Array.from(collectedIds);
}
