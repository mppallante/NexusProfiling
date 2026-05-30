export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeCnpj(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos.');
  }
  return digits;
}

export function normalizeCep(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos.');
  }
  return digits;
}

export function validateDomain(value: string): string {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domainRegex = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
  if (!domainRegex.test(domain)) {
    throw new Error('Domínio inválido.');
  }
  return domain;
}

export function validateEmail(value: string): string {
  const email = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('E-mail inválido.');
  }
  return email;
}

export function validateUsername(value: string): string {
  const username = value.trim().replace(/^@/, '');
  if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(username)) {
    throw new Error('Username deve ter 2 a 40 caracteres e usar apenas letras, números, ponto, hífen ou underscore.');
  }
  return username;
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1];
}
