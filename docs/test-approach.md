# API Test Approach — Restful Booker

**Base URL:** `https://restful-booker.herokuapp.com`  
**Framework:** Playwright Test (TypeScript)  
**Test Execution Date:** February 3, 2026

## Overview

This test suite provides comprehensive API testing coverage for the Restful Booker API with 21 automated test cases across 6 test files. All tests are written in TypeScript using Playwright Test framework.

**Key Achievements:**
- ✅ 21 comprehensive test cases covering all CRUD operations
- ✅ Centralized test data and helper functions for maintainability
- ✅ 3 critical bugs discovered and documented
- ✅ 7 API inconsistencies identified with HTTP status codes
- ✅ Complete end-to-end lifecycle validation
 - ✅ Tagged tests for fast filtering (smoke, security, positive/negative)

## Test Principles

- **Self-contained tests:** Each test creates its own test data and cleans up when needed
- **No test dependencies:** Tests can run independently and in any order
- **Data-driven:** Centralized test data management using shared fixtures
- **Reusable patterns:** Common operations (auth, booking creation) are extracted into helper functions
- **Comprehensive assertions:** Verify status codes, response structure, and business logic

## Project Structure

```text
tests/
├── api/
│   ├── auth.spec.ts                 # Authentication tests
│   ├── booking-lifecycle.spec.ts    # End-to-end lifecycle test
│   ├── client.ts                    # API client and auth helpers
│   ├── create-booking.spec.ts       # Booking creation tests
│   ├── delete-booking.spec.ts       # Booking deletion tests
│   ├── health-check.spec.ts         # API health check test
│   ├── retrieve-booking.spec.ts     # Booking retrieval tests
│   └── update-booking.spec.ts       # Booking update tests
└── test-data.ts                     # Centralized test data fixtures
```

## Test Data Management

All test data is centralized in `tests/test-data.ts` using the `validBookingPayload()` function. This approach:
- Eliminates duplication across test files
- Provides a single source of truth for test data
- Makes maintenance easier when payload structure changes
- Ensures consistency across all tests

## Implemented Test Coverage

### 1. Health Check (`health-check.spec.ts`)
**1 test**
- ✅ API responds successfully to health check ping

**API Quirk Noted:**
- Expected: 200 OK
- Actual: 201 Created

---

### 2. Authentication (`auth.spec.ts`)
**2 tests**

**Endpoint:** `POST /auth`

**Positive Scenarios:**
- ✅ Valid credentials (admin/password123) return authentication token

**Negative Scenarios:**
- ✅ Invalid credentials return error response (no token)

**API Quirk Noted:**
- Expected: 401 Unauthorized for invalid credentials
- Actual: 200 OK with error message

---

### 3. Create Booking (`create-booking.spec.ts`)
**6 tests**

**Endpoint:** `POST /booking`

**Positive Scenarios:**
- ✅ Create booking with valid payload
  - Asserts: bookingid returned, booking data matches payload
- ✅ Create booking with depositpaid=false variation
  - Asserts: boolean field variation is persisted correctly

**Negative Scenarios:**
- ✅ Reject malformed JSON
  - Asserts: 400 Bad Request (tests parsing layer)
- ⚠️ Reject invalid payload (missing firstname)
  - **BUG FOUND:** Returns 500 Internal Server Error instead of 400 Bad Request
  - Test exists but assertion is commented out pending bug fix

**Security / Boundary Scenarios:**
- ✅ Create booking without authentication token (public endpoint)
  - Asserts: 200 OK and bookingid returned
- ✅ Very long values are handled safely (boundary test)
  - Asserts: 200/400/413 acceptable, never 500

**Design Note:** Malformed JSON and validation tests are separated because they test different layers: JSON parsing vs. business validation.

**API Quirks Noted:**
- Expected: 201 Created for successful booking creation
- Actual: 200 OK
- **BUG:** Missing required field causes 500 error instead of validation error

---

### 4. Retrieve Booking (`retrieve-booking.spec.ts`)
**5 tests**

**Endpoint:** `GET /booking/:id`

**Positive Scenarios:**
- ✅ Retrieve existing booking by ID
  - Asserts: 200 OK, all fields match created payload
  - **BUG FOUND:** Booking ID is missing from the response body
- ✅ Retrieve booking with Accept: application/xml header
  - Asserts: 200 OK, response structure (API returns JSON despite XML request)
  - **BUG FOUND:** Booking ID is also missing from XML response

