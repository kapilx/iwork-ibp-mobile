# SMSCountry Implementation - Summary

## ✅ Completed Changes

### 1. Updated SMS Service (SMSCountry Bulk API Only)

**File**: `apps/services/notification-service/src/app/notification/sms.service.ts`

**Changes Made**:
- ❌ Removed AWS SNS implementation completely
- ❌ Removed 2Factor implementation
- ✅ Implemented SMSCountry Bulk API (GET request)
- ✅ Uses new credentials provided (ishare/HimGuj2498$ekn)

**API Details**:
- **URL**: `http://smscountry.com/SMSCwebservice_Bulk.aspx`
- **Method**: GET with query parameters
- **Parameters**:
  - `User`: ishare
  - `passwd`: HimGuj2498$ekn
  - `sid`: IDAINS
  - `mobilenumber`: Phone number (without + prefix)
  - `message`: SMS content
  - `mtype`: N
  - `DR`: Y

---

### 2. Updated Environment Variables

**File**: `environments/.env.dev`

**New Environment Variables**:
```bash
# --- SMSCountry Bulk API Configuration (Active) ---
SMSCOUNTRY_BULK_URL=http://smscountry.com/SMSCwebservice_Bulk.aspx
SMSCOUNTRY_USERNAME=ishare
SMSCOUNTRY_PASSWORD=HimGuj2498$ekn
SMSCOUNTRY_SERVICE_ID=IDAINS
SMSCOUNTRY_SID=smsVendorSid
SMSCOUNTRY_MTYPE=N
SMSCOUNTRY_DR=Y
```

**Commented Out (Old Configuration)**:
- ❌ SMSCountry REST API credentials (old)
- ❌ 2Factor API credentials (not used)

---

### 3. Updated Notification Service

**File**: `apps/services/notification-service/src/app/notification/notification.service.ts`

**Changes Made**:
- Updated comment from "Send SMS using AWS SNS" to "Send SMS using SMSCountry Bulk API"
- SMS sending logic remains the same (calls `smsService.sendSms()`)

---

## 📋 Database Template Update Required

### Where to Update the OTP Message Template

The SMS template is stored in the database and needs to be updated manually.

**Database Table**: `notification_channel_event_template_mapping`

**Column to Update**: `body`

**Filter Conditions**:
- `event_type_id`: Should match the event type for "SMS_OTP_Login" (get ID from `notification_event_type` table)
- `channel_type_id`: Should match the channel type for "SMS" (get ID from `notification_channel_type` table)

### Required Template Text

```
Dear {{UserName}}, Your One time password(OTP) is :{{otpCode}}, Thanks!! - ------India Insure------
```

**Important Notes**:
1. ✅ `{{UserName}}` - This placeholder will be replaced with the actual user name
2. ✅ `{{otpCode}}` - This placeholder will be replaced with the OTP code
3. ⚠️ **DO NOT change any other text** in the message
4. The template uses Handlebars syntax with double curly braces `{{ }}`

### SQL Query to Find the Template Record

```sql
-- Step 1: Find event_type_id for SMS_OTP_Login
SELECT id, name 
FROM notification_event_type 
WHERE name = 'SMS_OTP_Login';

-- Step 2: Find channel_type_id for SMS
SELECT id, name 
FROM notification_channel_type 
WHERE name = 'SMS';

-- Step 3: Find and view the current template
SELECT id, subject, body, event_type_id, channel_type_id, active_status_lid
FROM notification_channel_event_template_mapping
WHERE event_type_id = <event_type_id_from_step_1>
  AND channel_type_id = <channel_type_id_from_step_2>;
```

### SQL Query to Update the Template

```sql
-- Update the template body
UPDATE notification_channel_event_template_mapping
SET body = 'Dear {{UserName}}, Your One time password(OTP) is :{{otpCode}}, Thanks!! - ------India Insure------',
    updated_at = NOW(),
    updated_by = <your_user_id>
WHERE event_type_id = <event_type_id>
  AND channel_type_id = <channel_type_id>;
```

### Alternative: Update via API

You can also update the template using the Notification Service API:

**Endpoint**: `PUT /templates/{id}`

**Request Body**:
```json
{
  "body": "Dear {{UserName}}, Your One time password(OTP) is :{{otpCode}}, Thanks!! - ------India Insure------",
  "subject": "OTP for Login"
}
```

---

## 🔍 Template Parameter Mapping

When the OTP service sends a notification, it provides these parameters:

**From**: `apps/services/auth-service/src/app/phone-otp/phone-otp.service.ts`

```typescript
const parameters = {
  [SMS_OTP_KEY_1]: otp,                          // otpCode
  [SMS_OTP_KEY_2]: expiryMinutes.toString(),    // expiryMinutes
};
```

**Constants** (from `apps/services/service-lib/src/lib/constants.ts`):
```typescript
export const SMS_OTP_KEY_1 = "otpCode";
export const SMS_OTP_KEY_2 = "expiryMinutes";
```

**Template Placeholders**:
- `{{UserName}}` - Provided by notification service (from user data)
- `{{otpCode}}` - Mapped from `SMS_OTP_KEY_1` parameter
- `{{expiryMinutes}}` - Available but not used in current template

