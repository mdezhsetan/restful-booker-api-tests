import { APIRequestContext, expect, request } from '@playwright/test';

export async function createApiContext(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

export async function login() {
  const api = await createApiContext();

  const authRes = await api.post('/auth', {
    data: {
      username: process.env.VALID_USER_NAME,
      password: process.env.VALID_PASSWORD,
    },
  });
  expect(authRes.status()).toBe(200);
  const authBody = await authRes.json();
  const token = authBody.token;
  return token;
}

export async function expectJson(res: {
  headers: () => Promise<Record<string, string>>;
}) {
  const headers = await res.headers();
  const ct = headers['content-type']?.toLowerCase() ?? '';
  expect(ct).toContain('application/json');
}
