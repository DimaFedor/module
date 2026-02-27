export type EvidenceStatus = 'draft' | 'submitted' | 'approved';

export interface EvidenceRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: EvidenceStatus;
  file_path: string;
  version_group_id: string;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export interface EvidenceListRequest {
  search?: string;
  status?: EvidenceStatus | 'all';
  category?: string | 'all';
  sortBy?: 'created_at' | 'status';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeHistory?: boolean;
}

export interface EvidenceCreatePayload {
  title: string;
  description?: string;
  category: string;
  status: EvidenceStatus;
  file_path: string;
  tags: string[];
}

export interface EvidenceUpdatePayload {
  title: string;
  description?: string;
  category: string;
  status: EvidenceStatus;
  file_path?: string | null;
  tags: string[];
}

export interface EvidenceListResponse {
  items: EvidenceRow[];
  total: number;
}

export interface ExportFilters {
  status?: EvidenceStatus | 'all';
  category?: string | 'all';
}

export interface AuditLogRow {
  id: string;
  action_type: string;
  entity_id: string;
  entity_type: string;
  actor: string;
  timestamp: string;
}

export interface ElectronApi {
  openEvidenceFile(): Promise<string | null>;
  evidenceList(req: EvidenceListRequest): Promise<EvidenceListResponse>;
  evidenceGet(id: string): Promise<(EvidenceRow & { tags: string[] }) | null>;
  evidenceCreate(payload: EvidenceCreatePayload): Promise<EvidenceRow>;
  evidenceUpdate(id: string, payload: EvidenceUpdatePayload): Promise<EvidenceRow | null>;
  evidenceDelete(id: string): Promise<boolean>;
  evidenceUndoDelete(): Promise<EvidenceRow | null>;
  auditLogList(): Promise<AuditLogRow[]>;
  exportCreate(filters: ExportFilters): Promise<string | null>;
  themeGetSystem(): Promise<'light' | 'dark'>;
}

