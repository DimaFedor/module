import { app, BrowserWindow, dialog, ipcMain, nativeTheme } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import BetterSqlite3 from 'better-sqlite3';
import type { Database } from 'better-sqlite3';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import { resolveFontPath } from './utils/paths';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let db: Database;

type EvidenceStatus = 'draft' | 'submitted' | 'approved';

interface EvidenceRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: EvidenceStatus;
  file_path: string;
  version_group_id: string;
  version_number: number;
  created_at: string;
  updated_at: string;
}

interface EvidenceListRequest {
  search?: string;
  status?: EvidenceStatus | 'all';
  category?: string | 'all';
  sortBy?: 'created_at' | 'status';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeHistory?: boolean;
}

interface EvidenceCreatePayload {
  title: string;
  description?: string;
  category: string;
  status: EvidenceStatus;
  file_path: string;
  tags: string[];
}

interface EvidenceUpdatePayload {
  title: string;
  description?: string;
  category: string;
  status: EvidenceStatus;
  file_path?: string | null;
  tags: string[];
}

interface AuditLogRow {
  id: string;
  action_type: string;
  entity_id: string;
  entity_type: string;
  actor: string;
  timestamp: string;
}

interface ExportFilters {
  status?: EvidenceStatus | 'all';
  category?: string | 'all';
}

let lastDeleted:
  | {
      evidence: EvidenceRow;
      tags: string[];
      deletedAt: number;
    }
  | null = null;

function getPaths() {
  const userData = app.getPath('userData');
  const dbPath = path.join(userData, 'vault.db');
  const evidenceDir = path.join(userData, 'evidence-files');
  return { userData, dbPath, evidenceDir };
}

function ensureDatabase() {
  const { dbPath } = getPaths();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new BetterSqlite3(dbPath);

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '..', 'renderer-dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }
}

