---
name: Admin PIN auth pattern (hashed PIN + HMAC token, no bcrypt/jwt)
description: How the store's hidden admin panel authenticates without adding new server dependencies, and how the client attaches the resulting token to protected calls.
---

The api-server package has no `bcrypt`/`jsonwebtoken` dependency. Rather than adding one for a single low-stakes admin PIN gate, use Node's built-in `node:crypto`:

- Hash the PIN with `createHash("sha256")` + a fixed salt string; never compare or store the plaintext PIN.
- Issue a token as `base64url(payload.hmacSignature)` where `payload` is an expiry timestamp, signed with `createHmac("sha256", SESSION_SECRET)`. Verify by recomputing the HMAC with `timingSafeEqual` and checking expiry.
- A `requireAdmin` Express middleware checks `Authorization: Bearer <token>` via this verify function and gates mutating routes (POST/PATCH/DELETE) on products/categories/banners etc.

**Why:** avoids adding new runtime dependencies for a low-stakes internal auth gate, and keeps the secret-signing logic aligned with `SESSION_SECRET`, which is already provisioned as an env secret in this project template.

**How to apply:** On the client, after a successful PIN verify call, store the returned token (e.g. sessionStorage) and call `setAuthTokenGetter()` from `@workspace/api-client-react`'s custom-fetch so all subsequent generated-hook calls automatically attach the bearer token — no need to manually thread the token through every mutation hook call site.
