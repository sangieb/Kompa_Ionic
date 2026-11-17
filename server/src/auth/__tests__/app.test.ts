import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { crearApp } from '../../index';

describe('API de autenticación', () => {
  const app = crearApp();

  it('devuelve 404 para rutas no existentes', async () => {
    const response = await request(app).get('/no-existe');
    expect(response.status).toBe(404);
  });
});
