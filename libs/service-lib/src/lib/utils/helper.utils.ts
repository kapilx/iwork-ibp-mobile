import { BadRequestException } from "@nestjs/common";
import {
  ATTRIBUTE_FIELD_MAP,
  ACTIVITY_NAME_TABLE_MAP,
  RENEWAL_ACTIVITY_NAME_TABLE_MAP,
} from "../../../../../apps/services/service-lib/src/lib/constants";
import {
  FindOptionsWhere,
  ILike,
  Between,
  In,
  Repository,
  ObjectLiteral,
  SelectQueryBuilder,
} from "typeorm";
import {
  COVER_BEARING_ACTIVITY_ORDER,
  ENTITY_SORT_FIELDS,
  FIVE_YEARS,
  NINETY_DAYS,
  ONE_HUNDRED_EIGHTY_DAYS,
  ONE_YEAR,
  SIX_MONTHS,
  SIXTY_DAYS,
  THIRTY_DAYS,
  THREE_MONTHS,
  THREE_SIXTY_DAYS,
  TWO_YEARS,
} from "../constants";
import dayjs from "dayjs";

/**
 * Builds the where condition for the query.
 */
export function buildWhereCondition<T extends ObjectLiteral>(
  repository: Repository<T>,
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined,
  searchArray: { searchBy: string; searchValue: string }[] | undefined,
  relations: any
): FindOptionsWhere<T>[] | {} {
  let whereCondition: FindOptionsWhere<T>[] | {} = where || {};

  if (searchArray && searchArray.length > 0) {
    const searchConditions = searchArray
      .filter(({ searchBy, searchValue }) => searchBy && searchValue)
      .reduce((acc, { searchBy, searchValue }) => {
        const isNestedProperty = searchBy.includes(".");
        const parsedSearchValue = parseSearchValue(searchValue);

        if (!parsedSearchValue) return acc;

        if (isNestedProperty) {
          handleNestedSearchCondition(
            acc,
            searchBy,
            parsedSearchValue,
            relations
          );
        } else {
          handleSimpleSearchCondition(
            acc,
            repository,
            searchBy,
            parsedSearchValue
          );
        }

        return acc;
      }, {} as Record<string, any>);

    whereCondition = combineWhereConditions(whereCondition, searchConditions);
  }

  return whereCondition;
}

/**
 * Builds the order condition for the query.
 */
export function buildOrderCondition<T extends ObjectLiteral>(
  repository: Repository<T>,
  sort: { field: string; order: string }[],
  relations: any
): Record<string, any> {
  return sort.reduce<Record<string, any>>((acc, { field, order }) => {
    const isNestedProperty = field.includes(".");
    if (isNestedProperty) {
      const [relation, column] = field.split(".");
      if (!relations) relations = {};
      if (!relations[relation]) relations[relation] = true;
      acc[`${relation}.${column}`] = order;
    } else {
      const isValidColumn = repository.metadata.columns.some(
        (col) => col.propertyName === field
      );
      if (isValidColumn) {
        acc[field] = order;
      } else {
        console.warn(`Invalid sort field: ${field}`);
      }
    }
    return acc;
  }, {});
}

/**
 * Parses the search value to handle arrays or strings.
 */
function parseSearchValue(searchValue: string): string | string[] | undefined {
  if (searchValue.startsWith("[") && searchValue.endsWith("]")) {
    return searchValue
      .slice(1, -1)
      .split(",")
      .map((val) => val.trim());
  }
  return searchValue.trim() || undefined;
}

/**
 * Handles nested search conditions.
 */
function handleNestedSearchCondition(
  acc: Record<string, any>,
  searchBy: string,
  parsedSearchValue: string | string[],
  relations: any
): void {
  const [relation, field] = searchBy.split(".");
  if (!relations) relations = {};
  if (!relations[relation]) relations[relation] = true;
  if (!acc[relation]) acc[relation] = {};
  acc[relation][field] = Array.isArray(parsedSearchValue)
    ? In(parsedSearchValue)
    : ILike(`%${parsedSearchValue}%`);
}

/**
 * Handles simple search conditions.
 */
function handleSimpleSearchCondition<T extends ObjectLiteral>(
  acc: Record<string, any>,
  repository: Repository<T>,
  searchBy: string,
  parsedSearchValue: string | string[]
): void {
  const columnType = repository.metadata.columns.find(
    (col) => col.propertyName === searchBy
  )?.type;

  if (["varchar", "text"].includes(columnType as string)) {
    acc[searchBy] = Array.isArray(parsedSearchValue)
      ? In(parsedSearchValue)
      : ILike(`%${parsedSearchValue}%`);
  } else if (["number", "integer", "float"].includes(columnType as string)) {
    acc[searchBy] = Number(parsedSearchValue);
  } else if (["date", "timestamp"].includes(columnType as string)) {
    acc[searchBy] = Between(
      new Date(
        Array.isArray(parsedSearchValue)
          ? parsedSearchValue[0]
          : parsedSearchValue
      ),
      new Date(
        Array.isArray(parsedSearchValue)
          ? parsedSearchValue[1]
          : parsedSearchValue
      )
    );
  }
}

