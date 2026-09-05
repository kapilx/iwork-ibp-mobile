export interface Role {
  id: number;
  name: string;
  description: string;
  roleKey: string;
}

export interface AclAction {
  id: number;
  name: string;
  actionKey: string;
}

export interface AclCategory {
  id: number;
  name: string;
  categoryKey: string;
}

export interface AclCategoryWithActions {
  category: AclCategory;
  actions: AclAction[];
}
