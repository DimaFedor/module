import type {
  EvidenceListRequest,
  EvidenceListResponse,
  EvidenceCreatePayload,
  EvidenceUpdatePayload,
  EvidenceRow,
} from '../types/ipc';

export function listEvidence(req: EvidenceListRequest): Promise<EvidenceListResponse> {
  return window.electronApi.evidenceList(req);
}

export function getEvidence(id: string) {
  return window.electronApi.evidenceGet(id);
}

export function createEvidence(payload: EvidenceCreatePayload): Promise<EvidenceRow> {
  return window.electronApi.evidenceCreate(payload);
}

export function updateEvidence(id: string, payload: EvidenceUpdatePayload) {
  return window.electronApi.evidenceUpdate(id, payload);
}

export function deleteEvidence(id: string) {
  return window.electronApi.evidenceDelete(id);
}

export function undoDeleteEvidence() {
  return window.electronApi.evidenceUndoDelete();
}

export function openEvidenceFileDialog() {
  return window.electronApi.openEvidenceFile();
}

