import type { ConfidenceLevel, EntityType, EvidenceType, OsintInputType } from './domain';

export interface NormalizedEntity {
  type: EntityType;
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  metadata?: Record<string, unknown>;
}

export interface NormalizedRelationship {
  sourceValue: string;
  targetValue: string;
  label: string;
  confidence: ConfidenceLevel;
  source: string;
}

export interface ConnectorEvidence {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  evidenceType: EvidenceType;
  confidence: ConfidenceLevel;
  legalNote: string;
  rawData: Record<string, unknown>;
}

export interface ConnectorResult {
  status: 'success' | 'partial' | 'not_found' | 'error';
  message: string;
  evidence: ConnectorEvidence;
  entities: NormalizedEntity[];
  relationships: NormalizedRelationship[];
}

export interface OsintConnector {
  name: string;
  type: OsintInputType | 'source';
  requiresApiKey: boolean;
  documentationUrl: string;
  knownLimit: string;
  legalNotice: string;
  timeoutMs: number;
  run(input: string): Promise<ConnectorResult>;
  normalizeResult(raw: unknown, input: string): ConnectorResult;
}
