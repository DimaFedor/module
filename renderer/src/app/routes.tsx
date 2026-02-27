import { DashboardPage } from '../pages/DashboardPage';
import { EvidenceVaultPage } from '../pages/EvidenceVaultPage';
import { EvidenceFormPage } from '../pages/EvidenceFormPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { ExportPage } from '../pages/ExportPage';

export const routes = [
  { path: '/', label: 'nav.dashboard', component: DashboardPage },
  { path: '/vault', label: 'nav.vault', component: EvidenceVaultPage },
  { path: '/evidence/new', label: 'nav.addEvidence', component: EvidenceFormPage },
  // Hidden route used for edit; not in nav to avoid clutter.
  { path: '/evidence/:id', label: '', component: EvidenceFormPage },
  { path: '/audit-log', label: 'nav.auditLog', component: AuditLogPage },
  { path: '/export', label: 'nav.export', component: ExportPage },
];

