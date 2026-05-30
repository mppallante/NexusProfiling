# Arquitetura

NexusProfiling usa uma arquitetura local first:

- `src/pages`: telas da aplicação.
- `src/components`: componentes reutilizáveis de interface.
- `src/services`: cliente HTTP do front-end e serviços de backend.
- `src/connectors`: conectores OSINT padronizados.
- `src/database`: schema, migração, seed e repositório SQLite.
- `src/types`: contratos compartilhados.
- `src/utils`: validação, HTTP com timeout, rate limit simples e IDs.
- `src/server`: API Express local.

## Fluxo OSINT

1. O usuário escolhe o tipo e informa o valor no detalhe do caso.
2. A API valida o payload.
3. O serviço local seleciona o conector.
4. O conector aplica validação, timeout e normalização.
5. O resultado é salvo como evidência com fonte, URL, data/hora, tipo, confiança e observação legal.
6. Entidades e vínculos são criados automaticamente a partir do resultado normalizado.
7. Logs locais são registrados.
8. Estatísticas, grafo, timeline, relatório e fontes são atualizados.

## Interface de conector

Cada conector expõe:

- `name`.
- `type`.
- `requiresApiKey`.
- `run(input)`.
- `normalizeResult(raw, input)`.
- `legalNotice`.
- `timeoutMs`.

## Banco local

O SQLite fica em `data/nexus-profiling.sqlite`. A pasta `data` é ignorada pelo Git para evitar versionar evidências locais.

## Fontes futuras

RDAP/WHOIS e Have I Been Pwned aparecem documentados e catalogados para integração futura. Eles não executam coleta automática neste MVP. HIBP deve exigir chave de API e nunca deve consultar ou exibir senhas.
