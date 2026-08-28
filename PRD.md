# Product Requirements Document (PRD)

**Project:** Secure Digital Document Management System for Legal & Investigation Records
**SIH Problem Statement:** 26190
**Document status:** Living document — source of truth for product scope
**Related documents:** `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`

> **Terminology used throughout this document:**
> - **FACT** — an established, verifiable statement (e.g., about existing laws or standards).
> - **DESIGN DECISION** — a choice made by this project team for this prototype.
> - **FUTURE PROPOSAL** — something that is not built, not committed, and may or may not happen.
>
> This project is a **hackathon prototype built with synthetic/demo data**. It does **not** integrate with, replace, or represent CCTNS, ICJS, eCourts, e-Filing, e-Forensics, or any other government production system, and it does **not** claim legal certification or guaranteed legal admissibility of any document or process. (DESIGN DECISION / project constraint.)

---

## 1. Project Overview

The project is a web-based **Secure Digital Document Management System (SDMS)** for legal and investigation documents such as FIRs, police reports, investigation records, witness statements, charge sheets, court filings, evidence records, forensic reports, legal notices, and judgments.

The system provides a controlled digital environment where authorized personnel (investigators, legal officers, supervisors, auditors) can upload, organize, search, verify, and share sensitive case documents while maintaining a verifiable audit trail across the document's lifecycle.

The prototype is built for **Smart India Hackathon (SIH) Problem Statement 26190** and uses **synthetic/demo data only**. No real FIRs, real case data, or real personal data of any individual are used during development or demonstration.

## 2. Problem Statement

Law enforcement and judicial workflows generate large volumes of sensitive documents across multiple stages of an investigation and legal proceeding. In many current environments (FACT, general domain knowledge — not specific to any single department):

- Documents are scattered across physical files, shared drives, email, and local machines.
- There is no single, tamper-evident, access-controlled record of who created, modified, viewed, or shared a document.
- Search across large volumes of scanned/handwritten/typed documents is difficult without OCR and structured indexing.
- Version history of an evolving document (e.g., a charge sheet redrafted multiple times) is often lost.
- There is no consistent way to verify that a document retrieved today is byte-for-byte identical to the one originally filed.
- Sharing documents with other stakeholders (e.g., a prosecutor, another department) is done through unsecured channels (email, USB, print).
- There is no unified investigation timeline connecting related documents, evidence, and events.

## 3. Problem Background

India's justice and law-enforcement ecosystem already includes large-scale digital initiatives such as CCTNS (Crime and Criminal Tracking Network & Systems), ICJS (Inter-operable Criminal Justice System), eCourts, and e-Filing/e-Forensics initiatives (**FACT** — these are publicly known Government of India digital-justice programs). These systems focus primarily on inter-agency data exchange and case tracking at a national/state scale.

This project does **not** attempt to replace, replicate, or connect to any of those systems (**DESIGN DECISION**). Instead, it focuses on a narrower, complementary problem: how an individual unit, department, or investigation team can manage the **lifecycle, security, integrity, and auditability of the documents it holds**, using modern document-management and information-security practices. This is presented as a **prototype demonstrating patterns** that could, in principle and as a **FUTURE PROPOSAL**, be adapted for integration with wider systems — not as an existing integration.

The Bharatiya Sakshya Adhiniyam, 2023 (BSA) and Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) are recent Indian statutes governing evidence and criminal procedure respectively, including provisions relevant to electronic and digital records (**FACT** — publicly enacted legislation). This project uses concepts such as hash-based integrity verification and audit trails **because they are recognized good practices for digital evidence handling**, not because the prototype has been certified against these statutes. Whether a specific record meets the legal definition of admissible evidence is a matter of law, procedure, and certification that is **outside the scope of this software prototype** (DESIGN DECISION / non-goal).

## 4. Vision

To demonstrate a secure, auditable, and investigator-friendly digital document management platform that shows how sensitive legal and investigation records can be handled with strong access control, integrity verification, and traceability from creation to closure — as a reference implementation, not a production government system.

## 5. Goals

