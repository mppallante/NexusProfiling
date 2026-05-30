# Fontes OSINT

| Fonte | Tipo de dado | URL/documentação | Automática | Requer chave | Status | Observação legal |
| --- | --- | --- | --- | --- | --- | --- |
| BrasilAPI CNPJ | Registro público empresarial | https://brasilapi.com.br/docs#tag/CNPJ | Sim | Não | Implementada | Consulta dados públicos de pessoa jurídica, sem CPF. |
| ViaCEP | CEP e endereço público | https://viacep.com.br/ | Sim | Não | Implementada | Retorna endereço por CEP, sem identificar morador. |
| DNS Lookup | Infraestrutura pública | https://nodejs.org/api/dns.html | Sim | Não | Implementada | Consulta registros técnicos publicados no DNS. |
| MX Lookup | Infraestrutura de e-mail | https://nodejs.org/api/dns.html#dnspromisesresolvemxhostname | Sim | Não | Implementada | Consulta servidores de e-mail publicados para o domínio. |
| TXT Lookup | Políticas e registros públicos | https://nodejs.org/api/dns.html#dnspromisesresolvetxthostname | Sim | Não | Implementada | Consulta registros TXT publicados, como SPF/DMARC quando existentes. |
| NS Lookup | Servidores autoritativos | https://nodejs.org/api/dns.html#dnspromisesresolvenshostname | Sim | Não | Implementada | Consulta nameservers publicados no DNS. |
| E-mail DNS/MX Validation | Validação técnica de e-mail | https://nodejs.org/api/dns.html#dnspromisesresolvemxhostname | Sim | Não | Implementada | Valida formato e infraestrutura DNS/MX; não confirma caixa postal e não consulta senha ou vazamento. |
| RDAP/WHOIS | Registro de domínio | https://www.rdap.org/ | Não | Não | Futura | Deve respeitar campos redigidos e limites por registrador. |
| crt.sh / Certificate Transparency | Certificados e subdomínios públicos | https://crt.sh/ e https://sslmate.com/blog/post/certspotter_apiv1 | Sim | Não | Implementada | Usa logs públicos de transparência de certificados; quando crt.sh falha, usa fallback público Cert Spotter. |
| OpenStreetMap | Visualização cartográfica | https://www.openstreetmap.org/copyright | Sim | Não | Implementada | Camada visual de mapa; não é conector de coleta OSINT. |
| Have I Been Pwned | Exposição de contas | https://haveibeenpwned.com/API/v3 | Não | Sim | Opcional/Futura | Somente integração futura com chave de API; não consultar ou exibir senhas. |
| Username public sites | Presença pública por username | Lista controlada no código | Sim | Não | Implementada | Verifica apenas URLs públicas, sem login, perfis privados ou bypass. |

## Fontes implementadas neste MVP

Estas são as fontes automáticas que funcionam de verdade no MVP e salvam resultados como evidências quando executadas:

- BrasilAPI CNPJ.
- ViaCEP.
- DNS Lookup.
- MX Lookup.
- TXT Lookup.
- NS Lookup.
- E-mail DNS/MX Validation.
- crt.sh / Certificate Transparency.
- Username public sites.

Camada visual implementada, sem coleta OSINT própria:

- OpenStreetMap.

## Fontes preparadas para integração futura

- RDAP/WHOIS.
- Have I Been Pwned com chave de API, sem senhas.
- Geocodificação segura para endereços quando houver política de uso compatível.

## Fontes proibidas ou não suportadas

- CPF.
- Senhas.
- Bases vazadas clandestinas.
- Dados privados.
- Dados protegidos por login.
- Scraping com bypass.
- Bypass de captcha, paywall ou autenticação.
