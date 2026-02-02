import { test, expect } from '@playwright/test';
import { createApiContext, getTokenCookie } from './client';
import { validBookingPayload } from '../test-data';

test('auth → create → get → update → get → delete → verify deleted', async () => {
  const api = await createApiContext();

  // 1️ AUTH
  const tokenCookie = await getTokenCookie(api);

  // 2️ CREATE
  const createPayload = validBookingPayload();

  const createRes = await api.post('/booking', {
    data: createPayload,
  });

  expect(createRes.status()).toBe(200);

  const createBody = await createRes.json();

  const bookingId = createBody.bookingid;

  expect(typeof bookingId).toBe('number');

  // 3️ GET (verify persistence)
  const getRes1 = await api.get(`/booking/${bookingId}`);
  expect(getRes1.status()).toBe(200);

  const booking1 = await getRes1.json();

  expect(booking1.firstname).toBe(createPayload.firstname);
  expect(booking1.lastname).toBe(createPayload.lastname);
  expect(booking1.totalprice).toBe(createPayload.totalprice);

  // 4️ UPDATE
  const updatePayload = {
    ...booking1,
    firstname: 'LifecycleUpdated',
    totalprice: 999,
  };

  const updateRes = await api.put(`/booking/${bookingId}`, {
    data: updatePayload,
    headers: tokenCookie,
  });

  expect(updateRes.status()).toBe(200);

  // 5️ GET AGAIN (verify update)
  const getRes2 = await api.get(`/booking/${bookingId}`);
  expect(getRes2.status()).toBe(200);

  const booking2 = await getRes2.json();

  expect(booking2).toEqual({
    ...booking1,
    firstname: 'LifecycleUpdated',
    totalprice: 999,
  });

  // 6️ DELETE
  const deleteRes = await api.delete(`/booking/${bookingId}`, {
    headers: tokenCookie,
  });
  expect(deleteRes.status()).toBe(201);

  // 7️ VERIFY DELETED
  const getRes3 = await api.get(`/booking/${bookingId}`);

  expect(getRes3.status()).toBe(404);
});
