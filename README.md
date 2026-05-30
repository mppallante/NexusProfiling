# NexusProfiling

NexusProfiling é uma aplicação desktop/local de investigação OSINT legal e autorizada. O sistema organiza casos, entidades, evidências, vínculos, timeline, mapa e uma camada de perfilamento comportamental investigativo baseada em fontes públicas.

## Objetivo

Oferecer um ambiente profissional para uso acadêmico, corporativo defensivo e investigativo autorizado, com registro de fonte, URL, data/hora, tipo de dado, confiabilidade e observação legal para cada evidência coletada.

## Limites legais

A ferramenta não consulta CPF, senhas, bases vazadas clandestinas, dados privados, dados protegidos por login, scraping agressivo, bypass de captcha, paywall ou autenticação. Hipóteses investigativas devem ser tratadas como linhas de análise, não como conclusão acusatória.

## Funcionalidades

- Dashboard local de casos.
- Gestão de casos investigativos.
- Cadastro automático de entidades a partir de conectores OSINT.
- Registro de evidências com fonte, URL, data/hora, tipo e confiabilidade.
- Grafo investigativo com Cytoscape.js.
- Timeline cronológica.
- Mapa com Leaflet e OpenStreetMap.
- Perfilamento comportamental investigativo com alerta não acusatório.
- Checklist legal com finalidade, justificativa, autorização e observações LGPD/privacidade.
- Relatório HTML por caso.
- Tela Fontes OSINT com status, documentação, limite e última consulta.
- Logs locais em SQLite e em `logs/nexus-profiling.log`.

## Stack

- Front-end: React, Vite e TypeScript.
- Interface: dark mode profissional.
- Back-end local: Node.js e Express.
- Banco local: SQLite com `sql.js`.
- Grafo: Cytoscape.js.
- Mapa: Leaflet e OpenStreetMap.
- Preparado para empacotamento futuro com Electron.

## Instalação

```bash
npm install
```

## Execução local

```bash
npm run dev
```

A interface roda em `http://127.0.0.1:5173` e a API local em `http://127.0.0.1:3333`.

## Geração de build

```bash
npm run build
```

## Testes

```bash
npm test
```

## Fontes OSINT usadas

- BrasilAPI CNPJ.
- ViaCEP.
- DNS Lookup.
- MX Lookup.
- TXT Lookup.
- NS Lookup.
- E-mail DNS/MX Validation.
- crt.sh / Certificate Transparency.
- Username public sites em lista controlada.
- OpenStreetMap para visualização de mapa, sem coleta investigativa própria.

## Fontes opcionais

- Have I Been Pwned: preparado como integração futura opcional mediante chave de API, sem consulta ou exibição de senhas.
- RDAP/WHOIS: documentado para integração futura com respeito a campos redigidos por privacidade.

## Fontes não implementadas por segurança

- CPF.
- Senhas.
- Bases vazadas clandestinas.
- Dados privados ou protegidos por login.
- Scraping agressivo.
- Bypass de captcha, paywall ou autenticação.

## Fontes implementadas neste MVP

- BrasilAPI CNPJ: consulta pública por CNPJ, salva evidência, cria entidade de CNPJ, empresa, endereço/localidade, CNAE e quadro societário público quando disponível.
- ViaCEP: consulta pública por CEP, salva evidência e cria entidade local.
- DNS Lookup: consulta A, AAAA e CNAME quando disponível, salva evidência técnica e cria entidades de infraestrutura.
- MX Lookup: consulta registros MX do domínio como parte do conector de domínio/e-mail e alimenta evidência e grafo.
- TXT Lookup: consulta registros TXT do domínio como parte do conector de domínio e registra o achado na evidência.
- NS Lookup: consulta servidores de nome do domínio como parte do conector de domínio e cria vínculos de infraestrutura.
- E-mail DNS/MX Validation: valida formato, extrai domínio e verifica infraestrutura DNS/MX, sem buscar senhas ou vazamentos.
- crt.sh / Certificate Transparency: consulta certificados públicos, usa fallback público Cert Spotter quando crt.sh oscila e deduplica subdomínios.
- Username public sites: consulta lista controlada de URLs públicas com timeout e limite simples.

Observação: OpenStreetMap está implementado como camada visual de mapa, mas não é um conector de coleta OSINT neste MVP.

## Fontes preparadas para integração futura

- RDAP/WHOIS.
- Have I Been Pwned com chave de API, sem senhas.
- Empacotamento Electron.
- Geocodificação segura para converter endereços em coordenadas mediante política de uso compatível.

## Verificação do fluxo OSINT

Cada execução OSINT bem-sucedida passa pelo mesmo fluxo local: valida entrada, chama o conector, normaliza o resultado, salva evidência com fonte/data/URL/confiabilidade, cria ou reutiliza entidades, cria vínculos para o grafo, adiciona item de timeline e atualiza a tela de Fontes OSINT com a última consulta. O relatório HTML usa esses mesmos registros persistidos no SQLite local.

## Fontes proibidas ou não suportadas

- CPF.
- Senhas.
- Bases vazadas clandestinas.
- Dados privados.
- Dados protegidos por login.
- Scraping com bypass de captcha, paywall ou autenticação.
- Coleta que viole termos de uso, LGPD ou autorização do caso.

## Roadmap

- Empacotamento desktop com Electron.
- Exportação PDF assinável.
- Importação de evidências manuais com anexos.
- RDAP/WHOIS com campos redigidos preservados.
- Integração opcional com HIBP usando chave de API e sem exposição de senhas.
- Configuração editável de conectores e limites.
- Camada de auditoria por usuário local.

## Aviso de uso responsável

Use o NexusProfiling apenas para finalidades legais, proporcionais e autorizadas. Registre contexto, fonte e justificativa. Não utilize a ferramenta para perseguição, assédio, doxxing, invasão de privacidade ou qualquer atividade abusiva.
