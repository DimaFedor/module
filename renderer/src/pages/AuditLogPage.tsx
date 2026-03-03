import React from 'react';
import { Spinner } from '../components/ui/Spinner';
import { Callout } from '../components/ui/Callout';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { listAuditLog } from '../services/auditService';
import { IconRefresh, IconClipboard } from '../components/icons/Icons';
import type { AuditLogRow } from '../types/ipc';
import { t } from '../i18n/t';

type LoadState = 'idle' | 'loading' | 'error' | 'success';

export const AuditLogPage: React.FC = () => {
  const [items, setItems] = React.useState<AuditLogRow[]>([]);
  const [loadState, setLoadState] = React.useState<LoadState>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const data = await listAuditLog();
      setItems(data);
      setLoadState('success');
    } catch (e: any) {
      setError(e?.message || t('audit.error.load'));
      setLoadState('error');
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const hasData = items.length > 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('audit.title')}</h1>
          <p>{t('audit.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <Button variant="ghost" onClick={load}>
            <IconRefresh size={15} />
            {t('audit.refresh')}
          </Button>
        </div>
      </div>

      {loadState === 'loading' && !hasData && (
        <div className="flex-center" style={{ padding: 48 }}>
          <Spinner />
        </div>
      )}

      {loadState === 'error' && (
        <div style={{ marginBottom: 16 }}>
          <Callout type="error">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <Button variant="ghost" onClick={load}>
                <IconRefresh size={14} />
                {t('vault.retry')}
              </Button>
            </div>
          </Callout>
        </div>
      )}

      {hasData && (
        <div className="card card-flat">
          <div className="table-wrapper">
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
                {items.map((row) => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 500,
                      }}>
                        <IconClipboard size={14} color="var(--color-text-light)" />
                        {row.action_type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      <code style={{
                        fontSize: 12,
                        background: 'var(--color-bg-subtle)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        {row.entity_type}/{row.entity_id}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500 }}>{row.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loadState === 'success' && !hasData && (
        <EmptyState
          title={t('audit.empty.title')}
          description={t('audit.empty.description')}
        />
      )}
    </div>
  );
};