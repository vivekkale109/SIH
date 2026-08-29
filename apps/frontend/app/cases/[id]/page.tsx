'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { IntegrityModal } from '@/components/IntegrityModal';
import { AIAssistPanel } from '@/components/AIAssistPanel';
import { ShareModal } from '@/components/ShareModal';
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
  ArrowLeft,
  Share2,
  Download,
  Copy,
  Check,
  Paperclip,
  Tag,
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
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
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

  // Document details inside pane
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

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
      const docs = docsData.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }

      const tlData = await apiFetch<any>(`/cases/${caseId}/timeline`);
      setTimelineEvents(tlData.events || []);

      const evData = await apiFetch<any>(`/cases/${caseId}/evidence`);
      const evList = evData.evidence || [];
      setEvidenceList(evList);
      if (evList.length > 0 && !selectedEvidenceId) {
        setSelectedEvidenceId(evList[0].id);
      }

      if (meData.user?.roles?.includes('Super Admin')) {
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
      await loadCaseData();
      if (data.document?.id) {
        setSelectedDocId(data.document.id);
      }
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
      setEvNumber(`EVD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
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

  const copyHash = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];
  const selectedDocVersion = selectedDoc?.versions?.[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-bgPage flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-textSecondary font-mono">
          Loading case records...
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="min-h-screen bg-bgPage flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-error" />
          <h2 className="text-base font-bold text-textPrimary">Case Not Found or Access Denied</h2>
          <p className="text-xs text-textSecondary max-w-sm">
            You do not have authorization to view this investigation case.
          </p>
          <Link href="/cases" className="px-4 py-2 bg-accentPrimary text-white text-xs font-semibold rounded-xl">
            Return to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Case Header Card (§17) */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-textSecondary">
                <Link href="/cases" className="hover:text-textPrimary flex items-center space-x-1 font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cases</span>
                </Link>
                <span>/</span>
                <span className="font-mono text-accentPrimary font-bold">{caseItem.caseNumber}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-textPrimary tracking-tight">{caseItem.title}</h1>
                <StatusBadge status={caseItem.status} />
                <span className="px-2.5 py-0.5 bg-bgSurfaceMuted border border-borderDefault rounded-full font-mono text-[11px] font-semibold text-textPrimary">
                  Priority: {caseItem.priority}
                </span>
              </div>

              {caseItem.description && (
                <p className="text-xs text-textSecondary leading-relaxed max-w-4xl">{caseItem.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>+ Upload Document</span>
              </button>

              <button
                onClick={() => setShowTimelineModal(true)}
                className="px-4 py-2.5 bg-bgSurface hover:bg-bgSurfaceMuted border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all"
              >
                <Clock className="w-4 h-4 text-accentPrimary" />
                <span>+ Add Event</span>
              </button>

              <button
                onClick={() => setShowEvidenceModal(true)}
                className="px-4 py-2.5 bg-bgSurface hover:bg-bgSurfaceMuted border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>+ Register Evidence</span>
              </button>
            </div>
          </div>

          {/* Members / Meta Strip */}
          <div className="pt-4 border-t border-borderDefault flex flex-wrap items-center justify-between gap-4 text-xs text-textSecondary">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium">Lead Officer:</span>
                <span className="font-semibold text-textPrimary">{caseItem.creator?.fullName || 'Assigned Lead'}</span>
              </div>
              <span>·</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium">Assigned Team:</span>
                <div className="flex items-center -space-x-1.5">
                  {caseItem.members?.map((m: any, idx: number) => (
                    <div
                      key={m.id}
                      title={`${m.user?.fullName} (${m.roleInCase})`}
                      className="w-6 h-6 rounded-full bg-accentPrimarySoft border-2 border-white text-accentPrimary flex items-center justify-center text-[10px] font-bold shadow-xs"
                    >
                      {m.user?.fullName?.charAt(0) || 'U'}
                    </div>
                  ))}
                </div>
                <span className="font-mono text-[11px]">({caseItem.members?.length || 1})</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono text-[11px]">
              <span>Created: {new Date(caseItem.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span>{documents.length} Docs / {evidenceList.length} Evidence</span>
            </div>
          </div>
        </div>

        {/* Tab Row (§17) */}
        <div className="flex items-center space-x-2 border-b border-borderDefault pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${
              activeTab === 'documents'
                ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-sm font-bold'
                : 'bg-bgSurface text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted border border-borderDefault'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${
              activeTab === 'timeline'
                ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-sm font-bold'
                : 'bg-bgSurface text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted border border-borderDefault'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Investigation Timeline ({timelineEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${
              activeTab === 'evidence'
                ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-sm font-bold'
                : 'bg-bgSurface text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted border border-borderDefault'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seized Evidence ({evidenceList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${
              activeTab === 'members'
                ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-sm font-bold'
                : 'bg-bgSurface text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted border border-borderDefault'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Case Members ({caseItem.members?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: DOCUMENTS (Two-Pane view per Design.md §17) */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            {/* Left Pane: Documents Row-List */}
            <div className="lg:col-span-5 bg-bgSurface border border-borderDefault rounded-2xl p-5 shadow-card flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-borderDefault">
                  <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                    Case Documents ({documents.length})
                  </span>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-xs text-accentPrimary font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </button>
                </div>

                {documents.length === 0 ? (
                  <div className="p-8 bg-bgSurfaceMuted rounded-xl text-center space-y-2">
                    <FileText className="w-8 h-8 text-textSecondary mx-auto opacity-50" />
                    <p className="text-xs text-textSecondary">No documents uploaded to this case yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {documents.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      const currentVer = doc.versions?.[0];
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-[#EAF8ED]/70 border-accentPrimary shadow-xs'
                              : 'bg-bgSurface border-borderDefault hover:border-accentPrimary/40 hover:bg-bgSurfaceMuted'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-accentPrimary">
                              {doc.documentType}
                            </span>
                            <StatusBadge status={currentVer?.ocrStatus || 'PENDING'} />
                          </div>

                          <h3 className="text-xs font-bold text-textPrimary line-clamp-1">{doc.title}</h3>

                          <div className="flex items-center justify-between text-[11px] text-textSecondary font-mono pt-1 border-t border-borderDefault/50">
                            <span>v{currentVer?.versionNumber || 1}</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Selected Document Detail Inspector */}
            <div className="lg:col-span-7 bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-5">
              {selectedDoc ? (
                <div className="space-y-5">
                  {/* Doc Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderDefault pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-accentPrimary font-bold bg-accentPrimarySoft px-2.5 py-0.5 rounded-full">
                          {selectedDoc.documentType}
                        </span>
                        <StatusBadge status={selectedDoc.status} />
                        {selectedDocVersion && (
                          <StatusBadge status={selectedDocVersion.ocrStatus || 'PENDING'} />
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-textPrimary">{selectedDoc.title}</h2>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Link
                        href={`/documents/${selectedDoc.id}`}
                        className="px-3.5 py-1.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-xs"
                      >
                        <span>Full Inspector</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Digest Box (§18) */}
                  <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-textPrimary flex items-center space-x-1.5">
                        <FileCheck className="w-4 h-4 text-accentPrimary" />
                        <span>SHA-256 Byte Digest (v{selectedDocVersion?.versionNumber || 1})</span>
                      </span>
                      <button
                        onClick={() => copyHash(selectedDocVersion?.sha256 || '')}
                        className="text-accentPrimary hover:underline flex items-center space-x-1 text-xs font-medium"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-textPrimary bg-bgSurface p-2.5 rounded-lg border border-borderDefault break-all select-all">
                      {selectedDocVersion?.sha256 || 'Digest calculation pending'}
                    </div>
                  </div>

                  {/* Attachment Chip Pattern (§16 / §18) */}
                  <div className="p-3.5 bg-bgSurface border border-borderDefault rounded-xl flex items-center justify-between space-x-3 shadow-xs">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accentPrimarySoft flex items-center justify-center text-accentPrimary shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-textPrimary truncate">
                          {selectedDocVersion?.originalFilename || 'Document File'}
                        </div>
                        <div className="text-[10px] text-textSecondary font-mono">
                          {selectedDocVersion?.sizeBytes ? `${Math.round(selectedDocVersion.sizeBytes / 1024)} KB` : 'Binary object'} · {selectedDocVersion?.mimeType || 'PDF/Doc'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowIntegrityModal(true)}
                        className="px-3 py-1 bg-bgSurfaceMuted hover:bg-success hover:text-white border border-borderDefault text-textPrimary text-xs font-semibold rounded-lg transition-all"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="px-3 py-1 bg-bgSurfaceMuted hover:bg-accentPrimary hover:text-white border border-borderDefault text-textPrimary text-xs font-semibold rounded-lg transition-all"
                      >
                        Share
                      </button>
                    </div>
                  </div>

                  {/* OCR Extracted Text Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-textPrimary block">Extracted Text Content</span>
                    <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-xl font-mono text-xs text-textPrimary max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {selectedDocVersion?.ocrResult?.extractedText ||
                        'No OCR text extracted yet or OCR processing is currently in queue.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-textSecondary">
                  Select a document from the left to view its cryptographic digest and text content.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TIMELINE (§21) */}
        {activeTab === 'timeline' && (
          <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-borderDefault pb-4">
              <div>
                <h3 className="text-base font-bold text-textPrimary">Chronological Investigation Timeline</h3>
                <p className="text-xs text-textSecondary">Events, witness contacts, and seizure checkpoints</p>
              </div>
              <button
                onClick={() => setShowTimelineModal(true)}
                className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="p-12 bg-bgSurfaceMuted rounded-xl text-center text-xs text-textSecondary">
                No events recorded in this case timeline yet.
              </div>
            ) : (
              <div className="relative border-l-2 border-accentPrimary/40 ml-4 space-y-6 py-2">
                {timelineEvents.map((ev) => (
                  <div key={ev.id} className="relative pl-6 space-y-1.5">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-accentPrimary border-2 border-white shadow-xs" />
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-accentPrimary">
                        {new Date(ev.eventTime).toLocaleString()}
                      </span>
                      <span className="text-textSecondary">·</span>
                      <span className="text-xs text-textSecondary">by {ev.creator?.fullName || 'Investigator'}</span>
                    </div>
                    <h4 className="text-sm font-bold text-textPrimary">{ev.title}</h4>
                    <p className="text-xs text-textSecondary leading-relaxed max-w-3xl">{ev.description}</p>

                    {ev.document && (
                      <div className="pt-1">
                        <Link
                          href={`/documents/${ev.document.id}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1 bg-accentPrimarySoft text-accentPrimary text-xs font-semibold rounded-full hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Linked Document: {ev.document.title}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EVIDENCE (§19) */}
        {activeTab === 'evidence' && (
          <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-borderDefault pb-4">
              <div>
                <h3 className="text-base font-bold text-textPrimary">Seized Physical & Digital Evidence</h3>
                <p className="text-xs text-textSecondary">Chain of custody logs and secure locker registries</p>
              </div>
              <button
                onClick={() => setShowEvidenceModal(true)}
                className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Seized Evidence</span>
              </button>
            </div>

            {evidenceList.length === 0 ? (
              <div className="p-12 bg-bgSurfaceMuted rounded-xl text-center text-xs text-textSecondary">
                No seized evidence logged for this investigation.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-accentPrimary font-bold">{ev.evidenceNumber}</span>
                      <span className="px-2.5 py-0.5 bg-white border border-borderDefault text-textPrimary rounded-full text-[10px] font-semibold">
                        {ev.evidenceType}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-textPrimary leading-relaxed">{ev.description}</p>
                    <div className="pt-2 border-t border-borderDefault flex justify-between text-[11px] text-textSecondary font-mono">
                      <span>Locker: {ev.location || 'Vault'}</span>
                      <span>{new Date(ev.collectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEMBERS (§23) */}
        {activeTab === 'members' && (
          <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-borderDefault pb-4">
              <div>
                <h3 className="text-base font-bold text-textPrimary">Case Investigation Team</h3>
                <p className="text-xs text-textSecondary">Authorized officers and prosecutors with scoped access</p>
              </div>
              {user?.roles?.includes('Super Admin') && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member to Case</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgSurfaceMuted border-b border-borderDefault text-textSecondary uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Role In Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderDefault">
                  {caseItem.members?.map((m: any) => (
                    <tr key={m.id} className="hover:bg-bgSurfaceMuted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-textPrimary flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-accentPrimarySoft text-accentPrimary font-bold flex items-center justify-center text-xs">
                          {m.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span>{m.user?.fullName}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-textSecondary">{m.user?.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 bg-accentPrimarySoft text-accentPrimary font-bold rounded-full text-[11px]">
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

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Upload Case Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-error">
                  {uploadError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Witness Statement of Ramesh Kumar"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary font-mono"
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
                <label className="text-xs font-semibold text-textPrimary block">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Select File (PDF, Images, DOCX, TXT)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentPrimary file:text-white hover:file:bg-accentPrimaryHover"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {uploading ? 'Hashing & Uploading...' : 'Compute SHA-256 & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <h3 className="text-base font-bold text-textPrimary">Add Timeline Event</h3>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddTimelineEvent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Description</label>
                <textarea
                  rows={3}
                  required
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Event Date / Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={timelineLoading}
                  className="px-5 py-2 bg-accentPrimary text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Save Timeline Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <h3 className="text-base font-bold text-textPrimary">Register Seized Evidence</h3>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddEvidence} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Evidence Reference Number</label>
                <input
                  type="text"
                  required
                  value={evNumber}
                  onChange={(e) => setEvNumber(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Evidence Type</label>
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                >
                  <option value="DIGITAL">DIGITAL (Drive, Phone, USB, Hash Log)</option>
                  <option value="PHYSICAL">PHYSICAL (Document, Weapon, Clothing)</option>
                  <option value="FORENSIC">FORENSIC (Lab Sample, Bio-Sample)</option>
                  <option value="DOCUMENTARY">DOCUMENTARY (Contract, Ledger, Receipt)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Description</label>
                <textarea
                  rows={2}
                  required
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evLoading}
                  className="px-5 py-2 bg-accentPrimary text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Register Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <h3 className="text-base font-bold text-textPrimary">Assign Member to Case</h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                >
                  <option value="">Select an investigator / prosecutor...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email}) - {u.roles?.[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Role in Case</label>
                <select
                  value={roleInCase}
                  onChange={(e) => setRoleInCase(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary font-mono"
                >
                  <option value="INVESTIGATOR">INVESTIGATOR</option>
                  <option value="REVIEWER">REVIEWER</option>
                  <option value="PROSECUTOR">PROSECUTOR</option>
                  <option value="FORENSIC_EXAMINER">FORENSIC_EXAMINER</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberLoading}
                  className="px-5 py-2 bg-accentPrimary text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Assign to Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHA-256 Integrity Verification Modal */}
      {showIntegrityModal && selectedDocVersion && (
        <IntegrityModal
          versionId={selectedDocVersion.id}
          filename={selectedDocVersion.originalFilename}
          versionNumber={selectedDocVersion.versionNumber}
          recordedHash={selectedDocVersion.sha256}
          onClose={() => setShowIntegrityModal(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocVersion && (
        <ShareModal
          versionId={selectedDocVersion.id}
          filename={selectedDocVersion.originalFilename}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
