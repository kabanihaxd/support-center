/**
 * Простой синхронный хэш пароля для MOCK-бэкенда (FNV-1a, 2 прохода с солью).
 * Это не криптографическая защита: он нужен лишь для того, чтобы не хранить пароли
 * демо-аккаунтов в localStorage открытым текстом. В продакшене пароли хранит Firebase Auth.
 */
export function hashPassword(password: string, salt: string): string {
  const input = `${salt}:${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export interface StoredCredential {
  userId: string;
  email: string;
  salt: string;
  hash: string;
}

export function createCredential(userId: string, email: string, password: string, salt: string): StoredCredential {
  return { userId, email: email.trim().toLowerCase(), salt, hash: hashPassword(password, salt) };
}

export function verifyCredential(credential: StoredCredential, password: string): boolean {
  return hashPassword(password, credential.salt) === credential.hash;
}
