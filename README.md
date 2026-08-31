# Secure Digital Document Management System (SDMS)
### For Legal & Investigation Records — SIH Problem Statement 26190

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20NestJS%20%7C%20Prisma%20%7C%20PostgreSQL%20%7C%20MinIO-000000?style=flat)](https://github.com)
[![Status](https://img.shields.io/badge/Status-Prototype%20(Synthetic%20Data)-warning)](#synthetic-data--ethical-disclaimer)

A centralized, role-based, tamper-evident digital document management platform designed for police investigation units, legal support teams, supervisors, and internal auditors. Provides cryptographic integrity verification, versioning, automated OCR, scoped sharing, an immutable audit trail, and advisory-only AI document triage.

---

> ### ⚠️ Synthetic Data & Ethical Disclaimer
> This project is a **hackathon prototype built for Smart India Hackathon (SIH) Problem Statement 26190** using **synthetic/demo data only**.
> - It does **not** integrate with, replace, or represent CCTNS, ICJS, eCourts, e-Filing, e-Forensics, or any production government system.
> - It does **not** use real FIRs, real personal data, or real official credentials.
> - SHA-256 integrity verification confirms **byte-level content matching** only — it does not establish legal authenticity, authorship, or admissibility.
> - AI output is strictly **advisory-only** and does not replace human investigator or legal judgment.
> - **Production Security Requirement**: `JWT_SECRET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` must be explicitly configured via environment variables in any non-local/production deployment. Ephemeral secrets and fallback credentials are used strictly for isolated local development, and the backend enforces explicit configuration at startup in production.

---

## 🚀 Key Features

- 🔐 **Cryptographic SHA-256 Integrity Verification**: Every file version is hashed at intake. On-demand re-verification refetches stored bytes from private object storage and recomputes the digest to detect any file tampering live.
- 📜 **Version Control**: Full multi-version support (`v1`, `v2`, `v3`...) with current version pointers (`currentVersionId`) while retaining all historical versions intact.
- 🛡️ **Two-Layer Access Control (RBAC + Case Membership)**: Authenticated session/JWT security paired with role-based permissions (`Super Admin`, `Investigator`, `Supervisor`, `Prosecutor`, `Auditor`, `Records Clerk`) and case-scoped membership checks.
- 👁️ **Immutable Insert-Only Audit Trail**: Every sensitive action (login, upload, verification, share creation/access, role edit) is recorded to a read-only `AuditEvent` database table.
- 📄 **Automatic OCR & Full-Text Search**: Tesseract background worker process extracts text from images and scanned PDFs, feeding a permission-scoped search index.
- 🔗 **Secure Scoped Sharing**: Scoped (`VIEW_ONLY` vs `DOWNLOAD_ALLOWED`), expiring external share URLs with instant revocation support.
- 🤖 **Advisory-Only AI Assistance**: Summarizes text, suggests document classification, and extracts entity references (People, Dates, Locations) with persistent *"AI-Generated — Advisory Only"* labeling.
- 📅 **Investigation Timeline & Evidence Vault**: Chronological event timeline linking documents & seized physical/digital evidence items.

---

## 🛠️ Architecture & Tech Stack

```
                                  ┌───────────────────────────┐
                                  │   Next.js 14 Frontend     │
                                  │   (App Router, Tailwind)  │
                                  └─────────────┬─────────────┘
                                                │ REST API (Cookie Session)
                                  ┌─────────────▼─────────────┐
                                  │   NestJS / Express API    │
                                  │   (Modular Monolith)      │
                                  └──────┬──────────────┬─────┘
                                         │              │
                    ┌────────────────────▼────┐    ┌────▼────────────────────┐
                    │   PostgreSQL 16 DB      │    │   MinIO Object Storage  │
                    │   (Metadata, Audit)     │    │   (Private File Bytes)  │
                    └────────────────────▲────┘    └────▲────────────────────┘
                                         │              │
                                  ┌──────┴──────────────┴─────┐
                                  │    Background Worker      │
                                  │   (Tesseract OCR / AI)    │
                                  └───────────────────────────┘
```

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Backend API** | Node.js, Express / NestJS modular design, TypeScript, JWT (httpOnly) |
| **ORM & Database** | Prisma ORM, PostgreSQL 16 |
| **Object Storage** | MinIO (S3-Compatible, private bucket) |
| **OCR Worker** | Tesseract / Node worker process |
| **Deployment** | Docker & Docker Compose |

---

## 🔑 Demo Login Accounts (Password: `DemoPass@123`)

Click any persona on the login screen (`http://localhost:3000/login`) or sign in manually:

| Persona / Role | Email Address | Password | Capabilities |
|---|---|---|---|
| **Case Officer / Investigator** | `investigator.sharma@sdms.gov.in` | `DemoPass@123` | Creates cases, uploads FIRs, builds timelines |
| **Supervisor / Reviewing Officer** | `supervisor.verma@sdms.gov.in` | `DemoPass@123` | Reviews case files & approves records |
| **Legal Officer / Prosecutor** | `prosecutor.mehta@sdms.gov.in` | `DemoPass@123` | Verifies SHA-256 digests, court filings |
| **Auditor** | `auditor.gupta@sdms.gov.in` | `DemoPass@123` | Read-only audit log inspection (`/audit`) |
| **Super Admin** | `admin@sdms.gov.in` | `DemoPass@123` | User provisioning & system role assignment (`/admin`) |
| **Records Clerk** | `clerk.singh@sdms.gov.in` | `DemoPass@123` | Intake & OCR queue management |

---

## 🚦 Quick Start Guide

### Prerequisites
- [Node.js v18+](https://nodejs.org/)
- [Docker](https://www.docker.com/) & Docker Compose

---

### Method A: Local Development Run (Recommended)

1. **Clone the Repository & Install Dependencies:**
   ```bash
   git clone <repo-url>
   cd SIH
   npm install --legacy-peer-deps
   ```

2. **Start Infrastructure Containers (PostgreSQL & MinIO):**
   ```bash
   docker run -d --name sdms-postgres -p 5432:5432 -e POSTGRES_USER=sdms -e POSTGRES_PASSWORD=sdms_password -e POSTGRES_DB=sdms postgres:alpine
   docker run -d --name sdms-minio -p 9005:9000 -p 9006:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio server /data --console-address ":9001"
   ```

3. **Initialize Database & Seed Synthetic Demo Data:**
   ```bash
   npm run prisma:push --workspace=apps/backend
   npm run prisma:seed --workspace=apps/backend
   ```

4. **Launch Application Services:**
   Run in separate terminal windows or in background:

   - **Backend API (Port 4000):**
     ```bash
     npm run dev:backend
     ```
   - **Background Worker (OCR & AI Queue):**
     ```bash
     npm run dev:worker
     ```
   - **Frontend App (Port 3000):**
     ```bash
     npm run dev:frontend
     ```

5. **Access Application:**
   Open **`http://localhost:3000`** in your browser.

---

### Method B: Full Docker Compose Containerized Run

To launch the complete containerized stack in a single command:

```bash
docker compose up --build
```

- **Frontend App**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:4000/api/v1`
- **MinIO Web Console**: `http://localhost:9006`

---

## 📡 API Endpoint Overview

| Method | Endpoint | Description | Auth Required? |
|---|---|---|---|
| `GET` | `/api/v1/health` | Service health status (DB + MinIO) | No |
| `POST` | `/api/v1/auth/login` | Authenticate user & set httpOnly cookie | No |
| `POST` | `/api/v1/auth/logout` | Destroy session cookie | Yes |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/v1/cases` | List user's accessible cases | Yes |
| `POST` | `/api/v1/cases` | Create new investigation case | Yes |
| `GET` | `/api/v1/cases/:id` | Fetch case details, members, & counts | Yes |
| `POST` | `/api/v1/cases/:caseId/documents` | Upload file, compute hash, create v1 | Yes |
| `GET` | `/api/v1/documents/:id` | Get document details & version history | Yes |
| `POST` | `/api/v1/documents/:id/versions` | Upload new version (v2+) | Yes |
| `POST` | `/api/v1/documents/:versionId/verify` | Re-verify SHA-256 digest live | Yes |
| `POST` | `/api/v1/documents/:versionId/share` | Create scoped expiring share link | Yes |
| `GET` | `/api/v1/shared/:token` | External view for shared token | Token-scoped |
| `POST` | `/api/v1/documents/:versionId/ai-process` | Trigger advisory AI analysis | Yes |
| `GET` | `/api/v1/search?q=...` | Access-scoped full-text search | Yes |
| `GET` | `/api/v1/audit` | Filterable read-only audit log | Auditor / Admin |

---

## 🧪 Demonstration Journeys for Judges & Evaluators

1. **Upload & SHA-256 Intake:** Log in as `investigator.sharma@sdms.gov.in`, open case `CASE/2026/0891`, and upload a document. The server immediately calculates its cryptographic SHA-256 hash before private storage.
2. **Live Tamper Detection:** Open any uploaded document, click **Verify SHA-256 Digest**. The server refetches the object bytes from MinIO and recomputes the SHA-256 hash to confirm byte-for-byte matching.
3. **Advisory AI Triage:** Click **Run AI Analysis** on a witness statement or FIR to view automated text summaries and entity extractions (with persistent *"Advisory Only"* warning banner).
4. **Scoped Sharing & Revocation:** Click **Share Document**, configure scope (`VIEW_ONLY` vs `DOWNLOAD_ALLOWED`) and expiry duration. Test the URL in an incognito tab, then revoke it from the document dashboard.
5. **Auditor Log Inspection:** Log in as `auditor.gupta@sdms.gov.in` and visit `/audit` to inspect the filterable, immutable audit trail.

---

## 📄 License & Project Documentation

Refer to internal documentation files for detailed technical specifications:
- [PRD.md](PRD.md) — Product Requirements & Scope
- [Architecture.md](Architecture.md) — Technical Architecture & ER Diagram
- [Design.md](Design.md) — Enterprise Design System & UI Specifications
- [Rules.md](Rules.md) — Binding Security, Architecture, & AI Constraints
- [Phases.md](Phases.md) — Development Roadmap & Implementation Steps
- [Memory.md](Memory.md) — Development Handoff & State Log

*Smart India Hackathon (SIH) Problem Statement 26190 Prototype.*
