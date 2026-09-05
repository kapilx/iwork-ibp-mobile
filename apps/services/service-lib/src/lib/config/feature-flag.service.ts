import { Injectable } from '@nestjs/common';
import { ENV } from '../environment';

@Injectable()
export class FeatureFlagService {

  isAuthFailureTrackingEnabled(): boolean {
    // Default to false if environment variable is not set or not 'true'
    return ENV.FEATURE_AUTH_FAILURE_TRACKING_ENABLED === 'true';
  }

  isAuthProtectionActive(): boolean {
    return this.isAuthFailureTrackingEnabled()
  }
}
