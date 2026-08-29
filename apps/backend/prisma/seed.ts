import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding synthetic demo data for SDMS (SIH PS 26190)...');

  // 1. Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Manages system configuration, user accounts, and global roles.' },
    { name: 'Case Officer / Investigator', description: 'Creates cases, uploads and manages documents within assigned cases.' },
    { name: 'Supervisor / Reviewing Officer', description: 'Reviews and approves case documents, read access across assigned cases.' },
    { name: 'Legal Officer / Prosecutor', description: 'Views case documents relevant to legal proceedings, court filings.' },
    { name: 'Auditor', description: 'Read-only access to audit logs and metadata.' },
    { name: 'Records Clerk', description: 'Intake, indexing, and OCR queue management.' },
  ];

  const rolesMap = new Map<string, any>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      create: r,
      update: { description: r.description },
    });
    rolesMap.set(r.name, role);
  }

  // 2. Default Permissions
  const permissionsData = [
    { action: 'create', resourceType: 'case' },
    { action: 'read', resourceType: 'case' },
    { action: 'upload', resourceType: 'document' },
    { action: 'verify', resourceType: 'document' },
    { action: 'read', resourceType: 'audit' },
    { action: 'manage', resourceType: 'users' },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { action_resourceType: { action: p.action, resourceType: p.resourceType } },
      create: p,
      update: {},
    });
  }

  // 3. Demo Users
  const passwordHash = await bcrypt.hash('DemoPass@123', 10);

  const usersData = [
    { email: 'admin@sdms.gov.in', fullName: 'Rajesh Malhotra (Super Admin)', role: 'Super Admin' },
    { email: 'investigator.sharma@sdms.gov.in', fullName: 'Inspector Ramesh Sharma', role: 'Case Officer / Investigator' },
    { email: 'supervisor.verma@sdms.gov.in', fullName: 'ACP Sunita Verma', role: 'Supervisor / Reviewing Officer' },
    { email: 'prosecutor.mehta@sdms.gov.in', fullName: 'Advocate Vikram Mehta', role: 'Legal Officer / Prosecutor' },
    { email: 'auditor.gupta@sdms.gov.in', fullName: 'Suresh Gupta (Internal Audit)', role: 'Auditor' },
    { email: 'clerk.singh@sdms.gov.in', fullName: 'Amit Singh (Records Cell)', role: 'Records Clerk' },
  ];

  const createdUsers = new Map<string, any>();

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        status: 'ACTIVE',
      },
      update: {
        fullName: u.fullName,
        passwordHash,
      },
    });
    createdUsers.set(u.email, user);

    const role = rolesMap.get(u.role);
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });
    }
  }

  // 4. Synthetic Cases
  const invUser = createdUsers.get('investigator.sharma@sdms.gov.in')!;
  const supUser = createdUsers.get('supervisor.verma@sdms.gov.in')!;
  const prosUser = createdUsers.get('prosecutor.mehta@sdms.gov.in')!;

  const case1 = await prisma.case.upsert({
    where: { caseNumber: 'CASE/2026/0891' },
    create: {
      caseNumber: 'CASE/2026/0891',
      title: 'Cyber Fraud & Shell Account Laundering Operation',
      description: 'Synthetic investigation into multi-bank phishing network and fraudulent entity transactions.',
      status: 'UNDER_INVESTIGATION',
      priority: 'HIGH',
      createdBy: invUser.id,
      members: {
        create: [
          { userId: invUser.id, roleInCase: 'LEAD_INVESTIGATOR' },
          { userId: supUser.id, roleInCase: 'SUPERVISOR' },
          { userId: prosUser.id, roleInCase: 'PROSECUTOR' },
        ],
      },
    },
    update: {},
  });

  const case2 = await prisma.case.upsert({
    where: { caseNumber: 'CASE/2026/0412' },
    create: {
      caseNumber: 'CASE/2026/0412',
      title: 'Contraband Arms Tracking & Intercity Logistics',
      description: 'Synthetic tracking record of seized contraband shipments across state transit check-posts.',
      status: 'OPEN',
      priority: 'URGENT',
      createdBy: invUser.id,
      members: {
        create: [
          { userId: invUser.id, roleInCase: 'LEAD_INVESTIGATOR' },
          { userId: supUser.id, roleInCase: 'SUPERVISOR' },
        ],
      },
    },
    update: {},
  });

  // 5. Synthetic Documents & Versions
  const sampleText = `FIRST INFORMATION REPORT (Under Section 173 BNSS / 154 CrPC)
Police Station: Cyber Crime Cell, Special Branch
Case Number: CASE/2026/0891
Date & Time of Occurrence: 14-Aug-2026 11:30 AM
Complainant: Synthetic Financial Audit Wing
Summary: Unexplained transaction logs detected across accounts linked to fictitious vendor payments.
Investigating Officer: Inspector Ramesh Sharma
Status: Registered and under active investigation.`;

  const sha256 = crypto.createHash('sha256').update(Buffer.from(sampleText)).digest('hex');
  const storageKey = `documents/${case1.id}/seed-fir-0891.pdf`;

  const existingVer = await prisma.documentVersion.findUnique({
    where: { storageKey },
  });

  if (!existingVer) {
    const doc1 = await prisma.document.create({
      data: {
        caseId: case1.id,
        title: 'First Information Report (FIR 0891/2026)',
        documentType: 'FIR',
        status: 'APPROVED',
        tags: ['FIR', 'Initial Registration', 'Cyber Cell'],
        createdBy: invUser.id,
      },
    });

    const ver1 = await prisma.documentVersion.create({
      data: {
        documentId: doc1.id,
        versionNumber: 1,
        storageKey,
        originalFilename: 'FIR_0891_2026_Certified.pdf',
        sha256,
        mimeType: 'application/pdf',
        sizeBytes: BigInt(Buffer.byteLength(sampleText)),
        uploadedBy: invUser.id,
        ocrStatus: 'COMPLETED',
      },
    });

    await prisma.document.update({
      where: { id: doc1.id },
      data: { currentVersionId: ver1.id },
    });

    // Seed OCR Result
    await prisma.oCRResult.create({
      data: {
        documentVersionId: ver1.id,
        extractedText: sampleText,
        confidence: 0.96,
        status: 'COMPLETED',
      },
    });

    // Seed AI Advisory Result
    await prisma.aIResult.create({
      data: {
        documentVersionId: ver1.id,
        resultType: 'SUMMARIZATION_AND_ENTITIES',
        output: JSON.stringify({
          summary: 'Synthetic initial FIR detailing cyber fraud complaint registered on 14-Aug-2026.',
          suggestedClassification: 'FIR',
          entities: {
            people: ['Inspector Ramesh Sharma'],
            dates: ['14-Aug-2026'],
            locations: ['Cyber Crime Cell', 'Special Branch'],
          },
        }),
        modelName: 'sdms-legal-advisory-ai-v1',
        advisoryOnly: true,
      },
    });

    // 6. Synthetic Timeline Events & Evidence
    const ev1 = await prisma.evidence.create({
      data: {
        caseId: case1.id,
        evidenceNumber: 'EVD-2026-0891-01',
        evidenceType: 'DIGITAL',
        description: 'Cloned hard drive (1TB SSD) containing server log dumps and routing tables.',
        location: 'Forensic Vault B-04',
        collectedBy: 'Inspector Ramesh Sharma',
      },
    });

    await prisma.timelineEvent.create({
      data: {
        caseId: case1.id,
        title: 'Initial Registration & FIR Filing',
        description: 'FIR 0891/2026 formally registered and assigned to Inspector Ramesh Sharma.',
        eventTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdBy: invUser.id,
        documentId: doc1.id,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        caseId: case1.id,
        title: 'Digital Forensic Storage Drive Seizure',
        description: 'Seized server log drive deposited into Forensic Vault under seal.',
        eventTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdBy: invUser.id,
        evidenceId: ev1.id,
      },
    });

    // 7. Initial Audit Events
    await prisma.auditEvent.create({
      data: {
        actorId: invUser.id,
        action: 'document.upload',
        resourceType: 'document',
        resourceId: doc1.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ filename: 'FIR_0891_2026_Certified.pdf', sha256 }),
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: invUser.id,
        action: 'document.verify_integrity',
        resourceType: 'document_version',
        resourceId: ver1.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ isMatch: true, sha256 }),
      },
    });
  }

  console.log('Seeding complete! Demo users ready with password "DemoPass@123".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
