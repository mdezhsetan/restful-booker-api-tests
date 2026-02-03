import { test, expect } from '@playwright/test';
import { createApiContext, getTokenCookie, createBooking } from './client';

test('deletes booking with valid token and makes it inaccessible @booking @positive', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);
  const tokenCookie = await getTokenCookie(api);

  const deleteRes = await api.delete(`/booking/${bookingId}`, {
    headers: tokenCookie,
  });

  expect(deleteRes.status()).toBe(201); // 204 would be better
  //expect(await deleteRes.text()).toBe(''); //it returns 'Created' text

  const getRes = await api.get(`/booking/${bookingId}`);

  expect(getRes.status()).toBe(404);
});

test('rejects delete without authentication @booking @security @negative', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const deleteRes = await api.delete(`/booking/${bookingId}`);

  expect(deleteRes.status()).toBe(403); // expected 401 Unauthorized

  // Booking should still exist
  const getRes = await api.get(`/booking/${bookingId}`);
  expect(getRes.status()).toBe(200);
});

test('rejects delete with invalid token @booking @security @negative', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const deleteRes = await api.delete(`/booking/${bookingId}`, {
    headers: { Cookie: `token=invalid-token` },
  });

  expect(deleteRes.status()).toBe(403); // expected 401 Unauthorized

  // Booking should still exist
  const getRes = await api.get(`/booking/${bookingId}`);
  expect(getRes.status()).toBe(200);
});
