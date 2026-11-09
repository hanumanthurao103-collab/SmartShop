# SmartShop â€“ Threat Model and Security Tests

## 1. Purpose

This document identifies security risks in SmartShop, the protections implemented so far, and tests used to verify those protections.

## 2. Assets to Protect

- Customer names, email addresses, and password hashes
- Authentication tokens
- Product information and stock values
- Customer order information
- Admin-only product management operations
- MongoDB credentials and application secrets
- Security and audit records

## 3. Threats and Mitigations

| Threat | Potential Impact | Mitigation | Current Status |
|---|---|---|---|
| Unauthenticated product creation | Unauthorized changes to the catalogue | JWT authentication middleware | Implemented and tested |
| Customer accessing admin operations | Customers could create or modify products | Admin role authorization | Implemented and tested |
| Weak password storage | Exposure of customer passwords | bcrypt password hashing | Implemented; database hash verification pending |
| Invalid product input | Invalid or inconsistent database records | Server-side input validation | Implemented and tested |
| Forged or expired JWT | Unauthorized access | JWT signature and expiry verification | Implemented and tested |
| Duplicate customer registration | Duplicate accounts | Email normalization and uniqueness constraint | Implemented |
| Sensitive configuration exposure | Database or token compromise | Environment variables and Git ignore rules | Implemented; further review required |
| Excessive login attempts | Account access attempts at scale | Login rate limiting | Planned |
| Missing audit trail | Difficulty investigating administrative actions | Record important administrative events | Implemented and tested |
| Unauthorized order access | Exposure of another customer's orders | Filter customer order history by authenticated user ID and restrict admin routes by role | Implemented and tested |
| Concurrent order requests | Overselling or incorrect stock values | Atomically reserve or decrement stock and roll back if order creation fails | Planned |

## 4. Security Tests

### Test 1: Unauthenticated Product Creation

- Request: POST `/api/products` without an Authorization header.
- Expected: HTTP 401 Unauthorized.
- Observed: `Authentication required`.
- Result: Passed.

### Test 2: Customer Attempts Admin Operation

- Request: POST `/api/products` using a valid customer JWT.
- Expected: HTTP 403 Forbidden.
- Observed: `Admin access required`.
- Result: Passed.

### Test 3: Invalid or Expired JWT

- Request: Access a protected endpoint with an invalid token.
- Expected: HTTP 401 Unauthorized.
- Observed: `Invalid or expired token`.
- Result: Passed.

### Test 4: Password Hashing

- Action: Registered a separate test customer.
- Expected: The original password is hashed before database storage and is never returned by the registration API.
- Observed: Registration succeeded. The API response returned user details without a password field. Source code uses `bcrypt.hash(password, 12)`.
- Result: Registration and response checks passed; database hash verification pending.

### Test 5: Invalid Product Data

- Action: Sent a product creation request using an authenticated admin token with `price = -100`.
- Expected: HTTP 400 with `Invalid product data`.
- Observed: HTTP 400 with `Invalid product data`.
- Result: Passed.

### Test 6: Customer Order Ownership and Isolation

- Action 1: Created an order using the first customer account.
- Expected: The authenticated customer can retrieve their own order.
- Observed: The order was returned with quantity 2 and total amount 1198.
- Result: Passed.

- Action 2: Logged in using a second customer account and requested order history.
- Expected: The second customer must not see the first customer's orders.
- Observed: The second customer's order count was 0.
- Result: Passed.

- Action 3: Attempted to access the admin all-orders endpoint using a customer JWT.
- Expected: HTTP 403 Forbidden.
- Observed: `Admin access required`.
- Result: Passed.

### Test 7: Audit Trail

- Action: Created a product using an authenticated admin account.
- Expected: Product creation succeeds and an audit log is recorded.
- Observed: API returned `auditLogRecorded: true`.
- Result: Passed.

## 5. Security Development Priorities

1. Implement atomic stock deduction and prevent overselling during concurrent order creation.
2. Add login rate limiting to reduce excessive login attempts.
3. Verify password hashes directly in the database and improve duplicate-registration error handling.
4. Review database permissions and environment configuration.
5. Add automated API tests and review error handling.

## 6. Review

This threat model will be updated as SmartShop development progresses. Security tests will be recorded with their actual actions, expected results, observed results, and pass or pending status.
### Test 8: Order Stock Deduction and Transaction Rollback

- Action 1: Created an order for one Wireless Mouse.
- Expected: Order succeeds and stock decreases from 25 to 24.
- Observed: Order succeeded and stock decreased to 24.
- Result: Passed.

- Action 2: Requested 4 units of Audit Verification Product when stock was 3.
- Expected: HTTP 400 and stock remains unchanged.
- Observed: HTTP 400; stock remained 3.
- Result: Passed.

- Action 3: Submitted an order containing one Wireless Mouse and 4 units of Audit Verification Product.
- Expected: The order fails and all stock updates in the transaction are rolled back.
- Observed: HTTP 400; Wireless Mouse remained at 24 and Audit Verification Product remained at 3.
- Result: Passed.
