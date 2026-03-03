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

CREATE INDEX IF NOT EXISTS idx_evidence_version_group_id ON evidence(version_group_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_category ON evidence(category);
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp_desc ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);

CREATE INDEX IF NOT EXISTS idx_evidence_tags_evidence_id ON evidence_tags(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tags_tag_id ON evidence_tags(tag_id);
