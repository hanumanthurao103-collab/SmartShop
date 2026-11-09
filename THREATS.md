\# SmartShop – Threat Model and Security Tests



\## 1. Purpose



This document identifies security risks in SmartShop, the protections implemented so far, and tests used or planned to verify those protections.



\## 2. Assets to protect



\- Customer names, email addresses, and password hashes

\- Authentication tokens

\- Product information and stock values

\- Order information

\- Admin-only product management operations

\- MongoDB credentials and application secrets

\- Security and audit records



\## 3. Threats and mitigations



| Threat | Potential impact | Mitigation | Current status |

|---|---|---|---|

| Unauthenticated product creation | Unauthorized changes to the catalogue | JWT authentication middleware | Implemented |

| Customer accessing admin operations | Customers could create or modify products | Admin role authorization | Implemented |

| Weak password storage | Exposure of customer passwords | bcrypt password hashing | Implemented |

| Invalid product input | Invalid or inconsistent database records | Server-side validation | Implemented |

| Forged or expired JWT | Unauthorized access | JWT signature and expiry verification | Implemented |

| Duplicate customer registration | Duplicate accounts | Email normalization and uniqueness constraint | Implemented |

| Sensitive configuration exposure | Database or token compromise | Environment variables and Git ignore rules | Implemented; further review required |

| Excessive login attempts | Account access attempts at scale | Login rate limiting | Planned |

| Missing audit trail | Difficulty investigating administrative actions | Record important security events | Planned |

| Unauthorized order access | Exposure of another customer's orders | Verify ownership on every order request | Planned |



\## 4. Security tests



\### Test 1: Unauthenticated product creation



\- Request: POST `/api/products` without an Authorization header.

\- Expected: HTTP 401.

\- Observed: `Authentication required`.

\- Result: Passed.



\### Test 2: Customer attempts admin operation



\- Request: POST `/api/products` using a valid customer JWT.

\- Expected: HTTP 403.

\- Observed: `Admin access required`.

\- Result: Passed.



\### Test 3: Invalid or expired JWT



\- Request: Access a protected endpoint with an invalid or expired token.

\- Expected: HTTP 401.

\- Result: Pending.



\### Test 4: Password hashing



\- Register a customer and verify that the stored password is a bcrypt hash rather than the original password.

\- Expected: The original password is never stored.

\- Result: Pending database verification.



\### Test 5: Invalid product data



\- Submit missing fields, negative prices, and invalid stock values.

\- Expected: HTTP 400 and no product creation.

\- Result: Pending.



\### Test 6: Customer order ownership



\- Attempt to access an order belonging to another customer.

\- Expected: Access denied.

\- Result: Pending order API implementation.



\### Test 7: Audit trail



\- Perform an administrative action and inspect its audit record.

\- Expected: The record identifies the action, actor, and timestamp without storing passwords or authentication tokens.

\- Result: Pending audit implementation.



\## 5. Security development priorities



1\. Complete authentication and role-based authorization.

2\. Add secure order ownership checks.

3\. Implement an audit trail for sensitive administrative actions.

4\. Add login rate limiting.

5\. Verify error handling and input validation.

6\. Review database permissions and environment configuration.



\## 6. Review

