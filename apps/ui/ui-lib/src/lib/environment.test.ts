import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isSecurityRestrictionEnabledForOrg, environment } from './environment';

// Mock storage
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'sessionStorage', { value: storageMock });
Object.defineProperty(global, 'localStorage', { value: storageMock });

describe('isSecurityRestrictionEnabledForOrg', () => {
    beforeEach(() => {
        global.sessionStorage.clear();
        global.localStorage.clear();
        vi.clearAllMocks();
    });

    it('should return true (restricted) when sessionStorage is empty', () => {
        expect(isSecurityRestrictionEnabledForOrg()).toBe(true);
    });

    it('should return true (restricted) when stored user is "null"', () => {
        sessionStorage.setItem('user', 'null');
        expect(isSecurityRestrictionEnabledForOrg()).toBe(true);
    });

    it('should return true (restricted) when user has no organisationKey', () => {
        sessionStorage.setItem('user', JSON.stringify({ name: 'Test User' }));
        expect(isSecurityRestrictionEnabledForOrg()).toBe(true);
    });

    it('should return false (not restricted) when organization is in explicitly allowed config', () => {
        const orgKey = 'ALLOWED_ORG';
        environment.securityAllowedOrgs = { [orgKey]: true };
        
        sessionStorage.setItem('user', JSON.stringify({ organisationKey: orgKey }));
        
        expect(isSecurityRestrictionEnabledForOrg()).toBe(false);
    });

    it('should return true (restricted) when organization is NOT in allowed config', () => {
        const orgKey = 'DISALLOWED_ORG';
        environment.securityAllowedOrgs = { 'OTHER_ORG': true };
        
        sessionStorage.setItem('user', JSON.stringify({ organisationKey: orgKey }));
        
        expect(isSecurityRestrictionEnabledForOrg()).toBe(true);
    });
});
