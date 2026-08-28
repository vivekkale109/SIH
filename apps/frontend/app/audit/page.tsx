'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { History, Filter, ShieldCheck, ChevronDown, ChevronRight, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          <div className="border-b border-borderDefault pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-accentPrimary" />
                <h1 className="text-xl font-bold text-textPrimary tracking-tight">System Audit Log</h1>
              </div>
              <p className="text-xs text-textSecondary mt-1">
                Immutable, append-only security and operational audit trail for internal auditor inspection
              </p>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-sm text-xs text-success font-mono">
              <Lock className="w-4 h-4" />
              <span>INSERT-ONLY IMMUTABLE LOG</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-bgSurface border border-borderDefault p-4 rounded-md">
            <div className="space-y-1">
              <label className="text-xs text-textSecondary font-medium">Filter Action</label>
              <input
                type="text"
                placeholder="e.g. document.upload, verify..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-1.5 text-xs text-textPrimary font-mono focus:outline-none focus:border-accentPrimary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-textSecondary font-medium">Resource Type</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-1.5 text-xs text-textPrimary font-mono focus:outline-none focus:border-accentPrimary"
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
          </div>

          {/* Audit Events Table */}
          {loading ? (
            <div className="p-8 text-center text-xs text-textSecondary font-mono">Loading audit logs...</div>
          ) : auditEvents.length === 0 ? (
            <div className="p-12 bg-bgSurface border border-borderDefault rounded-md text-center text-xs text-textSecondary">
              No audit events matched your filter.
            </div>
          ) : (
            <div className="bg-bgSurface border border-borderDefault rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgSurfaceRaised border-b border-borderDefault text-textSecondary font-mono uppercase text-[11px]">
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
                          className="hover:bg-bgBase/50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-textSecondary">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-textSecondary">
                            {new Date(ev.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-textPrimary">
                            {ev.actor?.fullName || 'Anonymous / Public'}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-accentPrimary">
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
                          <tr className="bg-bgBase/80">
                            <td colSpan={6} className="px-6 py-3 border-b border-borderDefault">
                              <div className="space-y-2 text-[11px]">
                                <div className="font-semibold text-textPrimary font-mono">
                                  Technical Event Metadata (ID: {ev.id})
                                </div>
                                <pre className="p-3 bg-bgSurface border border-borderDefault rounded-sm font-mono text-[11px] text-textPrimary overflow-x-auto">
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
        </main>
      </div>
    </div>
  );
}
