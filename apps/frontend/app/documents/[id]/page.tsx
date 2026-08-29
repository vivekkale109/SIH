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
  FileText,
  ShieldCheck,
  Share2,
  Download,
  Upload,
  History,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  X,
  FileCheck,
  Paperclip,
  Clock,
  Layers,
  Lock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionUploadModal, setShowVersionUploadModal] = useState(false);

  // Version upload state
  const [verFile, setVerFile] = useState<File | null>(null);
  const [uploadingVer, setUploadingVer] = useState(false);
  const [verError, setVerError] = useState<string | null>(null);

  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [docId]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const meData = await apiFetch<any>('/auth/me');
      setUser(meData.user);

      const data = await apiFetch<any>(`/documents/${docId}`);
      setDocument(data.document);

      if (data.document?.versions?.length > 0) {
        setSelectedVersion(data.document.versions[0]);
      }
    } catch (err: any) {
      if (err.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedVersion) return;
    try {
      const data = await apiFetch<any>(`/documents/${selectedVersion.id}/download`);
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verFile) return;

    setUploadingVer(true);
    setVerError(null);

    const formData = new FormData();
    formData.append('file', verFile);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/documents/${docId}/versions`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Version upload failed');

      setShowVersionUploadModal(false);
      setVerFile(null);
      loadDocument();
    } catch (err: any) {
      setVerError(err.message || 'Version upload failed');
    } finally {
      setUploadingVer(false);
    }
  };

  const copyHashToClipboard = (hashStr: string) => {
    navigator.clipboard.writeText(hashStr);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgPage flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-textSecondary font-mono">
          Loading document record & versions...
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-bgPage flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <FileText className="w-12 h-12 text-error" />
          <h2 className="text-base font-bold text-textPrimary">Document Not Found</h2>
          <Link href="/dashboard" className="px-4 py-2 bg-accentPrimary text-white text-xs font-semibold rounded-xl">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentVersionId = document.currentVersionId;

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-[1500px] w-full mx-auto space-y-6">
        {/* Breadcrumb / Back */}
        <div className="flex items-center space-x-2 text-xs text-textSecondary">
          <Link
            href={`/cases/${document.caseId}`}
            className="hover:text-textPrimary flex items-center space-x-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Case {document.case?.caseNumber || document.caseId}</span>
          </Link>
          <span>/</span>
          <span className="text-textPrimary font-semibold">{document.title}</span>
        </div>

        {/* Document Header Card (§18) */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              {/* Type / Status Pills (§13) */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs text-accentPrimary font-bold bg-accentPrimarySoft px-3 py-0.5 rounded-full">
                  {document.documentType}
                </span>
                <StatusBadge status={document.status} />
                {selectedVersion && (
                  <StatusBadge status={selectedVersion.ocrStatus || 'PENDING'} />
                )}
                <span className="px-2.5 py-0.5 bg-bgSurfaceMuted border border-borderDefault rounded-full font-mono text-[11px] font-semibold text-textPrimary">
                  Version v{selectedVersion?.versionNumber || 1} of {document.versions?.length || 1}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-textPrimary tracking-tight">{document.title}</h1>

              <div className="text-xs text-textSecondary flex items-center space-x-2">
                <span>Belongs to Case:</span>
                <Link
                  href={`/cases/${document.caseId}`}
                  className="font-semibold text-accentPrimary hover:underline"
                >
                  {document.case?.title || document.caseId} ({document.case?.caseNumber})
                </Link>
              </div>
            </div>

            {/* Action Buttons (§7 & §18) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowIntegrityModal(true)}
                className="px-4 py-2.5 bg-bgSurface hover:bg-[#EAF8ED] border border-[#BDE8C7] text-[#2E954A] text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify SHA-256 Digest</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2.5 bg-bgSurface hover:bg-accentPrimarySoft border border-accentPrimary/30 text-accentPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Document</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2.5 bg-bgSurface hover:bg-bgSurfaceMuted border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>

              <button
                onClick={() => setShowVersionUploadModal(true)}
                className="px-4 py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>+ Upload New Version</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Preview & History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Version Inspector & Text & AI */}
          <div className="lg:col-span-8 space-y-6">
            {/* Version Details Card */}
            <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-borderDefault pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-textPrimary">
                      Version Inspector — v{selectedVersion?.versionNumber}
                    </h3>
                    <span className="text-[11px] text-textSecondary font-mono">
                      Uploaded by {selectedVersion?.uploader?.fullName || 'Investigator'} on{' '}
                      {new Date(selectedVersion?.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedVersion?.id === currentVersionId ? (
                  <span className="px-3 py-1 bg-[#EAF8ED] text-[#2E954A] border border-[#BDE8C7] font-semibold text-xs rounded-full">
                    CURRENT ACTIVE VERSION
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-bgSurfaceMuted text-textSecondary border border-borderDefault font-semibold text-xs rounded-full">
                    SUPERSEDED HISTORICAL
                  </span>
                )}
              </div>

              {/* Cryptographic SHA-256 Digest Box (§18) */}
              <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-textSecondary font-medium">
                  <span className="flex items-center space-x-1.5 text-textPrimary font-semibold">
                    <FileCheck className="w-4 h-4 text-accentPrimary" />
                    <span>Cryptographic SHA-256 Byte Digest:</span>
                  </span>
                  <button
                    onClick={() => copyHashToClipboard(selectedVersion?.sha256 || '')}
                    className="text-accentPrimary hover:underline flex items-center space-x-1 text-xs font-semibold"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-textPrimary bg-bgSurface p-3 rounded-lg border border-borderDefault break-all select-all shadow-xs">
                  {selectedVersion?.sha256}
                </div>
              </div>

              {/* Attachment File Chip Pattern (§16 / §18) */}
              <div className="p-4 bg-bgSurface border border-borderDefault rounded-xl flex items-center justify-between space-x-3 shadow-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-textPrimary truncate">
                      {selectedVersion?.originalFilename}
                    </div>
                    <div className="text-[11px] text-textSecondary font-mono">
                      {selectedVersion?.sizeBytes ? `${Math.round(selectedVersion.sizeBytes / 1024)} KB` : 'Binary object'} · {selectedVersion?.mimeType}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-1.5 bg-bgSurfaceMuted hover:bg-accentPrimary hover:text-white border border-borderDefault text-textPrimary text-xs font-semibold rounded-lg transition-all"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setShowIntegrityModal(true)}
                    className="px-3.5 py-1.5 bg-bgSurfaceMuted hover:bg-success hover:text-white border border-borderDefault text-textPrimary text-xs font-semibold rounded-lg transition-all"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Extracted OCR Content / Text View */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-textPrimary block">
                  OCR Extracted Text & Metadata View
                </span>
                <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-xl font-mono text-xs text-textPrimary max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedVersion?.ocrResult?.extractedText ||
                    `[METADATA RECORD]\nFilename: ${selectedVersion?.originalFilename}\nMIME Type: ${selectedVersion?.mimeType}\nSize: ${selectedVersion?.sizeBytes} bytes\nUploaded By: ${selectedVersion?.uploader?.fullName || 'Authorized Investigator'}\n\nStorage Location: Private Encrypted Object Storage\nKey: ${selectedVersion?.storageKey}`}
                </div>
              </div>
            </div>

            {/* AI Advisory Panel */}
            <AIAssistPanel
              versionId={selectedVersion?.id}
              existingAiResults={selectedVersion?.aiResults}
              onResultGenerated={loadDocument}
            />
          </div>

          {/* Right Column: Version History & Shares */}
          <div className="lg:col-span-4 space-y-6">
            {/* Version History Card (§18) */}
            <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center space-x-2.5 border-b border-borderDefault pb-3">
                <History className="w-4 h-4 text-accentPrimary" />
                <h3 className="text-sm font-bold text-textPrimary">Version History</h3>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {document.versions.map((ver: any) => {
                  const isCurrent = ver.id === currentVersionId;
                  const isSelected = ver.id === selectedVersion?.id;

                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-[#EAF8ED]/80 border-accentPrimary text-textPrimary shadow-xs'
                          : 'bg-bgSurface border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-textPrimary">Version v{ver.versionNumber}</span>
                        {isCurrent ? (
                          <span className="text-[10px] px-2 py-0.5 bg-[#EAF8ED] text-[#2E954A] border border-[#BDE8C7] rounded-full">
                            CURRENT
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-bgSurfaceMuted text-textSecondary border border-borderDefault rounded-full">
                            SUPERSEDED
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-textSecondary font-mono truncate">
                        {ver.originalFilename}
                      </div>

                      <div className="text-[10px] text-textSecondary font-mono flex justify-between pt-1 border-t border-borderDefault/50">
                        <span>by {ver.uploader?.fullName || 'User'}</span>
                        <span>{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Shares Card (§250) */}
            <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-borderDefault pb-3">
                <span className="font-bold text-textPrimary">Active Shares & Grants</span>
                <Share2 className="w-4 h-4 text-accentPrimary" />
              </div>
              <p className="text-textSecondary text-[11px] leading-relaxed">
                Shared links are time-limited and cryptographically scoped. Every access is recorded to the immutable audit log.
              </p>
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 bg-bgSurface hover:bg-bgSurfaceMuted border border-borderDefault text-textPrimary rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                + Generate Scoped Share Link
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* SHA-256 Integrity Verification Modal */}
      {showIntegrityModal && selectedVersion && (
        <IntegrityModal
          versionId={selectedVersion.id}
          filename={selectedVersion.originalFilename}
          versionNumber={selectedVersion.versionNumber}
          recordedHash={selectedVersion.sha256}
          onClose={() => setShowIntegrityModal(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && selectedVersion && (
        <ShareModal
          versionId={selectedVersion.id}
          filename={selectedVersion.originalFilename}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Upload New Version Modal */}
      {showVersionUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <h3 className="text-base font-bold text-textPrimary">
                Upload Revised Version (v{(document.versions[0]?.versionNumber || 1) + 1})
              </h3>
              <button
                onClick={() => setShowVersionUploadModal(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadVersion} className="p-6 space-y-4">
              {verError && <div className="p-3 bg-rose-50 text-xs text-error rounded-xl">{verError}</div>}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Select Revised File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setVerFile(e.target.files?.[0] || null)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentPrimary file:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVersionUploadModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingVer}
                  className="px-5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {uploadingVer ? 'Uploading Version...' : 'Upload & Compute Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
