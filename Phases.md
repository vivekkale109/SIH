# Phases.md

**Purpose:** The complete, ordered development roadmap. This is the only approved sequencing for implementation work.

**Binding rule for AI coding agents:** Complete **one phase at a time**. After finishing a phase: test it, update `Memory.md` (Current Phase, Completed/In-Progress/Pending Features, Work Log), and only then start the next phase. Do not implement multiple large phases in a single pass.

**Priority order for every phase:** Security > Correctness > Reliability > Usability > Performance > Extra features.

---

## Phase 0 — Foundation

**Objective:** Establish the repository, tooling, and environment so every later phase has a stable base.

- **Features:** Repo scaffolding, Docker Compose skeleton, base Next.js app, base NestJS app, Prisma connected to PostgreSQL, MinIO container running, linting/formatting, `.env.example`.
- **Tasks:** Initialize monorepo structure (per `Architecture.md`); set up `docker-compose.yml` (postgres, minio, backend, frontend, worker placeholder); configure Prisma; configure ESLint/Prettier; write base `README.md`.
- **Database changes:** Initialize empty Prisma schema; first migration (no domain tables yet, or minimal `User` placeholder if convenient).
- **API changes:** Health-check endpoint (`GET /api/v1/health`).
- **Frontend changes:** Base app shell, placeholder landing page.
- **Tests:** Containers start successfully; health-check endpoint returns 200; Prisma can connect to Postgres.
- **Security checks:** `.env` is git-ignored; no secrets committed; MinIO not publicly exposed by default compose config.
- **Definition of Done:** `docker-compose up` brings up all services cleanly on a fresh machine; health check passes.
- **Demo checkpoint:** Show the stack running end-to-end (empty but functional).

## Phase 1 — Authentication

**Objective:** Users can be provisioned and securely log in/out.

- **Features:** User model, password hashing, login, logout, session/JWT via httpOnly cookie, seed script for demo users.
- **Tasks:** Implement `User` entity; implement `AuthModule` (login, logout, current-user endpoint); bcrypt/argon2 hashing; rate-limit login; audit-log login attempts.
- **Database changes:** `User` table (id, email, passwordHash, fullName, createdAt).
- **API changes:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- **Frontend changes:** Login page, session-aware layout (logged-in vs logged-out state).
- **Tests:** Successful login; failed login (wrong password); session persists across requests; logout invalidates session.
- **Security checks:** No plaintext passwords anywhere (DB, logs); httpOnly/Secure/SameSite cookie; rate limiting confirmed; failed logins audit-logged without storing attempted password.
- **Definition of Done:** A seeded demo user can log in and out; unauthenticated requests to protected placeholder routes are rejected.
- **Demo checkpoint:** Live login/logout with a demo account.

## Phase 2 — RBAC

**Objective:** Enforce role-based access control across the system.

- **Features:** `Role`, `Permission` models; role assignment; backend guard enforcing role-based access on endpoints.
- **Tasks:** Implement `RolesModule`; seed default roles (per `PRD.md` §7); implement `RolesGuard`/decorator; admin endpoint to assign roles.
- **Database changes:** `Role`, `Permission`, `UserRole` (or equivalent join) tables.
- **API changes:** `GET /roles`, `POST /admin/users/:id/roles`.
- **Frontend changes:** Admin "Users & Roles" page (list users, assign roles) — visible only to Super Admin.
- **Tests:** A user without the required role is denied (403) on a protected test endpoint; a user with the role is allowed.
- **Security checks:** Role checks enforced server-side only; frontend hiding of admin UI is not relied upon for security (verified with a direct API call test).
- **Definition of Done:** Roles from `PRD.md` §7 exist and are enforceable; at least one protected endpoint demonstrates the guard.
- **Demo checkpoint:** Show a non-admin user blocked from an admin action, then an admin performing it.

## Phase 3 — Case Management

