import type { ConnectorResult, OsintConnector } from '../types/connectors';
import { fetchWithTimeout } from '../utils/http';
import { validateUsername } from '../utils/validation';

const publicSites = [
  { name: 'GitHub', url: (username: string) => `https://github.com/${username}` },
  { name: 'GitLab', url: (username: string) => `https://gitlab.com/${username}` },
  { name: 'Reddit', url: (username: string) => `https://www.reddit.com/user/${username}`, notFoundText: 'page not found' },
  { name: 'Hacker News', url: (username: string) => `https://news.ycombinator.com/user?id=${username}`, notFoundText: 'No such user.' }
];

export const usernameConnector: OsintConnector = {
  name: 'Username public sites',
  type: 'username',
  requiresApiKey: false,
  documentationUrl: 'docs/fontes-osint.md#username-public-sites',
  knownLimit: 'Lista controlada, timeout curto e baixa taxa de requisições.',
  legalNotice: 'Consulta apenas URLs públicas, sem login, perfis privados, scraping agressivo ou bypass.',
  timeoutMs: 6000,
  async run(input: string): Promise<ConnectorResult> {
    const username = validateUsername(input);
    const checks = [];

    for (const site of publicSites) {
      const url = site.url(username);
      try {
        const response = await fetchWithTimeout(url, this.timeoutMs, { method: 'GET', redirect: 'follow' });
        const body = await response.text().catch(() => '');
        const notFoundByBody = site.notFoundText ? body.toLowerCase().includes(site.notFoundText.toLowerCase()) : false;
        checks.push({ site: site.name, url, status: response.status, found: response.status >= 200 && response.status < 300 && !notFoundByBody });
      } catch (error) {
        checks.push({ site: site.name, url, status: 0, found: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    return this.normalizeResult({ username, checks }, username);
  },
  normalizeResult(raw: unknown, input: string): ConnectorResult {
    const username = validateUsername(input);
    const data = raw as Record<string, any>;
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const found = checks.filter((check) => check.found);

    return {
      status: found.length > 0 ? 'success' : 'not_found',
      message: found.length > 0
        ? `${found.length} presença(s) pública(s) encontrada(s) para username.`
        : 'Nenhuma presença pública encontrada na lista controlada.',
      evidence: {
        title: `Busca controlada de username: ${username}`,
        description: 'Verificação de presença pública em lista controlada de sites, sem autenticação ou bypass.',
        source: this.name,
        sourceUrl: 'docs/fontes-osint.md#username-public-sites',
        evidenceType: 'username_presence',
        confidence: found.length > 0 ? 'medium' : 'low',
        legalNote: this.legalNotice,
        rawData: { username, checks }
      },
      entities: [
        { type: 'username', label: `@${username}`, value: username, confidence: 'medium', metadata: { checkedSites: checks.length } },
        ...found.map((check) => ({
          type: 'public_profile' as const,
          label: `${check.site}: ${username}`,
          value: check.url,
          confidence: 'medium' as const,
          metadata: { site: check.site, status: check.status }
        }))
      ],
      relationships: found.map((check) => ({
        sourceValue: username,
        targetValue: check.url,
        label: 'possível presença pública',
        confidence: 'medium',
        source: this.name
      }))
    };
  }
};