**Negative Scenarios:**
- ✅ Non-existing booking ID returns 404
  - Asserts: 404 Not Found, appropriate error message
- ✅ Invalid ID format (abc) returns safe error
  - Asserts: 404 Not Found, never 500 Internal Server Error

**Security / Non-functional Scenarios:**
- ✅ Burst load rate-limit check
  - Asserts: responses are 200 or 429 (no 5xx)

---

### 5. Update Booking (`update-booking.spec.ts`)
**4 tests**

**Endpoint:** `PUT /booking/:id` (requires authentication)

**Positive Scenarios:**
- ✅ Update booking with token authentication
  - Asserts: 200 OK, changed fields updated, unchanged fields preserved
- ✅ Update booking with Basic Auth (admin/password123)
  - Asserts: 200 OK, persisted changes verified with GET

**Negative Scenarios:**
- ✅ Update without authentication is blocked
  - Asserts: 403 Forbidden, booking remains unchanged
- ✅ Update with invalid token is blocked
  - Asserts: 403 Forbidden, booking remains unchanged

**API Quirks Noted:**
- Expected: 401 Unauthorized for missing/invalid auth
- Actual: 403 Forbidden

---

### 6. Delete Booking (`delete-booking.spec.ts`)
**3 tests**

**Endpoint:** `DELETE /booking/:id` (requires authentication)

**Positive Scenarios:**
- ✅ Delete booking with token authentication
  - Asserts: 201 Created (unusual), subsequent GET returns 404
- ✅ Delete booking with Basic Auth
  - Asserts: 201 Created, resource no longer accessible

**Negative Scenarios:**
- ✅ Delete without authentication is blocked
  - Asserts: 403 Forbidden, booking still exists
- ✅ Delete with invalid token is blocked
  - Asserts: 403 Forbidden, booking still exists

**API Quirks Noted:**
- Expected: 204 No Content for successful deletion
- Actual: 201 Created
- **BUG:** Response body returns text "Created" instead of empty body
- Expected: 401 Unauthorized for missing/invalid auth
- Actual: 403 Forbidden

---

### 7. End-to-End Lifecycle (`booking-lifecycle.spec.ts`)
**1 comprehensive test**

**Complete booking lifecycle:**
1. ✅ Authenticate and obtain token
2. ✅ Create new booking
3. ✅ Retrieve and verify created booking
4. ✅ Update booking with new data
5. ✅ Retrieve and verify updated booking
6. ✅ Delete booking
7. ✅ Verify booking is deleted (404 on GET)

This test validates the complete user journey and integration between all endpoints.

---

## API Status Code Observations

The API has several non-standard HTTP status code implementations that are documented in the test comments:

| Endpoint | Expected | Actual | Notes |
|----------|----------|--------|-------|
| `GET /ping` | 200 OK | 201 Created | Health check should return 200 |
| `POST /auth` (invalid) | 401 Unauthorized | 200 OK | Should use proper 401 for auth failures |
| `POST /booking` | 201 Created | 200 OK | Resource creation should return 201 |
| `PUT /booking/:id` (no auth) | 401 Unauthorized | 403 Forbidden | 401 is more appropriate for missing auth |
| `DELETE /booking/:id` | 204 No Content | 201 Created | Deletion should return 204 or 200, not 201 |
| `DELETE /booking/:id` (no auth) | 401 Unauthorized | 403 Forbidden | 401 is more appropriate for missing auth |

**Note:** These status code discrepancies are documented but tests are written to match actual API behavior to ensure test reliability.

---

## Reusable Components

### API Client (`client.ts`)
- `createApiContext()`: Creates authenticated API request context with base URL
- `getTokenCookie(api)`: Authenticates and returns token cookie for protected operations
- `createBooking(api)`: Creates a booking and returns the bookingId (extracted from duplicate implementations)

### Test Data (`test-data.ts`)
- `validBookingPayload()`: Returns standardized booking payload used across all tests
- Single source of truth eliminates duplicate function definitions

### Refactoring Benefits
The `createBooking()` helper was duplicated across 3 test files (retrieve, update, delete specs). Moving it to `client.ts` provides:
- Single implementation to maintain
- Consistent booking creation behavior
- Reduced code duplication by ~30 lines
- Centralized assertion for creation status code

---

## Bugs Found

