import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js';
import { migrate } from './schema';
import { createId } from '../utils/ids';
import type {
  BehavioralProfile,
  CaseDetail,
  CaseRecord,
  ConfidenceLevel,
  EntityRecord,
  EntityType,
  EvidenceRecord,
  LegalChecklist,
  OsintSourceRecord,
  RelationshipRecord,
  TimelineEventRecord
} from '../types/domain';
import type { ConnectorEvidence, NormalizedEntity, NormalizedRelationship } from '../types/connectors';

const dataDir = process.env.NEXUS_DATA_DIR ?? path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'nexus-profiling.sqlite');

type Row = Record<string, unknown>;
const require = createRequire(import.meta.url);

const SQL: SqlJsStatic = await initSqlJs({
  locateFile: (file) => process.env.NEXUS_SQL_WASM_PATH ?? require.resolve(`sql.js/dist/${file}`)
});
const rawDb: Database = fs.existsSync(dbPath) ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();
migrate(rawDb);

function persist(): void {
  fs.writeFileSync(dbPath, Buffer.from(rawDb.export()));
}

persist();

export const db = {
  exec(sql: string): void {
    rawDb.exec(sql);
    persist();
  },
  prepare(sql: string) {
    return {
      all(...params: SqlValue[]): Row[] {
        const stmt = rawDb.prepare(sql);
        try {
          stmt.bind(params);
          const rows: Row[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject() as Row);
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
      get(...params: SqlValue[]): Row | undefined {
        const stmt = rawDb.prepare(sql);
        try {
          stmt.bind(params);
          return stmt.step() ? (stmt.getAsObject() as Row) : undefined;
        } finally {
          stmt.free();
        }
      },
      run(...params: SqlValue[]): void {
        rawDb.run(sql, params);
        persist();
      }
    };
  }
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapCase(row: Row): CaseRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    status: row.status as CaseRecord['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapEntity(row: Row): EntityRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    type: row.type as EntityType,
    label: String(row.label),
    value: String(row.value),
    confidence: row.confidence as ConfidenceLevel,
    metadata: parseJson<Record<string, unknown>>(row.metadata, {}),
    createdAt: String(row.created_at)
  };
}

function mapEvidence(row: Row): EvidenceRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    title: String(row.title),
    description: String(row.description),
    source: String(row.source),
    sourceUrl: String(row.source_url),
    collectedAt: String(row.collected_at),
    evidenceType: row.evidence_type as EvidenceRecord['evidenceType'],
    confidence: row.confidence as ConfidenceLevel,
    legalNote: String(row.legal_note),
    rawData: parseJson<Record<string, unknown>>(row.raw_data, {})
  };
}

function mapRelationship(row: Row): RelationshipRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    sourceEntityId: String(row.source_entity_id),
    targetEntityId: String(row.target_entity_id),
    label: String(row.label),
    confidence: row.confidence as ConfidenceLevel,
    source: String(row.source),
    createdAt: String(row.created_at)
  };
}

function mapTimeline(row: Row): TimelineEventRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    title: String(row.title),
    occurredAt: String(row.occurred_at),
    description: String(row.description),
    sourceEvidenceId: row.source_evidence_id ? String(row.source_evidence_id) : undefined
  };
}

export function listCases(): CaseRecord[] {
  return db.prepare('SELECT * FROM cases ORDER BY updated_at DESC').all().map(mapCase);
}

export function getCase(caseId: string): CaseDetail | undefined {
  const caseRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId) as Row | undefined;
  if (!caseRow) return undefined;

  const entities = db.prepare('SELECT * FROM entities WHERE case_id = ? ORDER BY created_at DESC').all(caseId).map(mapEntity);
  const evidences = db.prepare('SELECT * FROM evidences WHERE case_id = ? ORDER BY collected_at DESC').all(caseId).map(mapEvidence);
  const relationships = db.prepare('SELECT * FROM relationships WHERE case_id = ? ORDER BY created_at DESC').all(caseId).map(mapRelationship);
  const timeline = db.prepare('SELECT * FROM timeline_events WHERE case_id = ? ORDER BY occurred_at DESC').all(caseId).map(mapTimeline);
  const profileRow = db.prepare('SELECT * FROM behavioral_profiles WHERE case_id = ?').get(caseId) as Row | undefined;
  const checklistRow = db.prepare('SELECT * FROM legal_checklists WHERE case_id = ?').get(caseId) as Row | undefined;

  return {
    ...mapCase(caseRow),
    entities,
    evidences,
    relationships,
    timeline,
    profile: {
      modusOperandi: String(profileRow?.modus_operandi ?? ''),
      recurringPatterns: String(profileRow?.recurring_patterns ?? ''),
      digitalBehavior: String(profileRow?.digital_behavior ?? ''),
      temporalRecurrence: String(profileRow?.temporal_recurrence ?? ''),
      geographicConcentration: String(profileRow?.geographic_concentration ?? ''),
      hypotheses: String(profileRow?.hypotheses ?? ''),
      limitations: String(profileRow?.limitations ?? ''),
      nonAccusatoryAlert: String(profileRow?.non_accusatory_alert ?? 'Análise orientativa: não substitui validação humana, contraditório ou diligência formal.')
    },
    checklist: {
      publicSource: Boolean(checklistRow?.public_source ?? 1),
      purpose: String(checklistRow?.purpose ?? ''),
      justification: String(checklistRow?.justification ?? ''),
      authorization: String(checklistRow?.authorization ?? ''),
      privacyNotes: String(checklistRow?.privacy_notes ?? '')
    }
  };
}

