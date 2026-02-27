import React from 'react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Callout } from '../components/ui/Callout';
import { Spinner } from '../components/ui/Spinner';
import { createExport } from '../services/exportService';
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
    <div className="card">
      <h1 style={{ marginTop: 0, marginBottom: 12 }}>{t('export.title')}</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        {t('export.subtitle')}
      </p>
      {error && (
        <div style={{ marginBottom: 12 }}>
          <Callout type="error">{error}</Callout>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
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
      <div style={{ marginTop: 20 }}>
        <Button onClick={handleExport} disabled={loading}>
          {loading ? <Spinner /> : t('export.create')}
        </Button>
      </div>
      {lastPath && (
        <div style={{ marginTop: 16 }}>
          <Callout>
            <div style={{ fontSize: 13 }}>
              {t('export.done.prefix')}
              <br />
              <code>{lastPath}</code>
            </div>
          </Callout>
        </div>
      )}
    </div>
  );
};

