# Architecture.md

**Project:** Secure Digital Document Management System (SIH PS 26190)
**Scope:** Technical architecture — source of truth for all implementation decisions.
**Companion documents:** `PRD.md` (what/why), `Rules.md` (constraints), `Phases.md` (sequencing), `Design.md` (UI), `Memory.md` (live state).

> All items below are **DESIGN DECISIONS** for this prototype unless marked otherwise. No claim is made that any external government system is actually integrated.

---

## 1. Architecture Overview

The system is a modular monolith for the MVP: a single NestJS backend service (organized into clear domain modules) behind a REST API, a Next.js frontend, PostgreSQL for relational data, MinIO (S3-compatible) for object storage, and background workers for OCR/AI/search-indexing jobs. This keeps the MVP simple to build, deploy, and demo while preserving clean module boundaries that could be split into services later (Future Proposal).

**Stack**

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, NestJS, REST API |
| ORM | Prisma |
| Database | PostgreSQL |
| Object storage | MinIO (S3-compatible) |
| OCR | Tesseract (via worker process) |
| Search (MVP) | PostgreSQL full-text search (`tsvector`) |
| Search (conditional) | OpenSearch / vector search — only if MVP search is demonstrably insufficient (see §14) |
| Background jobs | Node worker process(es), queue via PostgreSQL-backed job table or Redis+BullMQ (see §20) |
| Deployment | Docker, Docker Compose, Nginx (reverse proxy, TLS termination) |