**Objective:** Users can create and manage cases, the top-level container for documents.

- **Features:** `Case` CRUD, `CaseMember` management, case-scoped access enforcement.
- **Tasks:** Implement `CasesModule`; case creation with auto-membership for creator; add/remove case members; resource-scope guard checking case membership.
- **Database changes:** `Case`, `CaseMember` tables.
- **API changes:** `POST /cases`, `GET /cases`, `GET /cases/:id`, `PATCH /cases/:id`, `POST /cases/:id/members`, `DELETE /cases/:id/members/:userId`.
- **Frontend changes:** Case list (dashboard), case creation form, case detail page shell, member management UI.
- **Tests:** Non-member cannot view/edit a case; member can; creator is auto-added as a member.
- **Security checks:** Case-scope guard verified with negative tests (direct ID access by non-member is denied).
- **Definition of Done:** Cases can be created, listed, and their membership managed, with access enforced.
- **Demo checkpoint:** Create a demo case, add a second user, show access difference before/after membership.

## Phase 4 — Document Management

**Objective:** Documents can be uploaded to a case with metadata and stored securely.

- **Features:** Document upload, metadata capture (type, title, tags), storage in MinIO, `Document` + first `DocumentVersion`.
- **Tasks:** Implement `DocumentsModule`; file validation (type/size/content-sniff); generate storage key; store file in MinIO; create `Document`/`DocumentVersion` rows; audit-log upload.
- **Database changes:** `Document`, `DocumentVersion` tables (hash/OCR fields can be added now or in Phase 5/8 — decide and note in `Memory.md`).
- **API changes:** `POST /cases/:caseId/documents`, `GET /cases/:caseId/documents`, `GET /documents/:id`.
- **Frontend changes:** Upload form (file picker + metadata fields), document list within a case, document detail page shell.
- **Tests:** Valid upload succeeds and is retrievable by an authorized case member; disallowed file type/size is rejected; unauthorized user cannot upload/view.
- **Security checks:** Files never stored under user-supplied names; bucket confirmed private; upload validated before storage.
- **Definition of Done:** A demo user can upload a document to a case and see it listed and retrievable.
- **Demo checkpoint:** Upload a synthetic FIR PDF and view it in the case.

## Phase 5 — File Integrity

**Objective:** Every stored file has a verifiable SHA-256 digest.

- **Features:** Hash computation on upload, on-demand re-verification.
- **Tasks:** Compute SHA-256 server-side at upload (Phase 4 endpoint updated if not already done); implement verify endpoint that refetches bytes and recomputes hash; audit-log verification results.
- **Database changes:** `DocumentVersion.sha256` column (if not already present).
- **API changes:** `POST /documents/:versionId/verify`.
- **Frontend changes:** "Verify Integrity" action + result display (Match/Mismatch, digest, timestamps) with the exact wording from `Rules.md` §17.
- **Tests:** Verification of an untouched file returns Match; verification against a manually altered stored object (test-only manipulation) returns Mismatch.
- **Security checks:** Hash always computed server-side, never trusts a client-supplied hash.
- **Definition of Done:** Integrity verification works correctly for both matching and tampered cases in a controlled test.
- **Demo checkpoint:** Live demo of Match, then a simulated tamper showing Mismatch.

## Phase 6 — Version Control

**Objective:** Documents can be re-uploaded as new versions without losing history.

- **Features:** New-version upload, version list, version comparison metadata (uploader/time/hash per version).
- **Tasks:** Extend document detail to support "Upload New Version"; update `Document.currentVersionId`; ensure old versions remain fetchable.
- **Database changes:** Ensure `DocumentVersion.versionNumber` and current-version pointer logic are solid.
- **API changes:** `POST /documents/:id/versions`, `GET /documents/:id/versions`.
- **Frontend changes:** Version history list/timeline on document detail page; clear "current" vs "superseded" labeling.
- **Tests:** Uploading a new version does not delete the old one; both remain independently retrievable and verifiable.
- **Security checks:** Access control applies equally to historical versions, not just the current one.
- **Definition of Done:** A document can have 2+ versions, each independently viewable, downloadable, and verifiable.
- **Demo checkpoint:** Upload a revised charge sheet as v2, show v1 still accessible.

