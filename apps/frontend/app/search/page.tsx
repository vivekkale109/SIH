'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, FileText, ExternalLink, Filter, FolderKanban, ShieldCheck, ArrowRight, Paperclip } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchMe();
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const fetchMe = async () => {
    try {
      const me = await apiFetch<any>('/auth/me');
      setUser(me.user);
    } catch (err) {}
  };

  const performSearch = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await apiFetch<any>(`/search?q=${encodeURIComponent(searchStr.trim())}`);
      const res = data.results || [];
      setResults(res);
      if (res.length > 0) {
        setSelectedResultId(res[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const filteredResults = results.filter((r) => {
    if (typeFilter === 'ALL') return true;
    return r.documentType === typeFilter;
  });

  const selectedResult = results.find((r) => r.id === selectedResultId) || filteredResults[0];

  const docTypes = ['ALL', 'FIR', 'WITNESS_STATEMENT', 'POLICE_REPORT', 'FORENSIC_REPORT', 'CHARGE_SHEET'];

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header & Search Bar Card */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-textPrimary tracking-tight">Full-Text & OCR Search</h1>
            <p className="text-xs text-textSecondary">
              Permission-scoped indexing across case metadata, document titles, tags, and Tesseract-extracted OCR text
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter keywords, witness names, dates, FIR numbers, forensic terms..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-bgSurfaceMuted border border-borderDefault rounded-full pl-10 pr-4 py-2.5 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-full transition-all shadow-sm shrink-0 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Pill Filter Row (§20) */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-1 text-xs">
            <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider mr-1">Filter Type:</span>
            {docTypes.map((dt) => (
              <button
                key={dt}
                onClick={() => setTypeFilter(dt)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  typeFilter === dt
                    ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-xs font-bold'
                    : 'bg-bgSurfaceMuted text-textSecondary hover:text-textPrimary border border-borderDefault'
                }`}
              >
                {dt.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Pane Search Results per Design.md §20 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Pane: Result List */}
          <div className="lg:col-span-6 bg-bgSurface border border-borderDefault rounded-2xl p-5 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-borderDefault pb-2 text-xs">
                <span className="font-bold text-textPrimary uppercase tracking-wider">
                  Matching Results ({filteredResults.length})
                </span>
                {searched && (
                  <span className="text-[11px] text-textSecondary font-mono">
                    Query: "{query}"
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-textSecondary font-mono">
                  Scanning OCR indexes and document metadata...
                </div>
              ) : searched && filteredResults.length === 0 ? (
                <div className="p-12 bg-bgSurfaceMuted rounded-xl text-center space-y-2">
                  <Search className="w-8 h-8 text-textSecondary mx-auto opacity-50" />
                  <h3 className="text-sm font-bold text-textPrimary">No Matching Records Found</h3>
                  <p className="text-xs text-textSecondary max-w-xs mx-auto">
                    No documents matching "{query}" were found within your authorized cases.
                  </p>
                </div>
              ) : !searched ? (
                <div className="p-12 bg-bgSurfaceMuted rounded-xl text-center space-y-2 text-xs text-textSecondary">
                  <Search className="w-8 h-8 text-accentPrimary mx-auto opacity-60" />
                  <p>Type a search query above to scan across all authorized case documents and OCR text.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredResults.map((r) => {
                    const isSelected = selectedResult?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedResultId(r.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'bg-[#EAF8ED]/70 border-accentPrimary shadow-xs'
                            : 'bg-bgSurface border-borderDefault hover:border-accentPrimary/40 hover:bg-bgSurfaceMuted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] font-bold text-accentPrimary bg-accentPrimarySoft px-2.5 py-0.5 rounded-full">
                              {r.documentType}
                            </span>
                            <StatusBadge status={r.ocrStatus} />
                          </div>
                          <span className="text-[10px] text-textSecondary font-mono">
                            Case: {r.case?.caseNumber}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-textPrimary">{r.title}</h3>

                        {r.highlightSnippet && (
                          <div className="p-2.5 bg-bgSurfaceMuted rounded-lg border border-borderDefault font-mono text-[11px] text-textSecondary line-clamp-2">
                            {r.highlightSnippet}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Selected Result Preview */}
          <div className="lg:col-span-6 bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card space-y-5">
            {selectedResult ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-borderDefault pb-4">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-accentPrimary font-bold bg-accentPrimarySoft px-2.5 py-0.5 rounded-full">
                      {selectedResult.documentType}
                    </span>
                    <h2 className="text-lg font-bold text-textPrimary">{selectedResult.title}</h2>
                    <div className="text-xs text-textSecondary font-medium">
                      Case: <span className="text-textPrimary font-semibold">{selectedResult.case?.title}</span> ({selectedResult.case?.caseNumber})
                    </div>
                  </div>

                  <Link
                    href={`/documents/${selectedResult.id}`}
                    className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-sm shrink-0"
                  >
                    <span>Open Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Cryptographic SHA-256 Info */}
                <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl space-y-1 text-xs">
                  <div className="text-textSecondary font-semibold">SHA-256 Byte Digest:</div>
                  <div className="font-mono text-xs text-textPrimary bg-bgSurface p-2 rounded-lg border border-borderDefault break-all">
                    {selectedResult.sha256 || 'Calculated server-side at intake'}
                  </div>
                </div>

                {/* OCR Snippet / Match Context */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-textPrimary block">Matching OCR Content / Context</span>
                  <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-xl font-mono text-xs text-textPrimary leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {selectedResult.highlightSnippet ||
                      'Document metadata matched the active search filters.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-textSecondary">
                Select a search result from the left pane to preview details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bgPage p-8 text-xs text-textSecondary font-mono">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
