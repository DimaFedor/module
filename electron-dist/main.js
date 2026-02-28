"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron2 = require("electron");
var import_path2 = __toESM(require("path"));
var import_fs2 = __toESM(require("fs"));
var import_crypto = __toESM(require("crypto"));
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_pdfkit = __toESM(require("pdfkit"));
var import_archiver = __toESM(require("archiver"));

// electron/utils/paths.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
function resolveFontPath() {
  const candidates = [];
  const appPath = import_electron.app.getAppPath();
  candidates.push(import_path.default.join(appPath, "assets", "fonts", "NotoSans-Regular.ttf"));
  if (process.resourcesPath) {
    candidates.push(
      import_path.default.join(process.resourcesPath, "assets", "fonts", "NotoSans-Regular.ttf")
    );
  }
  candidates.push(import_path.default.join(__dirname, "..", "assets", "fonts", "NotoSans-Regular.ttf"));
  for (const candidate of candidates) {
    if (import_fs.default.existsSync(candidate)) {
      return candidate;
    }
  }
  const message = `NotoSans-Regular.ttf font not found. Looked in: ${candidates.join(
    " , "
  )}. Ensure assets/fonts/NotoSans-Regular.ttf is bundled with the app.`;
  throw new Error(message);
}

// electron/main.ts
var isDev = !import_electron2.app.isPackaged;
var mainWindow = null;
var db;
var lastDeleted = null;
function getPaths() {
  const userData = import_electron2.app.getPath("userData");
  const dbPath = import_path2.default.join(userData, "vault.db");
  const evidenceDir = import_path2.default.join(userData, "evidence-files");
  return { userData, dbPath, evidenceDir };
}
function ensureDatabase() {
  const { dbPath } = getPaths();
  import_fs2.default.mkdirSync(import_path2.default.dirname(dbPath), { recursive: true });
  db = new import_better_sqlite3.default(dbPath);
  const schemaPath = import_path2.default.join(__dirname, "..", "database", "schema.sql");
  const schemaSql = import_fs2.default.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);
}
function createWindow() {
  const preloadPath = import_path2.default.join(__dirname, "preload.js");
  mainWindow = new import_electron2.BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = import_path2.default.join(__dirname, "..", "renderer-dist", "index.html");
    mainWindow.loadFile(indexPath);
  }
}
function registerIpcHandlers() {
  const { evidenceDir } = getPaths();
  import_fs2.default.mkdirSync(evidenceDir, { recursive: true });
  const fontPath = resolveFontPath();
  import_electron2.ipcMain.handle("theme:get-system", () => {
    return import_electron2.nativeTheme.shouldUseDarkColors ? "dark" : "light";
  });
  import_electron2.ipcMain.handle("evidence:openFile", async () => {
    if (!mainWindow) return null;
    const result = await import_electron2.dialog.showOpenDialog(mainWindow, {
      title: "Select evidence file",
      properties: ["openFile"]
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    const source = result.filePaths[0];
    const fileName = `${Date.now()}-${import_path2.default.basename(source)}`;
    const dest = import_path2.default.join(evidenceDir, fileName);
    import_fs2.default.copyFileSync(source, dest);
    return dest;
  });
  import_electron2.ipcMain.handle("evidence:list", (_event, req) => {
    const {
      search = "",
      status = "all",
      category = "all",
      sortBy = "created_at",
      sortDir = "desc",
      page = 1,
      pageSize = 10,
      includeHistory = false
    } = req || {};
    const where = [];
    const params = [];
    if (search) {
      where.push("(title LIKE ? OR description LIKE ? OR id IN (SELECT evidence_id FROM evidence_tags et JOIN tags t ON et.tag_id = t.id WHERE t.name LIKE ?))");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status !== "all") {
      where.push("status = ?");
      params.push(status);
    }
    if (category !== "all") {
      where.push("category = ?");
      params.push(category);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const baseTable = includeHistory ? "evidence" : "evidence e JOIN (SELECT version_group_id, MAX(version_number) AS max_version FROM evidence GROUP BY version_group_id) latest ON e.version_group_id = latest.version_group_id AND e.version_number = latest.max_version";
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM ${baseTable} ${whereSql}`);
    const totalRow = totalStmt.get(...params);
    const offset = (page - 1) * pageSize;
    const orderByColumn = sortBy === "status" ? "status" : "created_at";
    const rowsStmt = db.prepare(
      `SELECT * FROM ${baseTable} ${whereSql} ORDER BY ${orderByColumn} ${sortDir.toUpperCase()} LIMIT ? OFFSET ?`
    );
    const items = rowsStmt.all(...params, pageSize, offset);
    return { items, total: totalRow.count };
  });
  import_electron2.ipcMain.handle("evidence:get", (_event, id) => {
    const stmt = db.prepare("SELECT * FROM evidence WHERE id = ?");
    const row = stmt.get(id);
    if (!row) return null;
    const tagsStmt = db.prepare(
      "SELECT t.name FROM tags t JOIN evidence_tags et ON et.tag_id = t.id WHERE et.evidence_id = ?"
    );
    const tags = tagsStmt.all(id).map((t) => t.name);
    return { ...row, tags };
  });
  import_electron2.ipcMain.handle("evidence:create", (_event, payload) => {
    const id = import_crypto.default.randomUUID();
    const versionGroupId = import_crypto.default.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const insert = db.prepare(
      `INSERT INTO evidence (id, title, description, category, status, file_path, version_group_id, version_number, created_at, updated_at)
       VALUES (@id, @title, @description, @category, @status, @file_path, @version_group_id, @version_number, @created_at, @updated_at)`
    );
    const evidence = {
      id,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category,
      status: payload.status,
      file_path: payload.file_path,
      version_group_id: versionGroupId,
      version_number: 1,
      created_at: now,
      updated_at: now
    };
    insert.run(evidence);
    upsertTagsForEvidence(id, payload.tags);
    logAudit("CREATE", id, "evidence");
    return evidence;
  });
  import_electron2.ipcMain.handle("evidence:update", (_event, id, payload) => {
    const existingStmt = db.prepare("SELECT * FROM evidence WHERE id = ?");
    const existing = existingStmt.get(id);
    if (!existing) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const maxVersionStmt = db.prepare("SELECT MAX(version_number) as maxVersion FROM evidence WHERE version_group_id = ?");
    const maxVersionRow = maxVersionStmt.get(existing.version_group_id);
    const nextVersion = (maxVersionRow?.maxVersion ?? existing.version_number) + 1;
    const newId = import_crypto.default.randomUUID();
    const insert = db.prepare(
      `INSERT INTO evidence (id, title, description, category, status, file_path, version_group_id, version_number, created_at, updated_at)
       VALUES (@id, @title, @description, @category, @status, @file_path, @version_group_id, @version_number, @created_at, @updated_at)`
    );
    const evidence = {
      id: newId,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category,
      status: payload.status,
      file_path: payload.file_path ?? existing.file_path,
      version_group_id: existing.version_group_id,
      version_number: nextVersion,
      created_at: existing.created_at,
      updated_at: now
    };
    insert.run(evidence);
    upsertTagsForEvidence(newId, payload.tags);
    if (existing.status !== payload.status) {
      logAudit("STATUS_CHANGE", newId, "evidence");
    }
    return evidence;
  });
  import_electron2.ipcMain.handle("evidence:delete", (_event, id) => {
    const select = db.prepare("SELECT * FROM evidence WHERE id = ?");
    const row = select.get(id);
    if (!row) return false;
    const tagsStmt = db.prepare(
      "SELECT t.name FROM tags t JOIN evidence_tags et ON et.tag_id = t.id WHERE et.evidence_id = ?"
    );
    const tags = tagsStmt.all(id).map((t) => t.name);
    const delTags = db.prepare("DELETE FROM evidence_tags WHERE evidence_id = ?");
    const delEvidence = db.prepare("DELETE FROM evidence WHERE id = ?");
    const now = Date.now();
    db.transaction(() => {
      delTags.run(id);
      delEvidence.run(id);
      lastDeleted = { evidence: row, tags, deletedAt: now };
    })();
    logAudit("DELETE", id, "evidence");
    return true;
  });
  import_electron2.ipcMain.handle("evidence:undoDelete", () => {
    if (!lastDeleted) return null;
    const age = Date.now() - lastDeleted.deletedAt;
    if (age > 5e3) {
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
      upsertTagsForEvidence(evidence.id, lastDeleted.tags);
    })();
    lastDeleted = null;
    return evidence;
  });
  import_electron2.ipcMain.handle("audit:list", () => {
    const stmt = db.prepare(
      "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 500"
    );
    const rows = stmt.all();
    return rows;
  });
  import_electron2.ipcMain.handle("export:create", async (_event, filters) => {
    if (!mainWindow) return null;
    const result = await import_electron2.dialog.showSaveDialog(mainWindow, {
      title: "Save export package",
      filters: [{ name: "Zip Archive", extensions: ["zip"] }],
      defaultPath: "audit-package.zip"
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    const where = [];
    const params = [];
    if (filters.status && filters.status !== "all") {
      where.push("status = ?");
      params.push(filters.status);
    }
    if (filters.category && filters.category !== "all") {
      where.push("category = ?");
      params.push(filters.category);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const evidenceStmt = db.prepare(
      `SELECT * FROM evidence e JOIN (SELECT version_group_id, MAX(version_number) AS max_version FROM evidence GROUP BY version_group_id) latest ON e.version_group_id = latest.version_group_id AND e.version_number = latest.max_version ${whereSql}`
    );
    const items = evidenceStmt.all(...params);
    const pdfPath = await createReportPdf(items, fontPath, import_path2.default.dirname(result.filePath));
    await createZipWithPdfAndFiles(result.filePath, pdfPath, items);
    if (items.length > 0) {
      logAudit("EXPORT_PACKAGE", items[0].id, "evidence");
    } else {
      logAudit("EXPORT_PACKAGE", "none", "evidence");
    }
    return result.filePath;
  });
}
function upsertTagsForEvidence(evidenceId, tags) {
  const trimmed = Array.from(
    new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0))
  );
  const insertTag = db.prepare(
    "INSERT OR IGNORE INTO tags (id, name) VALUES (@id, @name)"
  );
  const selectTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const insertEvidenceTag = db.prepare(
    "INSERT OR IGNORE INTO evidence_tags (evidence_id, tag_id) VALUES (?, ?)"
  );
  const deleteEvidenceTags = db.prepare(
    "DELETE FROM evidence_tags WHERE evidence_id = ?"
  );
  db.transaction(() => {
    deleteEvidenceTags.run(evidenceId);
    for (const name of trimmed) {
      let row = selectTag.get(name);
      if (!row) {
        const id = import_crypto.default.randomUUID();
        insertTag.run({ id, name });
        row = { id };
      }
      insertEvidenceTag.run(evidenceId, row.id);
    }
  })();
}
function logAudit(action, entityId, entityType) {
  const stmt = db.prepare(
    `INSERT INTO audit_log (id, action_type, entity_id, entity_type, actor, timestamp)
     VALUES (@id, @action_type, @entity_id, @entity_type, @actor, @timestamp)`
  );
  stmt.run({
    id: import_crypto.default.randomUUID(),
    action_type: action,
    entity_id: entityId,
    entity_type: entityType,
    actor: "system",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function createReportPdf(items, fontPath, outputDir) {
  return new Promise((resolve, reject) => {
    const doc = new import_pdfkit.default({ margin: 50 });
    const pdfPath = import_path2.default.join(outputDir, `report-ukrainian-${Date.now()}.pdf`);
    const stream = import_fs2.default.createWriteStream(pdfPath);
    stream.on("close", () => resolve(pdfPath));
    stream.on("error", (err) => reject(err));
    doc.on("error", (err) => reject(err));
    doc.pipe(stream);
    try {
      doc.registerFont("NotoSans", fontPath);
      doc.font("NotoSans");
    } catch (err) {
      reject(
        new Error(
          `Failed to register Ukrainian font at ${fontPath}: ${err.message}`
        )
      );
      doc.end();
      return;
    }
    doc.fontSize(18).text("\u0417\u0432\u0456\u0442 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0441\u044C\u043A\u043E\u0433\u043E \u043F\u0430\u043A\u0435\u0442\u0443", { align: "center" });
    doc.moveDown();
    const formattedDate = new Intl.DateTimeFormat("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(/* @__PURE__ */ new Date());
    doc.fontSize(12).text(`\u0414\u0430\u0442\u0430: ${formattedDate}`, { align: "left" });
    doc.moveDown();
    doc.fontSize(12).text("\u0421\u043F\u0438\u0441\u043E\u043A \u0434\u043E\u043A\u0430\u0437\u0456\u0432:", { underline: true });
    doc.moveDown(0.5);
    const headers = ["\u041D\u0430\u0437\u0432\u0430", "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0456\u044F", "\u0421\u0442\u0430\u0442\u0443\u0441", "\u0412\u0435\u0440\u0441\u0456\u044F", "\u0422\u0435\u0433\u0438"];
    doc.text(headers.join(" | "));
    doc.moveDown(0.5);
    for (const item of items) {
      const tagsStmt = db.prepare(
        "SELECT t.name FROM tags t JOIN evidence_tags et ON et.tag_id = t.id WHERE et.evidence_id = ?"
      );
      const tags = tagsStmt.all(item.id).map((t) => t.name);
      const line = [
        `\u041D\u0430\u0437\u0432\u0430: ${item.title}`,
        `\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0456\u044F: ${item.category}`,
        `\u0421\u0442\u0430\u0442\u0443\u0441: ${item.status}`,
        `\u0412\u0435\u0440\u0441\u0456\u044F: ${item.version_number}`,
        `\u0422\u0435\u0433\u0438: ${tags.join(", ")}`
      ].join(" | ");
      doc.text(line);
    }
    doc.end();
  });
}
function createZipWithPdfAndFiles(zipPath, pdfPath, items) {
  return new Promise((resolve, reject) => {
    const output = import_fs2.default.createWriteStream(zipPath);
    const archive = (0, import_archiver.default)("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));
    archive.pipe(output);
    archive.file(pdfPath, { name: "report-ukrainian.pdf" });
    for (const item of items) {
      if (import_fs2.default.existsSync(item.file_path)) {
        archive.file(item.file_path, { name: import_path2.default.basename(item.file_path) });
      }
    }
    archive.finalize();
  });
}
import_electron2.app.whenReady().then(() => {
  ensureDatabase();
  registerIpcHandlers();
  createWindow();
  import_electron2.app.on("activate", () => {
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron2.app.quit();
  }
});
//# sourceMappingURL=main.js.map