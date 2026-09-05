# Document Download Logic Analysis

## Overview

This document provides an analysis of the existing single document download logic across the microservices architecture, identifying the methods that return file streams and the guards used for authentication and authorization.

---

## 1. Knowledge Service

### Location

- **Controller:** `apps/services/knowledge-service/src/app/knowledge/knowledge.controller.ts`
- **Service:** `apps/services/knowledge-service/src/app/knowledge/knowledge.service.ts`

### Download Endpoint

**Route:** `GET :documentId/download`

**Controller Method:**

```typescript
@Get(":documentId/download")
async download(
  @Param("documentId") documentId: bigint,
  @Res() res: Response,
) {
  const result = await this.service.download(documentId);

  // Set headers for download
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${result.fileName}"`,
  );
  res.setHeader(
    "Content-Type",
    result.mimeType || "application/octet-stream",
  );
  if (result.contentLength) {
    res.setHeader("Content-Length", result.contentLength);
  }
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  // Pipe the stream to the response
  result.stream.pipe(res);
}
```

### Service Method

**Method:** `KnowledgeService.download(documentId: bigint)`

**Return Structure:**

```typescript
return {
  stream: fileResult.stream,
  fileName,
  mimeType: fileResult.mimeType || "application/octet-stream",
  contentLength: fileResult.contentLength,
};
```

**Process:**

1. Validates `documentId`
2. Retrieves document metadata using `repo.findActiveDocument(documentId)`
3. Increments access count via `repo.incrementAccessCount(documentId)`
4. Fetches file stream from storage using `repo.getFileStream(entry.relativePath)`
5. Returns stream with metadata

### Guards

- **Direct Guards:** None applied on controller
- **Protection:** Handled at API Gateway level (see section 3)

---

## 2. Org Service (File Upload)

### Location

- **Controller:** `apps/services/org-service/src/app/file-upload/file-upload.controller.ts`
- **Service:** `apps/services/org-service/src/app/file-upload/file-upload.service.ts`

### Download Endpoint

**Route:** `GET :documentId/download`

**Controller Method:**

```typescript
@Get(":documentId/download")
async download(
  @Param("documentId") documentId: bigint,
  @Res() res: Response
) {
  const result = await this.fileUploadService.download(documentId);

  // Set headers for download
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${result.fileName}"`
  );
  res.setHeader(
    "Content-Type",
    result.mimeType || "application/octet-stream"
  );
  if (result.contentLength) {
    res.setHeader("Content-Length", result.contentLength);
  }
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  // Pipe the stream to the response
  result.stream.pipe(res);
}
```

### Service Method

**Method:** `FileUploadService.download(documentId: bigint)`

**Implementation:**

```typescript
async download(documentId: bigint) {
  const fileResult = await prepareFileDownload(documentId, {
    findDocument: (id) => this.fileUploadRepository.findDocuments(id),
    fetchStream: (key) => this.fileUploadRepository.getFileStream(key),
  });
  return fileResult;
}
```

**Process:**

1. Uses `prepareFileDownload()` utility function from service-lib
2. Passes callbacks for:
   - `findDocument`: Retrieves document metadata
   - `fetchStream`: Gets file stream from storage (S3 or local)
3. Returns stream with metadata

### Guards

- **Direct Guards:** None applied on controller
- **Protection:** Handled at API Gateway level (see section 3)

---

## 3. API Gateway Protection

### Location

- **Controller:** `apps/services/api-gateway/src/app/app.controller.ts`

### Download Proxy Endpoints

#### File Upload Download

```typescript
@Get(":service/file-upload/:documentId/download")
@UseGuards(AuthGuard, AclGuard)
async proxyFileDownloadFile(
  @Param("service") serviceName: string,
  @Param("documentId") documentId: bigint,
  @Req() req: Request,
  @Res() res: Response
) {
  return this.handleFileDownloadProxy(serviceName, documentId, req, res);
}
```

#### Company Employee File Download

```typescript
@Get(":service/company-employee/file-upload/:documentId/download")
@UseGuards(AuthGuard, AclGuard)
async proxyCompanyEmployeeFileDownload(
  @Param("service") serviceName: string,
  @Param("documentId") documentId: bigint,
  @Req() req: Request,
  @Res() res: Response
) {
  return this.handleFileDownloadProxy(serviceName, documentId, req, res);
}
```

### Guards Applied

#### 1. AuthGuard

- **Purpose:** JWT authentication
- **Location:** `libs/service-lib/src/lib/auth.guard.ts`
- **Functionality:** Validates JWT token from request headers

#### 2. AclGuard

- **Purpose:** Access Control List (permission-based authorization)
- **Location:** `libs/service-lib/src/lib/acl.guard.ts`
- **Functionality:** Validates user permissions for the requested resource

### Proxy Handler

**Method:** `handleFileDownloadProxy()`

**Process:**

1. Resolves service URL from service registry
2. Constructs downstream request path
3. Forwards request with headers to microservice
4. Streams response back to client

---

## Common Patterns

### File Stream Response Pattern

Both services follow the same pattern:

1. **Fetch Document Metadata**

   - Query database for document details
   - Validate document exists and is accessible

2. **Get File Stream**

   - Retrieve file from storage (S3 or local filesystem)
   - Handle both storage types transparently

3. **Set Response Headers**

   - `Content-Disposition`: Attachment with filename
   - `Content-Type`: MIME type (default: `application/octet-stream`)
   - `Content-Length`: File size (if available)
   - `Access-Control-Expose-Headers`: For CORS

4. **Pipe Stream**
   - Use `stream.pipe(res)` to stream file to client
   - Efficient memory usage for large files

### Error Handling

Both services handle similar errors:

- `BadRequestException`: Invalid document ID
- `NotFoundException`: Document not found
- Generic errors: Wrapped in `BadRequestException` with "Failed to download document"

---

## Security Architecture

### Multi-Layer Security

1. **API Gateway (Primary)**

   - JWT Authentication (`AuthGuard`)
   - Permission Validation (`AclGuard`)
   - Request routing and service discovery

2. **Microservices (Secondary)**
   - No direct guards on download endpoints
   - Assumes requests are pre-authenticated by gateway
   - Implements business logic validation (document exists, access count, etc.)

### Design Rationale

- **Centralized Security:** Single point for authentication/authorization
- **Microservice Simplicity:** Focus on business logic
- **Gateway Pattern:** Standard API gateway architecture

---

## Additional Download Endpoints

### Policy Service

**Template Download:**

- **Route:** `GET template/download/:documentId`
- **Method:** `downloadTemplateByDocumentId()`

**Endorsement Download:**

- **Route:** `GET :policyId/endorsement/download`

### Portal Configuration

**FAQ Downloads:**

- **Route:** `GET faq/:policyId/download`
- **Route:** `GET :policyId/faq/template/download`

### IBP Service

**Employee File Download:**

- **Route:** `GET file-upload/:documentId/download`
- **Method:** `downloadEmployeeFile()`

---

## Summary

| Service           | Endpoint                                        | Service Method                 | Stream Source           | Guards                  |
| ----------------- | ----------------------------------------------- | ------------------------------ | ----------------------- | ----------------------- |
| Knowledge Service | `GET :documentId/download`                      | `KnowledgeService.download()`  | `repo.getFileStream()`  | Via API Gateway         |
| Org Service       | `GET :documentId/download`                      | `FileUploadService.download()` | `prepareFileDownload()` | Via API Gateway         |
| API Gateway       | `GET :service/file-upload/:documentId/download` | `proxyFileDownloadFile()`      | Proxy to downstream     | `AuthGuard`, `AclGuard` |

### Key Takeaways

1. **File streams** are returned using Node.js stream piping (`stream.pipe(res)`)
2. **No direct authentication** on microservice download endpoints
3. **All security** enforced at API Gateway using `AuthGuard` and `AclGuard`
4. **Consistent pattern** across all services for file download handling
5. **Error handling** follows NestJS exception patterns
6. **Storage agnostic** design supports both S3 and local filesystem

---

## References

- Knowledge Controller: `apps/services/knowledge-service/src/app/knowledge/knowledge.controller.ts`
- File Upload Controller: `apps/services/org-service/src/app/file-upload/file-upload.controller.ts`
- API Gateway Controller: `apps/services/api-gateway/src/app/app.controller.ts`
- Auth Guard: `libs/service-lib/src/lib/auth.guard.ts`
- ACL Guard: `libs/service-lib/src/lib/acl.guard.ts`

---

## Recent Changes: Bulk Download as ZIP (POC)

### Date: 21 January 2026

### Summary

Added bulk document download functionality to the Org Service (File Upload) that allows downloading multiple documents as a single ZIP archive without buffering files in memory.

---

### Implementation Details

#### Location

- **Service:** `apps/services/org-service/src/app/file-upload/file-upload.service.ts`
- **Method:** `bulkDownloadAsZip(documentIds: bigint[], res: Response)`

#### Method Signature

```typescript
async bulkDownloadAsZip(documentIds: bigint[], res: Response): Promise<void>
```

#### New Dependencies

```typescript
import type { Response } from "express";
import * as archiver from "archiver";
```

#### Implementation Approach

**1. Input Validation**

- Validates that `documentIds` array is provided and not empty
- Throws `BadRequestException` if validation fails

**2. ZIP Archive Creation**

```typescript
const archive = archiver("zip", {
  zlib: { level: 9 }, // Maximum compression
});
```

**3. Response Headers**

```typescript
res.setHeader("Content-Type", "application/zip");
res.setHeader(
  "Content-Disposition",
  `attachment; filename="documents-${Date.now()}.zip"`,
);
res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
```

**4. Stream Pipeline**

- Archive is piped directly to response: `archive.pipe(res)`
- No intermediate memory buffering

**5. File Processing**

- Reuses existing `prepareFileDownload()` utility for each document
- Processes files in parallel using `Promise.all()`
- Each file stream is appended to archive without buffering:
  ```typescript
  archive.append(fileResult.stream, { name: fileResult.fileName });
  ```

**6. Error Handling**

- Archive-level errors throw `InternalServerErrorException`
- Individual file failures are logged but don't fail the entire operation
- Graceful degradation: continues processing remaining files if one fails

**7. Finalization**

- Calls `archive.finalize()` after all files are appended
- Triggers the archive's `end` event, completing the stream

#### Key Features

✅ **Memory Efficient**

- Streams files directly from storage → archiver → response
- No buffering in memory
- Suitable for large files and multiple documents

✅ **Resilient**

- Individual file failures don't break entire download
- Failed files are logged with detailed error messages
- Continues processing remaining documents

✅ **Reusable**

- Leverages existing `prepareFileDownload()` logic
- Maintains consistency with single-file download
- Works with both S3 and local storage

✅ **Observable**

- Comprehensive logging for:
  - Method invocation with document count
  - Each file added to archive
  - Individual file failures
  - Archive finalization
  - Overall operation success/failure

#### Code Flow

```
1. Validate input (documentIds)
2. Create archiver instance with compression
3. Set ZIP response headers
4. Pipe archive to response
5. For each documentId (parallel):
   a. Call prepareFileDownload()
   b. Get file stream and metadata
   c. Append stream to archive
   d. Log success or error
