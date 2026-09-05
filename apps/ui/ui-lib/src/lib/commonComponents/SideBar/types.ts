export interface SidebarChildItem {
  label: string;
  path: string;
  icon?: string;
  activeIcon?: string;
  disabled?: boolean;
  disabledIcon?: string;
  externalUrl?: string;
  download?: boolean;
  downloadType?: string;
  magicAppKey?: string;
  permissionKeys?: string[];
  permissionLogic?: "AND" | "OR"; // Logic to apply for permission checks
  permissionKey?: string; // Single permission key for backward compatibility
}

export interface SidebarItem<T = SidebarChildItem> {
  label: string;
  path?: string;
  type?: "divider";
  icon?: string;
  activeIcon?: string;
  children?: T[];
  disabledIcon?: string;
  disabled?: boolean;
  externalUrl?: string;
  download?: boolean;
  magicAppKey?: string;
  permissionKeys?: string[];
  permissionLogic?: "AND" | "OR"; // Logic to apply for permission checks
  permissionKey?: string; // Single permission key for backward compatibility
  excludeRolePatterns?: string[]; // Hide this item if roleName contains any of these patterns
}
