import { SetMetadata } from '@nestjs/common';

export const AUTH_PROTECTED_KEY = 'auth_protected';

/**
 * Marks endpoint for authentication attempt tracking
 * Usage: @AuthProtected() on login endpoints
 */
export const AuthProtected = () => SetMetadata(AUTH_PROTECTED_KEY, true);
