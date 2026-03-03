import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n/t';
import { Spinner } from '../components/ui/Spinner';
import { listEvidence } from '../services/evidenceService';
import { listAuditLog } from '../services/auditService';
import {
  IconShield,
  IconFile,
  IconCheck,
  IconClock,
  IconClipboard,
  IconArchive,
  IconPlus,
  IconAlertTriangle,
} from '../components/icons/Icons';
import type { EvidenceRow, AuditLogRow } from '../types/ipc';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    total: 0,
    drafts: 0,
    submitted: 0,
    approved: 0,
  });
  const [recentLogs, setRecentLogs] = React.useState<AuditLogRow[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const [evidenceRes, auditData] = await Promise.all([
          listEvidence({ search: '', status: 'all', category: 'all', sortBy: 'created_at', sortDir: 'desc', page: 1, pageSize: 1000, includeHistory: false }),
          listAuditLog(),
        ]);
        const items = evidenceRes.items;
        setStats({
          total: items.length,
          drafts: items.filter((i) => i.status === 'draft').length,
          submitted: items.filter((i) => i.status === 'submitted').length,
          approved: items.filter((i) => i.status === 'approved').length,
        });
        setRecentLogs(auditData.slice(0, 5));
      } catch {
        // silently fail, dashboard is non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ padding: 60 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-blue">
            <IconShield size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Всього доказів</div>
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-subtitle">у сховищі</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-amber">
            <IconFile size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Чернетки</div>
            <div className="stat-card-value">{stats.drafts}</div>
            <div className="stat-card-subtitle">потребують уваги</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-blue">
            <IconClock size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Подані</div>
            <div className="stat-card-value">{stats.submitted}</div>
            <div className="stat-card-subtitle">на перевірці</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-green">
            <IconCheck size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Погоджені</div>
            <div className="stat-card-value">{stats.approved}</div>
            <div className="stat-card-subtitle">готові до аудиту</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-title" style={{ marginTop: 28 }}>Швидкі дії</div>
      <div className="quick-actions">
        <Link to="/evidence/new" className="quick-action-card">
          <div className="quick-action-icon">
            <IconPlus size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('vault.newEvidence')}</h3>
            <p>Створити новий запис у сховищі</p>
          </div>
        </Link>

        <Link to="/vault" className="quick-action-card">
          <div className="quick-action-icon">
            <IconShield size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('nav.vault')}</h3>
            <p>Пошук та управління доказами</p>
          </div>
        </Link>

        <Link to="/export" className="quick-action-card">
          <div className="quick-action-icon">
            <IconArchive size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('nav.export')}</h3>
            <p>Сформувати ZIP-пакет для аудиту</p>
          </div>
        </Link>
      </div>

      {/* Recent Audit Log */}
      {recentLogs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="section-title">
            <IconClipboard size={16} />
            Останні події
          </div>
          <div className="card card-flat">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('audit.table.when')}</th>
                  <th>{t('audit.table.action')}</th>
                  <th>{t('audit.table.entity')}</th>
                  <th>{t('audit.table.actor')}</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    <td>{row.action_type}</td>
                    <td>{row.entity_type} / {row.entity_id}</td>
                    <td>{row.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <Link to="/audit-log" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
                Переглянути всі події →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};