export interface SectionRef {
  validateAndGetData: () => Promise<{
    isValid: boolean;
    data: Partial<import('./policytypes').PolicyConfiguration['configuration']> | null;
  }>;
}