## Phase 7 — Audit Trail

**Objective:** All sensitive actions from Phases 1–6 are (and remain) fully audit-logged and reviewable.

- **Features:** Central `AuditService`, `AuditEvent` table, Auditor-facing read-only log viewer.
- **Tasks:** Ensure every prior module calls `AuditService.record(...)` consistently; implement audit query endpoint with filters (user, case, resource, date range); implement Auditor role UI.
- **Database changes:** `AuditEvent` table (if not already created incrementally); indexes on `actorId`, `resourceType`, `resourceId`, `createdAt`.
- **API changes:** `GET /audit` (filterable, Auditor/Admin only).
- **Frontend changes:** Audit log page with filters and a readable event list.
- **Tests:** Every action type from Phases 1–6 produces exactly one corresponding audit event; non-auditor cannot access `/audit`.
- **Security checks:** No API path exists to edit or delete an `AuditEvent`; audit log excludes secrets.
- **Definition of Done:** A full walkthrough of Phases 1–6 actions is fully reconstructable from the audit log alone.
- **Demo checkpoint:** Perform a few actions, then show them appear live in the audit log.

## Phase 8 — OCR

**Objective:** Image/scanned-PDF documents are automatically made text-searchable via OCR.

- **Features:** OCR job queue, Tesseract worker, `OCRResult` storage, status indicator in UI.
- **Tasks:** Implement job queue (per `Architecture.md` §20); implement OCR worker calling Tesseract; store extracted text + confidence; update document OCR status; handle failures gracefully.
- **Database changes:** `OCRResult` table; `DocumentVersion.ocrStatus` field.
- **API changes:** Upload flow enqueues OCR job automatically; `GET /documents/:versionId/ocr` (status/result).
- **Frontend changes:** OCR status badge (Queued/Processing/Complete/Failed) on document detail; low-confidence warning where applicable.
- **Tests:** A sample scanned document produces extracted text; a non-OCR-applicable file (e.g., already-text PDF) is handled appropriately; failure path leaves a clear Failed status, not a stuck job.
- **Security checks:** Worker only accesses files it's authorized to process (via internal job context, not user-supplied paths); OCR text stored with the same access controls as the source document.
- **Definition of Done:** Uploading a scanned synthetic document results in searchable OCR text within a reasonable demo-scale time.
- **Demo checkpoint:** Upload a scanned document, show OCR status progress to Complete, show extracted text.

## Phase 9 — Search

**Objective:** Users can search documents by content and metadata, scoped to their access.

- **Features:** PostgreSQL full-text search (`tsvector`) over title/metadata/OCR text, case-scoped and global search, access-filtered results.
- **Tasks:** Add `tsvector` column + GIN index; implement `SearchModule`; apply access-scope filter at the SQL level; implement ranking.
- **Database changes:** `searchVector` (tsvector) column on `Document`/`DocumentVersion` (or a dedicated search table), GIN index.
- **API changes:** `GET /search?q=...&caseId=...`.
- **Frontend changes:** Search bar (global + case-scoped), results list with snippets/highlights.
- **Tests:** Search returns relevant results for known synthetic content; a user never sees a result for a document outside their access scope (explicit negative test).
- **Security checks:** Confirm access filtering happens in the query itself, not only in post-processing.
- **Definition of Done:** Searching a keyword present in a synthetic document's OCR text or metadata returns that document, correctly access-filtered.
- **Demo checkpoint:** Search for a term appearing only in one case's OCR text and show correct, scoped results.

## Phase 10 — Investigation Timeline

**Objective:** Users can build and view a chronological, document-linked case timeline.

