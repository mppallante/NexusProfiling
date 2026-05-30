import { certificateTransparencyConnector, connectorsByType } from '../connectors';
import {
  createEvidence,
  createRelationships,
  getCase,
  logOsintRun,
  updateSourceLastQueried,
  upsertEntity
} from '../database/db';
import type { OsintRunRequest, OsintRunResponse } from '../types/domain';
import type { ConnectorResult, OsintConnector } from '../types/connectors';
import { enforceConnectorRateLimit } from '../utils/rateLimit';
import { logger } from '../server/logger';

function updateSourceStatesForConnector(connectorName: string): void {
  updateSourceLastQueried(connectorName);

  if (connectorName === 'DNS Lookup') {
    updateSourceLastQueried('MX Lookup');
    updateSourceLastQueried('TXT Lookup');
    updateSourceLastQueried('NS Lookup');
  }

  if (connectorName === 'E-mail DNS/MX Validation') {
    updateSourceLastQueried('DNS Lookup');
    updateSourceLastQueried('MX Lookup');
  }
}

async function runOneConnector(caseId: string, connector: OsintConnector, input: string): Promise<{
  result: ConnectorResult;
  response: OsintRunResponse;
}> {
  await enforceConnectorRateLimit(connector.name, 500);
  const result = await connector.run(input);
  const evidence = createEvidence(caseId, result.evidence);
  const createdEntities = result.entities.map((entity) => upsertEntity(caseId, entity));
  const createdRelationships = createRelationships(caseId, createdEntities, result.relationships);
  updateSourceStatesForConnector(connector.name);

  logOsintRun({
    caseId,
    connector: connector.name,
    inputType: String(connector.type),
    inputValue: input,
    status: result.status,
    message: result.message
  });

  logger.info({ caseId, connector: connector.name, status: result.status }, result.message);

  return {
    result,
    response: {
      connector: connector.name,
      status: result.status,
      message: result.message,
      evidence,
      evidences: [evidence],
      createdEntities,
      createdRelationships
    }
  };
}

export async function runOsint(request: OsintRunRequest): Promise<OsintRunResponse> {
  const caseDetail = getCase(request.caseId);
  if (!caseDetail) {
    throw new Error('Caso não encontrado.');
  }

  const connector = connectorsByType[request.type];
  if (!connector) {
    throw new Error('Tipo de conector não suportado.');
  }

  try {
    const primary = await runOneConnector(request.caseId, connector, request.input);
    const responses = [primary.response];

    if (request.type === 'domain') {
      try {
        const ct = await runOneConnector(request.caseId, certificateTransparencyConnector, request.input);
        responses.push(ct.response);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro em Certificate Transparency.';
        logOsintRun({
          caseId: request.caseId,
          connector: certificateTransparencyConnector.name,
          inputType: 'domain',
          inputValue: request.input,
          status: 'error',
          message
        });
        logger.warn({ caseId: request.caseId, connector: certificateTransparencyConnector.name, error: message }, 'Falha em CT');
      }
    }

    return {
      connector: request.type === 'domain' ? 'DNS Lookup + Certificate Transparency' : primary.response.connector,
      status: responses.some((response) => response.status === 'success') ? 'success' : primary.response.status,
      message: responses.map((response) => response.message).join(' '),
      evidence: primary.response.evidence,
      evidences: responses.flatMap((response) => response.evidences ?? []),
      createdEntities: responses.flatMap((response) => response.createdEntities),
      createdRelationships: responses.flatMap((response) => response.createdRelationships)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao executar OSINT.';
    logOsintRun({
      caseId: request.caseId,
      connector: connector.name,
      inputType: request.type,
      inputValue: request.input,
      status: 'error',
      message
    });
    logger.error({ caseId: request.caseId, connector: connector.name, error: message }, 'Falha ao executar OSINT');
    throw error;
  }
}
