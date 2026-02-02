import { test, expect } from '@playwright/test';
import { createApiContext, getTokenCookie } from './client';
import { APIRequestContext } from '@playwright/test';

function validBookingPayload() {
  return {
    firstname: 'Mahi',
    lastname: 'Tester',
    totalprice: 400,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-06-01',
      checkout: '2026-06-04',
    },
    additionalneeds: 'None',
  };
}

async function createBooking(api: APIRequestContext) {
  const res = await api.post('/booking', {
    data: validBookingPayload(),
  });

  expect(res.status()).toBe(200); // 201 Created would be better

  const body = await res.json();
  return body.bookingid as number;
}

test('deletes booking with valid token and makes it inaccessible', async () => {
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

test('rejects delete without authentication', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const deleteRes = await api.delete(`/booking/${bookingId}`);

  expect(deleteRes.status()).toBe(403); // expected 401 Unauthorized

  // Booking should still exist
  const getRes = await api.get(`/booking/${bookingId}`);
  expect(getRes.status()).toBe(200);
});

test('rejects delete with invalid token', async () => {
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
