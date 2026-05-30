import type { ConnectorResult, OsintConnector } from '../types/connectors';
import { domainConnector } from './domainConnector';
import { getEmailDomain, validateEmail } from '../utils/validation';

export const emailConnector: OsintConnector = {
  name: 'E-mail DNS/MX Validation',
  type: 'email',
  requiresApiKey: false,
  documentationUrl: 'https://nodejs.org/api/dns.html#dnspromisesresolvemxhostname',
  knownLimit: 'Valida formato e domínio técnico; não garante existência de caixa postal.',
  legalNotice: 'Não consulta senhas, vazamentos, caixa postal, autenticação ou dados privados.',
  timeoutMs: 7000,
  async run(input: string): Promise<ConnectorResult> {
    const email = validateEmail(input);
    const domain = getEmailDomain(email);
    const dnsResult = await domainConnector.run(domain);
    return this.normalizeResult({ email, domain, dnsResult }, email);
  },
  normalizeResult(raw: unknown, input: string): ConnectorResult {
    const email = validateEmail(input);
    const data = raw as Record<string, any>;
    const domain = data.domain ?? getEmailDomain(email);
    const rawDns = data.dnsResult?.evidence?.rawData as Record<string, any> | undefined;
    const hasMx = Array.isArray(rawDns?.mx) && rawDns.mx.length > 0;

    return {
      status: hasMx ? 'success' : 'partial',
      message: hasMx
        ? 'E-mail tecnicamente válido quanto a formato e MX do domínio.'
        : 'Formato válido, mas sem MX confirmado para o domínio.',
      evidence: {
        title: `Validação técnica de e-mail: ${email}`,
        description: 'Validação de formato e infraestrutura DNS/MX do domínio. Não verifica senha, caixa postal ou vazamentos.',
        source: this.name,
        sourceUrl: `dns://${domain}`,
        evidenceType: 'technical_validation',
        confidence: hasMx ? 'medium' : 'low',
        legalNote: this.legalNotice,
        rawData: { email, domain, hasMx, dns: rawDns, hibpPreparedOnly: true }
      },
      entities: [
        { type: 'email', label: email, value: email, confidence: hasMx ? 'medium' : 'low', metadata: { technicallyValid: hasMx } },
        { type: 'domain', label: domain, value: domain, confidence: 'high', metadata: { extractedFromEmail: true } },
        ...(data.dnsResult?.entities ?? [])
      ],
      relationships: [
        { sourceValue: email, targetValue: domain, label: 'usa domínio', confidence: 'high', source: this.name },
        ...(data.dnsResult?.relationships ?? [])
      ]
    };
  }
};
