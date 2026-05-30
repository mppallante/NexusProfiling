export type EntityType =
  | 'person'
  | 'email'
  | 'phone'
  | 'domain'
  | 'cnpj'
  | 'cep'
  | 'username'
  | 'public_profile'
  | 'company'
  | 'location'
  | 'event'
  | 'infrastructure'
  | 'cnae';

export type EvidenceType =
  | 'public_registry'
  | 'address_lookup'
  | 'dns_record'
  | 'certificate_transparency'
  | 'username_presence'
  | 'manual_note'
  | 'technical_validation';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type OsintInputType = 'cnpj' | 'cep' | 'domain' | 'email' | 'username';

export interface CaseRecord {
  id: string;
  title: string;
  summary: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface EntityRecord {
  id: string;
  caseId: string;
  type: EntityType;
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  collectedAt: string;
  evidenceType: EvidenceType;
  confidence: ConfidenceLevel;
  legalNote: string;
  rawData: Record<string, unknown>;
}

export interface RelationshipRecord {
  id: string;
  caseId: string;
  sourceEntityId: string;
  targetEntityId: string;
  label: string;
  confidence: ConfidenceLevel;
  source: string;
  createdAt: string;
}

export interface TimelineEventRecord {
  id: string;
  caseId: string;
  title: string;
  occurredAt: string;
  description: string;
  sourceEvidenceId?: string;
}

export interface OsintSourceRecord {
  name: string;
  type: string;
  status: 'implemented' | 'optional' | 'future';
  requiresApiKey: boolean;
  documentationUrl: string;
  knownLimit: string;
  legalNote: string;
  lastQueriedAt?: string;
}

export interface BehavioralProfile {
  modusOperandi: string;
  recurringPatterns: string;
  digitalBehavior: string;
  temporalRecurrence: string;
  geographicConcentration: string;
  hypotheses: string;
  limitations: string;
  nonAccusatoryAlert: string;
}

export interface LegalChecklist {
  publicSource: boolean;
  purpose: string;
  justification: string;
  authorization: string;
  privacyNotes: string;
}

export interface CaseDetail extends CaseRecord {
  entities: EntityRecord[];
  evidences: EvidenceRecord[];
  relationships: RelationshipRecord[];
  timeline: TimelineEventRecord[];
  profile: BehavioralProfile;
  checklist: LegalChecklist;
}

export interface OsintRunRequest {
  caseId: string;
  type: OsintInputType;
  input: string;
}

export interface OsintRunResponse {
  connector: string;
  status: 'success' | 'partial' | 'not_found' | 'error';
  message: string;
  evidence?: EvidenceRecord;
  evidences?: EvidenceRecord[];
  createdEntities: EntityRecord[];
  createdRelationships: RelationshipRecord[];
}
