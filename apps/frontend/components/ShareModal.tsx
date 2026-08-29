'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Lock, Clock, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ShareModalProps {
  versionId: string;
  filename: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ versionId, filename, onClose }) => {
  const [scope, setScope] = useState<'VIEW_ONLY' | 'DOWNLOAD_ALLOWED'>('VIEW_ONLY');
  const [expiryHours, setExpiryHours] = useState(48);
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>(`/documents/${versionId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          scope,
          expiryHours,
        }),
      });
      setShareData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareData?.shareUrl) {
      navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-textPrimary">Generate Scoped Share Link</h3>
          </div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl text-xs space-y-1">
            <div className="text-textSecondary">Target Document:</div>
            <div className="font-semibold text-textPrimary">{filename}</div>
          </div>

          {!shareData ? (
            <div className="space-y-4">
              {/* Permission Scope */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-textPrimary block">Permission Scope</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScope('VIEW_ONLY')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      scope === 'VIEW_ONLY'
                        ? 'bg-accentPrimarySoft border-accentPrimary text-accentPrimary font-bold shadow-sm'
                        : 'bg-bgSurface border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">View-Only Preview</div>
                    <div className="text-[11px] font-normal opacity-80 leading-relaxed">
                      Recipient can only inspect metadata and OCR text
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('DOWNLOAD_ALLOWED')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      scope === 'DOWNLOAD_ALLOWED'
                        ? 'bg-accentPrimarySoft border-accentPrimary text-accentPrimary font-bold shadow-sm'
                        : 'bg-bgSurface border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">Download Permitted</div>
                    <div className="text-[11px] font-normal opacity-80 leading-relaxed">
                      Recipient can download the raw binary file bytes
                    </div>
                  </button>
                </div>
              </div>

              {/* Expiry Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-textPrimary block">Link Expiry Duration</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary transition-all"
                >
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={168}>7 Days (1 Week)</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-error">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateShare}
                disabled={loading}
                className="w-full py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Generating Cryptographic Token...' : 'Create Audited Share Link'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#EAF8ED] border border-[#BDE8C7] rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-[#2E954A] text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>Scoped Permission Token Created</span>
                </div>
                <div className="text-[11px] text-textSecondary">
                  Scope:{' '}
                  <span className="font-semibold text-textPrimary px-2 py-0.5 bg-white rounded-full border border-[#BDE8C7] ml-1">
                    {shareData.grant?.scope}
                  </span>{' '}
                  · Expires:{' '}
                  <strong className="text-textPrimary">
                    {new Date(shareData.grant?.expiresAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Link Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-textPrimary block">Shareable URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareData.shareUrl}
                    className="flex-1 bg-bgSurfaceMuted border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl text-xs text-textSecondary space-y-1">
                <div className="font-semibold text-textPrimary flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  <span>Access Logging & Revocation</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every access attempt through this link is recorded in the immutable audit log. You can revoke this grant anytime.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bgSurfaceMuted border-t border-borderDefault flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary hover:bg-bgSurfaceMuted text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
