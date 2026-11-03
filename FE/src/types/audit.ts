export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  targetLabel: string;
  changedFields: string[];
  occurredAt: string;
}
export interface AuditQuery {
  q: string;
  action: string;
  resourceType: string;
  page: number;
  pageSize: number;
}
export interface AuditResult {
  data: AuditEntry[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