- **Features:** `TimelineEvent` CRUD, linking events to documents/evidence, chronological timeline view.
- **Tasks:** Implement `TimelineModule`; implement `Evidence` entity if not already present; link creation UI; render timeline sorted by `eventTime`.
- **Database changes:** `TimelineEvent`, `Evidence` tables; join/link tables to `Document` where needed.
- **API changes:** `POST /cases/:caseId/timeline`, `GET /cases/:caseId/timeline`.
- **Frontend changes:** Timeline view (chronological list/visual), "Add Event" form with document/evidence linking.
- **Tests:** Events render in correct chronological order; a linked document a user cannot access shows as a restricted reference, not full content.
- **Security checks:** Timeline respects the same access checks as the underlying documents it references.
- **Definition of Done:** A demo case has a multi-event timeline linking at least two documents.
- **Demo checkpoint:** Walk through a synthetic case's timeline end to end.

## Phase 11 — Secure Sharing

**Objective:** Documents can be shared securely, internally or externally, with scope and expiry.

- **Features:** `PermissionGrant` creation, internal share, external time-bound link, revocation.
- **Tasks:** Implement `SharingModule`; generate signed/expiring tokens for external links; enforce scope (view-only vs download) on access; implement revocation.
- **Database changes:** `PermissionGrant` table.
- **API changes:** `POST /documents/:versionId/share`, `GET /shared/:token`, `POST /shares/:id/revoke`.
- **Frontend changes:** "Share" dialog (recipient/scope/expiry), active shares list, revoke action.
- **Tests:** Expired/revoked grants are correctly denied; scope (view vs download) is enforced; all access via a share is audit-logged.
- **Security checks:** Tokens are unguessable (sufficient entropy); revocation takes effect immediately; no share bypasses normal audit logging.
- **Definition of Done:** A document can be shared externally via a working, scoped, expiring link, and revoked on demand.
- **Demo checkpoint:** Generate a share link, access it as an "external" viewer, then revoke and show access denied.

## Phase 12 — AI Assistance

**Objective:** Advisory-only AI summarization, classification, and entity extraction are available and clearly labeled.

- **Features:** AI job queue, `AIResult` storage, summarization, document-type classification, basic entity extraction.
- **Tasks:** Implement `AIModule`; implement AI worker calling the configured provider with OCR text only; store results; enforce advisory labeling throughout (per `Rules.md` §16).
- **Database changes:** `AIResult` table.
- **API changes:** `POST /documents/:versionId/ai-process`, `GET /documents/:versionId/ai-results`.
- **Frontend changes:** "AI Assist" panel on document detail with persistent "Advisory Only" labeling; summary/classification/entities display.
- **Tests:** AI results are correctly linked to the source version; UI always shows the advisory label; AI failures (e.g., provider unavailable) degrade gracefully without breaking the document view.
- **Security checks:** Only OCR text (not unnecessary raw file/PII) sent to the AI provider; AI cannot write to `Document`/`DocumentVersion` content.
- **Definition of Done:** A synthetic document can be summarized/classified with results clearly marked advisory-only and traceable.
- **Demo checkpoint:** Run AI assist on a synthetic witness statement, show summary + advisory labeling.

## Phase 13 — Security Hardening

**Objective:** Systematically review and strengthen security across everything built so far.

- **Features:** Security review pass — no new user-facing features.
- **Tasks:** Re-audit all endpoints against `Rules.md` (authz, validation, error handling, logging); dependency vulnerability scan; review rate limiting; review CORS/CSRF/cookie settings; confirm secrets handling; review file-upload validation edge cases.
- **Database changes:** None expected, unless a gap requires a schema fix (documented in `Memory.md`).
- **API changes:** Bug-fix level only, addressing findings.
- **Frontend changes:** Bug-fix level only, addressing findings (e.g., confirmation dialogs missing on a sensitive action).
- **Tests:** Add any missing negative-path tests discovered during review; re-run full test suite.
- **Security checks:** Full checklist pass against `Rules.md` §3, §8, §9, §10; document findings and fixes in `Memory.md`.
- **Definition of Done:** No known open security gaps against `Rules.md`; findings either fixed or explicitly logged as known limitations.
- **Demo checkpoint:** N/A (internal hardening phase) — optionally show a "before/after" for one fixed issue.

