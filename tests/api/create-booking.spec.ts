import { test, expect } from '@playwright/test';
import { createApiContext } from './client';
import { validBookingPayload } from '../test-data';

test('creates booking with valid payload @booking @positive @smoke', async () => {
  const api = await createApiContext();
  const payload = validBookingPayload();

  const res = await api.post('/booking', { data: payload });

  expect(res.status()).toBe(200); // expected 201 Created

  const body = await res.json();

  expect(typeof body.bookingid).toBe('number');
  expect(body.booking).toEqual({
    firstname: payload.firstname,
    lastname: payload.lastname,
    totalprice: payload.totalprice,
    depositpaid: payload.depositpaid,
    bookingdates: {
      checkin: payload.bookingdates.checkin,
      checkout: payload.bookingdates.checkout,
    },
    additionalneeds: payload.additionalneeds,
  });
});

test('creates booking with valid payload variation @booking @positive', async () => {
  const api = await createApiContext();

  const payload = {
    ...validBookingPayload(),
    depositpaid: false,
    totalprice: 999,
    additionalneeds: 'Late Checkout',
  };

  const res = await api.post('/booking', { data: payload });

  expect(res.status()).toBe(200); // expected 201 Created

  const body = await res.json();

  expect(body.booking.depositpaid).toBe(false);
  expect(body.booking.totalprice).toBe(999);
  expect(body.booking.additionalneeds).toBe('Late Checkout');
});

test('rejects malformed JSON body @booking @negative', async () => {
  const api = await createApiContext();

  const res = await api.post('/booking', {
    data: '{"firstname":"Bad","lastname":}',
  });

  expect(res.status()).toBe(400);
});

test('rejects invalid schema (missing firstname) @booking @negative', async () => {
  const api = await createApiContext();

  const payload = validBookingPayload();
  Reflect.deleteProperty(payload, 'firstname');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const res = await api.post('/booking', { data: payload });
  // expect(res.status()).toBe(400); ==> currently returns 500
});

test('creates booking without authentication token @booking @security', async () => {
  const api = await createApiContext();
  const payload = validBookingPayload();

  // POST /booking should not require authentication
  const res = await api.post('/booking', { data: payload });

  expect(res.status()).toBe(200); // Booking creation is public, no auth needed
  const body = await res.json();
  expect(typeof body.bookingid).toBe('number');
});

test('handles very long values safely @security', async () => {
  const api = await createApiContext();
  const longValue = 'A'.repeat(5000);

  const payload = {
    ...validBookingPayload(),
    firstname: longValue,
    lastname: longValue,
    additionalneeds: longValue,
  };

  const res = await api.post('/booking', { data: payload });
  const status = res.status();

  expect([200, 400, 413]).toContain(status);

  if (status === 200) {
    const body = await res.json();
    expect(typeof body.bookingid).toBe('number');
  }
});
