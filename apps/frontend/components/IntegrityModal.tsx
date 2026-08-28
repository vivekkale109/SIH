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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-xl shadow-modal overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-accentPrimary" />
            <h3 className="text-base font-semibold text-textPrimary">SHA-256 Integrity Verification</h3>
          </div>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary p-1 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-bgBase border border-borderDefault rounded-md p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-textSecondary">Document File:</span>
              <span className="font-mono text-textPrimary">{filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">Version:</span>
              <span className="font-mono text-textPrimary">v{versionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">Recorded Hash:</span>
              <span className="font-mono text-accentPrimary text-[11px] break-all">{recordedHash}</span>
            </div>
          </div>

          {!result && !loading && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-textSecondary leading-relaxed">
                Click below to fetch the stored file bytes from object storage and recompute its SHA-256 hash server-side.
              </p>
              <button
                onClick={handleVerify}
                className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-medium rounded-sm inline-flex items-center space-x-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Re-Verify Hash Now</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-accentPrimary animate-spin mx-auto" />
              <p className="text-xs text-textSecondary font-mono">Fetching stored object bytes & recomputing SHA-256 digest...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-error/15 border border-error/30 rounded-md text-xs text-error flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-md border ${
                  result.isMatch
                    ? 'bg-success/10 border-success/30 text-textPrimary'
                    : 'bg-error/15 border-error/30 text-textPrimary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 font-semibold">
                    {result.isMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-error" />
                    )}
                    <span className={result.isMatch ? 'text-success' : 'text-error'}>
                      {result.isMatch ? 'HASH MATCH CONFIRMED' : 'HASH MISMATCH DETECTED'}
                    </span>
                  </div>
                  <StatusBadge status={result.result} />
                </div>

                <div className="space-y-1.5 text-xs font-mono mt-3">
                  <div>
                    <span className="text-textSecondary">Recorded Hash: </span>
                    <span className="text-textPrimary">{result.recordedHash}</span>
                  </div>
                  <div>
                    <span className="text-textSecondary">Recomputed Hash: </span>
                    <span className={result.isMatch ? 'text-success' : 'text-error font-bold'}>
                      {result.recomputedHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Binding Disclaimer per Rules.md §17 */}
              <div className="p-3 bg-bgBase border border-borderDefault rounded-sm text-[11px] text-textSecondary space-y-1">
                <div className="font-semibold text-textPrimary flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-info" />
                  <span>Integrity Scope Notice</span>
                </div>
                <p className="leading-relaxed">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bgSurfaceRaised border-t border-borderDefault flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-bgBase border border-borderDefault text-textPrimary hover:bg-bgSurface text-xs font-medium rounded-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