export function createCase(input: Pick<CaseRecord, 'title' | 'summary'>): CaseRecord {
  const now = new Date().toISOString();
  const id = createId('case');
  db.prepare('INSERT INTO cases (id, title, summary, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    input.title,
    input.summary,
    'active',
    now,
    now
  );
  db.prepare(`
    INSERT INTO behavioral_profiles (
      case_id, modus_operandi, recurring_patterns, digital_behavior, temporal_recurrence,
      geographic_concentration, hypotheses, limitations, non_accusatory_alert
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    'Em análise.',
    'Aguardando evidências suficientes.',
    'Sem padrão digital consolidado.',
    'Sem recorrência temporal definida.',
    'Sem concentração geográfica definida.',
    'Hipóteses devem ser tratadas como linhas de investigação, não como conclusão.',
    'Baseado exclusivamente em fontes públicas e dados inseridos pelo usuário.',
    'Evite conclusões acusatórias; valide achados por meios legais e autorizados.'
  );
  db.prepare(`
    INSERT INTO legal_checklists (case_id, public_source, purpose, justification, authorization, privacy_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, 1, 'Investigação OSINT legal e autorizada.', 'Coleta de fontes públicas para organização analítica.', 'Uso interno/autorizado.', 'Minimizar dados pessoais e registrar fonte, data e finalidade.');
  return getCase(id)!;
}

export function upsertEntity(caseId: string, entity: NormalizedEntity): EntityRecord {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM entities WHERE case_id = ? AND type = ? AND value = ?').get(caseId, entity.type, entity.value) as Row | undefined;
  if (existing) return mapEntity(existing);

  const id = createId('entity');
  db.prepare(`
    INSERT INTO entities (id, case_id, type, label, value, confidence, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, caseId, entity.type, entity.label, entity.value, entity.confidence, JSON.stringify(entity.metadata ?? {}), now);
  touchCase(caseId);
  return mapEntity(db.prepare('SELECT * FROM entities WHERE id = ?').get(id) as Row);
}

export function createEvidence(caseId: string, evidence: ConnectorEvidence): EvidenceRecord {
  const id = createId('evidence');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO evidences (
      id, case_id, title, description, source, source_url, collected_at,
      evidence_type, confidence, legal_note, raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    caseId,
    evidence.title,
    evidence.description,
    evidence.source,
    evidence.sourceUrl,
    now,
    evidence.evidenceType,
    evidence.confidence,
    evidence.legalNote,
    JSON.stringify(evidence.rawData)
  );
  db.prepare(`
    INSERT INTO timeline_events (id, case_id, title, occurred_at, description, source_evidence_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(createId('event'), caseId, evidence.title, now, evidence.description, id);
  touchCase(caseId);
  return mapEvidence(db.prepare('SELECT * FROM evidences WHERE id = ?').get(id) as Row);
}

export function createRelationships(caseId: string, entities: EntityRecord[], relationships: NormalizedRelationship[]): RelationshipRecord[] {
  const created: RelationshipRecord[] = [];
  const byValue = new Map(entities.map((entity) => [entity.value, entity]));
  const now = new Date().toISOString();

  for (const relationship of relationships) {
    const source = byValue.get(relationship.sourceValue);
    const target = byValue.get(relationship.targetValue);
    if (!source || !target || source.id === target.id) continue;

    const id = createId('rel');
    db.prepare(`
      INSERT OR IGNORE INTO relationships (id, case_id, source_entity_id, target_entity_id, label, confidence, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, caseId, source.id, target.id, relationship.label, relationship.confidence, relationship.source, now);

    const row = db.prepare(`
      SELECT * FROM relationships
      WHERE case_id = ? AND source_entity_id = ? AND target_entity_id = ? AND label = ?
    `).get(caseId, source.id, target.id, relationship.label) as Row | undefined;
    if (row) created.push(mapRelationship(row));
  }

  touchCase(caseId);
  return created;
}

export function updateSourceLastQueried(name: string): void {
  db.prepare('INSERT OR REPLACE INTO osint_source_state (name, last_queried_at) VALUES (?, ?)').run(name, new Date().toISOString());
}

export function sourceStateByName(): Map<string, string> {
  const rows = db.prepare('SELECT * FROM osint_source_state').all() as Row[];
  return new Map(rows.map((row) => [String(row.name), String(row.last_queried_at)]));
}

export function logOsintRun(input: {
  caseId?: string;
  connector: string;
  inputType: string;
  inputValue: string;
  status: string;
  message: string;
}): void {
  db.prepare(`
    INSERT INTO osint_logs (id, case_id, connector, input_type, input_value, status, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(createId('log'), input.caseId ?? null, input.connector, input.inputType, input.inputValue, input.status, input.message, new Date().toISOString());
}

export function buildSourcesWithState(sources: Omit<OsintSourceRecord, 'lastQueriedAt'>[]): OsintSourceRecord[] {
  const state = sourceStateByName();
  return sources.map((source) => ({ ...source, lastQueriedAt: state.get(source.name) }));
}

export function seedDemoData(): void {
  const count = db.prepare('SELECT COUNT(*) AS total FROM cases').get() as { total: number };
  if (count.total > 0) return;

  const demo = createCase({
    title: 'Demonstração OSINT autorizada',
    summary: 'Caso fictício para explorar entidades, evidências, grafo, timeline, mapa e relatório.'
  });

  const company = upsertEntity(demo.id, {
    type: 'company',
    label: 'Empresa demonstrativa',
    value: 'empresa-demo.local',
    confidence: 'medium',
    metadata: { note: 'Dado fictício' }
  });
  const domain = upsertEntity(demo.id, {
    type: 'domain',
    label: 'Domínio demonstrativo',
    value: 'example.org',
    confidence: 'high',
    metadata: { note: 'Domínio reservado para exemplos' }
  });
  const location = upsertEntity(demo.id, {
    type: 'location',
    label: 'São Paulo, SP',
    value: 'Sao Paulo/SP',
    confidence: 'medium',
    metadata: { lat: -23.5505, lng: -46.6333 }
  });

  createRelationships(demo.id, [company, domain, location], [
    { sourceValue: company.value, targetValue: domain.value, label: 'usa domínio', confidence: 'medium', source: 'Dados fictícios' },
    { sourceValue: company.value, targetValue: location.value, label: 'associada a localidade', confidence: 'medium', source: 'Dados fictícios' }
  ]);

  createEvidence(demo.id, {
    title: 'Evidência demonstrativa',
    description: 'Registro criado apenas para demonstrar o fluxo de evidências com fonte, data e observação legal.',
    source: 'Seed local',
    sourceUrl: 'local://demo',
    evidenceType: 'manual_note',
    confidence: 'medium',
    legalNote: 'Dado fictício, sem identificação de pessoa real.',
    rawData: { demo: true }
  });
}

export function updateBehavioralProfile(caseId: string, profile: BehavioralProfile): void {
  db.prepare(`
    UPDATE behavioral_profiles SET
      modus_operandi = ?,
      recurring_patterns = ?,
      digital_behavior = ?,
      temporal_recurrence = ?,
      geographic_concentration = ?,
      hypotheses = ?,
      limitations = ?,
      non_accusatory_alert = ?
    WHERE case_id = ?
  `).run(
    profile.modusOperandi,
    profile.recurringPatterns,
    profile.digitalBehavior,
    profile.temporalRecurrence,
    profile.geographicConcentration,
    profile.hypotheses,
    profile.limitations,
    profile.nonAccusatoryAlert,
    caseId
  );
  touchCase(caseId);
}

export function updateLegalChecklist(caseId: string, checklist: LegalChecklist): void {
  db.prepare(`
    UPDATE legal_checklists SET
      public_source = ?,
      purpose = ?,
      justification = ?,
      authorization = ?,
      privacy_notes = ?
    WHERE case_id = ?
  `).run(Number(checklist.publicSource), checklist.purpose, checklist.justification, checklist.authorization, checklist.privacyNotes, caseId);
  touchCase(caseId);
}

function touchCase(caseId: string): void {
  db.prepare('UPDATE cases SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), caseId);
}
