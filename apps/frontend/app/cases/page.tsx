'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  AlertCircle,
  X,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Case Modal state
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('action') === 'create');
  const [caseNumber, setCaseNumber] = useState(`CASE/2026/${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const meData = await apiFetch<any>('/auth/me');
      setUser(meData.user);

      const data = await apiFetch<any>('/cases');
      setCases(data.cases || []);
    } catch (err: any) {
      if (err.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const data = await apiFetch<any>('/cases', {
        method: 'POST',
        body: JSON.stringify({
          caseNumber,
          title,
          description,
          priority,
        }),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadCases();
      router.push(`/cases/${data.case.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create case');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesQuery =
      c.caseNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.status.toLowerCase().includes(searchFilter.toLowerCase());

    if (statusFilter === 'ALL') return matchesQuery;
    return matchesQuery && c.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-accentPrimarySoft border border-accentPrimary/20 flex items-center justify-center text-accentPrimary shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-textPrimary tracking-tight">Cases Repository</h1>
              <p className="text-xs text-textSecondary mt-0.5">
                Access-controlled digital case files, evidentiary records & investigative timelines
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-2 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Case</span>
          </button>
        </div>

        {/* Search & Filter Pill Bar */}
        <div className="bg-bgSurface border border-borderDefault p-4 rounded-2xl shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by case number, title, keywords..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-bgSurfaceMuted border border-borderDefault rounded-full pl-9 pr-4 py-2 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">Status:</span>
            {['ALL', 'ACTIVE', 'UNDER_REVIEW', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-xs font-bold'
                    : 'bg-bgSurfaceMuted text-textSecondary hover:text-textPrimary border border-borderDefault'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Cases Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-textSecondary font-mono bg-bgSurface rounded-2xl border border-borderDefault">
            Loading investigation cases repository...
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 bg-bgSurface border border-borderDefault rounded-2xl text-center space-y-3 shadow-card">
            <FolderKanban className="w-10 h-10 text-textSecondary mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-textPrimary">No Cases Found</h3>
            <p className="text-xs text-textSecondary max-w-sm mx-auto">
              No investigation cases match your active filter scope.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="bg-bgSurface border border-borderDefault hover:border-accentPrimary rounded-2xl p-5 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-accentPrimary font-bold bg-accentPrimarySoft px-2.5 py-0.5 rounded-full">
                      {c.caseNumber}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>

                  <h3 className="text-base font-bold text-textPrimary group-hover:text-accentPrimary transition-colors line-clamp-1">
                    {c.title}
                  </h3>

                  {c.description && (
                    <p className="text-xs text-textSecondary leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-borderDefault flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-textSecondary">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{c.members?.length || 1}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{c._count?.documents || 0} docs</span>
                    </span>
                  </div>

                  <Link
                    href={`/cases/${c.id}`}
                    className="px-3.5 py-1.5 bg-bgSurfaceMuted hover:bg-accentPrimary hover:text-white border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <span>Open Case</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Create Investigation Case</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-error flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Case Reference Number</label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Fraud & Financial Misconduct Investigation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Case Summary / Background</label>
                <textarea
                  rows={3}
                  placeholder="Brief background and investigative scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {createLoading ? 'Creating Case...' : 'Create Case & Assign Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bgPage p-8 text-xs text-textSecondary font-mono">Loading cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