## 2. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Client
        FE["Next.js Frontend (TS + Tailwind)"]
    end

    subgraph Edge
        NG["Nginx Reverse Proxy / TLS"]
    end

    subgraph Backend["NestJS Backend (Modular Monolith)"]
        API["REST API Layer"]
        AUTH["Auth Module"]
        RBAC["Authorization Module"]
        CASE["Case Module"]
        DOC["Document Module"]
        VER["Versioning Module"]
        AUD["Audit Module"]
        SHARE["Sharing Module"]
        SRCH["Search Module"]
        AI["AI Module"]
        NOTIF["Notification Module"]
    end

    subgraph Workers["Background Workers"]
        OCRW["OCR Worker (Tesseract)"]
        AIW["AI Processing Worker"]
        IDXW["Search Indexing Worker"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL")]
        MINIO[("MinIO Object Storage")]
    end

    FE -->|HTTPS| NG --> API
    API --> AUTH & RBAC & CASE & DOC & VER & AUD & SHARE & SRCH & AI & NOTIF
    DOC --> MINIO
    DOC --> PG
    VER --> PG
    AUD --> PG
    API -->|enqueue job| OCRW
    API -->|enqueue job| AIW
    OCRW --> MINIO
    OCRW --> PG
    OCRW -->|OCR text| IDXW
    IDXW --> PG
    AIW --> PG
    AI --> AIW
```

## 3. Frontend Architecture

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Structure:** feature-based folders (`/app/cases`, `/app/documents`, `/app/search`, `/app/audit`, `/app/admin`), shared UI in `/components`, API client in `/lib/api`.
- **State:** server components for data fetching where possible; client components with local/query state (e.g., TanStack Query) for interactive views.
- **Auth handling:** session/JWT stored in httpOnly secure cookies; frontend never stores tokens in `localStorage`.
- **Authorization in UI:** the frontend hides actions a user cannot perform, purely for UX — it is **never** the source of truth (backend re-checks every request; see `Rules.md`).
- **Error handling:** centralized API error boundary mapping backend error codes to user-friendly messages, never surfacing raw stack traces.

## 4. Backend Architecture

- **Framework:** NestJS with a modular structure — one module per domain (Auth, Users, Roles, Cases, Documents, Versions, Evidence, Timeline, Audit, Sharing, Search, OCR, AI, Notifications).
- **Layering per module:** Controller (HTTP/DTO validation) → Service (business logic) → Repository (Prisma access).
- **Validation:** class-validator DTOs on every endpoint; no unvalidated input reaches the service layer.
- **Cross-cutting concerns:** global exception filter, global auth guard, global RBAC guard, request-scoped logging interceptor (redacted), rate limiting on auth endpoints.

## 5. Database Architecture

PostgreSQL is the system of record for all metadata, relationships, permissions, and audit events. Prisma is used as the ORM/migration tool. Entities are detailed in §22 (Entity-Relationship section) below.

## 6. Object-Storage Architecture

- MinIO (S3-compatible) stores the actual file bytes.
- Buckets are **private by default** — never publicly readable.
- Files are stored under **generated, non-guessable storage keys** (e.g., UUID-based paths), never the original filename, to prevent enumeration.
- The database stores the mapping from `DocumentVersion` → storage key, hash, size, and MIME type.
- Access to a file always goes through the backend, which issues a short-lived, signed URL or streams the file after verifying authorization — never a direct public link.

## 7. Authentication Architecture

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Next.js Frontend
    participant API as NestJS Auth Module
    participant DB as PostgreSQL

    U->>FE: Enter credentials
    FE->>API: POST /auth/login
    API->>DB: Look up user by email
    DB-->>API: Hashed password
    API->>API: Verify password (bcrypt/argon2)
    API->>API: Generate signed session/JWT
    API-->>FE: Set httpOnly secure cookie
    FE-->>U: Redirect to dashboard
```

- Passwords hashed with bcrypt/argon2 (never reversible encryption, never plaintext).
- Session/JWT delivered via httpOnly, Secure, SameSite cookies.
- Failed login attempts are rate-limited and audit-logged.
- Password reset (if implemented) uses single-use, expiring tokens — never emails a plaintext password.

## 8. Authorization Architecture

Two layers, both enforced server-side on every request:

1. **Role-based (RBAC):** each user has one or more system roles (see `PRD.md` §7) which grant baseline capabilities (e.g., "can create cases").
2. **Resource-scoped (case membership / grants):** access to a specific case or document additionally requires case membership (`CaseMember`) or an explicit `PermissionGrant`.

```mermaid
flowchart LR
    REQ["Incoming Request"] --> AUTHN["AuthGuard: is user authenticated?"]
    AUTHN -->|no| DENY1["401 Unauthorized"]
    AUTHN -->|yes| ROLE["RBAC Guard: does role allow this action type?"]
    ROLE -->|no| DENY2["403 Forbidden"]
    ROLE -->|yes| SCOPE["Scope Check: is user a case member or grant holder for this resource?"]
    SCOPE -->|no| DENY3["403 Forbidden"]
    SCOPE -->|yes| ALLOW["Proceed to handler"]
```

## 9. Document Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Document Module
    participant ST as MinIO
    participant DB as PostgreSQL
    participant Q as Job Queue

    U->>API: POST /documents (file + metadata)
    API->>API: Validate file type/size, scan/sniff content
    API->>API: Compute SHA-256 hash
    API->>ST: Store file under generated key
    API->>DB: Create Document + DocumentVersion (hash, key, metadata)
    API->>DB: Write AuditEvent (document_uploaded)
    API->>Q: Enqueue OCR job (if applicable)
    API-->>U: 201 Created (document summary)
```

## 10. Document Retrieval Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Document Module
    participant AUTH as Authz Guard
    participant DB as PostgreSQL
    participant ST as MinIO

    U->>API: GET /documents/:id
    API->>AUTH: Check role + case membership/grant
    AUTH-->>API: Allow/Deny
    alt Denied
        API-->>U: 403 Forbidden
    else Allowed
        API->>DB: Fetch document/version metadata
        API->>ST: Generate short-lived signed URL or stream
        API->>DB: Write AuditEvent (document_viewed)
        API-->>U: Metadata + access URL
    end
```

## 11. Document Versioning Flow

- Re-uploading a document creates a new `DocumentVersion` row linked to the same `Document`, with its own hash, storage key, uploader, and timestamp.
- The `Document.currentVersionId` pointer is updated; previous versions remain fully retrievable.
- Every version transition is recorded as an `AuditEvent`.

```mermaid
flowchart LR
    D["Document"] --> V1["Version 1 (superseded)"]
    D --> V2["Version 2 (superseded)"]
    D --> V3["Version 3 (current)"]
    D -.currentVersionId.-> V3
```

## 12. SHA-256 Integrity Verification Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Document Module
    participant ST as MinIO
    participant DB as PostgreSQL

    U->>API: POST /documents/:versionId/verify
    API->>ST: Fetch file bytes
    API->>API: Recompute SHA-256
    API->>DB: Compare to stored hash
    API->>DB: Write AuditEvent (integrity_check, result)
    API-->>U: Match / Mismatch + digest + original metadata
```

Per `Rules.md`, the UI and API responses must always state that a "Match" confirms byte-level integrity only, not authorship, legal authenticity, or admissibility.

## 13. OCR Flow

```mermaid
sequenceDiagram
    participant Q as Job Queue
    participant W as OCR Worker (Tesseract)
    participant ST as MinIO
    participant DB as PostgreSQL

    Q->>W: OCR job (documentVersionId)
    W->>ST: Fetch file
    W->>W: Run Tesseract OCR
    W->>DB: Store OCRResult (text, confidence, status)
    W->>DB: Update DocumentVersion.ocrStatus = complete
    W->>DB: Enqueue/trigger search index update
```

OCR status is exposed to the frontend as Queued → Processing → Complete/Failed. Low-confidence OCR is flagged in the UI (known OCR limitation — accuracy varies significantly with handwriting and scan quality).

## 14. Search Flow

- **MVP:** PostgreSQL full-text search using a `tsvector` column combining document title, tags, metadata, and OCR text, indexed with a GIN index.
- Every search query is executed **with the requesting user's access scope applied as a SQL-level filter** (case membership / grants), never filtered only in application code after the fact, to avoid ever leaking existence of unauthorized documents.
- **Escalation criterion to OpenSearch/vector search (Future Proposal):** only pursued if MVP full-text search demonstrably fails to meet relevance or latency needs at realistic demo/production data volumes — this is not committed for the hackathon.

```mermaid
flowchart LR
    Q["Search Query"] --> SCOPE["Apply user's access scope (SQL filter)"]
    SCOPE --> FTS["PostgreSQL tsvector/tsquery match"]
    FTS --> RANK["Rank by relevance"]
    RANK --> RESULTS["Return only authorized results"]
```

## 15. AI Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as AI Module
    participant Q as Job Queue
    participant W as AI Worker
    participant DB as PostgreSQL

    U->>API: POST /documents/:versionId/ai-process
    API->>DB: Check OCR text available
    API->>Q: Enqueue AI job (text only, minimized)
    Q->>W: Process job
    W->>W: Call AI provider (summarization/classification/entities)
    W->>DB: Store AIResult (linked to versionId, model, output, "advisory" flag)
    W->>DB: Write AuditEvent (ai_processed)
    API-->>U: AIResult (clearly labeled advisory-only)
```

AI Module never writes to `Document`/`DocumentVersion` content — only to the separate `AIResult` table, enforcing that AI output can never silently alter the original record.

## 16. Audit-Log Flow

- Every module that performs a sensitive action calls a shared `AuditService.record(actor, action, resourceType, resourceId, outcome, metadata)`.
- `AuditEvent` rows are **insert-only**; no update/delete endpoint exists for this table at the API layer.
- Audit records are queryable (filtered) by Auditor and Admin roles only.

## 17. Timeline Flow

- `TimelineEvent` rows belong to a `Case`, optionally reference one or more `Document`/`Evidence` records, and have a timestamp + description + creator.
- Timeline view queries events for a case, ordered chronologically, and resolves linked document references through the normal authorization path (a linked document a user can't access is shown as a restricted reference, not silently exposed).

## 18. Secure Sharing Flow

```mermaid
sequenceDiagram
    participant U as Granting User
    participant API as Sharing Module
    participant DB as PostgreSQL
    participant R as Recipient

    U->>API: POST /documents/:versionId/share {recipient, scope, expiry}
    API->>DB: Create PermissionGrant (scoped, expiring)
    API->>DB: Write AuditEvent (share_created)
    API-->>U: Share link / confirmation
    R->>API: GET /shared/:token
    API->>DB: Validate grant (not expired/revoked, scope)
    API->>DB: Write AuditEvent (share_accessed)
    API-->>R: Document (view-only or download, per scope)
```

Revocation immediately invalidates the grant; subsequent access attempts are denied and logged.

## 19. Error-Handling Architecture

- Global NestJS exception filter maps internal errors to a small set of safe, generic API error responses (e.g., `400`, `401`, `403`, `404`, `409`, `422`, `500`).
- Stack traces and internal error details are logged server-side only, never returned in the API response body (see `Rules.md`).
- Frontend maps error codes to user-friendly messages; unknown errors show a generic "something went wrong" state with a reference/correlation ID for support/debugging.

## 20. Background Worker Architecture

- Workers (OCR, AI, search indexing) run as separate Node processes from the API, sharing the same codebase/module libraries where practical.
- **MVP job queue:** a PostgreSQL-backed job table (simple, no extra infra) is acceptable for hackathon scope; Redis + BullMQ is an optional upgrade if time permits (documented as such — not assumed by default).
- Workers are idempotent per job ID to tolerate retries safely.
- Worker failures update job/document status to `Failed` with a reason, never leave a document stuck silently.

## 21. API Architecture

- REST API under `/api/v1/...`, resource-oriented:
  - `/api/v1/auth/*`
  - `/api/v1/users/*`
  - `/api/v1/roles/*`
  - `/api/v1/cases/*`
  - `/api/v1/cases/:caseId/documents/*`
  - `/api/v1/documents/:id/versions/*`
  - `/api/v1/documents/:versionId/verify`
  - `/api/v1/documents/:versionId/ai-process`
  - `/api/v1/documents/:versionId/share`
  - `/api/v1/search`
  - `/api/v1/cases/:caseId/timeline`
  - `/api/v1/audit`
  - `/api/v1/notifications`
- All endpoints require authentication except `/auth/login` and (if implemented) `/shared/:token` (which authenticates via the grant token itself).
- Consistent envelope for errors; pagination via `limit`/`cursor` or `page`/`pageSize` (decided at implementation time, documented in code).

## 22. Security Boundaries

```mermaid
flowchart TB
    subgraph Untrusted["Untrusted Zone"]
        Browser
        ExternalShareRecipient["External share recipient"]
    end
    subgraph DMZ["Edge"]
        Nginx
    end
    subgraph Trusted["Trusted Application Zone"]
        API2["NestJS API"]
        Workers2["Background Workers"]
    end
    subgraph Restricted["Restricted Data Zone"]
        PG2[("PostgreSQL")]
        MinIO2[("MinIO")]
    end

    Browser --> Nginx --> API2
    ExternalShareRecipient -->|token-scoped only| Nginx
    API2 --> PG2
    API2 --> MinIO2
    Workers2 --> PG2
    Workers2 --> MinIO2
    Workers2 -.no direct external access.-> Untrusted
```

- Database and object storage are never directly reachable from the browser or the public internet — only via the backend/workers.
- Every trust boundary crossing (browser → API, API → data layer) re-validates authentication and authorization.

## 23. Deployment Architecture

```mermaid
flowchart LR
    subgraph Docker Compose
        NG2["nginx"] --> FE2["frontend (Next.js)"]
        NG2 --> API3["backend (NestJS)"]
        API3 --> WRK["worker(s)"]
        API3 --> PGD[("postgres")]
        API3 --> MND[("minio")]
        WRK --> PGD
        WRK --> MND
    end
```

- Single `docker-compose.yml` orchestrates: `frontend`, `backend`, `worker`, `postgres`, `minio`, `nginx`.
- Environment-specific config via `.env` files (never committed — see `Rules.md`).
- TLS terminated at Nginx in any externally reachable deployment; local dev may run HTTP only.

## 24. Backup/Recovery Architecture

- PostgreSQL: scheduled `pg_dump` snapshots (dev/demo cadence; production cadence is a **Future Proposal**, not implemented in MVP).
- MinIO: bucket versioning enabled where feasible so accidental overwrites are recoverable at the storage layer, in addition to the application-level `DocumentVersion` history.
- Recovery procedure (MVP): restore latest `pg_dump`, restore MinIO bucket, verify hash integrity of a sample of documents post-restore.

## 25. Scalability Strategy

- MVP targets demo-scale data (hundreds–low thousands of documents/cases) on a single host.
- Horizontal scaling path (Future Proposal, not built for MVP): stateless API replicas behind a load balancer, dedicated worker pool, managed PostgreSQL, external object storage (S3), and OpenSearch for search — noted as a future direction only.

## 26. Integration Architecture

- **MVP integrations:** none with external government systems. All "external" touchpoints (email notifications, AI provider) are optional/stubbed and clearly documented as such.
- **Explicitly not implemented:** any connection to CCTNS, ICJS, eCourts, e-Filing, or e-Forensics. If discussed in presentations, these are described only as **conceptual future integration points**, never as working integrations.

---

## Entity-Relationship Model

```mermaid
erDiagram
    USER ||--o{ CASEMEMBER : has
    USER ||--o{ AUDITEVENT : performs
    USER ||--o{ NOTIFICATION : receives
    ROLE ||--o{ USER : assigned_to
    ROLE ||--o{ PERMISSION : grants

    CASE ||--o{ CASEMEMBER : has
    CASE ||--o{ DOCUMENT : contains
    CASE ||--o{ TIMELINEEVENT : has
    CASE ||--o{ EVIDENCE : contains

    DOCUMENT ||--o{ DOCUMENTVERSION : has
    DOCUMENTVERSION ||--o| OCRRESULT : produces
    DOCUMENTVERSION ||--o{ AIRESULT : produces
    DOCUMENTVERSION ||--o{ PERMISSIONGRANT : shared_via
    DOCUMENT ||--o{ AUDITEVENT : referenced_in
    DOCUMENT }o--o{ EVIDENCE : linked_to
    DOCUMENT }o--o{ TIMELINEEVENT : linked_to

    USER {
        uuid id PK
        string email
        string passwordHash
        string fullName
        datetime createdAt
    }
    ROLE {
        uuid id PK
        string name
    }
    PERMISSION {
        uuid id PK
        string action
        string resourceType
    }
    CASE {
        uuid id PK
        string caseNumber
        string title
        string status
        datetime createdAt
    }
    CASEMEMBER {
        uuid id PK
        uuid caseId FK
        uuid userId FK
        string roleInCase
    }
    DOCUMENT {
        uuid id PK
        uuid caseId FK
        string title
        string documentType
        uuid currentVersionId FK
        string status
    }
    DOCUMENTVERSION {
        uuid id PK
        uuid documentId FK
        int versionNumber
        string storageKey
        string sha256
        string mimeType
        bigint sizeBytes
        uuid uploadedBy FK
        datetime uploadedAt
        string ocrStatus
    }
    EVIDENCE {
        uuid id PK
        uuid caseId FK
        string evidenceType
        string description
        datetime collectedAt
    }
    TIMELINEEVENT {
        uuid id PK
        uuid caseId FK
        string description
        datetime eventTime
        uuid createdBy FK
    }
    AUDITEVENT {
        uuid id PK
        uuid actorId FK
        string action
        string resourceType
        uuid resourceId
        string outcome
        jsonb metadata
        datetime createdAt
    }
    PERMISSIONGRANT {
        uuid id PK
        uuid documentVersionId FK
        uuid grantedBy FK
        uuid grantedToUser FK
        string externalToken
        string scope
        datetime expiresAt
        boolean revoked
    }
    AIRESULT {
        uuid id PK
        uuid documentVersionId FK
        string resultType
        text output
        string modelName
        boolean advisoryOnly
        datetime createdAt
    }
    OCRRESULT {
        uuid id PK
        uuid documentVersionId FK
        text extractedText
        float confidence
        string status
        datetime processedAt
    }
    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string type
        string referenceType
        uuid referenceId
        boolean read
        datetime createdAt
    }
```

## Repository Structure (Recommended)

```
/
├── apps/
│   ├── frontend/                # Next.js app
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   ├── backend/                 # NestJS app
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── cases/
│   │   │   ├── documents/
│   │   │   ├── versions/
│   │   │   ├── evidence/
│   │   │   ├── timeline/
│   │   │   ├── audit/
│   │   │   ├── sharing/
│   │   │   ├── search/
│   │   │   ├── ocr/
│   │   │   ├── ai/
│   │   │   ├── notifications/
│   │   │   ├── common/          # guards, interceptors, filters, decorators
│   │   │   └── main.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   └── worker/                  # background worker process(es)
│       └── src/
├── docs/                        # this documentation set
├── docker-compose.yml
├── .env.example
└── README.md
```

## Environment Variables (`.env.example`)

```
# App
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sdms

# Auth
JWT_SECRET=change_me
JWT_EXPIRY=1h
SESSION_COOKIE_NAME=sdms_session

# Object storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=change_me
S3_SECRET_KEY=change_me
S3_BUCKET=sdms-documents

# OCR
OCR_ENGINE=tesseract

# AI (optional, stubbed for demo if no key provided)
AI_PROVIDER_API_KEY=

# Misc
LOG_LEVEL=info
```

`.env` files are **never committed**; `.env.example` documents required variables only (see `Rules.md`).

## Development Environment

- `docker-compose up` brings up `postgres`, `minio`, `backend`, `worker`, `frontend` for local development.
- Prisma migrations run against the local Postgres container.
- Seed script populates **synthetic/demo data only** (fake users, fake cases, fake documents) — never real data.

## Production Considerations (Documented, Not Necessarily Implemented for Hackathon)

- Managed PostgreSQL with automated backups.
- Object storage with versioning + lifecycle policies.
- Centralized structured logging and alerting.
- Secrets management via a vault/secret manager rather than `.env` files.
- WAF/rate limiting at the edge.
- These are noted as **Future Proposal** considerations; the hackathon deployment target is Docker Compose on a single host, as stated in `PRD.md` (Constraints).