/**
 * Combines existing where conditions with new search conditions.
 */
function combineWhereConditions<T extends ObjectLiteral>(
  whereCondition: FindOptionsWhere<T>[] | {},
  searchConditions: Record<string, any>
): FindOptionsWhere<T>[] | {} {
  if (Array.isArray(whereCondition)) {
    return whereCondition.map((condition) => ({
      ...condition,
      ...searchConditions,
    }));
  } else if (Object.keys(whereCondition).length > 0) {
    return {
      ...whereCondition,
      ...searchConditions,
    };
  } else {
    return searchConditions;
  }
}

/**
 * Maps sort parameters to the format required by TypeORM.
 */
export function mapSortParams(
  params: string,
  entityName: string = "self"
): Array<{ field: string; order: "ASC" | "DESC" }> {
  if (!params) return [];
  const sortArray = params
    .split(",")
    .map((item) => {
      const [rawKey, rawOrder] = item.trim().split(":");
      const key = rawKey.trim();
      // Bare cast here previously let an arbitrary client string reach raw
      // SQL ORDER BY clauses downstream (field is whitelisted below, this
      // wasn't) — coerce to a real ASC/DESC now.
      const rawOrderUpper = (rawOrder || "ASC").trim().toUpperCase();
      const order: "ASC" | "DESC" =
        rawOrderUpper === "DESC" ? "DESC" : "ASC";
      let field;
      if (entityName === "self") field = ATTRIBUTE_FIELD_MAP[key];
      // Default to "created_at" if key is not mapped
      else {
        field = (ENTITY_SORT_FIELDS as Record<string, Record<string, string>>)[
          entityName
        ]?.[key]; // Use entity-specific mapping if available
      }
      return { field, order };
    })
    .filter(({ field }) => Boolean(field));
  return sortArray;
}

/**
 * Splits the params string on top-level commas (ignoring commas inside brackets).
 */
function splitParams(params: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of params) {
    if (char === "[") depth++;
    if (char === "]") depth--;
    if (char === "," && depth === 0) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

/**
 * Parses a search param string into the array format used by the query builder.
 * @param params Comma-separated "key:value" or "key:[v1,v2]" entries,
 *   where value can be a string, number, date (ISO), or array of those.
 */
export function mapSearchParams(params: string): Array<{
  searchBy: string;
  searchValue: string | number | Date | Array<string | number | Date>;
}> {
  if (!params) return [];
  return splitParams(params)
    .map((item) => {
      const colonIndex = item.indexOf(":");
      const equalsIndex = item.indexOf("=");
      let idx = -1;

      if (colonIndex === -1) {
        idx = equalsIndex;
      } else if (equalsIndex === -1) {
        idx = colonIndex;
      } else {
        idx = Math.min(colonIndex, equalsIndex);
      }

      if (idx < 0) return null;

      const rawKey = item.slice(0, idx).trim();
      const rawVal = item.slice(idx + 1).trim();
      let searchValue: string | number | Date | Array<string | number | Date>;

      if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
        // array of values inside brackets
        const inner = rawVal.slice(1, -1);
        searchValue = splitParams(inner)
          .map((v) => v.trim())
          .filter((v) => v)
          .map((v) => parseValue(v));
      } else {
        // single value
        searchValue = parseValue(rawVal);
      }

      const searchBy = ATTRIBUTE_FIELD_MAP[rawKey] ?? rawKey;
      return { searchBy, searchValue };
    })
    .filter((item): item is { searchBy: string; searchValue: any } =>
      Boolean(item)
    );
}

/**
 * Attempts to parse a string into number or Date; falls back to string.
 */
function parseValue(v: string): string | number | Date {
    if (v === "" || v == null) return v;

    // number check
    const num = Number(v);
    if (!isNaN(num) && v.trim() !== "") {
        return num;
    }

    // strict date check (ISO or yyyy-mm-dd)
    if (typeof v === "string") {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

        if (isoDateRegex.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) {
                return d;
            }
        }
    }

    return v;
}

