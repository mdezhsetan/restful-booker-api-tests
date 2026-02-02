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

export function tokenCookie(token: string) {
  return { Cookie: `token=${token}` };
}

export async function expectJson(res: {
  headers: () => Promise<Record<string, string>>;
}) {
  const headers = await res.headers();
  const ct = headers['content-type']?.toLowerCase() ?? '';
  expect(ct).toContain('application/json');
}
