'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FolderKanban,
  FileText,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Clock,
  Activity,
  Star,
  Download,
  ExternalLink,
  ChevronRight,
  Layers,
  FilePlus,
  Users,
  X,
  AlertCircle,
  Tag,
  Paperclip,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Two-pane selection state per Design.md §16
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_CASES' | 'STARRED' | 'PENDING_REVIEW' | 'URGENT' | 'ARCHIVED'>('MY_CASES');
  const [filterType, setFilterType] = useState<'ALL' | 'DOCUMENTS' | 'EVIDENCE' | 'TIMELINE'>('ALL');
  const [starredCases, setStarredCases] = useState<Record<string, boolean>>({});

  // Create Case Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caseNumber, setCaseNumber] = useState(`CASE/2026/${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const meData = await apiFetch<any>('/auth/me');
      setUser(meData.user);

      const casesData = await apiFetch<any>('/cases');
      const loadedCases = casesData.cases || [];
      setCases(loadedCases);

      if (loadedCases.length > 0) {
        setSelectedCaseId(loadedCases[0].id);
      }

      if (['Auditor', 'Super Admin', 'Supervisor / Reviewing Officer'].includes(meData.user?.roles?.[0])) {
        const auditData = await apiFetch<any>('/audit?limit=8');
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

  const toggleStar = (cId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredCases((prev) => ({ ...prev, [cId]: !prev[cId] }));
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
      setCaseNumber(`CASE/2026/${Math.floor(1000 + Math.random() * 9000)}`);
      await loadDashboardData();
      if (data.case?.id) {
        setSelectedCaseId(data.case.id);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create case');
    } finally {
      setCreateLoading(false);
    }
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const totalDocuments = cases.reduce((acc, c) => acc + (c._count?.documents || 0), 0);
  const totalEvidence = cases.reduce((acc, c) => acc + (c._count?.evidence || 0), 0);

  // Tab filtering
  const filteredCases = cases.filter((c) => {
    if (activeTab === 'STARRED') return starredCases[c.id];
    if (activeTab === 'PENDING_REVIEW') return c.status === 'UNDER_REVIEW' || c.status === 'PENDING';
    if (activeTab === 'URGENT') return c.priority === 'URGENT' || c.priority === 'HIGH';
    if (activeTab === 'ARCHIVED') return c.status === 'ARCHIVED' || c.status === 'CLOSED';
    return true;
  });

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 bg-bgSurface border border-borderDefault rounded-2xl shadow-card space-y-1">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs font-semibold">Active Cases</span>
              <FolderKanban className="w-4 h-4 text-accentPrimary" />
            </div>
            <div className="text-2xl font-bold text-textPrimary tracking-tight">{cases.length}</div>
            <div className="text-[11px] text-textSecondary">Assigned investigation units</div>
          </div>

          <div className="p-4 bg-bgSurface border border-borderDefault rounded-2xl shadow-card space-y-1">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs font-semibold">Secure Documents</span>
              <FileText className="w-4 h-4 text-info" />
            </div>
            <div className="text-2xl font-bold text-textPrimary tracking-tight">{totalDocuments}</div>
            <div className="text-[11px] text-textSecondary">SHA-256 verified records</div>
          </div>

          <div className="p-4 bg-bgSurface border border-borderDefault rounded-2xl shadow-card space-y-1">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs font-semibold">Seized Evidence</span>
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-textPrimary tracking-tight">{totalEvidence}</div>
            <div className="text-[11px] text-textSecondary">Digital & physical artifacts</div>
          </div>

          <div className="p-4 bg-bgSurface border border-borderDefault rounded-2xl shadow-card space-y-1">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs font-semibold">Integrity Engine</span>
              <Activity className="w-4 h-4 text-accentPrimary" />
            </div>
            <div className="text-sm font-bold text-[#2E954A] flex items-center space-x-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>ONLINE & AUDITED</span>
            </div>
            <div className="text-[11px] text-textSecondary">Append-only compliance log</div>
          </div>
        </div>

        {/* Two-Pane Layout per Design.md §16 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
          {/* LEFT PANE: Header, Action Buttons, Tab Row, Filter Pills, Case List */}
          <div className="lg:col-span-5 bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              {/* Greeting Header with Avatar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-full bg-accentPrimarySoft border-2 border-accentPrimary flex items-center justify-center text-accentPrimary font-bold text-base shadow-xs">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
                      Good morning, {user?.fullName ? user.fullName.split(' ')[0] : 'Officer'}
                    </h1>
                    <p className="text-xs text-textSecondary font-medium">
                      {user?.roles?.[0] || 'Investigator'} · SDMS Working Repository
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row (§7 & §16) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="py-2.5 px-4 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Case</span>
                </button>

                <Link
                  href={selectedCase ? `/cases/${selectedCase.id}` : '/cases'}
                  className="py-2.5 px-4 bg-bgSurface hover:bg-bgSurfaceMuted border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all"
                >
                  <FilePlus className="w-4 h-4 text-accentPrimary" />
                  <span>+ Upload Document</span>
                </Link>
              </div>

              {/* Primary Tab Row (§15 / §16) */}
              <div className="border-b border-borderDefault pb-2 flex items-center space-x-2 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('MY_CASES')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeTab === 'MY_CASES'
                      ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-xs font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                  }`}
                >
                  My Cases
                </button>
                <button
                  onClick={() => setActiveTab('STARRED')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeTab === 'STARRED'
                      ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-xs font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                  }`}
                >
                  Starred
                </button>
                <button
                  onClick={() => setActiveTab('PENDING_REVIEW')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeTab === 'PENDING_REVIEW'
                      ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-xs font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                  }`}
                >
                  Pending Review
                </button>
                <button
                  onClick={() => setActiveTab('URGENT')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeTab === 'URGENT'
                      ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-xs font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                  }`}
                >
                  Urgent
                </button>
              </div>

              {/* Secondary Filter Tag Pills (§15) */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mr-1">Filter:</span>
                {(['ALL', 'DOCUMENTS', 'EVIDENCE', 'TIMELINE'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                      filterType === f
                        ? 'bg-accentPrimarySoft text-accentPrimary font-bold border border-accentPrimary/30'
                        : 'bg-bgSurfaceMuted text-textSecondary hover:text-textPrimary border border-borderDefault'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Scannable Case Row-List (§9 & §16) */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="p-8 text-center text-xs text-textSecondary">Loading investigation cases...</div>
                ) : filteredCases.length === 0 ? (
                  <div className="p-8 bg-bgSurfaceMuted rounded-2xl text-center space-y-2">
                    <FolderKanban className="w-8 h-8 text-textSecondary mx-auto opacity-50" />
                    <p className="text-xs text-textSecondary">No cases in this view category.</p>
                  </div>
                ) : (
                  filteredCases.map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    const isStarred = starredCases[c.id];
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCaseId(c.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#EAF8ED]/70 border-accentPrimary shadow-sm'
                            : 'bg-bgSurface border-borderDefault hover:border-accentPrimary/40 hover:bg-bgSurfaceMuted/50'
                        }`}
                      >
                        {/* Leading Avatar / Icon */}
                        <div className="flex items-center space-x-3 min-w-0">
                          <button
                            onClick={(e) => toggleStar(c.id, e)}
                            className="p-1 text-textSecondary hover:text-warning transition-colors"
                            title="Star Case"
                          >
                            <Star
                              className={`w-4 h-4 ${isStarred ? 'text-warning fill-warning' : 'opacity-40'}`}
                            />
                          </button>

                          <div className="w-9 h-9 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary shrink-0">
                            <FolderKanban className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[11px] font-bold text-accentPrimary">
                                {c.caseNumber}
                              </span>
                              <span className="text-[10px] text-textSecondary">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-textPrimary truncate">{c.title}</h3>
                          </div>
                        </div>

                        {/* Trailing Status & Counter Pills (§13) */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <StatusBadge status={c.status} showIcon={false} />
                          <span className="px-2 py-0.5 bg-accentPrimarySoft text-[#2E954A] font-bold text-[10px] rounded-full">
                            {c._count?.documents || 0} docs
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Link to Cases */}
            <div className="pt-3 border-t border-borderDefault flex items-center justify-between text-xs">
              <span className="text-textSecondary">Total: {cases.length} investigation records</span>
              <Link href="/cases" className="text-accentPrimary hover:underline font-semibold flex items-center space-x-1">
                <span>All Cases View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT PANE: Selected Context Detail & Quick Preview (§16) */}
          <div className="lg:col-span-7 bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-6">
            {selectedCase ? (
              <div className="space-y-6">
                {/* Contact-Header Block (§16 & §17) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderDefault pb-5">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-full bg-accentPrimarySoft border-2 border-accentPrimary flex items-center justify-center text-accentPrimary font-bold text-base">
                      {selectedCase.creator?.fullName?.charAt(0) || 'L'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-textPrimary">{selectedCase.title}</h2>
                        <StatusBadge status={selectedCase.status} />
                      </div>
                      <div className="text-xs text-textSecondary mt-0.5">
                        Lead: <strong className="text-textPrimary">{selectedCase.creator?.fullName || 'Assigned Officer'}</strong> · Priority:{' '}
                        <span className="font-semibold text-accentPrimary">{selectedCase.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/cases/${selectedCase.id}`}
                      className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <span>Open Full Case</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Subject Tags / Pill Row (§13 & §16) */}
                <div className="flex items-center space-x-2 overflow-x-auto text-xs">
                  <span className="px-3 py-1 bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white rounded-full font-bold text-[11px] shadow-xs">
                    {selectedCase.caseNumber}
                  </span>
                  <span className="px-3 py-1 bg-bgSurfaceMuted border border-borderDefault rounded-full text-textPrimary font-semibold text-[11px]">
                    Priority: {selectedCase.priority}
                  </span>
                  <span className="px-3 py-1 bg-bgSurfaceMuted border border-borderDefault rounded-full text-textPrimary font-semibold text-[11px]">
                    {selectedCase.members?.length || 1} Assigned Officers
                  </span>
                  <span className="px-3 py-1 bg-bgSurfaceMuted border border-borderDefault rounded-full text-textPrimary font-semibold text-[11px]">
                    Created {new Date(selectedCase.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Primary Content: Case Summary & Scope */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                    Investigation Brief & Scope
                  </span>
                  <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-2xl text-xs text-textPrimary leading-relaxed">
                    {selectedCase.description || 'No detailed background summary recorded for this case file.'}
                  </div>
                </div>

                {/* Attached File Chip Pattern (§16 / "David Milner's Badge 2022.png" pattern) */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                    Case Records & Artifacts
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-bgSurface border border-borderDefault hover:border-accentPrimary rounded-2xl flex items-center justify-between space-x-3 transition-colors shadow-xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-textPrimary truncate">
                            {selectedCase._count?.documents || 0} Case Documents
                          </div>
                          <div className="text-[10px] text-textSecondary">Cryptographic SHA-256</div>
                        </div>
                      </div>
                      <Link
                        href={`/cases/${selectedCase.id}`}
                        className="px-2.5 py-1 bg-bgSurfaceMuted border border-borderDefault text-textPrimary rounded-lg text-xs font-semibold hover:bg-accentPrimary hover:text-white transition-all"
                      >
                        Inspect
                      </Link>
                    </div>

                    <div className="p-3.5 bg-bgSurface border border-borderDefault hover:border-accentPrimary rounded-2xl flex items-center justify-between space-x-3 transition-colors shadow-xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-textPrimary truncate">
                            {selectedCase._count?.evidence || 0} Seized Artifacts
                          </div>
                          <div className="text-[10px] text-textSecondary">Secure Evidence Vault</div>
                        </div>
                      </div>
                      <Link
                        href={`/cases/${selectedCase.id}`}
                        className="px-2.5 py-1 bg-bgSurfaceMuted border border-borderDefault text-textPrimary rounded-lg text-xs font-semibold hover:bg-accentPrimary hover:text-white transition-all"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Condensed Audit Trail Sub-Panel (§253) */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                      Recent Activity Trail
                    </span>
                    {recentAudits.length > 0 && (
                      <Link href="/audit" className="text-accentPrimary hover:underline text-xs font-semibold">
                        View Full Log →
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {recentAudits.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-accentPrimary font-bold text-[11px]">
                            {ev.action}
                          </span>
                          <span className="text-textSecondary text-[11px]">by {ev.actor?.fullName || 'User'}</span>
                        </div>
                        <span className="font-mono text-[10px] text-textSecondary">
                          {new Date(ev.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {recentAudits.length === 0 && (
                      <p className="text-xs text-textSecondary py-2">
                        Operational actions are logged in real-time to the immutable audit ledger.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 my-auto">
                <FolderKanban className="w-12 h-12 text-textSecondary opacity-40" />
                <h3 className="text-sm font-bold text-textPrimary">Select a Case from the List</h3>
                <p className="text-xs text-textSecondary max-w-xs">
                  Click on any case record on the left to inspect documents, evidence, and recent timeline events.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Case Modal (§11 & §16) */}
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
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface transition-colors"
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
                  placeholder="e.g. Cyber Financial Fraud & Identity Theft Ring"
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
                  placeholder="Summary of allegations, initial FIR details, and investigative focus..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bgSurface border border-borderDefault rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-bgSurface border border-borderDefault text-textPrimary hover:bg-bgSurfaceMuted text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Case & Assign Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