export function applySearchConditions(
  qb: SelectQueryBuilder<any>,
  search: string,
  searchFields: string[]
): void {
  if (
    !search?.trim() ||
    !Array.isArray(searchFields) ||
    searchFields.length === 0
  ) {
    return;
  }
  console.log("searchFields", searchFields);
  const conditions: string[] = [];

  // Check if all contact name fields are present
  const hasFullNameFields =
    searchFields.includes("firstName") && searchFields.includes("lastName");

  // Apply enhanced full name search logic only when all three name fields are present (contact name search)
  if (hasFullNameFields) {
    // Add concatenated full name search condition
    const fullNameParamKey = "fullNameSearch";
    qb.setParameter(fullNameParamKey, `%${search}%`);
    conditions.push(
      `CONCAT(main.firstName, ' ', main.lastName) ILIKE :${fullNameParamKey}`
    );
  }
  const searchConditions = searchFields.map((field, index) => {
    let alias: string, column: string;

    if (field.includes(".")) {
      const parts = field.split(".");
      column = parts.pop()!;
      alias = parts.join("_");
    } else {
      alias = "main";
      column = field;
    }

    const paramKey = `searchParam_${index}`;
    qb.setParameter(paramKey, `%${search}%`);
    return `${alias}.${column} ILIKE :${paramKey}`;
  });
  // Combine all conditions
  const allConditions = [...conditions, ...searchConditions];
  if (allConditions.length > 0) {
    qb.andWhere(`(${allConditions.join(" OR ")})`);
  }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDurationDates(durationKey: string): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (durationKey) {
    case THREE_MONTHS:
      endDate.setMonth(startDate.getMonth() + 3);
      break;
    case SIX_MONTHS:
      endDate.setMonth(startDate.getMonth() + 6);
      break;
    case ONE_YEAR:
      endDate.setFullYear(startDate.getFullYear() + 1);
      break;
    case TWO_YEARS:
      endDate.setFullYear(startDate.getFullYear() + 2);
      break;
    case FIVE_YEARS:
      endDate.setFullYear(startDate.getFullYear() + 5);
      break;
    case THIRTY_DAYS:
      endDate.setDate(startDate.getDate() + 30);
      break;
    case SIXTY_DAYS:
      endDate.setDate(startDate.getDate() + 60);
      break;
    case NINETY_DAYS:
      endDate.setDate(startDate.getDate() + 90);
      break;
    case ONE_HUNDRED_EIGHTY_DAYS:
      endDate.setDate(startDate.getDate() + 180);
      break;
    case ONE_YEAR:
      endDate.setDate(startDate.getDate() + 365);
      break;
    case THREE_SIXTY_DAYS:
      endDate.setDate(startDate.getDate() + 365);
      break;
    default:
      throw new BadRequestException("Invalid duration key");
  }

  return { startDate, endDate };
}

// The UI's three-option status LOV (Active / Won / Lost) over nine underlying
// status values. "Active" is the whole live pipeline, including the BD/ISG
// planning stages, which are stored as distinct statuses rather than under
// "Work In Progress"; "Lost" covers the two auto/manual close variants too.
// Exported so aggregates that must mirror the listing's default status filter
// (opportunity-service's scope summaries) resolve the SAME values instead of
// re-deriving the grouping and drifting from it.
export const OPPORTUNITY_ACTIVE_STATUS_VALUES = [
  "Open",
  "Default",
  "Work In Progress",
  "BD Planning",
  "ISG Planning",
];
export const OPPORTUNITY_LOST_STATUS_VALUES = [
  "AUTO CLOSE(lost)",
  "CLOSE(lost)",
  "Lost",
];

// Map opportunity state values
export function mapOpportunityState(search: string): string {
  // Extract the state value from the search string
  const stateMatch = search.match(/state:(\[[^\]]*\])/);
  const stateValue = stateMatch ? stateMatch[1].toLowerCase() : null;

  if (stateValue) {
    let mappedStates: string[] = [];

    // Check if it's an array format [value1,value2] or single value
    if (stateValue.startsWith("[") && stateValue.endsWith("]")) {
      const arrayContent = stateValue.slice(1, -1); // Remove brackets
      const states = arrayContent.split(",").map((s) => s.trim().toLowerCase());

      states.forEach((state) => {
        if (state === "lost") {
          mappedStates.push(...OPPORTUNITY_LOST_STATUS_VALUES);
        } else if (state === "active") {
          mappedStates.push(...OPPORTUNITY_ACTIVE_STATUS_VALUES);
        } else if (state === "bd planning" || state === "renewal planning") {
          // RO surfaces label this stage "Renewal Planning"; it maps to the
          // same underlying "BD Planning" status value in the database.
          mappedStates.push("BD Planning");
        } else if (state === "isg planning") {
          mappedStates.push("ISG Planning");
        } else {
          mappedStates.push(state.charAt(0).toUpperCase() + state.slice(1));
        }
      });
    } else {
      // Handle single value
      if (stateValue === "lost") {
        mappedStates = [...OPPORTUNITY_LOST_STATUS_VALUES];
      } else if (stateValue === "active") {
        mappedStates = [...OPPORTUNITY_ACTIVE_STATUS_VALUES];
      } else if (
        stateValue === "bd planning" ||
        stateValue === "renewal planning"
      ) {
        mappedStates = ["BD Planning"];
      } else if (stateValue === "isg planning") {
        mappedStates = ["ISG Planning"];
      } else {
        mappedStates = [
          stateValue.charAt(0).toUpperCase() + stateValue.slice(1),
        ];
      }
    }
    mappedStates = mappedStates
      .map((state) => state.trim())
      .filter((state) => state !== "");
    if (mappedStates.length === 0) {
      // Remove state cleanly (no dangling commas)
      search = search
        .replace(/,?\s*state:\[[^\]]*\]\s*,?/, ",")
        .replace(/,{2,}/g, ",")
        .replace(/^,|,$/g, "");
    } else {
      const mappedStateString = `[${mappedStates.join(",")}]`;
      search = search.replace(
        /state:(\[[^\]]*\])/,
        `state:${mappedStateString}`
      );
    }
  }
  return search;
}

