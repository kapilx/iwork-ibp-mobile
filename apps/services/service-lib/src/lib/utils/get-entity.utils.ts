import { Organisation } from "../entities/organisation.entity";
import { OrgDesignation } from "../entities/org-designation.entity";
import { OrgDepartment } from "../entities/org-department.entity";
import { OrgSbu } from "../entities/org-sbu.entity";
import { OrgVertical } from "../entities/org-vertical.entity";
import { OrgBranch } from "../entities/org-branch.entity";
import { City } from "../entities/city.entity";
import { State } from "../entities/state.entity";
import { Country } from "../entities/country.entity";
import { Region } from "../entities/region.entity";
import { Currency } from "../entities/currency.entity";
import { LookUp, Role } from "../entities";
import { User } from "../entities/user";
import { MstrCover } from "../entities/mstr-cover.entity";
import { DEFAULT_VALUES } from "../constants";

export function getEntityByName(name: string): any {
  switch (name) {
    case "organisation": {
      return Organisation;
    }
    case "org_designation": {
      return OrgDesignation;
    }
    case "org_department": {
      return OrgDepartment;
    }
    case "org_sbu": {
      return OrgSbu;
    }
    case "org_vertical": {
      return OrgVertical;
    }
    case "org_branch": {
      return OrgBranch;
    }
    case "city": {
      return City;
    }
    case "state": {
      return State;
    }
    case "country": {
      return Country;
    }
    case "region": {
      return Region;
    }
    case "role": {
      return Role;
    }
    case "currency": {
      return Currency;
    }
    case "user": {
      return User;
    }
    case DEFAULT_VALUES.LOOKUP_DATA_ENTITY:
    case DEFAULT_VALUES.POLICY_TYPE:
    case DEFAULT_VALUES.IRDAI_POLICY_TYPE:
    case DEFAULT_VALUES.IIRM_POLICY_TYPE:
    case DEFAULT_VALUES.IIRM_POLICY_TYPES:
    case DEFAULT_VALUES.IRDAI_POLICY_TYPES: {
      return LookUp;
    }
    case "cover": {
      return MstrCover;
    }

    default:
      throw new Error(`Entity not found for table: ${name}`);
  }
}
