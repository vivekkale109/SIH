'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

interface IntegrityModalProps {
  versionId: string;
  filename: string;
  versionNumber: number;
  recordedHash: string;
  onClose: () => void;
}

export const IntegrityModal: React.FC<IntegrityModalProps> = ({
  versionId,
  filename,
  versionNumber,
  recordedHash,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>(`/documents/${versionId}/verify`, {
        method: 'POST',
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to verify file integrity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-xl shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-textPrimary">SHA-256 Byte Integrity Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-bgSurfaceMuted border border-borderDefault rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-textSecondary">Document File:</span>
              <span className="font-semibold text-textPrimary">{filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">Version:</span>
              <span className="font-mono text-textPrimary font-semibold">v{versionNumber}</span>
            </div>
            <div className="flex flex-col space-y-1 pt-1 border-t border-borderDefault">
              <span className="text-textSecondary">Intake Recorded SHA-256 Digest:</span>
              <span className="font-mono text-textPrimary text-[11px] break-all bg-bgSurface p-2 rounded-lg border border-borderDefault">
                {recordedHash}
              </span>
            </div>
          </div>

          {!result && !loading && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-textSecondary leading-relaxed max-w-md mx-auto">
                Click below to fetch the stored file bytes from object storage and independently recompute its SHA-256 hash server-side.
              </p>
              <button
                onClick={handleVerify}
                className="px-5 py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Cryptographic Digest</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-accentPrimary animate-spin mx-auto" />
              <p className="text-xs text-textSecondary font-mono">
                Streaming stored object bytes & recomputing cryptographic hash...
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-error flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  result.isMatch
                    ? 'bg-[#EAF8ED] border-[#BDE8C7] text-textPrimary'
                    : 'bg-rose-50 border-rose-200 text-textPrimary'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 font-bold">
                    {result.isMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-error" />
                    )}
                    <span className={result.isMatch ? 'text-success' : 'text-error'}>
                      {result.isMatch ? 'BYTE-LEVEL INTEGRITY VERIFIED' : 'HASH MISMATCH DETECTED'}
                    </span>
                  </div>
                  <StatusBadge status={result.result} />
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 bg-bgSurface/80 rounded-lg border border-borderDefault">
                    <span className="text-textSecondary block text-[10px] uppercase font-sans font-semibold">
                      Recorded Hash:
                    </span>
                    <span className="text-textPrimary break-all">{result.recordedHash}</span>
                  </div>
                  <div className="p-2 bg-bgSurface/80 rounded-lg border border-borderDefault">
                    <span className="text-textSecondary block text-[10px] uppercase font-sans font-semibold">
                      Recomputed Hash:
                    </span>
                    <span className={`break-all ${result.isMatch ? 'text-success font-semibold' : 'text-error font-bold'}`}>
                      {result.recomputedHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Binding Scope Limitation Notice per Rules.md §17 */}
              <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl text-xs text-textSecondary space-y-1">
                <div className="font-semibold text-textPrimary flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-info" />
                  <span>Integrity Scope Limitation Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-textSecondary">
                  {result.disclaimer || 'Confirms byte-level integrity only against the intake hash; does not attest to legal admissibility, chain of custody, or substantive truth.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bgSurfaceMuted border-t border-borderDefault flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bgSurface border border-borderDefault hover:bg-bgSurfaceMuted text-textPrimary text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
