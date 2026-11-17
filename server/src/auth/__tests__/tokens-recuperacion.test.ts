import { describe, expect, it } from 'vitest';

import { crearTokenRecuperacion, hashToken } from '../tokens-recuperacion';

describe('tokens-recuperacion', () => {
  it('crea un token y su hash', () => {
    const { token, expiraEn } = crearTokenRecuperacion();
    expect(token.length).toBeGreaterThan(0);
    expect(expiraEn).toBeGreaterThan(Date.now());
    expect(hashToken(token)).toBeTruthy();
  });
});
