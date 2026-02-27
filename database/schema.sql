CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','submitted','approved')),
  file_path TEXT NOT NULL,
  version_group_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_tags (
  evidence_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (evidence_id, tag_id),
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  timestamp TEXT NOT NULL
);
