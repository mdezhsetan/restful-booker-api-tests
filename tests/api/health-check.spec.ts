import { test, expect } from '@playwright/test';
import { createApiContext } from './client';

test('health check @smoke', async () => {
  const api = await createApiContext();
  const res = await api.get('/ping');
  expect(res.status()).toBe(201); //expected to be 200
});
