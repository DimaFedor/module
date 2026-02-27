import { contextBridge, ipcRenderer } from 'electron';

type EvidenceStatus = 'draft' | 'submitted' | 'approved';

interface EvidenceListRequest {
  search?: string;
  status?: EvidenceStatus | 'all';
  category?: string | 'all';
  sortBy?: 'created_at' | 'status';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeHistory?: boolean;
}

interface EvidenceRow {
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

interface EvidenceCreatePayload {
  title: string;
  description?: string;
  category: string;
  status: EvidenceStatus;
  file_path: string;
  tags: string[];
}

interface EvidenceUpdatePayload {
  title: string;
  description?: string;
  category: string;
  status: EvidenceStatus;
  file_path?: string | null;
  tags: string[];
}

interface EvidenceListResponse {
  items: EvidenceRow[];
  total: number;
}

interface ExportFilters {
  status?: EvidenceStatus | 'all';
  category?: string | 'all';
}

interface AuditLogRow {
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

const api: ElectronApi = {
  openEvidenceFile: () => ipcRenderer.invoke('evidence:openFile'),
  evidenceList: (req) => ipcRenderer.invoke('evidence:list', req),
  evidenceGet: (id) => ipcRenderer.invoke('evidence:get', id),
  evidenceCreate: (payload) => ipcRenderer.invoke('evidence:create', payload),
  evidenceUpdate: (id, payload) => ipcRenderer.invoke('evidence:update', id, payload),
  evidenceDelete: (id) => ipcRenderer.invoke('evidence:delete', id),
  evidenceUndoDelete: () => ipcRenderer.invoke('evidence:undoDelete'),
  auditLogList: () => ipcRenderer.invoke('audit:list'),
  exportCreate: (filters) => ipcRenderer.invoke('export:create', filters),
  themeGetSystem: () => ipcRenderer.invoke('theme:get-system'),
};

contextBridge.exposeInMainWorld('electronApi', api);
