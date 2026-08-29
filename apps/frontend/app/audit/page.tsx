'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { History, Filter, ShieldCheck, ChevronDown, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => {
    loadAuditTrail();
  }, [actionFilter, resourceFilter]);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      const me = await apiFetch<any>('/auth/me');
      setUser(me.user);

      let queryStr = '/audit?limit=100';
      if (actionFilter) queryStr += `&action=${encodeURIComponent(actionFilter)}`;
      if (resourceFilter) queryStr += `&resourceType=${encodeURIComponent(resourceFilter)}`;

      const data = await apiFetch<any>(queryStr);
      setAuditEvents(data.auditEvents || []);
    } catch (err: any) {
      if (err.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-accentPrimarySoft border border-accentPrimary/20 flex items-center justify-center text-accentPrimary shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-textPrimary tracking-tight">System Audit Trail</h1>
              <p className="text-xs text-textSecondary mt-0.5">
                Append-only, immutable operational and security audit log for internal compliance inspection
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#EAF8ED] border border-[#BDE8C7] rounded-full text-xs text-[#2E954A] font-semibold shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span>INSERT-ONLY IMMUTABLE LEDGER</span>
          </div>
        </div>

        {/* Filter Controls (§22) */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-textPrimary block">Filter by Action</label>
            <input
              type="text"
              placeholder="e.g. document.upload, verify..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-bgSurfaceMuted border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary font-mono focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-textPrimary block">Resource Type</label>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="w-full bg-bgSurfaceMuted border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary font-mono focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
            >
              <option value="">All Resource Types</option>
              <option value="user">user</option>
              <option value="case">case</option>
              <option value="document">document</option>
              <option value="document_version">document_version</option>
              <option value="permission_grant">permission_grant</option>
              <option value="timeline_event">timeline_event</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end justify-between">
            <span className="text-textSecondary font-mono text-[11px]">
              Showing {auditEvents.length} audited operational records
            </span>
            {(actionFilter || resourceFilter) && (
              <button
                onClick={() => {
                  setActionFilter('');
                  setResourceFilter('');
                }}
                className="text-xs text-accentPrimary font-semibold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Full-width Data Table (§9 & §22) */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-textSecondary font-mono">
              Loading immutable audit ledger...
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="p-12 text-center text-xs text-textSecondary">
              No audit records matched your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgSurfaceMuted border-b border-borderDefault text-textSecondary uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="w-8 px-4 py-3"></th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource Type</th>
                    <th className="px-4 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderDefault">
                  {auditEvents.map((ev) => {
                    const isExpanded = expandedId === ev.id;
                    return (
                      <React.Fragment key={ev.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                          className="hover:bg-bgSurfaceMuted/60 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-textSecondary">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-accentPrimary" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-textSecondary">
                            {new Date(ev.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-textPrimary">
                            {ev.actor?.fullName || 'System / Public'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-accentPrimary">
                            {ev.action}
                          </td>
                          <td className="px-4 py-3 font-mono text-textSecondary">
                            {ev.resourceType}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={ev.outcome} />
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-bgSurfaceMuted/40">
                            <td colSpan={6} className="px-6 py-4 border-b border-borderDefault">
                              <div className="space-y-2 text-xs">
                                <div className="font-bold text-textPrimary font-mono flex items-center justify-between">
                                  <span>Audit Payload & Metadata (ID: {ev.id})</span>
                                  <span className="text-[11px] text-textSecondary font-normal">
                                    IP: {ev.ipAddress || '127.0.0.1'} · Agent: {ev.userAgent || 'Web/Browser'}
                                  </span>
                                </div>
                                <pre className="p-4 bg-bgSurface border border-borderDefault rounded-xl font-mono text-[11px] text-textPrimary overflow-x-auto shadow-xs">
                                  {JSON.stringify(
                                    {
                                      actorId: ev.actorId,
                                      resourceId: ev.resourceId,
                                      ipAddress: ev.ipAddress,
                                      userAgent: ev.userAgent,
                                      metadata: ev.parsedMetadata,
                                    },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
