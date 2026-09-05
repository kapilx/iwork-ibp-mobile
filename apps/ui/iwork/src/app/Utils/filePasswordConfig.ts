export type FilePasswordType = "custom" | "user_details";

export interface FilePasswordConfigResponse {
  passwordType: FilePasswordType;
  customPassword?: string;
  userFields?: string[];
  selectedCountryId?: number | "";
  organisationKey?: string;
}

export const USER_FIELD_OPTIONS = [
  { value: "firstName", label: "First Name" },
];

export const getStoredUser = (): Record<string, any> => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}") || {};
  } catch (error) {
    return {};
  }
};

export const getUserDetails = (): Record<string, any> => {
  const userData = getStoredUser();
  return userData.data || userData.userDetails || userData;
};

export const isAdminUser = (userData: Record<string, any>): boolean => {
  const userRoles = userData?.roles || [];
  return userRoles.some((role: any) => {
    const roleName = role?.name || role;
    const roleStr =
      typeof roleName === "string"
        ? roleName.toLowerCase()
        : String(roleName).toLowerCase();
    return (
      roleStr.includes("super") ||
      roleStr.includes("admin") ||
      roleStr.includes("manager") ||
      roleStr.includes("chairman") ||
      roleStr.includes("head")
    );
  });
};

export const buildUserPasswordPreview = (fields: string[] = []): string => {
  if (!fields.length) return "No fields selected";

  const userDetails = getUserDetails();
  const values = fields
    .map((field) => userDetails?.[field])
    .filter((value) => typeof value === "string" && value.trim() !== "") as string[];

  if (!values.length) return "Unavailable";

  return values.join("");
};
