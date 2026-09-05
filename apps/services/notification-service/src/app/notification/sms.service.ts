import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { ENV } from "../../../../service-lib/src/lib/environment";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  
  // SMSCountry Bulk API credentials
  private readonly smsCountryUrl: string;
  private readonly vendorUsername: string;
  private readonly vendorPassword: string;
  private readonly vendorServiceId: string;
  private readonly vendorSid: string;
  private readonly vendorMType: string;
  private readonly vendorDR: string;

  constructor() {
    // Initialize SMSCountry Bulk API credentials
    if (!ENV.SMSCOUNTRY_BULK_URL) {
      throw new Error('Missing ENV: SMSCOUNTRY_BULK_URL');
    }
    if (!ENV.SMSCOUNTRY_USERNAME) {
      throw new Error('Missing ENV: SMSCOUNTRY_USERNAME');
    }
    if (!ENV.SMSCOUNTRY_PASSWORD) {
      throw new Error('Missing ENV: SMSCOUNTRY_PASSWORD');
    }
    if (!ENV.SMSCOUNTRY_SERVICE_ID) {
      throw new Error('Missing ENV: SMSCOUNTRY_SERVICE_ID');
    }
    if (!ENV.SMSCOUNTRY_SID) {
      throw new Error('Missing ENV: SMSCOUNTRY_SID');
    }
    if (!ENV.SMSCOUNTRY_MTYPE) {
      throw new Error('Missing ENV: SMSCOUNTRY_MTYPE');
    }
    if (!ENV.SMSCOUNTRY_DR) {
      throw new Error('Missing ENV: SMSCOUNTRY_DR');
    }

    this.smsCountryUrl = ENV.SMSCOUNTRY_BULK_URL;
    this.vendorUsername = ENV.SMSCOUNTRY_USERNAME;
    this.vendorPassword = ENV.SMSCOUNTRY_PASSWORD;
    this.vendorServiceId = ENV.SMSCOUNTRY_SERVICE_ID;
    this.vendorSid = ENV.SMSCOUNTRY_SID;
    this.vendorMType = ENV.SMSCOUNTRY_MTYPE;
    this.vendorDR = ENV.SMSCOUNTRY_DR;
  }

  /**
   * Send SMS to a single or multiple phone numbers via SMSCountry Bulk API
   * @param phoneNumbers - Array of phone numbers (e.g., 919876543210)
   * @param message - SMS message content
   */
  async sendSms(phoneNumbers: string[], message: string): Promise<void> {
    try {
      if (!phoneNumbers || phoneNumbers.length === 0) {
        throw new Error('No phone numbers provided');
      }

      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      this.logger.log(`Sending SMS to ${phoneNumbers.length} recipient(s) via SMSCountry`);

      // Send SMS to each phone number
      const sendPromises = phoneNumbers.map(phoneNumber =>
        this.sendSingleSms(phoneNumber, message)
      );

      await Promise.all(sendPromises);

      this.logger.log(`Successfully sent SMS to all ${phoneNumbers.length} recipient(s) via SMSCountry`);
    } catch (error) {
      this.logger.error('Failed to send SMS via SMSCountry:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send SMS to a single phone number via SMSCountry Bulk API
   * @param phoneNumber - Phone number (e.g., 919876543210 or +919876543210)
   * @param message - SMS message content
   */
  private async sendSingleSms(phoneNumber: string, message: string): Promise<void> {
    try {
      // Normalize phone number (remove + if present)
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // Validate phone number format
      if (!this.isValidPhoneNumber(normalizedPhone)) {
        throw new Error(`Invalid phone number format: ${phoneNumber}`);
      }

      // Build SMSCountry Bulk API URL with query parameters
      const params = new URLSearchParams({
        User: this.vendorUsername,
        passwd: this.vendorPassword,
        sid: this.vendorServiceId,
        mobilenumber: normalizedPhone,
        message: message,
        mtype: this.vendorMType,
        DR: this.vendorDR,
      });

      const url = `${this.smsCountryUrl}?${params.toString()}`;

      this.logger.log(`Sending SMS to ${normalizedPhone} via SMSCountry Bulk API`);

      // Send GET request to SMSCountry Bulk API
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
      });

      this.logger.log(`SMS sent successfully to ${normalizedPhone}. Response: ${response.data}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber} via SMSCountry:`, error);
      if (axios.isAxiosError(error)) {
        this.logger.error(`SMSCountry API Error: ${error.response?.status} - ${error.response?.data}`);
      }
      throw error;
    }
  }

  /**
   * Normalize phone number for SMSCountry (remove + prefix if present)
   * @param phoneNumber - Phone number to normalize
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/^\+/, '');
  }

  /**
   * Validate phone number format (with or without + prefix)
   * @param phoneNumber - Phone number to validate
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation: 10-15 digits
    // Example: 919876543210 (India), 14155552671 (US)
    const phoneRegex = /^[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  }

}
