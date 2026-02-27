import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { Callout } from '../components/ui/Callout';
import { createEvidence, getEvidence, updateEvidence, openEvidenceFileDialog } from '../services/evidenceService';
import type { EvidenceStatus } from '../types/ipc';

type Mode = 'create' | 'edit';

interface FormState {
  title: string;
  category: string;
  status: EvidenceStatus;
  tags: string;
  description: string;
  filePath: string;
}

interface Errors {
  title?: string;
  category?: string;
  filePath?: string;
}

export const EvidenceFormPage: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const mode: Mode = params.id ? 'edit' : 'create';
  const [form, setForm] = React.useState<FormState>({
    title: '',
    category: '',
    status: 'draft',
    tags: '',
    description: '',
    filePath: '',
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [loading, setLoading] = React.useState(false);
  const [loadingExisting, setLoadingExisting] = React.useState(mode === 'edit');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mode === 'edit' && params.id) {
      (async () => {
        try {
          const existing = await getEvidence(params.id!);
          if (!existing) {
            navigate('/vault');
            return;
          }
          setForm({
            title: existing.title,
            category: existing.category,
            status: existing.status,
            tags: existing.tags.join(', '),
            description: existing.description ?? '',
            filePath: existing.file_path,
          });
        } catch (e: any) {
          setError(e?.message || 'Failed to load evidence.');
        } finally {
          setLoadingExisting(false);
        }
      })();
    }
  }, [mode, params.id, navigate]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.category.trim()) next.category = 'Category is required.';
    if (!form.filePath.trim()) next.filePath = 'Evidence file is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFileChoose = async () => {
    const path = await openEvidenceFileDialog();
    if (path) {
      updateField('filePath', path);
      setErrors((e) => ({ ...e, filePath: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (mode === 'create') {
        await createEvidence({
          title: form.title.trim(),
          category: form.category.trim(),
          status: form.status,
          description: form.description.trim() || undefined,
          file_path: form.filePath,
          tags,
        });
      } else if (mode === 'edit' && params.id) {
        await updateEvidence(params.id, {
          title: form.title.trim(),
          category: form.category.trim(),
          status: form.status,
          description: form.description.trim() || undefined,
          file_path: form.filePath,
          tags,
        });
      }
      navigate('/vault');
    } catch (e: any) {
      setError(e?.message || 'Failed to save evidence.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, marginBottom: 12 }}>
        {mode === 'create' ? 'Add evidence' : 'Edit evidence'}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        Versioning ensures new edits create a new immutable version instead of overwriting history.
      </p>
      {error && (
        <div style={{ marginBottom: 12 }}>
          <Callout type="error">{error}</Callout>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          error={errors.title}
        />
        <Select
          label="Category"
          required
          value={form.category}
          onChange={(e) => updateField('category', e.target.value)}
          error={errors.category}
        >
          <option value="">Choose category</option>
          <option value="control">Control</option>
          <option value="policy">Policy</option>
          <option value="evidence">Evidence</option>
        </Select>
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => updateField('status', e.target.value as EvidenceStatus)}
        >
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
        </Select>
        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. iso27001, access-control"
          value={form.tags}
          onChange={(e) => updateField('tags', e.target.value)}
        />
        <div className="form-field">
          <span className="form-label">Evidence file</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button type="button" onClick={handleFileChoose}>
              Choose file…
            </Button>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {form.filePath ? form.filePath : 'No file selected'}
            </span>
          </div>
          {errors.filePath && <div className="form-error">{errors.filePath}</div>}
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/vault')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner /> : mode === 'create' ? 'Create evidence' : 'Save version'}
          </Button>
        </div>
      </form>
    </div>
  );
};

