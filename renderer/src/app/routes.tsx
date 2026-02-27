import { DashboardPage } from '../pages/DashboardPage';
import { EvidenceVaultPage } from '../pages/EvidenceVaultPage';
import { EvidenceFormPage } from '../pages/EvidenceFormPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { ExportPage } from '../pages/ExportPage';

export const routes = [
  { path: '/', label: 'Dashboard', component: DashboardPage },
  { path: '/vault', label: 'Evidence Vault', component: EvidenceVaultPage },
  { path: '/evidence/new', label: 'Add Evidence', component: EvidenceFormPage },
  // Hidden route used for edit; not in nav to avoid clutter.
  { path: '/evidence/:id', label: '', component: EvidenceFormPage },
  { path: '/audit-log', label: 'Audit Log', component: AuditLogPage },
  { path: '/export', label: 'Export Package', component: ExportPage },
];

