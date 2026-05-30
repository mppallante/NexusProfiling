import type { Database } from 'sql.js';

export function migrate(db: Database): void {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence TEXT NOT NULL,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(case_id, type, value),
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidences (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      confidence TEXT NOT NULL,
      legal_note TEXT NOT NULL,
      raw_data TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      source_entity_id TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      label TEXT NOT NULL,
      confidence TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(case_id, source_entity_id, target_entity_id, label),
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY(source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY(target_entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      title TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      description TEXT NOT NULL,
      source_evidence_id TEXT,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY(source_evidence_id) REFERENCES evidences(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS behavioral_profiles (
      case_id TEXT PRIMARY KEY,
      modus_operandi TEXT NOT NULL,
      recurring_patterns TEXT NOT NULL,
      digital_behavior TEXT NOT NULL,
      temporal_recurrence TEXT NOT NULL,
      geographic_concentration TEXT NOT NULL,
      hypotheses TEXT NOT NULL,
      limitations TEXT NOT NULL,
      non_accusatory_alert TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS legal_checklists (
      case_id TEXT PRIMARY KEY,
      public_source INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      justification TEXT NOT NULL,
      authorization TEXT NOT NULL,
      privacy_notes TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS osint_source_state (
      name TEXT PRIMARY KEY,
      last_queried_at TEXT
    );

    CREATE TABLE IF NOT EXISTS osint_logs (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      connector TEXT NOT NULL,
      input_type TEXT NOT NULL,
      input_value TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
