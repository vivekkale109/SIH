# Rules.md

**Audience:** Any AI coding agent (or human developer) working on this project.
**Status:** Binding. If a request conflicts with these rules, the rule wins — flag the conflict instead of silently violating a rule.
**Companion documents:** `PRD.md`, `Architecture.md`, `Phases.md`, `Design.md`, `Memory.md`.

---

## 0. Golden Priority Order

When in doubt, prioritize in this order (also stated in `Phases.md`):

**Security > Correctness > Reliability > Usability > Performance > Extra features**

Never trade a higher priority for a lower one without explicit user approval.

## 1. Coding Rules

- TypeScript everywhere (frontend and backend). No implicit `any` in new code.
- Follow the module boundaries defined in `Architecture.md` — do not bypass a module's service layer to query the database directly from another module.
- Keep functions small and single-purpose; prefer composition over deeply nested logic.
- No commented-out dead code committed to the repository.
- No `TODO` left unaddressed without a corresponding entry in `Memory.md` (§ Pending Features / Known Limitations).

## 2. Architecture Rules

- Follow the layering in `Architecture.md`: Controller → Service → Repository (Prisma). Controllers must not contain business logic.
- New entities/relationships must be reflected in `Architecture.md`'s ER diagram before (or in the same change as) implementation — do not let the code and the docs diverge.
- Do not introduce a new major architectural component (e.g., a new database, a new queue system, a new external service) without updating `Architecture.md` and getting explicit approval.
- Background/long-running work (OCR, AI, indexing) must go through the worker/job architecture — never block an API request on a slow external call.

## 3. Security Rules

- **Never store plaintext passwords.** Use bcrypt or argon2 with an appropriate cost factor.
- **Never hard-code secrets** (API keys, DB credentials, JWT secrets) in source code.
- **Never commit `.env` files or any file containing real secrets.** Only `.env.example` (with placeholder values) is committed.
- **Never trust frontend authorization.** The frontend may hide UI for UX reasons, but every backend endpoint must independently enforce authentication and authorization.
- **Always enforce authorization on the backend** for every request that touches a case, document, evidence, or audit resource — role check *and* resource-scope check (case membership / grant), per `Architecture.md` §8.
- **Validate all uploaded files**: check declared MIME type against actual content (content sniffing), enforce a maximum size, and reject disallowed types.
- **Do not execute uploaded files** under any circumstance. Uploaded content is data, never code.
- **Do not expose private object storage publicly.** MinIO buckets are private; access only via backend-issued short-lived signed URLs or backend-streamed responses.
- **Use generated storage identifiers** (e.g., UUIDs) for file storage keys — never the original filename or any user-supplied string, to prevent path traversal and enumeration.
- **Use parameterized queries** (Prisma does this by default) — never build raw SQL by string concatenation with user input.
- **Never log passwords, tokens, session cookies, or full JWTs.** Redact sensitive fields in all log output.
- **Do not expose stack traces or internal error details to users.** Return generic, safe error messages; log details server-side only.
- **Do not expose unnecessary sensitive document data.** API responses return only the fields required for the given view (avoid over-fetching/over-serializing full records with unrelated sensitive fields).
- **Use least privilege** for every role, service account, and database user — grant only what is needed for the task at hand.
- All endpoints except `/auth/login` and token-scoped share access require authentication.
- Rate-limit authentication endpoints and log failed login attempts.

## 4. Database Rules

- All schema changes go through Prisma migrations — no manual/ad-hoc schema edits against the running database.
- Every table that holds sensitive data must have a clear owning module/service; no cross-module direct table access.
- Foreign keys and cascade rules must be explicit and reviewed — deletions of a `Case` or `Document` must never silently cascade-delete `AuditEvent` rows (audit history is preserved even if the underlying resource is later removed — see §6 Documentation and §Data Lifecycle in `Architecture.md`).
- Index columns used in search/filter paths (e.g., `caseId`, `documentId`, `createdAt`) for query performance.

## 5. API Rules

- REST, versioned under `/api/v1/`.
- Every endpoint has an explicit DTO with validation (class-validator) — no endpoint accepts unvalidated raw `any` body.
- Every endpoint's required role/permission is explicit (guard/decorator), not implied.
- Idempotent operations (e.g., re-verify integrity) must be safe to call repeatedly without side effects beyond an audit log entry.
- Breaking API changes require a version bump or explicit migration note in `Memory.md`.

## 6. Frontend Rules

- No direct database or storage access from the frontend — all data flows through the backend API.
- No sensitive data (raw password, tokens beyond the httpOnly session cookie, internal IDs not needed by the UI) stored in `localStorage` or `sessionStorage`.
- All user-facing copy about integrity/AI must match the exact wording constraints in §17 (Hashing) and §18 (AI) of this document — do not soften or oversell these statements in the UI.
- Every destructive or security-sensitive action (revoke share, delete/archive document, change role) requires an explicit confirmation step in the UI.

## 7. Backend Rules

- Business logic lives in services, not controllers or Prisma calls scattered in modules.
- Every service method that mutates state relevant to security/audit must call the shared `AuditService` — do not add a new mutation path that skips audit logging.
- External calls (AI provider, email) must have timeouts and must not block the main API request thread synchronously for anything beyond a small operation — use the worker/queue path per `Architecture.md`.

## 8. File-Upload Rules

- Enforce an explicit allow-list of accepted MIME types/extensions relevant to the document domain (e.g., PDF, common image formats, common office formats) — reject everything else.
- Enforce a maximum file size at both the reverse proxy and application layer.
- Compute the SHA-256 hash server-side immediately upon receipt — never trust a client-supplied hash.
- Store files under a generated key in private object storage; never serve uploaded files from a public/static directory.
- Never allow an uploaded file to be interpreted as executable code by any part of the stack (no serving with an executable content-type, no placing in a web-servable path that a runtime would execute).

