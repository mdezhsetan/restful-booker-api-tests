import { APIRequestContext, expect, request } from '@playwright/test';
import { validBookingPayload } from '../test-data';

export async function createApiContext(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

export async function getTokenCookie(
  api: APIRequestContext,
): Promise<{ [key: string]: string }> {
  const authRes = await api.post('/auth', {
    data: {
      username: process.env.VALID_USER_NAME,
      password: process.env.VALID_PASSWORD,
    },
  });
  expect(authRes.status()).toBe(200);
  const authBody = await authRes.json();
  const token = authBody.token;
  return { Cookie: `token=${token}` };
}

export async function createBooking(api: APIRequestContext): Promise<number> {
  const res = await api.post('/booking', {
    data: validBookingPayload(),
  });

  expect(res.status()).toBe(200); // 201 Created would be better

  const body = await res.json();
  return body.bookingid as number;
}
