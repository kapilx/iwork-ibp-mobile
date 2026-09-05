## Updated API Response for /hospitals/transactions

### GET /policy/{policyId}/hospitals/transactions

**Updated Response Structure:**

```json
{
  "success": true,
  "message": "Upload history retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "policyId": 123,
        "fileId": 456,
        "fileName": "hospital_upload_20251112.xlsx",
        "fileStatus": "COMPLETED",
        "successCount": 75,                    // Total successful records
        "errorCount": 5,                      // Total failed records
        "networkHospitalCount": 50,           // NEW: Successful network hospitals
        "excludedHospitalCount": 25,          // NEW: Successful excluded hospitals
        "totalRows": 80,
        "errorFileId": 789,
        "successFileId": null,
        "createdAt": "2025-11-12T10:30:00Z",  // NEW: Full timestamp
        "createdBy": 42,                      // NEW: User ID who created
        "createdByName": "John Doe",          // NEW: Creator's full name
        "createdByEmail": "john.doe@example.com", // NEW: Creator's email
        "updatedAt": "2025-11-12T11:00:00Z",  // NEW: Full timestamp
        "updatedBy": 42,                      // NEW: User ID who last updated
        "updatedByName": "John Doe",          // NEW: Updater's full name
        "updatedByEmail": "john.doe@example.com"  // NEW: Updater's email
      }
    ],
    "count": 1
  }
}
```

### Field Descriptions:

| Field | Type | Description |
|-------|------|-------------|
| `successCount` | number | Total number of successfully processed hospitals |
| `errorCount` | number | Total number of failed hospital records |
| `networkHospitalCount` | number | **NEW**: Number of network hospitals processed successfully |
| `excludedHospitalCount` | number | **NEW**: Number of excluded hospitals processed successfully |
| `createdAt` | string | **NEW**: ISO timestamp when record was created |
| `createdBy` | number | **NEW**: User ID who created the upload |
| `createdByName` | string | **NEW**: Full name of user who created upload |
| `createdByEmail` | string | **NEW**: Email of user who created upload |
| `updatedAt` | string | **NEW**: ISO timestamp when record was last updated |
| `updatedBy` | number | **NEW**: User ID who last updated the record |
| `updatedByName` | string | **NEW**: Full name of user who last updated |
| `updatedByEmail` | string | **NEW**: Email of user who last updated |

### Key Changes:

1. **Hospital Count Breakdown**: Now shows separate counts for network vs excluded hospitals
2. **User Information**: Includes creator and updater names/emails from users table
3. **Full Timestamps**: Complete datetime information for created/updated times
4. **User IDs**: Explicit user IDs for auditing purposes

### Example Calculation:
- Total uploaded: 80 rows
- Successful: 75 (50 network + 25 excluded)
- Failed: 5
- `successCount` = 75
- `networkHospitalCount` = 50  
- `excludedHospitalCount` = 25
- `errorCount` = 5