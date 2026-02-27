import type { ExportFilters } from '../types/ipc';

export function createExport(filters: ExportFilters): Promise<string | null> {
  return window.electronApi.exportCreate(filters);
}

