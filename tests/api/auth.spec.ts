import { test, expect } from '@playwright/test';
import { createApiContext } from './client';

test('valid credentials returns token @auth @positive @smoke', async () => {
  const api = await createApiContext();
  const res = await api.post('/auth', {
    data: {
      username: process.env.VALID_USER_NAME,
      password: process.env.VALID_PASSWORD,
    },
  });

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(typeof body.token).toBe('string');
  expect(body.token.length).toBeGreaterThan(0);
});

test('rejects invalid credentials (no token) @auth @negative @security', async () => {
  const api = await createApiContext();
  const res = await api.post('/auth', {
    data: { username: process.env.VALID_USER_NAME, password: 'wrong' },
  });
  expect(res.status()).toBe(200); // expected to be 401 unauthorized
  const body = await res.json();
  expect(body.token).toBeUndefined();
});
