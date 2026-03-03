import React from 'react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Callout } from '../components/ui/Callout';
import { Spinner } from '../components/ui/Spinner';
import { createExport } from '../services/exportService';
import { IconArchive, IconDownload, IconCheck } from '../components/icons/Icons';
import type { EvidenceStatus } from '../types/ipc';
import { t } from '../i18n/t';

export const ExportPage: React.FC = () => {
  const [status, setStatus] = React.useState<EvidenceStatus | 'all'>('all');
  const [category, setCategory] = React.useState<string | 'all'>('all');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastPath, setLastPath] = React.useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setLastPath(null);
    try {
      const path = await createExport({ status, category });
      if (path) {
        setLastPath(path);
      }
    } catch (e: any) {
      setError(e?.message || t('export.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('export.title')}</h1>
          <p>{t('export.subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)',
          }}>
            <IconArchive size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Формування пакету</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Оберіть фільтри та створіть ZIP-архів
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Callout type="error">{error}</Callout>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label={t('export.status.label')}
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">{t('vault.filter.status.all')}</option>
            <option value="draft">{t('vault.filter.status.draft')}</option>
            <option value="submitted">{t('vault.filter.status.submitted')}</option>
            <option value="approved">{t('vault.filter.status.approved')}</option>
          </Select>
          <Select
            label={t('export.category.label')}
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            <option value="all">{t('vault.filter.category.all')}</option>
            <option value="control">{t('vault.filter.category.control')}</option>
            <option value="policy">{t('vault.filter.category.policy')}</option>
            <option value="evidence">{t('vault.filter.category.evidence')}</option>
          </Select>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)' }}>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <Spinner />
            ) : (
              <>
                <IconDownload size={16} />
                {t('export.create')}
              </>
            )}
          </Button>
        </div>

        {lastPath && (
          <div style={{ marginTop: 16 }}>
            <Callout type="success">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCheck size={15} />
                  Експорт завершено
                </div>
                <div style={{ fontSize: 13 }}>
                  {t('export.done.prefix')}
                  <br />
                  <code style={{
                    fontSize: 12,
                    background: 'var(--color-bg-subtle)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    wordBreak: 'break-all',
                  }}>
                    {lastPath}
                  </code>
                </div>
              </div>
            </Callout>
          </div>
        )}
      </div>
    </div>
  );
};