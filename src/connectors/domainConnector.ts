import dns from 'node:dns/promises';
import type { ConnectorResult, OsintConnector } from '../types/connectors';
import { validateDomain } from '../utils/validation';

async function safeDns<T>(lookup: Promise<T>): Promise<T | null> {
  try {
    return await lookup;
  } catch {
    return null;
  }
}

async function lookupDomain(domain: string): Promise<ConnectorResult> {
  const [a, aaaa, mx, txt, ns, cname] = await Promise.all([
    safeDns(dns.resolve4(domain)),
    safeDns(dns.resolve6(domain)),
    safeDns(dns.resolveMx(domain)),
    safeDns(dns.resolveTxt(domain)),
    safeDns(dns.resolveNs(domain)),
    safeDns(dns.resolveCname(domain))
  ]);

  return domainConnector.normalizeResult({ domain, a, aaaa, mx, txt, ns, cname }, domain);
}

export const domainConnector: OsintConnector = {
  name: 'DNS Lookup',
  type: 'domain',
  requiresApiKey: false,
  documentationUrl: 'https://nodejs.org/api/dns.html',
  knownLimit: 'Depende de resolvedores DNS públicos/locais e timeout da rede.',
  legalNotice: 'Consulta apenas registros DNS publicados publicamente.',
  timeoutMs: 7000,
  async run(input: string): Promise<ConnectorResult> {
    const domain = validateDomain(input);
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na consulta DNS.')), this.timeoutMs);
    });
    return Promise.race([lookupDomain(domain), timeout]);
  },
  normalizeResult(raw: unknown, input: string): ConnectorResult {
    const data = raw as Record<string, any>;
    const domain = validateDomain(input);
    const mxRecords = Array.isArray(data.mx) ? data.mx : [];
    const txtRecords = Array.isArray(data.txt) ? data.txt.map((entry: string[]) => entry.join('')) : [];
    const nsRecords = Array.isArray(data.ns) ? data.ns : [];
    const addresses = [...(data.a ?? []), ...(data.aaaa ?? [])];

    const entities = [
      { type: 'domain' as const, label: domain, value: domain, confidence: 'high' as const, metadata: { source: this.name } },
      ...mxRecords.map((record: { exchange: string; priority: number }) => ({
        type: 'infrastructure' as const,
        label: `MX ${record.exchange}`,
        value: record.exchange,
        confidence: 'high' as const,
        metadata: { priority: record.priority, recordType: 'MX' }
      })),
      ...nsRecords.map((record: string) => ({
        type: 'infrastructure' as const,
        label: `NS ${record}`,
        value: record,
        confidence: 'high' as const,
        metadata: { recordType: 'NS' }
      })),
      ...addresses.map((address: string) => ({
        type: 'infrastructure' as const,
        label: `IP ${address}`,
        value: address,
        confidence: 'medium' as const,
        metadata: { recordType: 'A/AAAA' }
      }))
    ];

    const relationships = entities
      .filter((entity) => entity.value !== domain)
      .map((entity) => ({
        sourceValue: domain,
        targetValue: entity.value,
        label: 'publica registro DNS',
        confidence: entity.confidence,
        source: this.name
      }));

    return {
      status: entities.length > 1 || txtRecords.length > 0 ? 'success' : 'partial',
      message: `Registros DNS consultados para ${domain}.`,
      evidence: {
        title: `Consulta DNS: ${domain}`,
        description: `Consulta técnica de DNS, MX, TXT, NS e endereços publicados para o domínio.`,
        source: this.name,
        sourceUrl: `dns://${domain}`,
        evidenceType: 'dns_record',
        confidence: 'high',
        legalNote: this.legalNotice,
        rawData: { ...data, txt: txtRecords }
      },
      entities,
      relationships
    };
  }
};
