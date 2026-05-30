import type { ConnectorResult, OsintConnector } from '../types/connectors';
import type { NormalizedEntity } from '../types/connectors';
import { fetchWithTimeout } from '../utils/http';
import { normalizeCnpj } from '../utils/validation';

export const cnpjConnector: OsintConnector = {
  name: 'BrasilAPI CNPJ',
  type: 'cnpj',
  requiresApiKey: false,
  documentationUrl: 'https://brasilapi.com.br/docs#tag/CNPJ',
  knownLimit: 'Uso público sujeito à disponibilidade da BrasilAPI.',
  legalNotice: 'Consulta restrita a dados públicos de pessoa jurídica. Não consulta CPF ou dados privados.',
  timeoutMs: 8000,
  async run(input: string): Promise<ConnectorResult> {
    const cnpj = normalizeCnpj(input);
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
    const response = await fetchWithTimeout(url, this.timeoutMs);
    if (response.status === 404) {
      return this.normalizeResult({ cnpj, notFound: true }, cnpj);
    }
    if (!response.ok) {
      throw new Error(`BrasilAPI retornou HTTP ${response.status}.`);
    }
    return this.normalizeResult(await response.json(), cnpj);
  },
  normalizeResult(raw: unknown, input: string): ConnectorResult {
    const data = raw as Record<string, any>;
    const cnpj = normalizeCnpj(input);
    const companyName = String(data.razao_social ?? data.nome_fantasia ?? cnpj);
    const municipality = data.municipio ? String(data.municipio) : undefined;
    const uf = data.uf ? String(data.uf) : undefined;
    const address = [data.logradouro, data.numero, data.bairro, municipality, uf].filter(Boolean).join(', ');
    const cnae = data.cnae_fiscal_descricao ? String(data.cnae_fiscal_descricao) : undefined;

    if (data.notFound) {
      return {
        status: 'not_found',
        message: 'CNPJ não encontrado na BrasilAPI.',
        evidence: {
          title: `Consulta CNPJ ${cnpj}`,
          description: 'CNPJ não encontrado em fonte pública consultada.',
          source: this.name,
          sourceUrl: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
          evidenceType: 'public_registry',
          confidence: 'medium',
          legalNote: this.legalNotice,
          rawData: data
        },
        entities: [{ type: 'cnpj', label: `CNPJ ${cnpj}`, value: cnpj, confidence: 'medium' }],
        relationships: []
      };
    }

    const entities: NormalizedEntity[] = [
      { type: 'cnpj' as const, label: `CNPJ ${cnpj}`, value: cnpj, confidence: 'high' as const, metadata: { source: this.name } },
      { type: 'company' as const, label: companyName, value: companyName, confidence: 'high' as const, metadata: { cnpj, nomeFantasia: data.nome_fantasia } }
    ];

    if (address) {
      entities.push({
        type: 'location',
        label: address,
        value: address,
        confidence: 'medium',
        metadata: { municipio: municipality, uf, cep: data.cep }
      });
    }
    if (municipality && uf) {
      entities.push({ type: 'location', label: `${municipality}/${uf}`, value: `${municipality}/${uf}`, confidence: 'medium', metadata: { municipio: municipality, uf } });
    }
    if (cnae) {
      entities.push({ type: 'cnae', label: cnae, value: String(data.cnae_fiscal ?? cnae), confidence: 'high', metadata: { descricao: cnae } });
    }

    const socios = Array.isArray(data.qsa) ? data.qsa.slice(0, 12) : [];
    for (const socio of socios) {
      const nomeSocio = socio.nome_socio || socio.nome;
      if (nomeSocio) {
        entities.push({
          type: 'person',
          label: String(nomeSocio),
          value: String(nomeSocio),
          confidence: 'medium',
          metadata: { qualificacao: socio.qualificacao_socio, publicBusinessRegistry: true }
        });
      }
    }

    const relationships = entities
      .filter((entity) => entity.value !== cnpj)
      .map((entity) => ({
        sourceValue: cnpj,
        targetValue: entity.value,
        label: entity.type === 'person' ? 'quadro societário público' : 'associado a',
        confidence: entity.confidence,
        source: this.name
      }));

    return {
      status: 'success',
      message: `Dados públicos encontrados para ${companyName}.`,
      evidence: {
        title: `Consulta BrasilAPI CNPJ: ${companyName}`,
        description: `Registro público de CNPJ consultado e normalizado para o caso.`,
        source: this.name,
        sourceUrl: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        evidenceType: 'public_registry',
        confidence: 'high',
        legalNote: this.legalNotice,
        rawData: data
      },
      entities,
      relationships
    };
  }
};