---

## ✅ Testing Checklist

### 1. Verify Environment Variables Loaded
```bash
# Check if new environment variables are available
cd apps/services/notification-service
node -e "console.log(process.env.SMSCOUNTRY_BULK_URL)"
node -e "console.log(process.env.SMSCOUNTRY_USERNAME)"
```

### 2. Test SMS Sending

**Option A: Via Phone OTP Endpoint**
```bash
curl -X POST http://localhost:3003/auth/phone-otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "domain": "iwork.dev.indiainsure.com"
  }'
```

**Option B: Via Notification Service Directly**
```bash
curl -X POST http://localhost:3004/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "SMS_OTP_Login",
    "phoneNumber": ["+919876543210"],
    "channel": "SMS",
    "parameters": {
      "otpCode": "123456",
      "UserName": "Test User"
    },
    "userId": [1]
  }'
```

### 3. Check Logs

Monitor notification service logs for:
- ✅ "SMS Service initialized with SMSCountry Bulk API"
- ✅ "Sending SMS to X recipient(s) via SMSCountry"
- ✅ "SMS sent successfully to XXXXX via SMSCountry"

### 4. Verify Phone Number Format

The service automatically normalizes phone numbers:
- Input: `+919876543210` → Output: `919876543210` (+ removed)
- Input: `919876543210` → Output: `919876543210` (no change)

---

## 🚀 Deployment Steps

1. ✅ Code changes already implemented in `sms.service.ts`
2. ✅ Environment variables updated in `.env.dev`
3. ⏳ **TODO**: Update database template (see above)
4. ⏳ **TODO**: Restart notification-service to load new environment variables
5. ⏳ **TODO**: Test OTP sending with real phone number

---

## 📊 Database Template Tables Reference

### Table: `notification_channel_event_template_mapping`

**Key Columns**:
- `id` - Primary key
- `event_type_id` - Foreign key to `notification_event_type`
- `channel_type_id` - Foreign key to `notification_channel_type`
- `subject` - Email subject / SMS header
- `body` - **Template content (UPDATE THIS)**
- `active_status_lid` - Status (should be active)
- `approval_status_lid` - Approval status
- `organization_id` - Null for global templates
- `created_by`, `updated_by` - User IDs
- `created_at`, `updated_at` - Timestamps

### Table: `notification_event_type`

Find the event type for OTP:
```sql
SELECT * FROM notification_event_type WHERE name = 'SMS_OTP_Login';
```

### Table: `notification_channel_type`

Find the channel type for SMS:
```sql
SELECT * FROM notification_channel_type WHERE name = 'SMS';
```

---

## 📝 Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| **SMS Provider** | AWS SNS | SMSCountry Bulk API |
| **API Method** | AWS SDK | HTTP GET with query params |
| **Authentication** | AWS IAM | Username/Password in URL |
| **Phone Format** | +919876543210 | 919876543210 (no +) |
| **Service URL** | AWS SNS endpoint | http://smscountry.com/SMSCwebservice_Bulk.aspx |
| **2Factor** | Implemented | ❌ Removed completely |

---

## ⚠️ Important Notes

1. **Template Placeholders**: 
   - Use `{{variableName}}` syntax (Handlebars)
   - Case-sensitive: `{{UserName}}` ≠ `{{username}}`

2. **Phone Number Format**: 
   - SMSCountry Bulk API expects numbers WITHOUT the + prefix
   - Automatic normalization implemented in code

3. **Environment Variables**: 
   - Must restart service after updating `.env.dev`
   - Verify variables loaded: `console.log(process.env.SMSCOUNTRY_BULK_URL)`

4. **Database Template**:
   - Must be updated manually (SQL or API)
   - Test template rendering before going to production

5. **Error Handling**:
   - Check notification service logs for SMSCountry API errors
   - Timeout set to 10 seconds per SMS

---

## 🔗 Related Files

1. **SMS Service Implementation**: 
   - `apps/services/notification-service/src/app/notification/sms.service.ts`

2. **Notification Service**: 
   - `apps/services/notification-service/src/app/notification/notification.service.ts`

3. **Phone OTP Service**: 
   - `apps/services/auth-service/src/app/phone-otp/phone-otp.service.ts`

4. **Environment Config**: 
   - `environments/.env.dev`

5. **Constants**: 
   - `apps/services/service-lib/src/lib/constants.ts`

6. **Database Entities**: 
   - `apps/services/service-lib/src/lib/entities/notification-channel-event-template-mapping.entity.ts`
   - `apps/services/service-lib/src/lib/entities/notification-event-type.entity.ts`
   - `apps/services/service-lib/src/lib/entities/notification-channel-type.entity.ts`

---

## ✅ Next Steps

1. **Update Database Template** (see SQL queries above)
2. **Restart Notification Service** to load new environment variables
3. **Test OTP Flow** with a real phone number
4. **Monitor Logs** for successful SMS delivery
5. **Update Production Environment** with same variables once tested

---

**Implementation Date**: 24 February 2026  
**Status**: Code ✅ Complete | Database Template ⏳ Pending Update
