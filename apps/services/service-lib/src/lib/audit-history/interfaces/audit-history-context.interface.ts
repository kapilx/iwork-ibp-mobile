export interface AuditHistoryContext {
  userId: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}