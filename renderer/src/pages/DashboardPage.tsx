import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n/t';
import { Spinner } from '../components/ui/Spinner';
import { Callout } from '../components/ui/Callout';
import {
  IconShield,
  IconFile,
  IconCheck,
  IconClock,
  IconClipboard,
  IconArchive,
  IconPlus,
} from '../components/icons/Icons';
import type { DashboardStats } from '../types/ipc';
import { getDashboardStats } from '../services/dashboardService';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('uk-UA');
}

function actionColor(action: string) {
  if (action === 'CREATE') return 'badge-status-create';
  if (action === 'UPDATE') return 'badge-status-update';
  if (action === 'STATUS_CHANGE') return 'badge-status-status-change';
  if (action === 'DELETE') return 'badge-status-delete';
  if (action === 'EXPORT_PACKAGE') return 'badge-status-export';
  return 'badge-status-default';
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loadState, setLoadState] = React.useState<LoadState>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);

  const load = React.useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const res = await getDashboardStats();
      setStats(res);
      setLoadState('success');
    } catch (e: any) {
      setError(e?.message || 'Не вдалося завантажити дані панелі.');
      setLoadState('error');
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const initialLoading = loadState === 'loading' && !stats;

  if (initialLoading) {
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

      {loadState === 'error' && (
        <div style={{ marginBottom: 16 }}>
          <Callout type="error">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span>{error}</span>
              <button className="btn btn-ghost" onClick={load}>
                Повторити
              </button>
            </div>
          </Callout>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-blue">
            <IconShield size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">{t('dashboard.total')}</div>
            <div className="stat-card-value">{stats?.total ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-amber">
            <IconFile size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">{t('dashboard.draft')}</div>
            <div className="stat-card-value">{stats?.byStatus['draft'] ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-blue">
            <IconClock size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">{t('dashboard.submitted')}</div>
            <div className="stat-card-value">{stats?.byStatus['submitted'] ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-green">
            <IconCheck size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">{t('dashboard.approved')}</div>
            <div className="stat-card-value">{stats?.byStatus['approved'] ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-title" style={{ marginTop: 28 }}>
        Швидкі дії
      </div>
      <div className="quick-actions">
        <Link to="/vault" className="quick-action-card">
          <div className="quick-action-icon">
            <IconShield size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('dashboard.goVault')}</h3>
            <p>{t('nav.vault')}</p>
          </div>
        </Link>

        <Link to="/evidence/new" className="quick-action-card">
          <div className="quick-action-icon">
            <IconPlus size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('nav.addEvidence')}</h3>
            <p>{t('vault.newEvidence')}</p>
          </div>
        </Link>

        <Link to="/export" className="quick-action-card">
          <div className="quick-action-icon">
            <IconArchive size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('dashboard.goExport')}</h3>
            <p>{t('export.title')}</p>
          </div>
        </Link>

        <Link to="/audit-log" className="quick-action-card">
          <div className="quick-action-icon">
            <IconClipboard size={20} />
          </div>
          <div className="quick-action-text">
            <h3>{t('dashboard.goAuditLog')}</h3>
            <p>{t('audit.title')}</p>
          </div>
        </Link>
      </div>

      {/* Last export */}
      <div style={{ marginTop: 28 }}>
        <div className="section-title">{t('dashboard.lastExport')}</div>
        <div className="card card-flat">
          <div style={{ fontSize: 14 }}>
            {stats?.lastExport
              ? formatTimestamp(stats.lastExport.timestamp)
              : t('dashboard.lastExport.none')}
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div style={{ marginTop: 28 }}>
        <div className="section-title">
          <IconClipboard size={16} />
          {t('dashboard.recentAudit')}
        </div>
        <div className="card card-flat">
          {stats && stats.recentAudit.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('audit.table.when')}</th>
                  <th>{t('audit.table.action')}</th>
                  <th>{t('audit.table.entity')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAudit.map((row) => (
                  <tr key={row.id}>
                    <td>{formatTimestamp(row.timestamp)}</td>
                    <td>
                      <span className={`badge ${actionColor(row.action_type)}`}>
                        {row.action_type}
                      </span>
                    </td>
                    <td>
                      {row.entity_type} / {row.entity_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {t('dashboard.recentAudit.empty')}
            </div>
          )}
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Link
              to="/audit-log"
              style={{
                fontSize: 13,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Переглянути всі події →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};