import type { ConnectorResult, OsintConnector } from '../types/connectors';
import { fetchWithTimeout } from '../utils/http';
import { normalizeCep } from '../utils/validation';

export const cepConnector: OsintConnector = {
  name: 'ViaCEP',
  type: 'cep',
  requiresApiKey: false,
  documentationUrl: 'https://viacep.com.br/',
  knownLimit: 'Uso público sem chave; aplicar moderação de chamadas.',
  legalNotice: 'Consulta apenas endereço público por CEP, sem identificação de morador.',
  timeoutMs: 7000,
  async run(input: string): Promise<ConnectorResult> {
    const cep = normalizeCep(input);
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    const response = await fetchWithTimeout(url, this.timeoutMs);
    if (!response.ok) {
      throw new Error(`ViaCEP retornou HTTP ${response.status}.`);
    }
    return this.normalizeResult(await response.json(), cep);
  },
  normalizeResult(raw: unknown, input: string): ConnectorResult {
    const data = raw as Record<string, any>;
    const cep = normalizeCep(input);
    const notFound = Boolean(data.erro);
    const address = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean).join(', ');
    const label = address || `CEP ${cep}`;

    return {
      status: notFound ? 'not_found' : 'success',
      message: notFound ? 'CEP não encontrado no ViaCEP.' : `Endereço público localizado: ${label}.`,
      evidence: {
        title: `Consulta ViaCEP ${cep}`,
        description: notFound ? 'CEP não encontrado em fonte pública consultada.' : `Endereço público associado ao CEP ${cep}.`,
        source: this.name,
        sourceUrl: `https://viacep.com.br/ws/${cep}/json/`,
        evidenceType: 'address_lookup',
        confidence: notFound ? 'medium' : 'high',
        legalNote: this.legalNotice,
        rawData: data
      },
      entities: [
        { type: 'cep', label: `CEP ${cep}`, value: cep, confidence: 'high', metadata: { source: this.name } },
        ...(notFound ? [] : [{ type: 'location' as const, label, value: label, confidence: 'high' as const, metadata: data }])
      ],
      relationships: notFound ? [] : [{ sourceValue: cep, targetValue: label, label: 'resolve para endereço', confidence: 'high', source: this.name }]
    };
  }
};
