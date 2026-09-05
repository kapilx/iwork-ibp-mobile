export const AUDIT_CONTEXT_KEY = 'auditHistoryContext';
export const AUDITABLE_KEY = Symbol('auditable');
export const SKIP_AUDIT_KEY = Symbol('skipAudit');

export enum AuditHistoryAction {
  INSERT   = 'INSERT',
  UPDATE   = 'UPDATE',
  DELETE   = 'DELETE',
  REVEALED = 'REVEALED',
}

export enum AuditHistoryLogType {
  AUDIT = 'Audit',
  TRACE = 'Trace',
}