6. Wait for all Promise.all() to complete
7. Finalize archive (close stream)
8. Log completion
```

#### Error Scenarios Handled

| Scenario                          | Behavior                              |
| --------------------------------- | ------------------------------------- |
| Empty `documentIds` array         | Throws `BadRequestException`          |
| Archive creation fails            | Throws `InternalServerErrorException` |
| Individual document not found     | Logs error, continues with others     |
| Stream read error                 | Logs error, continues with others     |
| No documents successfully fetched | Returns empty ZIP                     |

#### Usage Example

```typescript
// In controller
await this.fileUploadService.bulkDownloadAsZip(
  [BigInt(1), BigInt(2), BigInt(3)],
  res,
);
```

#### Performance Considerations

**Advantages:**

- Parallel file fetching (Promise.all)
- Stream-based processing (no memory accumulation)
- Compression level 9 for smaller file size

**Trade-offs:**

- No content-length header (streaming response)
- Client won't know total size upfront
- Failed files silently excluded from ZIP

#### Security Notes

- **No guards on method itself** - follows existing pattern
- Security handled at API Gateway level (to be implemented)
- Reuses existing `prepareFileDownload()` which validates document access
- Each document goes through standard access checks

#### Next Steps (Recommended)

1. **Add Controller Endpoint**

   - Create POST/GET endpoint in `file-upload.controller.ts`
   - Accept array of document IDs in request body
   - Call `bulkDownloadAsZip()` method

2. **Add API Gateway Route**

   - Create proxy endpoint with `@UseGuards(AuthGuard, AclGuard)`
   - Forward bulk download requests to org-service

3. **Add Swagger Documentation**

   - Document request/response schema
   - Example requests with multiple document IDs
   - Error response examples

4. **Add Unit Tests**

   - Test successful bulk download
   - Test empty array validation
   - Test partial failure scenarios
   - Test archive creation errors

5. **Add Integration Tests**

   - End-to-end ZIP download test
   - Verify ZIP content integrity
   - Test with various file types and sizes

6. **Add Limits**
   - Maximum number of documents per request
   - Total size limits for ZIP
   - Timeout handling for large archives

#### Technical Debt & Considerations

- **Package Dependency:** Requires `archiver` package in dependencies
- **Error Recovery:** Consider adding retry logic for transient failures
- **Monitoring:** Add metrics for bulk download usage and success rates
- **File Naming:** Consider handling duplicate filenames in ZIP
- **Cancellation:** No stream cancellation handling if client disconnects

---

**Document Created:** 21 January 2026  
**Last Updated:** 21 January 2026  
**Analysis Context:** Document download logic identification for microservices architecture
