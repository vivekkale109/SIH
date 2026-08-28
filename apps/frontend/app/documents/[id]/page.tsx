'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
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
        setSelectedVersion(data.document.versions[0]); // newest version default
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
      <div className="min-h-screen bg-bgBase flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-textSecondary font-mono">
          Loading document record & versions...
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-bgBase flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <FileText className="w-10 h-10 text-error" />
          <h2 className="text-base font-semibold text-textPrimary">Document Not Found</h2>
          <Link href="/dashboard" className="px-3 py-1.5 bg-accentPrimary text-white text-xs rounded-sm">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentVersionId = document.currentVersionId;

  return (
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          {/* Breadcrumb / Back */}
          <div className="flex items-center space-x-2 text-xs text-textSecondary">
            <Link href={`/cases/${document.caseId}`} className="hover:text-textPrimary flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Case {document.case?.caseNumber || ''}</span>
            </Link>
            <span>/</span>
            <span className="text-textPrimary font-mono">{document.title}</span>
          </div>

          {/* Document Header Card */}
          <div className="bg-bgSurface border border-borderDefault rounded-lg p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs text-accentPrimary font-bold">{document.documentType}</span>
                  <StatusBadge status={document.status} />
                  {selectedVersion && (
                    <StatusBadge status={selectedVersion.ocrStatus || 'PENDING'} />
                  )}
                </div>
                <h1 className="text-xl font-bold text-textPrimary tracking-tight">{document.title}</h1>
                <div className="text-xs text-textSecondary font-mono">
                  Belongs to Case: <strong className="text-textPrimary">{document.case?.title || document.caseId}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowIntegrityModal(true)}
                  className="px-3.5 py-2 bg-success/15 hover:bg-success/25 border border-success/40 text-success text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify SHA-256 Digest</span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3.5 py-2 bg-accentPrimary/15 hover:bg-accentPrimary/25 border border-accentPrimary/40 text-accentPrimary text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Document</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3.5 py-2 bg-bgBase hover:bg-bgSurfaceRaised border border-borderDefault text-textPrimary text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>

                <button
                  onClick={() => setShowVersionUploadModal(true)}
                  className="px-3.5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload New Version</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid: Preview & Sidebar Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Document Preview & Extracted Text */}
            <div className="lg:col-span-2 space-y-6">
              {/* Document Version Inspector */}
              <div className="bg-bgSurface border border-borderDefault rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-borderDefault pb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-accentPrimary" />
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Version Inspector — v{selectedVersion?.versionNumber}
                    </h3>
                  </div>

                  {selectedVersion?.id === currentVersionId ? (
                    <span className="px-2.5 py-0.5 bg-success/15 text-success border border-success/30 font-mono text-[10px] rounded-sm">
                      CURRENT VERSION
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-neutral/15 text-textSecondary border border-borderDefault font-mono text-[10px] rounded-sm">
                      SUPERSEDED HISTORICAL VERSION
                    </span>
                  )}
                </div>

                {/* Hash Box */}
                <div className="p-3 bg-bgBase border border-borderDefault rounded-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-textSecondary">
                    <span>Cryptographic SHA-256 Digest:</span>
                    <button
                      onClick={() => copyHashToClipboard(selectedVersion?.sha256 || '')}
                      className="text-accentPrimary hover:underline flex items-center space-x-1 text-[11px]"
                    >
                      {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-textPrimary break-all bg-bgSurface p-2 rounded-sm border border-borderDefault">
                    {selectedVersion?.sha256}
                  </div>
                </div>

                {/* Extracted OCR Content / Text View */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-textPrimary block">
                    OCR Extracted Text & Metadata Content
                  </span>
                  <div className="p-4 bg-bgBase border border-borderDefault rounded-sm font-mono text-xs text-textPrimary max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {selectedVersion?.ocrResult?.extractedText ||
                      `[PREVIEW RECORD]\nFilename: ${selectedVersion?.originalFilename}\nMIME Type: ${selectedVersion?.mimeType}\nSize: ${selectedVersion?.sizeBytes} bytes\nUploaded By: ${selectedVersion?.uploader?.fullName || 'Authorized Investigator'}\n\nFile is stored securely in private object storage under key:\n${selectedVersion?.storageKey}`}
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

            {/* Right Col: Version History & Metadata */}
            <div className="space-y-6">
              {/* Version History Card */}
              <div className="bg-bgSurface border border-borderDefault rounded-lg p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-borderDefault pb-3">
                  <History className="w-4 h-4 text-accentPrimary" />
                  <h3 className="text-sm font-semibold text-textPrimary">Version History</h3>
                </div>

                <div className="space-y-2">
                  {document.versions.map((ver: any) => {
                    const isCurrent = ver.id === currentVersionId;
                    const isSelected = ver.id === selectedVersion?.id;

                    return (
                      <div
                        key={ver.id}
                        onClick={() => setSelectedVersion(ver)}
                        className={`p-3 rounded-md border text-xs cursor-pointer transition-colors space-y-1.5 ${
                          isSelected
                            ? 'bg-accentPrimary/15 border-accentPrimary text-textPrimary'
                            : 'bg-bgBase border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceRaised'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="font-mono text-textPrimary">Version v{ver.versionNumber}</span>
                          {isCurrent ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-success/15 text-success rounded-sm">
                              CURRENT
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral/15 text-textSecondary rounded-sm">
                              SUPERSEDED
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-textSecondary font-mono truncate">
                          File: {ver.originalFilename}
                        </div>

                        <div className="text-[10px] text-textSecondary font-mono flex justify-between pt-1 border-t border-borderDefault/50">
                          <span>By: {ver.uploader?.fullName || 'User'}</span>
                          <span>{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Shares Card */}
              <div className="bg-bgSurface border border-borderDefault rounded-lg p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-borderDefault pb-2">
                  <span className="font-semibold text-textPrimary">Active Permission Grants</span>
                  <Share2 className="w-4 h-4 text-accentPrimary" />
                </div>
                <p className="text-textSecondary text-[11px]">
                  Shares created for this version are scoped and expiring. All access is logged to the immutable audit trail.
                </p>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-1.5 bg-bgBase border border-borderDefault hover:border-accentPrimary text-textPrimary rounded-sm text-xs font-medium"
                >
                  Create New Share Link
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
              <h3 className="text-base font-semibold text-textPrimary">Upload Revised Version (v{(document.versions[0]?.versionNumber || 1) + 1})</h3>
              <button onClick={() => setShowVersionUploadModal(false)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadVersion} className="p-6 space-y-4">
              {verError && <div className="p-3 bg-error/15 text-xs text-error rounded-sm">{verError}</div>}
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Select File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setVerFile(e.target.files?.[0] || null)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowVersionUploadModal(false)} className="px-4 py-2 bg-bgBase text-xs rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={uploadingVer} className="px-4 py-2 bg-accentPrimary text-white text-xs font-semibold rounded-sm">
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
