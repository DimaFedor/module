import React from 'react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Callout } from '../components/ui/Callout';
import { Spinner } from '../components/ui/Spinner';
import { createExport } from '../services/exportService';
import type { EvidenceStatus } from '../types/ipc';

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
      setError(e?.message || 'Failed to create export package.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, marginBottom: 12 }}>Export Package</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        Build a focused ZIP package for auditors with a Ukrainian-language PDF summary and selected evidence files.
      </p>
      {error && (
        <div style={{ marginBottom: 12 }}>
          <Callout type="error">{error}</Callout>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <Select
          label="Status filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
        </Select>
        <Select
          label="Category filter"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <option value="all">All categories</option>
          <option value="control">Control</option>
          <option value="policy">Policy</option>
          <option value="evidence">Evidence</option>
        </Select>
      </div>
      <div style={{ marginTop: 20 }}>
        <Button onClick={handleExport} disabled={loading}>
          {loading ? <Spinner /> : 'Create export ZIP'}
        </Button>
      </div>
      {lastPath && (
        <div style={{ marginTop: 16 }}>
          <Callout>
            <div style={{ fontSize: 13 }}>
              Export created at:
              <br />
              <code>{lastPath}</code>
            </div>
          </Callout>
        </div>
      )}
    </div>
  );
};

