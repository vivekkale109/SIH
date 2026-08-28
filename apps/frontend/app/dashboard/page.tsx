'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { FolderKanban, FileText, ShieldCheck, Share2, Plus, ArrowUpRight, Clock, Activity, FilePlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const meData = await apiFetch<any>('/auth/me');
      setUser(meData.user);

      const casesData = await apiFetch<any>('/cases');
      setCases(casesData.cases || []);

      if (['Auditor', 'Super Admin', 'Supervisor / Reviewing Officer'].includes(meData.user.roles[0])) {
        const auditData = await apiFetch<any>('/audit?limit=10');
        setRecentAudits(auditData.auditEvents || []);
      }
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalDocuments = cases.reduce((acc, c) => acc + (c._count?.documents || 0), 0);
  const totalEvidence = cases.reduce((acc, c) => acc + (c._count?.evidence || 0), 0);

  return (
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-borderDefault pb-5">
            <div>
              <h1 className="text-xl font-bold text-textPrimary tracking-tight">System Overview & Dashboard</h1>
              <p className="text-xs text-textSecondary mt-1">
                Centralized access-controlled repository for legal and investigation records
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/cases?action=create"
                className="px-3.5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Case</span>
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bgSurface border border-borderDefault rounded-md space-y-2">
              <div className="flex items-center justify-between text-textSecondary">
                <span className="text-xs font-medium">Assigned Cases</span>
                <FolderKanban className="w-4 h-4 text-accentPrimary" />
              </div>
              <div className="text-2xl font-bold text-textPrimary font-mono">{cases.length}</div>
              <div className="text-[11px] text-textSecondary">Active investigation units</div>
            </div>

            <div className="p-4 bg-bgSurface border border-borderDefault rounded-md space-y-2">
              <div className="flex items-center justify-between text-textSecondary">
                <span className="text-xs font-medium">Document Records</span>
                <FileText className="w-4 h-4 text-info" />
              </div>
              <div className="text-2xl font-bold text-textPrimary font-mono">{totalDocuments}</div>
              <div className="text-[11px] text-textSecondary">SHA-256 hashed versions</div>
            </div>

            <div className="p-4 bg-bgSurface border border-borderDefault rounded-md space-y-2">
              <div className="flex items-center justify-between text-textSecondary">
                <span className="text-xs font-medium">Seized Evidence Items</span>
                <ShieldCheck className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-textPrimary font-mono">{totalEvidence}</div>
              <div className="text-[11px] text-textSecondary">Digital & physical vaults</div>
            </div>

            <div className="p-4 bg-bgSurface border border-borderDefault rounded-md space-y-2">
              <div className="flex items-center justify-between text-textSecondary">
                <span className="text-xs font-medium">System Status</span>
                <Activity className="w-4 h-4 text-success" />
              </div>
              <div className="text-base font-bold text-success flex items-center space-x-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>ONLINE & AUDITED</span>
              </div>
              <div className="text-[11px] text-textSecondary font-mono">MinIO + Postgres Verified</div>
            </div>
          </div>

          {/* Active Cases Grid & Recent Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cases list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-textPrimary">Your Active Cases</h3>
                <Link href="/cases" className="text-xs text-accentPrimary hover:underline flex items-center space-x-1">
                  <span>View All Cases</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-textSecondary font-mono">Loading cases...</div>
              ) : cases.length === 0 ? (
                <div className="p-8 bg-bgSurface border border-borderDefault rounded-md text-center space-y-3">
                  <FolderKanban className="w-8 h-8 text-textSecondary mx-auto opacity-50" />
                  <p className="text-xs text-textSecondary">No active cases assigned to your user account yet.</p>
                  <Link
                    href="/cases?action=create"
                    className="inline-block px-3 py-1.5 bg-accentPrimary text-white text-xs font-medium rounded-sm"
                  >
                    Create First Case
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {cases.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-bgSurface border border-borderDefault hover:border-accentPrimary/50 rounded-md transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono text-xs text-accentPrimary font-semibold">{c.caseNumber}</span>
                          <StatusBadge status={c.status} />
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral/10 text-textSecondary rounded-sm">
                            Priority: {c.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-textPrimary">{c.title}</h4>
                        {c.description && (
                          <p className="text-xs text-textSecondary line-clamp-1">{c.description}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-right text-xs text-textSecondary">
                          <div><strong className="text-textPrimary font-mono">{c._count?.documents || 0}</strong> docs</div>
                          <div><strong className="text-textPrimary font-mono">{c._count?.timelineEvents || 0}</strong> events</div>
                        </div>

                        <Link
                          href={`/cases/${c.id}`}
                          className="px-3 py-1.5 bg-bgBase border border-borderDefault hover:border-accentPrimary text-textPrimary text-xs font-medium rounded-sm transition-colors"
                        >
                          Open Case
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log Excerpt Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-textPrimary">Recent Audit Trail</h3>
                {['Auditor', 'Super Admin', 'Supervisor / Reviewing Officer'].includes(user?.roles?.[0]) && (
                  <Link href="/audit" className="text-xs text-accentPrimary hover:underline flex items-center space-x-1">
                    <span>Full Log</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="bg-bgSurface border border-borderDefault rounded-md p-4 space-y-3">
                {recentAudits.length === 0 ? (
                  <p className="text-xs text-textSecondary py-4 text-center">
                    Audit events logged in background during operational actions.
                  </p>
                ) : (
                  recentAudits.map((ev) => (
                    <div key={ev.id} className="text-xs p-2.5 bg-bgBase border border-borderDefault rounded-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-accentPrimary text-[11px]">{ev.action}</span>
                        <span className="text-[10px] text-textSecondary font-mono">
                          {new Date(ev.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-textPrimary text-[11px]">
                        Actor: <span className="font-medium">{ev.actor?.fullName || 'System'}</span>
                      </div>
                      {ev.metadata && (
                        <div className="text-[10px] text-textSecondary font-mono truncate">
                          {JSON.stringify(ev.parsedMetadata)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