1. Provide a centralized, access-controlled repository for case-related documents.
2. Enforce role-based access control (RBAC) so users only see what they are authorized to see.
3. Preserve full version history for every document.
4. Provide cryptographic integrity verification (SHA-256) for uploaded files.
5. Maintain a complete, immutable audit log of all significant actions.
6. Provide OCR so scanned/typed documents become searchable.
7. Provide full-text search across document content and metadata.
8. Provide a case-level investigation timeline linking documents and events.
9. Provide secure, permission-scoped, time-bound sharing of documents.
10. Provide AI-assisted (advisory-only) document processing: summarization, classification, entity extraction.
11. Demonstrate these capabilities clearly to SIH evaluators using realistic **synthetic** case data.

## 6. Target Users

- District/state police investigation units (conceptual target — demo only).
- Legal cell / prosecution support staff.
- Case supervisors and reviewing officers.
- Records/administration staff.
- Internal auditors / oversight officers.

## 7. User Roles

| Role | Description |
|---|---|
| **Super Admin** | Manages system configuration, user accounts, and global roles. Not attached to specific cases by default. |
| **Case Officer / Investigator** | Creates cases, uploads and manages documents within assigned cases, builds timeline. |
| **Supervisor / Reviewing Officer** | Reviews and approves case documents, has read access across assigned cases, can grant limited sharing. |
| **Legal Officer / Prosecutor** | Views case documents relevant to legal proceedings, may add court filings and legal notices. |
| **Auditor** | Read-only access to audit logs and metadata; cannot view document contents unless explicitly granted. |
| **Records Clerk** | Handles intake, indexing, and OCR queue management; limited edit rights. |
| **External/Guest (share recipient)** | Access only via a secure, scoped, time-bound share link — no login to the main system required, or a restricted-scope account (implementation choice documented in `Architecture.md`). |

Exact permission matrices are defined in `Architecture.md` (Authorization Architecture) and enforced per `Rules.md`.

## 8. User Personas

**Persona 1 — Investigating Officer (Primary user)**
Handles 5–15 active cases at a time. Needs fast upload, clear document status, and confidence that only authorized colleagues can view case material. Not deeply technical; wants a simple, guided interface.

**Persona 2 — Supervisor**
Reviews multiple investigators' work. Needs a dashboard view across cases, quick access to timelines, and the ability to approve/reject documents or escalate.

**Persona 3 — Legal Officer**
Joins a case later in its lifecycle. Needs to quickly search and retrieve relevant filings, verify document integrity before referencing them, and receive shared documents securely.

**Persona 4 — Auditor**
Periodically reviews system usage for compliance. Needs read-only access to audit trails, filterable by user, case, document, and time range — without needing to see sensitive document content by default.

**Persona 5 — Records Clerk**
Performs bulk intake of scanned documents, monitors OCR queue status, and fixes metadata errors.

## 9. User Journeys

**Journey A — Upload and Secure a New Document**
1. Investigator logs in → opens assigned case → clicks "Upload Document."
2. Selects document type (e.g., Witness Statement), attaches file, adds metadata.
3. System computes SHA-256 hash, stores file in object storage, creates a `Document` + `DocumentVersion` record.
4. OCR job is queued if the file is an image/scanned PDF.
5. Audit event is recorded ("document uploaded by X at T").
6. Document appears in the case document list with status "Processing" → "Ready."

**Journey B — Verify Document Integrity**
1. Legal officer opens a document.
2. Clicks "Verify Integrity."
3. System recomputes SHA-256 of the stored file and compares to the recorded digest.
4. UI shows Match/Mismatch with the digest, timestamp of original upload, and uploader identity.
5. Result and the check itself are logged in the audit trail.

**Journey C — Search Across Case Documents**
1. User enters a keyword/phrase in global or case-scoped search.
2. System searches OCR-extracted text and metadata (title, type, tags, dates).
3. Results are filtered by the user's access rights before being shown — a user never sees a result for a document they cannot open.
4. User opens a result, which routes through the normal authorization check again.

**Journey D — Share a Document Securely**
1. Case officer selects a document/version to share.
2. Chooses recipient (internal user or external share link), scope (view-only/download), and expiry.
3. System creates a `PermissionGrant` with constraints; if a link, generates a signed, time-bound URL.
4. All access via the share is logged.
5. Share can be revoked at any time by the granting user or a supervisor.

**Journey E — Build an Investigation Timeline**
1. Investigator adds a `TimelineEvent` (e.g., "Witness statement recorded") and links it to relevant document(s)/evidence.
2. Timeline view renders chronologically per case, with linked documents accessible inline (subject to permission).

