import { test, expect } from '@playwright/test';
import { createApiContext, createBooking } from './client';
import { validBookingPayload } from '../test-data';

test('retrieves existing booking by id @booking @positive', async () => {
  const api = await createApiContext();
  const payload = validBookingPayload();

  const bookingId = await createBooking(api);

  const res = await api.get(`/booking/${bookingId}`);

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

test('retrieves booking with explicit Accept header @booking @positive', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const res = await api.get(`/booking/${bookingId}`, {
    headers: { Accept: 'application/xml' },
  });

  expect(res.status()).toBe(200);
  const body = await res.text();

  expect(body).toContain("<?xml version='1.0'?>"); // Id is missing form the response body
  expect(body).toContain('<firstname>Mahi</firstname>');
});

test('returns not found for non-existing booking id @booking @negative', async () => {
  const api = await createApiContext();

  const nonExistingId = 999999999999;

  const res = await api.get(`/booking/${nonExistingId}`);

  expect(res.status()).toBe(404);
});

test('handles invalid id format safely @booking @negative', async () => {
  const api = await createApiContext();

  const res = await api.get(`/booking/abc`);
  expect(res.status()).toBe(404);

  const res2 = await api.get(`/booking/-1`);
  expect(res2.status()).toBe(404);
});

test('checks rate limit behavior under burst load @security @rate-limit', async () => {
  const api = await createApiContext();

  const requests = Array.from({ length: 30 }, () => api.get('/booking'));
  const responses = await Promise.all(requests);
  const statuses = responses.map((res) => res.status());

  const allAllowed = statuses.every(
    (status) => status === 200 || status === 429,
  );
  expect(allAllowed).toBe(true);
});
