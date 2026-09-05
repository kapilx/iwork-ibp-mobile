import { ATTRIBUTE_FIELD_MAP } from "../../../../../apps/services/service-lib/src/lib/constants";
import { mapSearchParams } from "./helper.utils";

interface EmployeeInsuredSearchInput {
  relationshipGroup?: string;
  claimStatus?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  searchBy?: string;
  search?: string;
  iirmPolicyId?: string;
  insurerEndorsementNumber?: string;
  insurerEndorsementDate?: string;
  tpaId?: string;
  status?: string;
  endorsementId?: string;
}

interface EmployeeInsuredSearchResult {
  relationshipGroup?: string;
  claimStatus?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  searchBy?: string;
  employeeId?: string;
  iirmPolicyId?: string;
  insurerEndorsementNumber?: string;
  insurerEndorsementDate?: string;
  tpaId?: string;
  status?: string;
  endorsementId?: string;
}

export const resolveEmployeeInsuredSearchParams = ({
  relationshipGroup,
  claimStatus,
  effectiveFrom,
  effectiveTo,
  searchBy,
  search,
  iirmPolicyId,
  insurerEndorsementNumber,
  insurerEndorsementDate,
  tpaId,
  status,
  endorsementId,
}: EmployeeInsuredSearchInput): EmployeeInsuredSearchResult => {
  let effectiveRelationshipGroup = relationshipGroup;
  let effectiveClaimStatus = claimStatus;
  let effectiveEffectiveFrom = effectiveFrom;
  let effectiveEffectiveTo = effectiveTo;
  let effectiveSearchBy = searchBy;
  let effectiveEmployeeId: string | undefined;
  let effectiveIirmPolicyId = iirmPolicyId;
  let effectiveInsurerEndorsementNumber = insurerEndorsementNumber;
  let effectiveInsurerEndorsementDate = insurerEndorsementDate;
  let effectiveTpaId = tpaId;
  let effectiveStatus = status;
  let effectiveEndorsementId = endorsementId;

  const getRawEmployeeIdFromSearch = (
    rawSearch?: string
  ): string | undefined => {
    if (!rawSearch) return undefined;
    const match = rawSearch.match(/employeeId\s*[:=]\s*\[(.*?)\]/i);
    if (match && match[1]) {
      const [firstValue] = match[1].split(",");
      return firstValue?.trim();
    }
    return undefined;
  };

  if (search) {
    const rawEmployeeIdFromSearch = getRawEmployeeIdFromSearch(search);
    if (rawEmployeeIdFromSearch) {
      effectiveEmployeeId = rawEmployeeIdFromSearch;
    }

    const searchParams = mapSearchParams(search);
    if (!relationshipGroup) {
      const relationshipParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.relationshipGroup
      );
      if (relationshipParam) {
        effectiveRelationshipGroup = (relationshipParam as any).searchValue[0];
      }
    }

    if (!claimStatus) {
      const claimStatusParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.claimStatusFilter
      );
      if (claimStatusParam) {
        effectiveClaimStatus = (claimStatusParam as any).searchValue[0];
      }
    }

    if (!effectiveFrom) {
      const effectiveFromParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.effectiveFrom
      );
      if (effectiveFromParam) {
        effectiveEffectiveFrom = (effectiveFromParam as any).searchValue[0];
      }
    }

    if (!effectiveTo) {
      const effectiveToParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.effectiveTo
      );
      if (effectiveToParam) {
        effectiveEffectiveTo = (effectiveToParam as any).searchValue[0];
      }
    }

    if (!searchBy) {
      const insuredNameParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.insuredName
      );
      if (insuredNameParam) {
        effectiveSearchBy = (insuredNameParam as any).searchValue[0];
      }
    }

    const employeeIdParam = searchParams.find(
      (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.employeeId
    );
    if (employeeIdParam) {
      const rawEmployeeId = Array.isArray((employeeIdParam as any).searchValue)
        ? (employeeIdParam as any).searchValue[0]
        : (employeeIdParam as any).searchValue;
      if (rawEmployeeId instanceof Date) {
        effectiveEmployeeId = rawEmployeeIdFromSearch;
      } else {
        effectiveEmployeeId = String(rawEmployeeId);
      }
    }

    if (!iirmPolicyId) {
      const iirmPolicyIdParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.iirmPolicyId
      );
      if (iirmPolicyIdParam) {
        effectiveIirmPolicyId = (iirmPolicyIdParam as any).searchValue[0];
      }
    }

    if (!insurerEndorsementNumber) {
      const insurerEndorsementNumberParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.insurerEndorsementNumber
      );
      if (insurerEndorsementNumberParam) {
        effectiveInsurerEndorsementNumber = (insurerEndorsementNumberParam as any).searchValue[0];
      }
    }

    if (!insurerEndorsementDate) {
      const insurerEndorsementDateParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.insurerEndorsementDate
      );
      if (insurerEndorsementDateParam) {
        effectiveInsurerEndorsementDate = (insurerEndorsementDateParam as any).searchValue[0];
      }
    }

    if (!tpaId) {
      const tpaIdParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.tpaId
      );
      if (tpaIdParam) {
        effectiveTpaId = (tpaIdParam as any).searchValue[0];
      }
    }

    if (!status) {
      const statusParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.insuredStatus
      );
      if (statusParam) {
        effectiveStatus = (statusParam as any).searchValue[0];
      }
    }

    if (!endorsementId) {
      const endorsementIdParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.endorsementId
      );
      if (endorsementIdParam) {
        effectiveEndorsementId = (endorsementIdParam as any).searchValue[0];
      }
    }
  }

  return {
    relationshipGroup: effectiveRelationshipGroup,
    claimStatus: effectiveClaimStatus,
    effectiveFrom: effectiveEffectiveFrom,
    effectiveTo: effectiveEffectiveTo,
    searchBy: effectiveSearchBy,
    employeeId: effectiveEmployeeId ? String(effectiveEmployeeId) : undefined,
    iirmPolicyId: effectiveIirmPolicyId,
    insurerEndorsementNumber: effectiveInsurerEndorsementNumber ? String(effectiveInsurerEndorsementNumber) : undefined,
    insurerEndorsementDate: effectiveInsurerEndorsementDate,
    tpaId: effectiveTpaId ? String(effectiveTpaId) : undefined,
    status: effectiveStatus,
    endorsementId: effectiveEndorsementId ? String(effectiveEndorsementId) : undefined,
  };
};
