'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Lock, Clock, AlertCircle, X, ShieldAlert } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
          <div className="flex items-center space-x-2.5">
            <Share2 className="w-5 h-5 text-accentPrimary" />
            <h3 className="text-base font-semibold text-textPrimary">Secure Document Sharing</h3>
          </div>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary p-1 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-3 bg-bgBase border border-borderDefault rounded-md text-xs space-y-1">
            <div className="text-textSecondary">Sharing Document Version:</div>
            <div className="font-mono text-textPrimary font-semibold">{filename}</div>
          </div>

          {!shareData ? (
            <div className="space-y-4">
              {/* Permission Scope */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textPrimary block">Permission Scope</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScope('VIEW_ONLY')}
                    className={`p-3 rounded-sm border text-left text-xs transition-colors ${
                      scope === 'VIEW_ONLY'
                        ? 'bg-accentPrimary/15 border-accentPrimary text-accentPrimary'
                        : 'bg-bgBase border-borderDefault text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">View-Only Access</div>
                    <div className="text-[11px] opacity-80">Recipient can preview document text/metadata only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('DOWNLOAD_ALLOWED')}
                    className={`p-3 rounded-sm border text-left text-xs transition-colors ${
                      scope === 'DOWNLOAD_ALLOWED'
                        ? 'bg-accentPrimary/15 border-accentPrimary text-accentPrimary'
                        : 'bg-bgBase border-borderDefault text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    <div className="font-semibold mb-0.5 font-sans">Download Allowed</div>
                    <div className="text-[11px] opacity-80">Recipient can download underlying file bytes</div>
                  </button>
                </div>
              </div>

              {/* Expiry Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textPrimary block">Link Expiry Duration</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                >
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-error/15 border border-error/30 rounded-md text-xs text-error">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateShare}
                disabled={loading}
                className="w-full py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-medium rounded-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Generating Encrypted Link...' : 'Generate Scoped Share Link'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-success/10 border border-success/30 rounded-md space-y-2">
                <div className="flex items-center space-x-2 text-success text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Scoped Permission Grant Created</span>
                </div>
                <div className="text-[11px] text-textSecondary">
                  Scope: <strong className="text-textPrimary">{shareData.grant.scope}</strong> | Expires:{' '}
                  <strong className="text-textPrimary">
                    {new Date(shareData.grant.expiresAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Link Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textPrimary block">Share URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareData.shareUrl}
                    className="flex-1 bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-medium rounded-sm flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-bgBase border border-borderDefault rounded-sm text-[11px] text-textSecondary space-y-1">
                <div className="font-semibold text-textPrimary flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  <span>Audit & Revocation Notice</span>
                </div>
                <p className="leading-relaxed">
                  Every access attempt via this token is audit-logged. You can revoke this link at any time from the document detail page.
                </p>
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
