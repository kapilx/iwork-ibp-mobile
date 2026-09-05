// rolesConfig.ts
export enum Roles {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
  TEAM_LEAD = "team_lead",
  TEAM_MEMBER = "team_member",
  TEAM_USER = "team_user",
}
export const roleHierarchy = [
  Roles.SUPER_ADMIN,
  Roles.ADMIN,
  Roles.MANAGER,
  Roles.USER,
];

export enum Permission {
  READ = "READ",
  WRITE = "WRITE",
  DELETE = "DELETE",
  UPDATE = "UPDATE",
  ADMIN = "ADMIN",
}

export enum EntityType {
  INSURER = "insurer",
  TPA = "tpa",
  BROKER = "broker",
}

export enum CelebrationType {
  BIRTHDAY = "BIRTHDAY",
  WORK_ANNIVERSARY = "WORK_ANNIVERSARY",
}

export const CELEBRATION_NOUN: Record<
  CelebrationType,
  "birthday" | "anniversary"
> = {
  [CelebrationType.BIRTHDAY]: "birthday",
  [CelebrationType.WORK_ANNIVERSARY]: "anniversary",
};
