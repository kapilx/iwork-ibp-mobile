import { useSelector } from 'react-redux';
import { isModulePasswordProtectionEnabled } from '../redux/passwordProtectionConfigSlice';

/**
 * Custom hook to check if password protection is enabled for a specific module
 * 
 * @param categoryKey - The category key to check (e.g., 'knowledge_central', 'policy')
 * @returns Boolean indicating if password protection is enabled for the module
 * 
 * @example
 * const isKnowledgePasswordEnabled = usePasswordProtectionStatus('knowledge_central');
 * const isPolicyPasswordEnabled = usePasswordProtectionStatus('policy');
 */
export const usePasswordProtectionStatus = (categoryKey: string): boolean => {
    return useSelector((state) => isModulePasswordProtectionEnabled(state, categoryKey));
};

/**
 * Category keys for different modules
 * Use these constants to ensure consistency across the application
 */
export const PASSWORD_PROTECTION_CATEGORIES = {
    KNOWLEDGE_CENTRAL: 'knowledge_central',
    INCEPTION: 'inception',
    ENDORSEMENT: 'endorsement',
    OPPORTUNITY: 'opportunity',
    OPPORTUNITY_ACTIVITY: 'opportunity_activity',
    POLICY: 'policies',
    POLICY_TEMPLATE: 'policy_template',
    COMPANY_DOCUMENTS: 'company_documents',
    FAQ_DOCUMENTS: 'faq_documents',
    CONFIGURATION: 'configuration',
    EMPLOYEE_DOCUMENTS: 'employee_documents',
} as const;

export type PasswordProtectionCategoryKey = typeof PASSWORD_PROTECTION_CATEGORIES[keyof typeof PASSWORD_PROTECTION_CATEGORIES];