## 9. Authentication Rules

- Passwords hashed with bcrypt/argon2 before storage; never logged, never returned in any API response.
- Session/JWT delivered via httpOnly, Secure, SameSite cookies; short expiry with refresh handled server-side.
- Failed authentication attempts are rate-limited and recorded as `AuditEvent`s (without recording the attempted password).
- Any password reset or account-provisioning flow uses single-use, time-limited tokens.

## 10. Authorization Rules

- Every protected resource access checks: (1) authentication, (2) role permission for the action type, (3) resource-scope (case membership or explicit grant) — per `Architecture.md` §8.
- Denials return `403 Forbidden` (or `404` where existence itself should not be revealed to unauthorized users, per the specific endpoint's sensitivity) — decide and document consistently per endpoint, never leak resource existence to unauthorized users by accident.
- Role/permission changes are themselves audit-logged and require an elevated role (Admin) to perform.

## 11. Logging Rules

- Structured logs (not free-text) for all API requests: method, path, status, actor (if known), duration — never full request/response bodies containing sensitive content.
- `AuditEvent` (business audit trail) is distinct from application/debug logs — audit events are permanent, structured, and queryable; debug logs may be more verbose but must still be redacted of secrets.
- No secrets, passwords, tokens, or full document content in application logs.

## 12. Error-Handling Rules

- Use a global exception filter (backend) to map all errors to a safe, consistent response shape.
- Never return raw exception messages, stack traces, SQL errors, or internal file paths to the client.
- Log full error details server-side with enough context (correlation ID) to debug, without leaking that detail to the client.

## 13. Testing Rules

- Every phase in `Phases.md` must include tests for its features before being marked complete in `Memory.md`.
- Security-relevant logic (authz checks, hashing, file validation) requires explicit unit/integration tests, including negative tests (unauthorized access attempts must fail).
- Do not mark a feature as "done" without at least a basic passing test demonstrating the happy path and one failure/edge case.

## 14. Git Rules

- Small, reviewable commits scoped to a single phase/feature where possible.
- No secrets, `.env` files, credentials, or real data ever committed.
- Commit messages describe the change and reference the relevant phase (e.g., `Phase 4: add document upload endpoint`).
- Do not force-push over shared history without explicit instruction.

## 15. Dependency Rules

- Only add a new dependency when it is clearly justified; prefer the stack already defined in `Architecture.md`.
- Avoid unmaintained or unnecessary packages, especially anything with filesystem/network access beyond what's needed.
- Pin dependency versions in lockfiles; do not silently upgrade major versions without noting it in `Memory.md`.

## 16. AI Rules

AI features in this system are **advisory only**. The following are binding, non-negotiable constraints:

AI must **never**:
- Determine guilt or innocence.
- Determine or imply legal outcomes.
- Make final legal decisions of any kind.
- Declare or imply legal admissibility of any document.
- Replace investigators' judgment.
- Replace lawyers' judgment.
- Replace, silently edit, or auto-overwrite original documents.

Implementation requirements:
- Every AI-generated result is stored in the separate `AIResult` table (never merged into `Document`/`DocumentVersion` content).
- Every AI-generated result displayed in the UI is **clearly and persistently labeled** "AI-Generated — Advisory Only."
- Every AI-generated result is traceable to the exact model/version and the exact source `DocumentVersion` it was generated from.
- AI processing sends the minimum necessary data (generally OCR text, not raw files with unnecessary personal data) to any AI provider.

## 17. Hashing Rules (Integrity Verification)

- Use **SHA-256** for MVP file-integrity verification, computed server-side at upload time and re-computed on demand for verification.
- The following statement must appear, in substance, everywhere integrity verification is explained (API docs, UI copy, judge-facing materials):

  > SHA-256 verifies that the file's content exactly matches a previously recorded digest. It does **not**, by itself, prove legal authenticity, authorship, factual truth, admissibility, or chain of custody.

- Never phrase integrity verification as "proof this document is authentic/legally valid" — only as "proof the stored bytes are unchanged since the recorded hash was taken."

## 18. Documentation Rules

- `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md` are updated **before or alongside** any change that alters scope, architecture, rules, phase plan, or UI/UX direction — not after the fact as an afterthought.
- `Memory.md` is updated at the **end of every phase** (see `Phases.md`), reflecting actual implemented/tested state — never aspirational state.
- Do not delete historical entries from `Memory.md`'s work log; append new entries.

## 19. Performance Rules

- Do not optimize prematurely; correctness and security come first (see §0 Golden Priority Order).
- Add database indexes for known query patterns (case-scoped lookups, search, audit filtering) once those patterns exist, not speculatively.
- Background jobs (OCR/AI/indexing) must never block the main request/response cycle of the API.

## 20. Privacy Rules

- Use **synthetic/demo data only** throughout development, testing, and demonstration — never real FIRs, real case data, or real personal data of any individual.
- Minimize data sent to any third-party AI provider to only what's necessary for the requested processing.
- Document content is visible only to authorized case members/grant holders; auditors see metadata/logs by default, not content, unless separately granted.
- Do not fabricate integrations with real government systems (CCTNS, ICJS, eCourts, e-Filing, e-Forensics) in code, configuration, documentation, or demo narration. Any reference to these systems must be clearly framed as background/context or future conceptual direction, never as an implemented integration.
- Do not claim legal certification, forensic certification, or guaranteed legal admissibility anywhere in code, UI copy, or documentation.
