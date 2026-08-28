'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shield, FileText, Download, Lock, Clock, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

export default function SharedDocumentPage() {
  const params = useParams();
  const token = params.token as string;

  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShare();
  }, [token]);

  const loadShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>(`/shared/${token}`);
      setShareData(data);
    } catch (err: any) {
      setError(err.message || 'Invalid, expired, or revoked share link.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgBase flex flex-col items-center justify-center p-4">
        <div className="text-xs text-textSecondary font-mono animate-pulse">
          Validating token & fetching shared document record...
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-bgBase flex flex-col items-center justify-center p-4">
        <div className="bg-bgSurface border border-borderDefault rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-modal">
          <div className="w-12 h-12 bg-error/15 text-error rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-textPrimary">Access Denied / Link Expired</h2>
          <p className="text-xs text-textSecondary leading-relaxed">{error}</p>
          <div className="pt-2 text-[11px] text-textSecondary font-mono border-t border-borderDefault">
            SIH SDMS Access Control & Audit Log Enforced
          </div>
        </div>
      </div>
    );
  }

  const { document, version, shareScope, expiresAt, downloadUrl, granter, disclaimer } = shareData;

  return (
    <div className="min-h-screen bg-bgBase flex flex-col">
      {/* External Topbar */}
      <header className="h-16 bg-bgSurface border-b border-borderDefault flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-sm bg-accentPrimary/20 border border-accentPrimary/40 flex items-center justify-center text-accentPrimary">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-textPrimary text-sm block">SDMS Shared Document Viewer</span>
            <span className="text-[10px] text-textSecondary font-mono block">Token-Scoped External Access</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-success bg-success/15 px-2.5 py-1 rounded-sm border border-success/30">
            Scope: {shareScope}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-4xl mx-auto space-y-6 w-full">
        {/* Banner */}
        <div className="bg-bgSurface border border-borderDefault rounded-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-xs text-accentPrimary font-bold">{document.documentType}</span>
              <h1 className="text-xl font-bold text-textPrimary">{document.title}</h1>
              <p className="text-xs text-textSecondary font-mono">
                Case Ref: {document.caseNumber} — {document.caseTitle}
              </p>
            </div>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Shared File</span>
              </a>
            )}
          </div>

          <div className="pt-4 border-t border-borderDefault grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-textSecondary font-mono">
            <div>
              <span>Granted By:</span>
              <div className="text-textPrimary font-sans font-medium">{granter?.fullName} ({granter?.email})</div>
            </div>
            <div>
              <span>Version Number:</span>
              <div className="text-textPrimary font-bold">v{version.versionNumber}</div>
            </div>
            <div>
              <span>Link Expiry:</span>
              <div className="text-textPrimary">
                {expiresAt ? new Date(expiresAt).toLocaleString() : 'No expiry'}
              </div>
            </div>
          </div>
        </div>

        {/* SHA-256 Card */}
        <div className="p-4 bg-bgSurface border border-borderDefault rounded-lg space-y-2">
          <div className="flex items-center space-x-2 text-success font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cryptographic SHA-256 File Digest</span>
          </div>
          <div className="font-mono text-xs text-textPrimary bg-bgBase p-3 rounded-sm border border-borderDefault break-all">
            {version.sha256}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-bgSurface border border-borderDefault rounded-lg text-xs text-textSecondary space-y-1">
          <div className="font-semibold text-textPrimary flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-info" />
            <span>Shared Access Security & Audit Notice</span>
          </div>
          <p className="leading-relaxed">{disclaimer}</p>
        </div>
      </main>
    </div>
  );
}
