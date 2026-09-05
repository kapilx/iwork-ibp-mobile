import { useEffect } from "react";
import type { useForm } from "react-hook-form";

type FormMethods = ReturnType<typeof useForm> | undefined;

/**
 * Keeps the insurer "View by" segmented control (Branch / Branch + sub-branches)
 * in step with the selected insurer branch.
 *
 * The control only means anything once a branch is picked — resolveInsurerBranchIds
 * ignores branchViewBy when there is no insurerBranchId — so seeding it in a page's
 * defaultValues showed a scope the query never applied. Instead:
 *   - branch selected -> select "Branch" (the user can still switch to sub-branches);
 *   - branch cleared, or the insurer above it cleared (which clears the branch via
 *     the insurer field's clearFieldsOnChange) -> clear "View by" too.
 *
 * Pass the watched insurerBranchId value; both the smart-search {value,label}
 * shape and a bare id are accepted.
 */
export const useInsurerBranchViewBy = (
  formMethods: FormMethods,
  insurerBranchValue: any
) => {
  useEffect(() => {
    if (!formMethods) return;
    const branchId =
      insurerBranchValue && typeof insurerBranchValue === "object"
        ? insurerBranchValue.value
        : insurerBranchValue;
    const current = formMethods.getValues("branchViewBy");
    if (branchId) {
      if (!current) {
        formMethods.setValue("branchViewBy", {
          value: "branch",
          label: "Branch",
        });
      }
    } else if (current) {
      formMethods.setValue("branchViewBy", "");
    }
  }, [insurerBranchValue, formMethods]);
};
