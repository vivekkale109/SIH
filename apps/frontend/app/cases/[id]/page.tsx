'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FolderKanban,
  FileText,
  Clock,
  ShieldCheck,
  Users,
  Plus,
  Upload,
  FileCheck,
  Search,
  X,
  AlertCircle,
  ExternalLink,
  Calendar,
  MapPin,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [caseItem, setCaseItem] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'documents' | 'timeline' | 'evidence' | 'members'>('documents');
  const [loading, setLoading] = useState(true);

  // Upload Document Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('WITNESS_STATEMENT');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTags, setDocTags] = useState('Witness, Statement, Investigation');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add Timeline Event Modal State
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventTime, setEventTime] = useState(new Date().toISOString().slice(0, 16));
  const [eventDocId, setEventDocId] = useState('');
  const [eventEvId, setEventEvId] = useState('');
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Add Evidence Modal State
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evNumber, setEvNumber] = useState(`EVD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [evType, setEvType] = useState('DIGITAL');
  const [evDesc, setEvDesc] = useState('');
  const [evLocation, setEvLocation] = useState('Forensic Evidence Locker B-01');
  const [evLoading, setEvLoading] = useState(false);

  // Add Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleInCase, setRoleInCase] = useState('INVESTIGATOR');
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const meData = await apiFetch<any>('/auth/me');
      setUser(meData.user);

      const cData = await apiFetch<any>(`/cases/${caseId}`);
      setCaseItem(cData.case);

      const docsData = await apiFetch<any>(`/cases/${caseId}/documents`);
      setDocuments(docsData.documents || []);

      const tlData = await apiFetch<any>(`/cases/${caseId}/timeline`);
      setTimelineEvents(tlData.events || []);

      const evData = await apiFetch<any>(`/cases/${caseId}/evidence`);
      setEvidenceList(evData.evidence || []);

      if (meData.user.roles.includes('Super Admin')) {
        const uData = await apiFetch<any>('/admin/users');
        setAllUsers(uData.users || []);
      }
    } catch (err: any) {
      if (err.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('title', docTitle);
    formData.append('documentType', docType);
    formData.append('tags', docTags);
    formData.append('file', docFile);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Upload failed');
      }

      setShowUploadModal(false);
      setDocTitle('');
      setDocFile(null);
      loadCaseData();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimelineLoading(true);
    try {
      await apiFetch(`/cases/${caseId}/timeline`, {
        method: 'POST',
        body: JSON.stringify({
          title: eventTitle,
          description: eventDesc,
          eventTime,
          documentId: eventDocId || undefined,
          evidenceId: eventEvId || undefined,
        }),
      });
      setShowTimelineModal(false);
      setEventTitle('');
      setEventDesc('');
      loadCaseData();
    } catch (err: any) {
      alert(err.message || 'Failed to add timeline event');
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvLoading(true);
    try {
      await apiFetch(`/cases/${caseId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          evidenceNumber: evNumber,
          evidenceType: evType,
          description: evDesc,
          location: evLocation,
        }),
      });
      setShowEvidenceModal(false);
      setEvDesc('');
      loadCaseData();
    } catch (err: any) {
      alert(err.message || 'Failed to add evidence');
    } finally {
      setEvLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setMemberLoading(true);
    try {
      await apiFetch(`/cases/${caseId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUserId,
          roleInCase,
        }),
      });
      setShowMemberModal(false);
      loadCaseData();
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    } finally {
      setMemberLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgBase flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-textSecondary font-mono">
          Loading case details...
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="min-h-screen bg-bgBase flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-error" />
          <h2 className="text-base font-semibold text-textPrimary">Case Not Found or Access Denied</h2>
          <p className="text-xs text-textSecondary">You do not have authorization to view this investigation case.</p>
          <Link href="/cases" className="px-3 py-1.5 bg-accentPrimary text-white text-xs rounded-sm">
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-bgSurface border border-borderDefault rounded-lg p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-accentPrimary font-bold">{caseItem.caseNumber}</span>
                  <StatusBadge status={caseItem.status} />
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral/10 text-textSecondary rounded-sm">
                    Priority: {caseItem.priority}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-textPrimary tracking-tight">{caseItem.title}</h1>
                {caseItem.description && (
                  <p className="text-xs text-textSecondary max-w-3xl">{caseItem.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-3.5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Case Info bar */}
            <div className="pt-4 border-t border-borderDefault grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-textSecondary">
              <div>
                <span className="block text-[11px]">Lead Investigator:</span>
                <span className="font-medium text-textPrimary">{caseItem.creator?.fullName || 'Assigned Lead'}</span>
              </div>
              <div>
                <span className="block text-[11px]">Case Members:</span>
                <span className="font-medium text-textPrimary font-mono">{caseItem.members?.length || 0} Members</span>
              </div>
              <div>
                <span className="block text-[11px]">Documents Uploaded:</span>
                <span className="font-medium text-textPrimary font-mono">{documents.length} Records</span>
              </div>
              <div>
                <span className="block text-[11px]">Created Date:</span>
                <span className="font-medium text-textPrimary font-mono">
                  {new Date(caseItem.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-borderDefault flex space-x-6">
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-accentPrimary text-accentPrimary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documents ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-accentPrimary text-accentPrimary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Investigation Timeline ({timelineEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'evidence'
                  ? 'border-accentPrimary text-accentPrimary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Seized Evidence ({evidenceList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-accentPrimary text-accentPrimary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Case Members ({caseItem.members?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="p-12 bg-bgSurface border border-borderDefault rounded-md text-center space-y-3">
                  <FileText className="w-10 h-10 text-textSecondary mx-auto opacity-50" />
                  <h3 className="text-sm font-semibold text-textPrimary">No Documents Uploaded Yet</h3>
                  <p className="text-xs text-textSecondary max-w-sm mx-auto">
                    Upload FIRs, witness statements, forensic reports, or charge sheets to this case.
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-accentPrimary text-white text-xs font-medium rounded-sm inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload First Document</span>
                  </button>
                </div>
              ) : (
                <div className="bg-bgSurface border border-borderDefault rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bgSurfaceRaised border-b border-borderDefault text-textSecondary font-mono uppercase text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Document Title</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Current Version</th>
                        <th className="px-4 py-3">SHA-256 Digest</th>
                        <th className="px-4 py-3">OCR Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderDefault">
                      {documents.map((doc) => {
                        const currentVer = doc.versions?.[0];
                        return (
                          <tr key={doc.id} className="hover:bg-bgBase/50 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/documents/${doc.id}`} className="font-semibold text-textPrimary hover:text-accentPrimary">
                                {doc.title}
                              </Link>
                              {doc.tags?.length > 0 && (
                                <div className="flex space-x-1 mt-1">
                                  {doc.tags.map((tag: string, i: number) => (
                                    <span key={i} className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral/15 text-textSecondary rounded-sm">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-accentPrimary">{doc.documentType}</span>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              v{currentVer?.versionNumber || 1}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-textSecondary">
                              {currentVer?.sha256 ? `${currentVer.sha256.substring(0, 14)}...` : 'Pending'}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={currentVer?.ocrStatus || 'PENDING'} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/documents/${doc.id}`}
                                className="px-2.5 py-1 bg-bgBase border border-borderDefault hover:border-accentPrimary text-textPrimary text-xs rounded-sm inline-flex items-center space-x-1"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTimelineModal(true)}
                  className="px-3 py-1.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Timeline Event</span>
                </button>
              </div>

              {timelineEvents.length === 0 ? (
                <div className="p-8 bg-bgSurface border border-borderDefault rounded-md text-center text-xs text-textSecondary">
                  No chronological events added to this timeline yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-borderDefault ml-4 space-y-6 py-2">
                  {timelineEvents.map((ev) => (
                    <div key={ev.id} className="relative pl-6 space-y-1.5">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-accentPrimary border-2 border-bgBase" />
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-textSecondary">
                          {new Date(ev.eventTime).toLocaleString()}
                        </span>
                        <span className="text-textSecondary">•</span>
                        <span className="text-xs text-textSecondary">By {ev.creator?.fullName || 'Officer'}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-textPrimary">{ev.title}</h4>
                      <p className="text-xs text-textSecondary leading-relaxed max-w-2xl">{ev.description}</p>

                      {ev.document && (
                        <div className="mt-2">
                          <Link
                            href={`/documents/${ev.document.id}`}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-accentPrimary/10 border border-accentPrimary/30 text-accentPrimary text-xs rounded-sm hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Linked Doc: {ev.document.title}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEvidenceModal(true)}
                  className="px-3 py-1.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Seized Evidence</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="p-4 bg-bgSurface border border-borderDefault rounded-md space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-accentPrimary font-bold">{ev.evidenceNumber}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-neutral/10 text-textSecondary rounded-sm">
                        {ev.evidenceType}
                      </span>
                    </div>
                    <p className="text-textPrimary font-medium">{ev.description}</p>
                    <div className="pt-2 border-t border-borderDefault flex justify-between text-[11px] text-textSecondary">
                      <span>Location: {ev.location || 'Vault'}</span>
                      <span>Seized: {new Date(ev.collectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {user?.roles?.includes('Super Admin') && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-3 py-1.5 bg-accentPrimary text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member to Case</span>
                  </button>
                </div>
              )}

              <div className="bg-bgSurface border border-borderDefault rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bgSurfaceRaised border-b border-borderDefault text-textSecondary font-mono uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Member Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Case Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderDefault">
                    {caseItem.members?.map((m: any) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3 font-semibold text-textPrimary">{m.user?.fullName}</td>
                        <td className="px-4 py-3 font-mono text-textSecondary">{m.user?.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-accentPrimary/15 text-accentPrimary font-mono rounded-sm">
                            {m.roleInCase}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
              <div className="flex items-center space-x-2.5">
                <Upload className="w-5 h-5 text-accentPrimary" />
                <h3 className="text-base font-semibold text-textPrimary">Upload Case Document</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-textSecondary hover:text-textPrimary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-error/15 border border-error/30 rounded-md text-xs text-error">
                  {uploadError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Witness Statement of Ramesh Kumar"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary font-mono"
                >
                  <option value="FIR">FIR (First Information Report)</option>
                  <option value="WITNESS_STATEMENT">WITNESS_STATEMENT</option>
                  <option value="POLICE_REPORT">POLICE_REPORT</option>
                  <option value="CHARGE_SHEET">CHARGE_SHEET</option>
                  <option value="COURT_FILING">COURT_FILING</option>
                  <option value="EVIDENCE_RECORD">EVIDENCE_RECORD</option>
                  <option value="FORENSIC_REPORT">FORENSIC_REPORT</option>
                  <option value="LEGAL_NOTICE">LEGAL_NOTICE</option>
                  <option value="JUDGMENT">JUDGMENT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Select File (PDF, Images, DOCX, TXT)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-accentPrimary file:text-white hover:file:bg-accentPrimaryHover"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-bgBase border border-borderDefault text-textPrimary text-xs font-medium rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-medium rounded-sm transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Hashing & Uploading...' : 'Compute SHA-256 & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Timeline Event Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
              <h3 className="text-base font-semibold text-textPrimary">Add Timeline Event</h3>
              <button onClick={() => setShowTimelineModal(false)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTimelineEvent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Event Description</label>
                <textarea
                  rows={3}
                  required
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Event Date/Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowTimelineModal(false)} className="px-4 py-2 bg-bgBase text-xs rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={timelineLoading} className="px-4 py-2 bg-accentPrimary text-white text-xs font-medium rounded-sm">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
              <h3 className="text-base font-semibold text-textPrimary">Register Evidence</h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEvidence} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Evidence Number</label>
                <input
                  type="text"
                  required
                  value={evNumber}
                  onChange={(e) => setEvNumber(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs font-mono text-textPrimary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Type</label>
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs font-mono text-textPrimary"
                >
                  <option value="DIGITAL">DIGITAL</option>
                  <option value="PHYSICAL">PHYSICAL</option>
                  <option value="FORENSIC">FORENSIC</option>
                  <option value="DOCUMENTARY">DOCUMENTARY</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Description</label>
                <textarea
                  rows={2}
                  required
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowEvidenceModal(false)} className="px-4 py-2 bg-bgBase text-xs rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={evLoading} className="px-4 py-2 bg-accentPrimary text-white text-xs font-medium rounded-sm">
                  Register Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
