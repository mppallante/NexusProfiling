import { describe, expect, it } from 'vitest';
import { createCase, createEvidence, createRelationships, getCase, upsertEntity } from '../database/db';
import type { ConnectorEvidence, NormalizedEntity, NormalizedRelationship } from '../types/connectors';

describe('OSINT persistence workflow', () => {
  it('transforma resultado normalizado em evidência, entidades, timeline e grafo', () => {
    const caseRecord = createCase({
      title: `Teste persistência ${Date.now()}`,
      summary: 'Validação local do fluxo OSINT sem rede externa.'
    });
    const evidenceInput: ConnectorEvidence = {
      title: 'Consulta técnica de domínio',
      description: 'Resultado normalizado salvo como evidência.',
      source: 'Teste local',
      sourceUrl: 'dns://example.org',
      evidenceType: 'dns_record',
      confidence: 'high',
      legalNote: 'Fonte pública simulada para teste local.',
      rawData: { domain: 'example.org', mx: [{ exchange: 'mail.example.org' }] }
    };
    const entitiesInput: NormalizedEntity[] = [
      { type: 'domain', label: 'example.org', value: 'example.org', confidence: 'high' },
      { type: 'infrastructure', label: 'MX mail.example.org', value: 'mail.example.org', confidence: 'high' }
    ];
    const relationshipsInput: NormalizedRelationship[] = [
      {
        sourceValue: 'example.org',
        targetValue: 'mail.example.org',
        label: 'publica registro DNS',
        confidence: 'high',
        source: 'Teste local'
      }
    ];

    const evidence = createEvidence(caseRecord.id, evidenceInput);
    const entities = entitiesInput.map((entity) => upsertEntity(caseRecord.id, entity));
    const relationships = createRelationships(caseRecord.id, entities, relationshipsInput);
    const detail = getCase(caseRecord.id);

    expect(evidence.source).toBe('Teste local');
    expect(detail?.evidences).toHaveLength(1);
    expect(detail?.timeline).toHaveLength(1);
    expect(detail?.entities).toHaveLength(2);
    expect(relationships).toHaveLength(1);
    expect(detail?.relationships).toHaveLength(1);
  });
});
