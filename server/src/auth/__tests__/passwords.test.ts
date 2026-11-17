import { describe, expect, it } from 'vitest';

import { hashPassword, verificarPassword } from '../passwords';
import type { PasswordHashData } from '../passwords';

describe('passwords', () => {
  it('hashea y verifica una contraseña correcta', async () => {
    const hash: PasswordHashData = await hashPassword('secreto123');
    expect(hash.salt).toBeTruthy();
    expect(hash.hash).toBeTruthy();
    expect(await verificarPassword('secreto123', hash)).toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashPassword('secreto123');
    expect(await verificarPassword('otra-cosa', hash)).toBe(false);
  });
});
