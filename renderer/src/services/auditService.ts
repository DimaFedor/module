import type { AuditLogRow } from '../types/ipc';

export function listAuditLog(): Promise<AuditLogRow[]> {
  return window.electronApi.auditLogList();
}

