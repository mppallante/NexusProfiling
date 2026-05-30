import { describe, expect, it } from 'vitest';
import { cnpjConnector } from './cnpjConnector';
import { cepConnector } from './cepConnector';
import { domainConnector } from './domainConnector';
import { emailConnector } from './emailConnector';
import { certificateTransparencyConnector } from './certificateTransparencyConnector';
import { usernameConnector } from './usernameConnector';

describe('OSINT connectors normalization', () => {
  it('normaliza CNPJ público da BrasilAPI', () => {
    const result = cnpjConnector.normalizeResult(
      {
        razao_social: 'EMPRESA TESTE LTDA',
        nome_fantasia: 'TESTE',
        municipio: 'SAO PAULO',
        uf: 'SP',
        logradouro: 'Rua Pública',
        numero: '100',
        bairro: 'Centro',
        cep: '01001000',
        cnae_fiscal: 6201501,
        cnae_fiscal_descricao: 'Desenvolvimento de programas de computador',
        qsa: [{ nome_socio: 'SOCIO PUBLICO', qualificacao_socio: 'Administrador' }]
      },
      '12.345.678/0001-90'
    );

    expect(result.status).toBe('success');
    expect(result.entities.some((entity) => entity.type === 'company')).toBe(true);
    expect(result.relationships.length).toBeGreaterThan(0);
  });

  it('normaliza endereço público por CEP', () => {
    const result = cepConnector.normalizeResult(
      { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' },
      '01001000'
    );

    expect(result.status).toBe('success');
    expect(result.entities.some((entity) => entity.type === 'location')).toBe(true);
  });

  it('normaliza registros DNS de domínio', () => {
    const result = domainConnector.normalizeResult(
      {
        domain: 'example.org',
        mx: [{ exchange: 'mail.example.org', priority: 10 }],
        txt: [['v=spf1 -all']],
        ns: ['ns1.example.org'],
        a: ['93.184.216.34'],
        aaaa: []
      },
      'example.org'
    );

    expect(result.status).toBe('success');
    expect(result.evidence.rawData.txt).toEqual(['v=spf1 -all']);
  });

  it('valida e-mail sem consultar senhas ou vazamentos', () => {
    const result = emailConnector.normalizeResult(
      { email: 'analista@example.org', domain: 'example.org', dnsResult: { evidence: { rawData: { mx: [{ exchange: 'mail.example.org' }] } } } },
      'analista@example.org'
    );

    expect(result.status).toBe('success');
    expect(result.evidence.rawData).toMatchObject({ hibpPreparedOnly: true });
  });

  it('deduplica subdomínios de Certificate Transparency', () => {
    const result = certificateTransparencyConnector.normalizeResult(
      [
        { name_value: '*.api.example.org\napi.example.org' },
        { name_value: 'www.example.org' }
      ],
      'example.org'
    );

    expect(result.evidence.rawData.subdomains).toEqual(['api.example.org', 'www.example.org']);
  });

  it('normaliza presença pública controlada de username', () => {
    const result = usernameConnector.normalizeResult(
      {
        username: 'demo',
        checks: [
          { site: 'GitHub', url: 'https://github.com/demo', status: 200, found: true },
          { site: 'GitLab', url: 'https://gitlab.com/demo', status: 404, found: false }
        ]
      },
      'demo'
    );

    expect(result.status).toBe('success');
    expect(result.entities.some((entity) => entity.type === 'public_profile')).toBe(true);
  });
});