function registerIpcHandlers() {
  const { evidenceDir } = getPaths();
  fs.mkdirSync(evidenceDir, { recursive: true });
  const fontPath = resolveFontPath();

  ipcMain.handle('theme:get-system', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('evidence:openFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select evidence file',
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    const source = result.filePaths[0];
    const fileName = `${Date.now()}-${path.basename(source)}`;
    const dest = path.join(evidenceDir, fileName);
    fs.copyFileSync(source, dest);
    return dest;
  });

  ipcMain.handle('evidence:list', (_event, req: EvidenceListRequest) => {
    const {
      search = '',
      status = 'all',
      category = 'all',
      sortBy = 'created_at',
      sortDir = 'desc',
      page = 1,
      pageSize = 10,
      includeHistory = false,
    } = req || {};

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push('(title LIKE ? OR description LIKE ? OR id IN (SELECT evidence_id FROM evidence_tags et JOIN tags t ON et.tag_id = t.id WHERE t.name LIKE ?))');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status !== 'all') {
      where.push('status = ?');
      params.push(status);
    }
    if (category !== 'all') {
      where.push('category = ?');
      params.push(category);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const baseTable = includeHistory
      ? 'evidence'
      : 'evidence e JOIN (SELECT version_group_id, MAX(version_number) AS max_version FROM evidence GROUP BY version_group_id) latest ON e.version_group_id = latest.version_group_id AND e.version_number = latest.max_version';

    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM ${baseTable} ${whereSql}`);
    const totalRow = totalStmt.get(...params) as { count: number };

    const offset = (page - 1) * pageSize;
    const orderByColumn = sortBy === 'status' ? 'status' : 'created_at';
    const rowsStmt = db.prepare(
      `SELECT * FROM ${baseTable} ${whereSql} ORDER BY ${orderByColumn} ${sortDir.toUpperCase()} LIMIT ? OFFSET ?`
    );
    const items = rowsStmt.all(...params, pageSize, offset) as EvidenceRow[];

    return { items, total: totalRow.count };
  });

  ipcMain.handle('evidence:get', (_event, id: string) => {
    const stmt = db.prepare('SELECT * FROM evidence WHERE id = ?');
    const row = stmt.get(id) as EvidenceRow | undefined;
    if (!row) return null;

    const tagsStmt = db.prepare(
      'SELECT t.name FROM tags t JOIN evidence_tags et ON et.tag_id = t.id WHERE et.evidence_id = ?'
    );
    const tags = tagsStmt.all(id).map((t: any) => t.name) as string[];
    return { ...row, tags };
  });

  ipcMain.handle('evidence:create', (_event, payload: EvidenceCreatePayload) => {
    const id = crypto.randomUUID();
    const versionGroupId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insert = db.prepare(
      `INSERT INTO evidence (id, title, description, category, status, file_path, version_group_id, version_number, created_at, updated_at)
       VALUES (@id, @title, @description, @category, @status, @file_path, @version_group_id, @version_number, @created_at, @updated_at)`
    );
    const evidence: EvidenceRow = {
      id,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category,
      status: payload.status,
      file_path: payload.file_path,
      version_group_id: versionGroupId,
      version_number: 1,
      created_at: now,
      updated_at: now,
    };
    insert.run(evidence);

    upsertTagsForEvidence(id, payload.tags);

    logAudit('CREATE', id, 'evidence');

    return evidence;
  });

  ipcMain.handle('evidence:update', (_event, id: string, payload: EvidenceUpdatePayload) => {
    const existingStmt = db.prepare('SELECT * FROM evidence WHERE id = ?');
    const existing = existingStmt.get(id) as EvidenceRow | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const maxVersionStmt = db.prepare('SELECT MAX(version_number) as maxVersion FROM evidence WHERE version_group_id = ?');
    const maxVersionRow = maxVersionStmt.get(existing.version_group_id) as { maxVersion: number };
    const nextVersion = (maxVersionRow?.maxVersion ?? existing.version_number) + 1;

    const newId = crypto.randomUUID();
    const insert = db.prepare(
      `INSERT INTO evidence (id, title, description, category, status, file_path, version_group_id, version_number, created_at, updated_at)
       VALUES (@id, @title, @description, @category, @status, @file_path, @version_group_id, @version_number, @created_at, @updated_at)`
    );

    const evidence: EvidenceRow = {
      id: newId,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category,
      status: payload.status,
      file_path: payload.file_path ?? existing.file_path,
      version_group_id: existing.version_group_id,
      version_number: nextVersion,
      created_at: existing.created_at,
      updated_at: now,
    };

    insert.run(evidence);
    upsertTagsForEvidence(newId, payload.tags);

    if (existing.status !== payload.status) {
      logAudit('STATUS_CHANGE', newId, 'evidence');
    }

    return evidence;
  });

  ipcMain.handle('evidence:delete', (_event, id: string) => {
    const select = db.prepare('SELECT * FROM evidence WHERE id = ?');
    const row = select.get(id) as EvidenceRow | undefined;
    if (!row) return false;

    const tagsStmt = db.prepare(
      'SELECT t.name FROM tags t JOIN evidence_tags et ON et.tag_id = t.id WHERE et.evidence_id = ?'
    );
    const tags = tagsStmt.all(id).map((t: any) => t.name) as string[];

    const delTags = db.prepare('DELETE FROM evidence_tags WHERE evidence_id = ?');
    const delEvidence = db.prepare('DELETE FROM evidence WHERE id = ?');

    const now = Date.now();
    db.transaction(() => {
      delTags.run(id);
      delEvidence.run(id);
      lastDeleted = { evidence: row, tags, deletedAt: now };
    })();

    logAudit('DELETE', id, 'evidence');

    return true;
  });

  ipcMain.handle('evidence:undoDelete', () => {
    if (!lastDeleted) return null;
    const age = Date.now() - lastDeleted.deletedAt;
    if (age > 5000) {
      lastDeleted = null;
      return null;
    }

    const insert = db.prepare(
      `INSERT INTO evidence (id, title, description, category, status, file_path, version_group_id, version_number, created_at, updated_at)
       VALUES (@id, @title, @description, @category, @status, @file_path, @version_group_id, @version_number, @created_at, @updated_at)`
    );
    const evidence = lastDeleted.evidence;
    db.transaction(() => {
      insert.run(evidence);
      upsertTagsForEvidence(evidence.id, lastDeleted!.tags);
    })();

    lastDeleted = null;
    return evidence;
  });

  ipcMain.handle('audit:list', () => {
    const stmt = db.prepare(
      'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 500'
    );
    const rows = stmt.all() as AuditLogRow[];
    return rows;
  });

  ipcMain.handle('export:create', async (_event, filters: ExportFilters) => {
    if (!mainWindow) return null;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save export package',
      filters: [{ name: 'Zip Archive', extensions: ['zip'] }],
      defaultPath: 'audit-package.zip',
    });
    if (result.canceled || !result.filePath) {
      return null;
    }

    const where: string[] = [];
    const params: any[] = [];
    if (filters.status && filters.status !== 'all') {
      where.push('status = ?');
      params.push(filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      where.push('category = ?');
      params.push(filters.category);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const evidenceStmt = db.prepare(
      `SELECT * FROM evidence e JOIN (SELECT version_group_id, MAX(version_number) AS max_version FROM evidence GROUP BY version_group_id) latest ON e.version_group_id = latest.version_group_id AND e.version_number = latest.max_version ${whereSql}`
    );
    const items = evidenceStmt.all(...params) as EvidenceRow[];

    const pdfPath = await createReportPdf(items, fontPath, path.dirname(result.filePath));

    await createZipWithPdfAndFiles(result.filePath, pdfPath, items);

    if (items.length > 0) {
      logAudit('EXPORT_PACKAGE', items[0].id, 'evidence');
    } else {
      logAudit('EXPORT_PACKAGE', 'none', 'evidence');
    }

    return result.filePath;
  });
}

function upsertTagsForEvidence(evidenceId: string, tags: string[]) {
  const trimmed = Array.from(
    new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0))
  );
  const insertTag = db.prepare(
    'INSERT OR IGNORE INTO tags (id, name) VALUES (@id, @name)'
  );
  const selectTag = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertEvidenceTag = db.prepare(
    'INSERT OR IGNORE INTO evidence_tags (evidence_id, tag_id) VALUES (?, ?)'
  );
  const deleteEvidenceTags = db.prepare(
    'DELETE FROM evidence_tags WHERE evidence_id = ?'
  );

  db.transaction(() => {
    deleteEvidenceTags.run(evidenceId);
    for (const name of trimmed) {
      let row = selectTag.get(name) as { id: string } | undefined;
      if (!row) {
        const id = crypto.randomUUID();
        insertTag.run({ id, name });
        row = { id };
      }
      insertEvidenceTag.run(evidenceId, row.id);
    }
  })();
}

function logAudit(action: string, entityId: string, entityType: string) {
  const stmt = db.prepare(
    `INSERT INTO audit_log (id, action_type, entity_id, entity_type, actor, timestamp)
     VALUES (@id, @action_type, @entity_id, @entity_type, @actor, @timestamp)`
  );
  stmt.run({
    id: crypto.randomUUID(),
    action_type: action,
    entity_id: entityId,
    entity_type: entityType,
    actor: 'system',
    timestamp: new Date().toISOString(),
  });
}

function createReportPdf(
  items: EvidenceRow[],
  fontPath: string,
  outputDir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const pdfPath = path.join(outputDir, `report-ukrainian-${Date.now()}.pdf`);
    const stream = fs.createWriteStream(pdfPath);

    stream.on('close', () => resolve(pdfPath));
    stream.on('error', (err) => reject(err));
    doc.on('error', (err) => reject(err));

    doc.pipe(stream);

    try {
      doc.registerFont('NotoSans', fontPath);
      doc.font('NotoSans');
    } catch (err) {
      reject(
        new Error(
          `Failed to register Ukrainian font at ${fontPath}: ${(err as Error).message}`
        )
      );
      doc.end();
      return;
    }

    doc.fontSize(18).text('Звіт аудиторського пакету', { align: 'center' });
    doc.moveDown();

    const formattedDate = new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    doc.fontSize(12).text(`Дата: ${formattedDate}`, { align: 'left' });
    doc.moveDown();

    doc.fontSize(12).text('Список доказів:', { underline: true });
    doc.moveDown(0.5);

    const headers = ['Назва', 'Категорія', 'Статус', 'Версія', 'Теги'];
    doc.text(headers.join(' | '));
    doc.moveDown(0.5);

    for (const item of items) {
      const tagsStmt = db.prepare(
        'SELECT t.name FROM tags t JOIN evidence_tags et ON et.tag_id = t.id WHERE et.evidence_id = ?'
      );
      const tags = tagsStmt.all(item.id).map((t: any) => t.name) as string[];
      const line = [
        `Назва: ${item.title}`,
        `Категорія: ${item.category}`,
        `Статус: ${item.status}`,
        `Версія: ${item.version_number}`,
        `Теги: ${tags.join(', ')}`,
      ].join(' | ');
      doc.text(line);
    }

    doc.end();
  });
}

function createZipWithPdfAndFiles(zipPath: string, pdfPath: string, items: EvidenceRow[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    archive.file(pdfPath, { name: 'report-ukrainian.pdf' });

    for (const item of items) {
      if (fs.existsSync(item.file_path)) {
        archive.file(item.file_path, { name: path.basename(item.file_path) });
      }
    }

    archive.finalize();
  });
}

app.whenReady().then(() => {
  ensureDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
