'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shield, FileText, Download, Lock, Clock, AlertCircle, ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

export default function SharedDocumentPage() {
  const params = useParams();
  const token = params.token as string;

  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

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

  const copyHash = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgPage flex flex-col items-center justify-center p-4">
        <div className="text-xs text-textSecondary font-mono animate-pulse">
          Validating cryptographic token & loading shared document record...
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-bgPage flex flex-col items-center justify-center p-4">
        <div className="bg-bgSurface border border-borderDefault rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-modal">
          <div className="w-12 h-12 bg-rose-50 text-error rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-textPrimary">Access Denied / Link Expired</h2>
          <p className="text-xs text-textSecondary leading-relaxed">{error}</p>
          <div className="pt-3 text-[11px] text-textSecondary font-mono border-t border-borderDefault">
            SIH SDMS Access Control & Audit Log Enforced
          </div>
        </div>
      </div>
    );
  }

  const { document, version, shareScope, expiresAt, downloadUrl, granter, disclaimer } = shareData;

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      {/* External Topbar */}
      <header className="h-16 bg-bgSurface border-b border-borderDefault flex items-center justify-between px-6 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-textPrimary text-sm block">SDMS Shared Document Viewer</span>
            <span className="text-[10px] text-textSecondary font-mono block">Token-Scoped External Access</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#2E954A] bg-[#EAF8ED] px-3 py-1 rounded-full border border-[#BDE8C7]">
            Scope: {shareScope}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        {/* Banner Card */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="font-mono text-xs text-accentPrimary font-bold bg-accentPrimarySoft px-2.5 py-0.5 rounded-full">
                {document.documentType}
              </span>
              <h1 className="text-2xl font-bold text-textPrimary">{document.title}</h1>
              <p className="text-xs text-textSecondary font-mono">
                Case Ref: {document.caseNumber} — {document.caseTitle}
              </p>
            </div>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Shared File</span>
              </a>
            )}
          </div>

          <div className="pt-4 border-t border-borderDefault grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-textSecondary">
            <div className="space-y-0.5">
              <span className="text-[11px] block">Granted By:</span>
              <div className="text-textPrimary font-semibold">{granter?.fullName} ({granter?.email})</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] block">Version Number:</span>
              <div className="text-textPrimary font-bold font-mono">v{version.versionNumber}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] block">Link Expiry:</span>
              <div className="text-textPrimary font-semibold">
                {expiresAt ? new Date(expiresAt).toLocaleString() : 'No expiry set'}
              </div>
            </div>
          </div>
        </div>

        {/* SHA-256 Card */}
        <div className="p-5 bg-bgSurface border border-borderDefault rounded-2xl shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-success font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cryptographic SHA-256 Byte Digest</span>
            </div>
            <button
              onClick={() => copyHash(version.sha256)}
              className="text-accentPrimary hover:underline flex items-center space-x-1 text-xs font-semibold"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-textPrimary bg-bgSurfaceMuted p-3 rounded-xl border border-borderDefault break-all select-all">
            {version.sha256}
          </div>
        </div>

        {/* Disclaimer Card */}
        <div className="p-5 bg-bgSurface border border-borderDefault rounded-2xl shadow-card text-xs text-textSecondary space-y-1.5">
          <div className="font-bold text-textPrimary flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-info" />
            <span>Shared Access Security & Audit Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-textSecondary">
            {disclaimer || 'Access to this record is monitored and logged in an immutable audit trail per security compliance standards.'}
          </p>
        </div>
      </main>
    </div>
  );
}