**Journey F — AI-Assisted Review**
1. User requests an AI summary or classification of a document.
2. System sends OCR text (never raw images with faces/PII beyond what's necessary) to the AI processing service.
3. Result is stored as an `AIResult`, clearly labeled "AI-Generated — Advisory Only," and linked to the source document/version.
4. User can accept, ignore, or flag the AI result; it never modifies the original document.

## 10. Core Problems Being Solved

1. Lack of centralized, access-controlled document storage for case material.
2. No reliable way to verify a document hasn't changed since it was filed.
3. No systematic version history for evolving documents.
4. No searchable index across scanned/paper-origin documents.
5. No consistent audit trail of who did what, when.
6. No safe way to share documents with external/internal stakeholders without email/USB.
7. No unified chronological view of a case's documents and events.
8. Manual document triage (classification, summarization) is slow.

## 11. Proposed Solution

A role-based web application with:
- A document repository backed by object storage, with metadata in a relational database.
- SHA-256 integrity hashing on every uploaded file/version.
- Full version history per document.
- An append-only audit log for all sensitive actions.
- OCR pipeline (Tesseract) feeding a full-text search index.
- A secure sharing mechanism using scoped, expiring permission grants.
- A case-level timeline linking documents, evidence, and events.
- An advisory-only AI layer for summarization, classification, and entity extraction, always clearly labeled and never authoritative.

## 12. Functional Requirements

| ID | Requirement | MVP? |
|---|---|---|
| FR-1 | Users can register/be provisioned and authenticate securely | MVP |
| FR-2 | System enforces RBAC on all resources | MVP |
| FR-3 | Users can create and manage cases | MVP |
| FR-4 | Users can upload documents to a case with metadata | MVP |
| FR-5 | System computes and stores SHA-256 hash per file version | MVP |
| FR-6 | Users can view document version history | MVP |
| FR-7 | Users can re-verify integrity of any stored version on demand | MVP |
| FR-8 | System logs all create/read/update/delete/share/verify actions | MVP |
| FR-9 | Documents are OCR-processed automatically when applicable | MVP |
| FR-10 | Users can search documents by content and metadata within their access scope | MVP |
| FR-11 | Users can build and view a case investigation timeline | MVP |
| FR-12 | Users can share a document with scoped, time-bound permissions | MVP |
| FR-13 | Users receive notifications for key events (share, OCR complete, mention) | MVP |
| FR-14 | Users can request AI-generated summary/classification/entity extraction | MVP (basic) |
| FR-15 | Auditors can view filtered audit logs read-only | MVP |
| FR-16 | Admins can manage users, roles, and permissions | MVP |
| FR-17 | Vector/semantic search over documents | Future |
| FR-18 | AI-assisted redaction suggestions | Future |
| FR-19 | Cross-department federated case linking | Future |
| FR-20 | Mobile app | Future |

## 13. Non-Functional Requirements

- **Security-first**: every feature is designed access-control-first (see `Rules.md`).
- **Auditability**: every sensitive action must be traceable to a user, timestamp, and outcome.
- **Integrity**: stored files must be verifiable against their original hash at any time.
- **Availability**: core read/upload flows should degrade gracefully if background services (OCR, AI, search indexing) are slow or unavailable.
- **Performance**: document list/search should respond within a few seconds for demo-scale data (hundreds to low thousands of documents).
- **Maintainability**: clear layering (frontend / API / service / data) as per `Architecture.md`.
- **Portability**: fully containerized (Docker Compose) for reproducible demo/dev environments.
- **Data minimization**: only necessary metadata/content is processed by AI or logged.

## 14. MVP Features

- Authentication (email/password, hashed credentials, session/JWT).
- RBAC with a fixed set of roles (Section 7).
- Case CRUD + case membership.
- Document upload, metadata, versioning, SHA-256 hashing.
- Integrity verification on demand.
- Audit logging of core actions.
- OCR pipeline (Tesseract) for image/PDF documents.
- Full-text search (PostgreSQL full-text search) over OCR text + metadata.
- Case timeline (manual event entry + auto-linked document events).
- Secure sharing (internal grant + expiring external link).
- Basic notifications (in-app; email optional/stubbed for demo).
- Basic AI assist: document summarization and document-type classification (advisory-only, clearly labeled).

## 15. Advanced Features (Future Scope, not MVP)

- Vector/semantic search and Q&A over case documents.
- AI-assisted redaction/PII detection.
- Multi-department/agency federation.
- Digital signature integration.
- Mobile application.
- Advanced analytics/reporting dashboards.
- Workflow automation (approval chains, SLA tracking).

## 16. AI Features

All AI features are **advisory only** (see `Rules.md` §16 for binding rules). MVP AI scope:
- Document summarization (from OCR text).
- Document type classification (e.g., suggests "Witness Statement" vs "Charge Sheet").
- Basic named-entity extraction (names, dates, locations mentioned in the text) shown as suggestions.

Every AI output is stored as an `AIResult`, tagged with the model/version used, linked to the exact document version it was generated from, and displayed with a persistent "AI-Generated — Advisory Only, Not Verified" label. AI never edits, deletes, or replaces original documents, and never determines legal outcomes.

## 17. Security Requirements

- Passwords hashed with a strong adaptive algorithm (e.g., bcrypt/argon2) — never plaintext, never reversible encryption.
- All authorization checks enforced server-side; frontend checks are UX-only.
- All file uploads validated (type, size, content sniffing) before storage.
- Uploaded files are never executed; stored under generated, non-guessable identifiers in private object storage.
- All traffic over TLS in any deployed environment.
- Secrets/config via environment variables, never hard-coded or committed.
- Principle of least privilege applied to every role and every service account.
- Full details in `Rules.md` and `Architecture.md` (Security Boundaries).

## 18. Privacy Requirements

- Only synthetic/demo data used in development, testing, and demonstration.
- Access to document content is restricted to case members and roles with explicit grants.
- Auditors see metadata/logs by default, not document content, unless separately granted.
- AI processing sends only the minimum text/content necessary and does not retain data beyond the processing request (implementation-dependent; documented per integration in `Architecture.md`).
- No analytics/tracking of personal data beyond what is needed for audit and security logging.

## 19. Document Lifecycle

`Draft/Uploaded → Processing (OCR/AI) → Under Review → Verified/Approved → Archived`, with `Superseded` applied to older versions when a new version is uploaded, and `Revoked/Withdrawn` as an explicit terminal state if a document is removed from active use (soft-delete only — see `Rules.md`). Full state machine and transition rules are defined in `Architecture.md`.

## 20. Evidence / Document Integrity

Every stored file version has a SHA-256 digest computed at upload time and stored alongside it. Integrity verification recomputes the digest on demand and compares it to the stored value. A **Match** result means the stored bytes are unchanged since upload; it does **not** by itself establish authorship, legal authenticity, or admissibility (see `Rules.md` §"Hashing Rules" for the exact, binding wording used everywhere in the product).

## 21. Search Requirements

- Search across document titles, metadata, tags, and OCR-extracted text.
- Search results strictly filtered by the requesting user's access rights (never leak existence of a document the user cannot access).
- Case-scoped and global (cross-case, permission-filtered) search modes.
- MVP: PostgreSQL full-text search (`tsvector`/`tsquery`). OpenSearch/vector search only considered later if MVP search proves insufficient (see `Architecture.md` §Search Flow for justification criteria).

## 22. OCR Requirements

- Automatic OCR trigger on upload for image and scanned-PDF documents (Tesseract, MVP).
- OCR status visible to the user: Queued → Processing → Complete/Failed.
- OCR output stored as an `OCRResult` linked to the specific document version, including confidence indicators where available.
- OCR text feeds search indexing; OCR text is **not** treated as a verified transcription — UI must indicate OCR text may contain errors, especially for handwriting (a known, documented OCR limitation).

## 23. Audit Requirements

- Append-only `AuditEvent` log for: login/logout/failed login, case create/update, document upload/view/download/update/delete, version changes, integrity checks, permission grants/revokes, share creation/access/revocation, role/permission changes, AI requests.
- Each event records: actor, action, target resource, timestamp, outcome (success/failure), and relevant metadata (e.g., IP, user agent) without storing sensitive secrets.
- Audit logs are read-only to all roles except system-level retention/export processes; no UI path allows editing or deleting audit events.

## 24. Version Control

- Every re-upload of a document creates a new `DocumentVersion` rather than overwriting the previous one.
- All prior versions remain retrievable (subject to permission) with their own hash, uploader, and timestamp.
- Current version is clearly marked; superseded versions are labeled accordingly.

## 25. Access-Control Requirements

- RBAC at the system level (roles) combined with case-membership scoping (a user must be a member of a case, or hold an elevated role, to access its documents).
- Explicit `PermissionGrant` model for exceptions (e.g., sharing a single document outside normal case membership).
- All authorization decisions are made and enforced in the backend for every request, not inferred from UI state.

## 26. Sharing Requirements

- Share a specific document (and version) with: another internal user, a role, or an external recipient via a signed, expiring link.
- Configurable scope: view-only vs. download-allowed.
- Configurable expiry (time-bound) and optional revocation at any time.
- All access through a share link is authenticated against the grant and logged like any other access.

## 27. Notification Requirements

- In-app notifications for: document shared with you, OCR complete, AI result ready, added to a case, permission changes affecting you.
- Notifications never include full sensitive document content — only references/links that re-trigger normal authorization checks.
- Email notifications are an optional/stub integration for the demo (documented as such, not claimed as a production feature).

## 28. Reporting Requirements

- Case summary report (documents, versions, timeline, audit excerpt) exportable for internal review — MVP: on-screen + basic export (e.g., PDF/CSV of metadata), not a claim of legal reporting compliance.
- Audit report filterable by user/case/date range for auditors.

## 29. Future Scope

See Section 15 (Advanced Features) and `Phases.md` for phase-by-phase sequencing. Future scope explicitly includes: semantic search, redaction assistance, digital signatures, cross-agency federation (all **FUTURE PROPOSAL**, not committed).

## 30. Non-Goals

- This system is **not** a replacement for CCTNS, ICJS, eCourts, e-Filing, or e-Forensics.
- This system does **not** claim legal admissibility, forensic certification, or chain-of-custody compliance with any specific statute.
- This system does **not** perform real integrations with any government production system during the hackathon.
- This system does **not** use real case data, real personal data, or real government credentials at any point.
- AI in this system does **not** make legal, guilt/innocence, or admissibility determinations.

## 31. Success Criteria

- All MVP functional requirements (Section 12) implemented and demonstrable end-to-end with synthetic data.
- Every sensitive action produces a corresponding audit log entry, verifiable live in the demo.
- Integrity verification correctly detects both matching and tampered files in a live demo.
- Search returns correct, permission-filtered results across a demo dataset.
- Judges can follow a full journey (upload → OCR → search → share → timeline → audit) without errors.

## 32. Acceptance Criteria

- [ ] A user cannot access a case/document they are not authorized for, even via direct URL manipulation.
- [ ] Every document upload produces a SHA-256 hash that is stored and re-verifiable.
- [ ] Every document edit/re-upload creates a new version without destroying prior versions.
- [ ] Every logged action appears correctly and immutably in the audit log.
- [ ] OCR text becomes searchable within a reasonable time after upload.
- [ ] A shared document link respects its configured scope and expiry.
- [ ] AI results are visibly labeled as advisory and are traceable to a specific document version.

## 33. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Scope creep toward "real" government integration claims | Credibility/ethics risk in demo | Explicit non-goals (Section 30), reviewed in every phase |
| OCR accuracy on poor-quality scans | Reduced search quality | Set expectations in UI, allow manual metadata correction |
| Treating SHA-256 match as "proof of authenticity" | Misleading claim | Strict wording rules in `Rules.md`, enforced in `Design.md` copy |
| Time pressure causing security shortcuts | Vulnerabilities | Security prioritized above features in `Phases.md` |
| AI hallucination in summaries | Misleading investigators | Advisory-only labeling, no auto-apply of AI output |

## 34. Assumptions

- Judges/evaluators understand this is a prototype using synthetic data.
- Demo environment runs via Docker Compose on a single host/laptop.
- Users are pre-provisioned by an admin (no public self-registration for this domain).
- Network/internet access may be limited during live demo; core flows must work offline/local.

## 35. Constraints

- Timeline: hackathon schedule (see `Phases.md`).
- Stack constraints as defined in `Architecture.md` (Next.js/NestJS/PostgreSQL/MinIO/Tesseract).
- No real government data, credentials, or system access available or permitted.
- Small team; MVP scope must remain achievable — see `Phases.md` for sequencing discipline.
