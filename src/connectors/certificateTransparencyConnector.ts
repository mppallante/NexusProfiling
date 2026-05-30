import type { ConnectorResult, OsintConnector } from '../types/connectors';
import { fetchWithTimeout } from '../utils/http';
import { validateDomain } from '../utils/validation';

export const certificateTransparencyConnector: OsintConnector = {
  name: 'crt.sh / Certificate Transparency',
  type: 'domain',
  requiresApiKey: false,
  documentationUrl: 'https://crt.sh/',
  knownLimit: 'Serviço público pode oscilar; aplica timeout e deduplicação.',
  legalNotice: 'Consulta logs públicos de transparência de certificados, sem autenticação ou bypass.',
  timeoutMs: 10000,
  async run(input: string): Promise<ConnectorResult> {
    const domain = validateDomain(input);
    const crtshUrl = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`;

    try {
      const response = await fetchWithTimeout(crtshUrl, this.timeoutMs);
      if (!response.ok) {
        throw new Error(`crt.sh retornou HTTP ${response.status}.`);
      }
      const text = await response.text();
      const rows = text.trim() ? JSON.parse(text) : [];
      return this.normalizeResult({ provider: 'crt.sh', sourceUrl: crtshUrl, rows }, domain);
    } catch {
      const certSpotterUrl = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`;
      const response = await fetchWithTimeout(certSpotterUrl, this.timeoutMs);
      if (!response.ok) {
        throw new Error(`Certificate Transparency indisponível: crt.sh falhou e Cert Spotter retornou HTTP ${response.status}.`);
      }
      return this.normalizeResult({ provider: 'Cert Spotter API', sourceUrl: certSpotterUrl, rows: await response.json() }, domain);
    }
  },
  normalizeResult(raw: unknown, input: string): ConnectorResult {
    const domain = validateDomain(input);
    const payload = Array.isArray(raw)
      ? { provider: 'crt.sh', sourceUrl: `https://crt.sh/?q=%25.${domain}&output=json`, rows: raw }
      : raw as { provider?: string; sourceUrl?: string; rows?: unknown[] };
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const provider = payload.provider ?? 'Certificate Transparency';
    const sourceUrl = payload.sourceUrl ?? `https://crt.sh/?q=%25.${domain}&output=json`;
    const names = new Set<string>();

    for (const row of rows.slice(0, 250)) {
      const rowRecord = row as Record<string, unknown>;
      const values = Array.isArray(rowRecord.dns_names)
        ? rowRecord.dns_names.map(String)
        : String(rowRecord.name_value ?? '').split('\n');

      for (const name of values) {
        const normalized = name.trim().toLowerCase().replace(/^\*\./, '');
        if (normalized.endsWith(domain) && normalized !== domain) {
          names.add(normalized);
        }
      }
    }

    const subdomains = [...names].sort().slice(0, 80);

    return {
      status: subdomains.length > 0 ? 'success' : 'not_found',
      message: subdomains.length > 0
        ? `${subdomains.length} subdomínio(s) deduplicado(s) encontrado(s).`
        : 'Nenhum subdomínio encontrado em Certificate Transparency.',
      evidence: {
        title: `Certificate Transparency: ${domain}`,
        description: 'Busca de certificados públicos e subdomínios relacionados, com deduplicação.',
        source: this.name,
        sourceUrl,
        evidenceType: 'certificate_transparency',
        confidence: 'medium',
        legalNote: this.legalNotice,
        rawData: { provider, totalRows: rows.length, subdomains, sample: rows.slice(0, 20) }
      },
      entities: [
        { type: 'domain', label: domain, value: domain, confidence: 'high', metadata: { source: this.name } },
        ...subdomains.map((subdomain) => ({
          type: 'domain' as const,
          label: subdomain,
          value: subdomain,
          confidence: 'medium' as const,
          metadata: { parentDomain: domain, source: this.name }
        }))
      ],
      relationships: subdomains.map((subdomain) => ({
        sourceValue: domain,
        targetValue: subdomain,
        label: 'possui subdomínio em CT',
        confidence: 'medium',
        source: this.name
      }))
    };
  }
};
