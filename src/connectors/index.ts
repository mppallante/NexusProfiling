import type { OsintInputType } from '../types/domain';
import type { OsintConnector } from '../types/connectors';
import { cepConnector } from './cepConnector';
import { cnpjConnector } from './cnpjConnector';
import { domainConnector } from './domainConnector';
import { emailConnector } from './emailConnector';
import { usernameConnector } from './usernameConnector';

export const connectorsByType: Record<OsintInputType, OsintConnector> = {
  cnpj: cnpjConnector,
  cep: cepConnector,
  domain: domainConnector,
  email: emailConnector,
  username: usernameConnector
};

export { certificateTransparencyConnector } from './certificateTransparencyConnector';
export { sourceCatalog } from './sourceCatalog';
