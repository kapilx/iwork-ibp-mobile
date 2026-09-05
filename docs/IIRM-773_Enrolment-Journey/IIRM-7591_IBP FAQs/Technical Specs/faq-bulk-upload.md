# FAQ Bulk Upload API

## Overview
This endpoint allows bulk uploading of Frequently Asked Questions (FAQs) for a specific policy using an Excel file. The implementation follows proper layered architecture with clear separation of concerns.

## Architecture
- **Controller Layer**: Handles HTTP requests, logging, and response formatting
- **Service Layer**: Contains business logic, Excel processing, and validation
- **Repository Layer**: Manages all database operations and transactions

## Endpoint
`POST /policy/faq/bulk-upload`

## Headers
- `Authorization: Bearer <token>` (Required)
- `Content-Type: application/json`

## Request Body
```json
{
  "policyId": 12345,
  "fileId": 67890,
  "replaceAll": false
}
```

### Parameters
- **policyId** (integer, required): The ID of the policy to associate FAQs with
- **fileId** (integer, required): The ID from `file_uploads` table containing the Excel file
- **replaceAll** (boolean, required): 
  - `true`: Mark all existing FAQs for the policy as inactive and create new ones
  - `false`: Only add new FAQs without affecting existing ones

## Excel File Format
The Excel file must contain the following headers in the first row:

| Column | Header | Description | Required |
|--------|--------|-------------|----------|
| A | S. No | Serial number (optional) | No |
| B | category | FAQ category (max 100 chars) | Yes |
| C | Question | FAQ question text | Yes |
| D | Answer | FAQ answer text | Yes |

### Example Excel Content:
```
| S. No | category | Question | Answer |
|-------|----------|----------|--------|
| 1 | General | What is this policy? | This policy covers... |
| 2 | Claims | How to file a claim? | To file a claim... |
```

## Response Format

### Success Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "FAQ bulk upload processed successfully",
  "data": {
    "uploadId": 123,
    "processedCount": 25,
    "successCount": 23,
    "errorCount": 2,
    "errors": [
      "Row 3: Question field is required",
      "Row 5: Category field is too long"
    ],
    "status": "FAQ_UPLOAD_COMPLETED",
    "replacedExisting": false
  }
}
```

### Response Fields
- **uploadId**: ID of the upload record in `policy_faq_uploads` table
- **processedCount**: Total number of rows processed from Excel
- **successCount**: Number of FAQs successfully created
- **errorCount**: Number of rows with errors
- **errors**: Array of error messages for failed rows
- **status**: Processing status
  - `FAQ_UPLOAD_COMPLETED`: All rows processed successfully
  - `FAQ_UPLOAD_COMPLETED_WITH_ERRORS`: Some rows had errors
  - `FAQ_UPLOAD_FAILED`: Upload failed completely
- **replacedExisting**: Whether existing FAQs were replaced

## Error Responses

### 400 Bad Request
- Invalid request body
- Missing or invalid file
- Excel parsing errors
- Missing required headers

### 401 Unauthorized
- Missing or invalid authorization token

### 404 Not Found
- Policy not found
- File not found in `file_uploads` table

### 500 Internal Server Error
- Database errors
- File processing errors

## Database Tables Affected

### 1. `policy_faqs`
New FAQ records are inserted here with:
- `policy_id`: Associated policy
- `category`: FAQ category
- `question`: Question text
- `answer`: Answer text
- `is_active`: Set to `true` for new FAQs
- `created_by`: User ID from token

### 2. `policy_faq_uploads`
Upload tracking record created with:
- `policy_id`: Associated policy
- `file_id`: Source file ID
- `file_name`: Original file name
- `file_path`: S3 file path
- `faq_count`: Number of successfully created FAQs
- `uploaded_by`: User ID from token
- `status_lkey`: Processing status

## Process Flow

### Controller Layer (`PolicyController.bulkUploadFaq`)
1. **Request Logging**: Log incoming request with trace ID and context
2. **Authentication**: Validate user authorization
3. **Service Delegation**: Single call to `PolicyService.bulkUploadFaq`
4. **Response Handling**: Format and return response with success/error logging

### Service Layer (`PolicyService.bulkUploadFaq`)
1. **Validation**: Verify policy exists and file is accessible via repository
2. **Excel Processing**: Download and parse Excel file with business validations
3. **Data Transformation**: Convert Excel rows to FAQ entities with validation
4. **Repository Coordination**: Delegate database operations to repository methods
5. **Response Assembly**: Prepare final response with processing summary

### Repository Layer (`PolicyRepository`)
1. **`getFileUploadWithPolicy`**: Fetch file details and validate policy existence
2. **`bulkUploadFaqData`**: Handle successful uploads without validation errors
3. **`bulkUploadFaqWithErrors`**: Handle uploads with validation errors
4. **Database Transactions**: Manage all CRUD operations within transactions

## Detailed Architecture Flow

### 1. Request Processing
- Controller receives and logs request
- Extracts user ID from authentication context
- Delegates to service layer with minimal processing

### 2. Business Logic Processing
- Service validates input and fetches required data
- Processes Excel file with comprehensive validation
- Determines appropriate repository method based on validation results

### 3. Database Operations
- Repository handles all database interactions
- Manages upload tracking records
- Executes FAQ CRUD operations within transactions
- Updates status and counts appropriately

### 4. Response Generation
- Service assembles response from repository results
- Controller formats response and handles error scenarios
- Comprehensive logging at each layer

## Usage Examples

### Upload FAQs (Append Mode)
```bash
curl -X POST /policy/faq/bulk-upload \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": 12345,
    "fileId": 67890,
    "replaceAll": false
  }'
```

### Replace All FAQs
```bash
curl -X POST /policy/faq/bulk-upload \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": 12345,
    "fileId": 67890,
    "replaceAll": true
  }'
```

## Notes
- The Excel file must be uploaded to S3 first and the file ID obtained from the file upload API
- Only the first worksheet in the Excel file is processed
- Empty rows are skipped during processing
- Header matching is case-insensitive and flexible (partial matches supported)
- All operations are performed within a database transaction for data consistency