## Phase 14 — Testing

**Objective:** Comprehensive test pass across the whole system before deployment prep.

- **Features:** None new — test coverage and stability work.
- **Tasks:** Fill test gaps across all modules; add integration tests for full user journeys from `PRD.md` §9; fix any bugs found.
- **Database changes:** None expected.
- **API changes:** Bug fixes only.
- **Frontend changes:** Bug fixes only.
- **Tests:** All PRD §9 journeys covered by at least one integration/E2E test; all `Rules.md` security rules have at least one corresponding test.
- **Security checks:** Re-run security-relevant tests; confirm no regressions from earlier phases.
- **Definition of Done:** Test suite passes reliably; all core journeys verified end-to-end.
- **Demo checkpoint:** N/A — internal QA phase.

## Phase 15 — Deployment

**Objective:** The system runs reliably via Docker Compose in a clean environment, ready for demonstration.

- **Features:** Finalized Docker Compose setup, Nginx reverse proxy, seed script for demo data.
- **Tasks:** Finalize `docker-compose.yml` for all services; configure Nginx; write/finalize seed script with rich synthetic demo data (multiple cases, documents, users, roles); write deployment README.
- **Database changes:** Final migration review; ensure seed script is idempotent/re-runnable for repeated demo runs.
- **API changes:** None expected beyond configuration (base URL, CORS for deployed origin).
- **Frontend changes:** Production build configuration.
- **Tests:** Fresh-machine deployment test: clone repo, `docker-compose up`, run seed script, verify all core journeys work.
- **Security checks:** Confirm no debug/verbose error output in production config; confirm `.env.example` is complete and `.env` is not committed.
- **Definition of Done:** A fresh clone of the repository can be brought up and demoed end-to-end following the README.
- **Demo checkpoint:** Full fresh-environment run-through.

## Phase 16 — SIH Demo Preparation

**Objective:** Prepare a polished, judge-ready demonstration.

- **Features:** None new — presentation/demo readiness only.
- **Tasks:** Prepare a demo script covering PRD §9 journeys; prepare a small, realistic synthetic dataset (varied document types: FIR, witness statement, charge sheet, forensic report, etc.); rehearse the tamper-detection and permission-denial demos; prepare slides referencing `PRD.md`/`Architecture.md` diagrams; double-check all judge-facing language complies with `Rules.md` §17 (hashing) and §20 (privacy — no fabricated integrations, no admissibility claims).
- **Database changes:** None (only seed data curation).
- **API changes:** None.
- **Frontend changes:** Minor polish only (copy fixes, empty/loading/error states per `Design.md`).
- **Tests:** Full dry-run of the demo script at least twice.
- **Security checks:** Final review that no real data, no real credentials, and no unsubstantiated claims appear anywhere in the demo materials.
- **Definition of Done:** Demo script rehearsed successfully end-to-end within the time limit.
- **Demo checkpoint:** This phase *is* the final demo.

---

## Cross-Phase Discipline

- After each phase: run its tests, fix failures, update `Memory.md` (mark checkboxes truthfully, log the work, note any deviations), then proceed.
- If a phase reveals a needed change to `PRD.md`/`Architecture.md`/`Rules.md`/`Design.md`, update that document in the same change — do not let docs drift from implementation.
- If time runs short, drop scope from later phases (12+) before compromising Phases 0–7 (foundation, auth, RBAC, cases, documents, integrity, versioning, audit) — these are the security/trust core of the product.
