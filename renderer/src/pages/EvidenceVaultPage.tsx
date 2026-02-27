import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Callout } from '../components/ui/Callout';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Snackbar } from '../components/ui/Snackbar';
import { Badge } from '../components/ui/Badge';
import { CheckboxRow } from '../components/ui/CheckboxRow';
import { listEvidence, deleteEvidence, undoDeleteEvidence } from '../services/evidenceService';
import type { EvidenceRow, EvidenceStatus } from '../types/ipc';

type LoadState = 'idle' | 'loading' | 'error' | 'success';

export const EvidenceVaultPage: React.FC = () => {
  const [items, setItems] = React.useState<EvidenceRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<EvidenceStatus | 'all'>('all');
  const [category, setCategory] = React.useState<string | 'all'>('all');
  const [sortBy, setSortBy] = React.useState<'created_at' | 'status'>('created_at');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [includeHistory, setIncludeHistory] = React.useState(false);
  const [loadState, setLoadState] = React.useState<LoadState>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [showUndo, setShowUndo] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState(30);

  const navigate = useNavigate();

  const load = React.useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      // Search-first UX: we prioritize search, filters, and sorting before table rendering
      // to reduce cognitive load for auditors under time pressure.
      const res = await listEvidence({
        search,
        status,
        category,
        sortBy,
        sortDir,
        page,
        pageSize,
        includeHistory,
      });
      setItems(res.items);
      setTotal(res.total);
      setLoadState('success');
    } catch (e: any) {
      setError(e?.message || 'Failed to load evidence.');
      setLoadState('error');
    }
  }, [search, status, category, sortBy, sortDir, page, pageSize, includeHistory]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const ms = autoRefreshInterval * 1000;
    const id = setInterval(() => {
      load();
    }, ms);
    return () => clearInterval(id);
  }, [autoRefresh, autoRefreshInterval, load]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const ok = await deleteEvidence(confirmDeleteId);
      if (ok) {
        setConfirmDeleteId(null);
        setShowUndo(true);
        setTimeout(() => setShowUndo(false), 5000);
        load();
      }
    } catch {
      // error handled via next load if needed
    }
  };

  const handleUndo = async () => {
    await undoDeleteEvidence();
    setShowUndo(false);
    load();
  };

  const hasData = items.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4 }}>Evidence Vault</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Search and filter evidence; latest versions are shown by default for clarity.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckboxRow
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.currentTarget.checked)}
            label="Auto-refresh"
          />
          {autoRefresh && (
            <Select
              value={String(autoRefreshInterval)}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            >
              <option value="15">15s</option>
              <option value="30">30s</option>
              <option value="60">60s</option>
            </Select>
          )}
          <Button onClick={() => navigate('/evidence/new')}>New evidence</Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Input
          id="evidence-search-input"
          placeholder="Search title, description, or tags"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
        </Select>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">All categories</option>
          <option value="control">Control</option>
          <option value="policy">Policy</option>
          <option value="evidence">Evidence</option>
        </Select>
        <Select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split(':') as any;
            setSortBy(sb);
            setSortDir(sd);
          }}
        >
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="status:asc">Status A-Z</option>
          <option value="status:desc">Status Z-A</option>
        </Select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <CheckboxRow
          checked={includeHistory}
          onChange={(e) => setIncludeHistory(e.currentTarget.checked)}
          label="Show history (all versions)"
        />
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
                Retry
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
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Version</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td>
                    <Badge status={item.status} />
                  </td>
                  <td>{item.version_number}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/evidence/${item.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(item.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      {loadState === 'success' && !hasData && (
        <EmptyState
          title="No evidence yet"
          description="Start by adding your first evidence item so auditors have something to review."
          actionLabel="Add evidence"
          onAction={() => navigate('/evidence/new')}
        />
      )}

      {confirmDeleteId && (
        <Modal
          title="Delete evidence?"
          description="This will remove the selected version. History rows remain unless deleted explicitly."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {showUndo && (
        <Snackbar
          message="Evidence deleted. You can undo for 5 seconds."
          actionLabel="Undo"
          onAction={handleUndo}
        />
      )}
    </div>
  );
};

