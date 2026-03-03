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
import { IconPlus, IconSearch, IconEdit, IconTrash, IconRefresh } from '../components/icons/Icons';
import type { EvidenceRow, EvidenceStatus } from '../types/ipc';
import { t } from '../i18n/t';

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
      setError(e?.message || t('vault.error.load'));
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
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('vault.title')}</h1>
          <p>{t('vault.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <CheckboxRow
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.currentTarget.checked)}
            label={t('vault.autoRefresh')}
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
          <Button onClick={() => navigate('/evidence/new')}>
            <IconPlus size={16} />
            {t('vault.newEvidence')}
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-light)',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            <IconSearch size={16} />
          </div>
          <input
            id="evidence-search-input"
            className="form-input"
            style={{ paddingLeft: 34, width: '100%', height: '100%' }}
            placeholder={t('vault.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">{t('vault.filter.status.all')}</option>
          <option value="draft">{t('vault.filter.status.draft')}</option>
          <option value="submitted">{t('vault.filter.status.submitted')}</option>
          <option value="approved">{t('vault.filter.status.approved')}</option>
        </Select>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">{t('vault.filter.category.all')}</option>
          <option value="control">{t('vault.filter.category.control')}</option>
          <option value="policy">{t('vault.filter.category.policy')}</option>
          <option value="evidence">{t('vault.filter.category.evidence')}</option>
        </Select>
        <Select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split(':') as any;
            setSortBy(sb);
            setSortDir(sd);
          }}
        >
          <option value="created_at:desc">{t('vault.sort.newest')}</option>
          <option value="created_at:asc">{t('vault.sort.oldest')}</option>
          <option value="status:asc">{t('vault.sort.statusAsc')}</option>
          <option value="status:desc">{t('vault.sort.statusDesc')}</option>
        </Select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <CheckboxRow
          checked={includeHistory}
          onChange={(e) => setIncludeHistory(e.currentTarget.checked)}
          label={t('vault.showHistory')}
        />
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
              <span>{error ?? t('vault.error.load')}</span>
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
                  <th>{t('vault.table.title')}</th>
                  <th>{t('vault.table.category')}</th>
                  <th>{t('vault.table.status')}</th>
                  <th>{t('vault.table.version')}</th>
                  <th>{t('vault.table.created')}</th>
                  <th style={{ textAlign: 'right' }}>{t('vault.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.title}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{item.category}</td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>v{item.version_number}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          className="btn btn-icon btn-ghost"
                          title={t('vault.action.edit')}
                          onClick={() => navigate(`/evidence/${item.id}`)}
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          className="btn btn-icon btn-ghost"
                          title={t('vault.action.delete')}
                          onClick={() => setConfirmDeleteId(item.id)}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          title={t('vault.empty.title')}
          description={t('vault.empty.description')}
          actionLabel={t('vault.empty.cta')}
          onAction={() => navigate('/evidence/new')}
        />
      )}

      {confirmDeleteId && (
        <Modal
          title={t('vault.delete.title')}
          description={t('vault.delete.description')}
          confirmLabel={t('vault.delete.confirm')}
          cancelLabel={t('vault.delete.cancel')}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {showUndo && (
        <Snackbar
          message={t('vault.snackbar.deleted')}
          actionLabel={t('vault.snackbar.undo')}
          onAction={handleUndo}
        />
      )}
    </div>
  );
};