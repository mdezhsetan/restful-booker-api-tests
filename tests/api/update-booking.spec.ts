import { test, expect, APIRequestContext } from '@playwright/test';
import { createApiContext, getTokenCookie } from './client';

function validBookingPayload() {
  return {
    firstname: 'Mahi',
    lastname: 'Tester',
    totalprice: 300,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-05-01',
      checkout: '2026-05-04',
    },
    additionalneeds: 'Dinner',
  };
}

async function createBooking(api: APIRequestContext) {
  const res = await api.post('/booking', {
    data: validBookingPayload(),
  });

  expect(res.status()).toBe(200); // 201 Created would be better

  const body = await res.json();
  return body.bookingid;
}

test('updates booking with valid token and only changes intended fields', async () => {
  const api = await createApiContext();

  const bookingId = await createBooking(api);

  const originalRes = await api.get(`/booking/${bookingId}`);
  const original = await originalRes.json();

  const updatePayload = {
    ...original,
    firstname: 'UpdatedName',
    totalprice: 999,
  };

  const updateRes = await api.put(`/booking/${bookingId}`, {
    data: updatePayload,
    headers: await getTokenCookie(api),
  });

  expect(updateRes.status()).toBe(200); // 201 would be better

  const updated = await updateRes.json();

  expect(updated).toEqual({
    ...original,
    firstname: 'UpdatedName',
    totalprice: 999,
  });
});

test('rejects update without authentication', async () => {
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

test('rejects update with invalid token', async () => {
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
