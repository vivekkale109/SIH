'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { FolderKanban, Plus, Search, Filter, ShieldCheck, X, Users, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

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

  const filteredCases = cases.filter(
    (c) =>
      c.caseNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.status.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-borderDefault pb-5">
            <div>
              <h1 className="text-xl font-bold text-textPrimary tracking-tight">Cases Repository</h1>
              <p className="text-xs text-textSecondary mt-1">
                Access-controlled investigation containers and role assignments
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center space-x-4 bg-bgSurface border border-borderDefault p-3 rounded-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter cases by case number, title, status..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-bgBase border border-borderDefault rounded-sm pl-9 pr-4 py-1.5 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:border-accentPrimary"
              />
            </div>
            <div className="text-xs text-textSecondary font-mono">
              Total: {filteredCases.length} Cases
            </div>
          </div>

          {/* Cases List */}
          {loading ? (
            <div className="p-8 text-center text-xs text-textSecondary font-mono">Loading cases repository...</div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 bg-bgSurface border border-borderDefault rounded-md text-center space-y-3">
              <FolderKanban className="w-10 h-10 text-textSecondary mx-auto opacity-50" />
              <h3 className="text-sm font-semibold text-textPrimary">No Cases Found</h3>
              <p className="text-xs text-textSecondary max-w-sm mx-auto">
                No active investigation cases match your filter or access scope.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-bgSurface border border-borderDefault hover:border-accentPrimary/50 rounded-md p-5 flex flex-col justify-between space-y-4 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-accentPrimary font-bold">{c.caseNumber}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <h3 className="text-base font-semibold text-textPrimary">{c.title}</h3>
                    {c.description && (
                      <p className="text-xs text-textSecondary leading-relaxed line-clamp-2">{c.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-borderDefault flex items-center justify-between text-xs text-textSecondary">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-textSecondary" />
                        <span className="font-mono">{c.members?.length || 0} Members</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono">{c._count?.documents || 0} Docs</span>
                    </div>

                    <Link
                      href={`/cases/${c.id}`}
                      className="px-3 py-1.5 bg-bgBase border border-borderDefault hover:border-accentPrimary text-textPrimary font-medium rounded-sm transition-colors"
                    >
                      Open Case
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
              <div className="flex items-center space-x-2.5">
                <FolderKanban className="w-5 h-5 text-accentPrimary" />
                <h3 className="text-base font-semibold text-textPrimary">Create Investigation Case</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-textSecondary hover:text-textPrimary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-error/15 border border-error/30 rounded-md text-xs text-error flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Case Identification Number</label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Fraud & Financial Misconduct Investigation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Case Summary / Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief background and scope of this investigation case..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bgBase border border-borderDefault rounded-sm px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-bgBase border border-borderDefault text-textPrimary text-xs font-medium rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-medium rounded-sm transition-colors disabled:opacity-50"
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
    <Suspense fallback={<div className="min-h-screen bg-bgBase p-8 text-xs text-textSecondary font-mono">Loading cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