export function getActivityTableName(
  search: string,
  type: string
): {
  search: string;
  table: string | null;
} {
  // Extract the activityName value from the search string
  const activityMatch = search.match(/activityName:(\[[^\]]+\]|[^\s]+)/);
  const activityValue = activityMatch ? activityMatch[1] : null;
  let table = null;
  if (
    activityValue &&
    activityValue.startsWith("[") &&
    activityValue.endsWith("]")
  ) {
    const activity = activityValue.slice(1, -1).trim(); // Remove brackets

    const TABLE_MAP =
      type === "RO" ? RENEWAL_ACTIVITY_NAME_TABLE_MAP : ACTIVITY_NAME_TABLE_MAP;
    if (activity && activity in TABLE_MAP)
      table = TABLE_MAP[activity as string];
    search = search.replace(/activityName:(\[[^\]]+\]|[^\s]+)/, "");
  }
  return { search, table };
}

// Convert UTC to IST (+5:30)
export function convertUtcToIst(utcDate: string | Date): Date {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  // IST is UTC + 5 hours 30 minutes
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
}

export function extractDateAndTime(timestamp: Date): {
  date: string;
  time: string;
} {
  const isoString: string = timestamp.toISOString();
  const [date, timeWithMs] = isoString.split("T");
  const time: string = timeWithMs?.split(".")[0] ?? "00:00:00";
  return { date, time };
}

export const formatDate = (
  date: string | null,
  format: string = "DD/MM/YYYY"
) => {
  if (date === "" || date?.length === 0 || date === null) return null;
  return dayjs(date).format(format);
};

// Format name to be used as key (lowercase, underscores, no special chars)
export const formatNameToKey = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const calculateAge = (dob: Date | undefined): number | string => {
  if (!dob) return "";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

export const formatColumnName = (name: string): string => {
  return name.trim();
};

export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const haveSameValues = (list1: number[], list2: number[]): boolean => {
  if (list1.length !== list2.length) return false;

  const set = new Set(list2);
  return list1.every((value) => set.has(value));
};
export const snakeToTitle = (input: string) => {
    if (!input) return "";

    return input
      .replace(/_-_/g, " - ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const normalizeHeader = (header: string): string => {
  return header.toLowerCase().replace(/[\s_]+/g, ""); // removes underscores and spaces, and converts to lowercase
};

export const formatDateWithTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // Force IST timezone
    };
    let formatted = new Intl.DateTimeFormat("en-GB", options).format(date);
    
    // Fix midnight (00:xx:xx) to display as 12:xx:xx AM instead of 00:xx:xx AM
    formatted = formatted.replace(/\b00:(\d{2}:\d{2})\b/g, "12:$1");
    
    // Convert am/pm to AM/PM
    return formatted.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
  }

/**
 * Filter cover-like records by the per-cover "show until activity" cutoff.
 * A record is kept when the current activity is at or before the record's
 * cutoff in COVER_BEARING_ACTIVITY_ORDER (inclusive). A null/empty/unknown
 * cutoff means "no limit" (always visible). An unknown current activity key
 * fails open (returns all) so a missing render context can never hide every
 * cover.
 */
export const filterCoversByActivity = <
  T extends { visibleUntilActivityKey?: string | null }
>(
  covers: T[],
  currentActivityKey: string
): T[] => {
  const current = COVER_BEARING_ACTIVITY_ORDER.indexOf(currentActivityKey);
  if (current < 0) return covers;
  return covers.filter((cover) => {
    const cutoff = COVER_BEARING_ACTIVITY_ORDER.indexOf(
      cover.visibleUntilActivityKey ?? ""
    );
    return cutoff < 0 || current <= cutoff;
  });
};