During testing, several bugs and API inconsistencies were discovered:

### 🐛 Bug #1: Missing Booking ID in GET Response
**Endpoint:** `GET /booking/:id`  
**Severity:** Medium  
**Description:** The booking ID is missing from the response body when retrieving a booking.
- When calling `GET /booking/{id}`, the response includes all booking fields (firstname, lastname, etc.) but does not include the `id` field itself
- This makes it difficult to confirm which booking was retrieved without relying solely on the URL parameter
- Noted in both JSON and XML response formats

**Expected Behavior:** Response should include:
```json
{
  "id": 123,
  "firstname": "Mahi",
  "lastname": "Tester",
  ...
}
```

**Actual Behavior:** Response only contains booking fields without the ID

---

### 🐛 Bug #2: Server Error on Missing Required Field
**Endpoint:** `POST /booking`  
**Severity:** High  
**Description:** API returns 500 Internal Server Error instead of 400 Bad Request when required fields are missing.
- When creating a booking without the `firstname` field, the API crashes with a 500 error
- This indicates improper validation handling on the server side

**Expected Behavior:** 
- Status: 400 Bad Request
- Response body should explain the validation error (e.g., "firstname is required")

**Actual Behavior:** 
- Status: 500 Internal Server Error
- Server fails to handle the validation gracefully

**Test Implementation:** Test is currently commented out with note: `// currently returns 500`

**Impact:** 
- Poor user experience
- No clear indication of what went wrong
- Server errors for client validation issues
- Security concern: stack traces might be exposed

---

### 🐛 Bug #3: DELETE Returns 201 Created
**Endpoint:** `DELETE /booking/:id`  
**Severity:** Low  
**Description:** Successful deletion returns `201 Created` status code and response body contains the text "Created".

**Expected Behavior:** 
- Status: 204 No Content (preferred) or 200 OK
- Response body: Empty

**Actual Behavior:**
- Status: 201 Created
- Response body: "Created" (text)

**Impact:** Confusing semantics - "Created" status for a deletion operation violates REST conventions

---

### 📊 API Inconsistencies Summary

| Issue | Endpoint | Expected | Actual | Severity |
|-------|----------|----------|--------|----------|
| Missing ID in response | `GET /booking/:id` | Include booking ID | ID not included | Medium |
| Server error on validation | `POST /booking` (no firstname) | 400 Bad Request | 500 Internal Server Error | High |
| Wrong status on creation | `POST /booking` | 201 Created | 200 OK | Low |
| Wrong status on deletion | `DELETE /booking/:id` | 204 No Content | 201 Created | Low |
| Wrong auth error code | `PUT/DELETE` (no auth) | 401 Unauthorized | 403 Forbidden | Low |
| Wrong auth error code | `POST /auth` (invalid creds) | 401 Unauthorized | 200 OK | Low |
| Wrong status on health | `GET /ping` | 200 OK | 201 Created | Low |

---

## Test Execution

**Total Tests:** 21  
**Status:** All passing ✅  
**Execution Time:** ~2.8 seconds  
**Workers:** 5 (parallel execution)

**Breakdown:**
- Health Check: 1
- Authentication: 2
- Create Booking: 6
- Retrieve Booking: 5
- Update Booking: 3
- Delete Booking: 3
- End-to-End Lifecycle: 1

**Run command:**
```bash
npx playwright test
```

**View report:**
```bash
npx playwright show-report
```

---

## Key Implementation Decisions

1. **Centralized Test Data:** Moved `validBookingPayload()` from individual spec files to `tests/test-data.ts` for maintainability and consistency

2. **Separated Test Concerns:** 
   - Malformed JSON tests (parsing layer)
   - Invalid payload tests (validation layer)
   - Authentication tests (security layer)

3. **Real-World Status Code Handling:** Tests accept actual API responses (even non-standard) with inline comments explaining expected vs. actual behavior

4. **Self-Sufficient Tests:** Each test creates its own booking data rather than depending on pre-existing data

5. **Helper Function Reuse:** Common operations like authentication and booking creation are extracted to reduce duplication

6. **Tagging Strategy:** Tests use tags like `@smoke`, `@security`, `@positive`, `@negative`, and `@boundary` to enable targeted runs (e.g., `--grep @security`).

---

## Future Enhancements

- Add performance testing for response times
- Expand negative test coverage
- Add contract testing to validate response schema stability
- Add load testing scenarios