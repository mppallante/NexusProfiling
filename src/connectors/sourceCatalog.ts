import type { OsintSourceRecord } from '../types/domain';

export const sourceCatalog: Omit<OsintSourceRecord, 'lastQueriedAt'>[] = [
  {
    name: 'BrasilAPI CNPJ',
    type: 'CNPJ / registro público empresarial',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://brasilapi.com.br/docs#tag/CNPJ',
    knownLimit: 'Uso público sujeito à disponibilidade da BrasilAPI; aplicar timeout e moderação.',
    legalNote: 'Consulta somente dados cadastrais públicos de pessoa jurídica.'
  },
  {
    name: 'ViaCEP',
    type: 'CEP / endereço público',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://viacep.com.br/',
    knownLimit: 'Uso público sem chave; evitar volume excessivo.',
    legalNote: 'Retorna endereço por CEP sem identificar morador.'
  },
  {
    name: 'DNS Lookup',
    type: 'Infraestrutura pública',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://nodejs.org/api/dns.html',
    knownLimit: 'Depende do resolvedor DNS local e timeout configurado.',
    legalNote: 'Consulta registros técnicos publicados no DNS.'
  },
  {
    name: 'MX Lookup',
    type: 'Infraestrutura de e-mail',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://nodejs.org/api/dns.html#dnspromisesresolvemxhostname',
    knownLimit: 'Depende do resolvedor DNS local.',
    legalNote: 'Consulta registros MX publicados no DNS.'
  },
  {
    name: 'TXT Lookup',
    type: 'Infraestrutura / políticas públicas',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://nodejs.org/api/dns.html#dnspromisesresolvetxthostname',
    knownLimit: 'Depende do resolvedor DNS local.',
    legalNote: 'Consulta registros TXT publicados, como SPF/DMARC quando existentes.'
  },
  {
    name: 'NS Lookup',
    type: 'Infraestrutura pública',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://nodejs.org/api/dns.html#dnspromisesresolvenshostname',
    knownLimit: 'Depende do resolvedor DNS local.',
    legalNote: 'Consulta servidores autoritativos publicados no DNS.'
  },
  {
    name: 'E-mail DNS/MX Validation',
    type: 'Validação técnica de e-mail',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://nodejs.org/api/dns.html#dnspromisesresolvemxhostname',
    knownLimit: 'Não confirma existência de caixa postal; apenas formato e infraestrutura do domínio.',
    legalNote: 'Não consulta senha, vazamento, caixa postal, login ou conteúdo privado.'
  },
  {
    name: 'RDAP/WHOIS',
    type: 'Registro de domínio',
    status: 'future',
    requiresApiKey: false,
    documentationUrl: 'https://www.rdap.org/',
    knownLimit: 'Varia por registrador e TLD; alguns campos podem ser redigidos por privacidade.',
    legalNote: 'Preparado para consulta pública futura, respeitando campos redigidos.'
  },
  {
    name: 'crt.sh / Certificate Transparency',
    type: 'Certificados públicos',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://crt.sh/',
    knownLimit: 'Serviço público pode oscilar; usa fallback público Cert Spotter quando crt.sh falha.',
    legalNote: 'Consulta logs públicos de transparência de certificados, sem autenticação ou bypass.'
  },
  {
    name: 'Username public sites',
    type: 'Presença pública por username',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'docs/fontes-osint.md#username-public-sites',
    knownLimit: 'Lista controlada, timeout e baixa taxa de requisições.',
    legalNote: 'Verifica apenas URLs públicas, sem login, bypass ou perfis privados.'
  },
  {
    name: 'OpenStreetMap',
    type: 'Mapa base',
    status: 'implemented',
    requiresApiKey: false,
    documentationUrl: 'https://www.openstreetmap.org/copyright',
    knownLimit: 'Tiles públicos sujeitos à política de uso do provedor.',
    legalNote: 'Usado apenas como visualização cartográfica de locais vinculados ao caso.'
  },
  {
    name: 'Have I Been Pwned',
    type: 'Exposição de conta',
    status: 'optional',
    requiresApiKey: true,
    documentationUrl: 'https://haveibeenpwned.com/API/v3',
    knownLimit: 'Requer chave de API e respeito estrito aos termos; não consulta senhas.',
    legalNote: 'Preparado apenas para integração futura segura, sem exibir senhas ou bases clandestinas.'
  }
];
