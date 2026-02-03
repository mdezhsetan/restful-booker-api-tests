import { test, expect } from '@playwright/test';
import { createApiContext, getTokenCookie, createBooking } from './client';

test('updates booking with valid token and only changes intended fields @booking @positive', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const originalRes = await api.get(`/booking/${bookingId}`);
  const original = await originalRes.json();

  const updatePayload = {
    ...original,
    firstname: 'UpdatedName',
    totalprice: 999,
  };
  const tokenCookie = await getTokenCookie(api);
  const updateRes = await api.put(`/booking/${bookingId}`, {
    data: updatePayload,

    headers: tokenCookie,
  });

  expect(updateRes.status()).toBe(200); // 201 would be better

  const updated = await updateRes.json();

  expect(updated).toEqual({
    ...original,
    firstname: 'UpdatedName',
    totalprice: 999,
  });
});

test('rejects update without authentication @booking @security @negative', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const originalRes = await api.get(`/booking/${bookingId}`);
  const original = await originalRes.json();

  const updatePayload = {
    ...original,
    firstname: 'HackerChange',
  };

  const res = await api.put(`/booking/${bookingId}`, {
    data: updatePayload,
  });
  expect(res.status()).toBe(403); // expected 401 Unauthorized

  // Verify booking unchanged
  const afterRes = await api.get(`/booking/${bookingId}`);
  const after = await afterRes.json();

  expect(after.firstname).toBe(original.firstname);
});

test('rejects update with invalid token @booking @security @negative', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const originalRes = await api.get(`/booking/${bookingId}`);
  const original = await originalRes.json();

  const updatePayload = {
    ...original,
    firstname: 'InvalidTokenChange',
  };

  const res = await api.put(`/booking/${bookingId}`, {
    data: updatePayload,
    headers: { Cookie: `token=invalid-token` },
  });

  expect(res.status()).toBe(403); // expected 401 Unauthorized

  // Verify booking unchanged
  const afterRes = await api.get(`/booking/${bookingId}`);
  const after = await afterRes.json();

  expect(after.firstname).toBe(original.firstname);
});
