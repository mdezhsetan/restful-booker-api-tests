import { test, expect, APIRequestContext } from '@playwright/test';
import { createApiContext } from './client';

function validBookingPayload() {
  return {
    firstname: 'Mahi',
    lastname: 'Tester',
    totalprice: 200,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-04-01',
      checkout: '2026-04-03',
    },
    additionalneeds: 'Lunch',
  };
}

async function createBooking(api: APIRequestContext) {
  const res = await api.post('/booking', { data: validBookingPayload() });
  expect(res.status()).toBe(200); // 201 Created would be better
  const body = await res.json();
  return body as { bookingid: number; booking: object };
}

test('retrieves existing booking by id', async () => {
  const api = await createApiContext();
  const payload = validBookingPayload();

  const booking = await createBooking(api);

  const res = await api.get(`/booking/${booking.bookingid}`);

  expect(res.status()).toBe(200);

  const body = await res.json();
  expect(body).toEqual({
    firstname: payload.firstname,
    lastname: payload.lastname,
    totalprice: payload.totalprice,
    depositpaid: payload.depositpaid,
    bookingdates: {
      checkin: payload.bookingdates.checkin,
      checkout: payload.bookingdates.checkout,
    },
    additionalneeds: payload.additionalneeds,
  }); // Id is missing form the response body
});

test('retrieves booking with explicit Accept header', async () => {
  const api = await createApiContext();

  const booking = await createBooking(api);

  const res = await api.get(`/booking/${booking.bookingid}`, {
    headers: { Accept: 'application/xml' },
  });

  expect(res.status()).toBe(200);
  const body = await res.text();

  expect(body).toContain("<?xml version='1.0'?>"); // Id is missing form the response body
  expect(body).toContain('<firstname>Mahi</firstname>');
});

test('returns not found for non-existing booking id', async () => {
  const api = await createApiContext();

  const nonExistingId = 999999999999;

  const res = await api.get(`/booking/${nonExistingId}`);

  expect(res.status()).toBe(404);
});

test('handles invalid id format safely', async () => {
  const api = await createApiContext();

  const res = await api.get(`/booking/abc`);
  expect(res.status()).toBe(404);

  const res2 = await api.get(`/booking/-1`);
  expect(res2.status()).toBe(404);
});
