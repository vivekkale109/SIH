'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, FileText, ExternalLink, Filter } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
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
      setResults(data.results || []);
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

  return (
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          <div className="border-b border-borderDefault pb-5">
            <h1 className="text-xl font-bold text-textPrimary tracking-tight">Full-Text & OCR Search</h1>
            <p className="text-xs text-textSecondary mt-1">
              Search across titles, document types, metadata, tags, and Tesseract-extracted OCR text (Access Scoped)
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter keywords, names, dates, FIR numbers, or OCR phrases..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-bgSurface border border-borderDefault rounded-sm pl-9 pr-4 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentPrimary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          <div className="space-y-4">
            {searched && (
              <div className="text-xs text-textSecondary font-mono">
                Found {results.length} permission-filtered result(s) for "{query}"
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-xs text-textSecondary font-mono">Searching OCR records & metadata...</div>
            ) : searched && results.length === 0 ? (
              <div className="p-12 bg-bgSurface border border-borderDefault rounded-md text-center space-y-2">
                <Search className="w-8 h-8 text-textSecondary mx-auto opacity-50" />
                <h3 className="text-sm font-semibold text-textPrimary">No Matching Records Found</h3>
                <p className="text-xs text-textSecondary max-w-sm mx-auto">
                  No documents in your authorized cases match the search query "{query}".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <div key={r.id} className="p-4 bg-bgSurface border border-borderDefault hover:border-accentPrimary/50 rounded-md transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs text-accentPrimary font-bold">{r.documentType}</span>
                        <span className="text-xs text-textSecondary font-mono">Case: {r.case?.caseNumber} ({r.case?.title})</span>
                        <StatusBadge status={r.ocrStatus} />
                      </div>
                      <Link
                        href={`/documents/${r.id}`}
                        className="px-2.5 py-1 bg-bgBase border border-borderDefault text-textPrimary text-xs rounded-sm inline-flex items-center space-x-1 hover:border-accentPrimary"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <h3 className="text-base font-semibold text-textPrimary">
                      <Link href={`/documents/${r.id}`} className="hover:text-accentPrimary">
                        {r.title}
                      </Link>
                    </h3>

                    {r.highlightSnippet && (
                      <div className="p-2.5 bg-bgBase border border-borderDefault rounded-sm font-mono text-xs text-textSecondary leading-relaxed">
                        {r.highlightSnippet}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-textSecondary font-mono pt-1">
                      <span>SHA-256: {r.sha256 ? `${r.sha256.substring(0, 16)}...` : 'Pending'}</span>
                      <span>Version: v{r.currentVersionNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bgBase p-8 text-xs text-textSecondary font-mono">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
