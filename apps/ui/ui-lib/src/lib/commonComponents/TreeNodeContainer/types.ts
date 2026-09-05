export type TreeNode = {
  id: string;
  label: string;
  value?: string;
  status?: string;
  children?: TreeNode[];
  country?: string;
};
