import React from 'react';
import { Spinner } from '../components/ui/Spinner';
import { Callout } from '../components/ui/Callout';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { listAuditLog } from '../services/auditService';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4 }}>{t('audit.title')}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {t('audit.subtitle')}
          </p>
        </div>
        <Button variant="ghost" onClick={load}>
          {t('audit.refresh')}
        </Button>
      </div>

      {loadState === 'loading' && !hasData && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner />
        </div>
      )}

      {loadState === 'error' && (
        <div style={{ marginBottom: 12 }}>
          <Callout type="error">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <Button variant="ghost" onClick={load}>
                {t('vault.retry')}
              </Button>
            </div>
          </Callout>
        </div>
      )}

      {hasData && (
        <div className="card">
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
                  <td>{new Date(row.timestamp).toLocaleString()}</td>
                  <td>{row.action_type}</td>
                  <td>
                    {row.entity_type} / {row.entity_id}
                  </td>
                  <td>{row.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

