'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, FileText, UserCheck, Calendar, MapPin, RefreshCw, Tag } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AIAssistPanelProps {
  versionId: string;
  existingAiResults?: any[];
  onResultGenerated?: () => void;
}

export const AIAssistPanel: React.FC<AIAssistPanelProps> = ({
  versionId,
  existingAiResults = [],
  onResultGenerated,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(
    existingAiResults.length > 0 ? existingAiResults[0] : null
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>(`/documents/${versionId}/ai-process`, {
        method: 'POST',
      });
      setCurrentResult(data.aiResult);
      if (onResultGenerated) onResultGenerated();
    } catch (err: any) {
      setError(err.message || 'Failed to process AI assist');
    } finally {
      setLoading(false);
    }
  };

  const parsedOutput = currentResult
    ? typeof currentResult.output === 'string'
      ? JSON.parse(currentResult.output)
      : currentResult.output
    : null;

  return (
    <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 space-y-5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderDefault pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-accentPrimarySoft flex items-center justify-center text-accentPrimary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-textPrimary">AI Advisory Assistance</h4>
            <span className="text-[11px] text-textSecondary font-medium block">
              Automated Document Triage & Entity Extraction
            </span>
          </div>
        </div>

        <button
          onClick={handleGenerateAI}
          disabled={loading}
          className="px-3.5 py-1.5 bg-accentPrimarySoft hover:bg-accentPrimary hover:text-white border border-accentPrimary/30 text-accentPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{currentResult ? 'Re-Run Analysis' : 'Run AI Analysis'}</span>
        </button>
      </div>

      {/* Advisory Warning Banner per Rules.md §16 */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-xs text-amber-800 dark:bg-warning/10 dark:border-warning/30 dark:text-warning">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block text-amber-900 dark:text-warning">
            AI-Generated — Advisory Only, Not Verified
          </span>
          <p className="text-[11px] text-amber-700 dark:text-textSecondary leading-relaxed">
            Advisory support for triage only. Does not replace investigator or judicial judgment and does not determine legal admissibility.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-error">
          {error}
        </div>
      )}

      {!currentResult && !loading && (
        <div className="p-6 bg-bgSurfaceMuted rounded-xl text-center space-y-2">
          <Sparkles className="w-6 h-6 text-accentPrimary mx-auto opacity-70" />
          <p className="text-xs text-textSecondary max-w-sm mx-auto">
            Run automated AI triage to extract key entities (persons, dates, locations), classification suggestions, and an advisory summary.
          </p>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-xs text-textSecondary space-y-2">
          <RefreshCw className="w-6 h-6 text-accentPrimary animate-spin mx-auto" />
          <p className="font-semibold text-textPrimary">Processing document through advisory AI model...</p>
          <p className="text-[11px] text-textSecondary">Extracting structured entities and summarizing text</p>
        </div>
      )}

      {parsedOutput && !loading && (
        <div className="space-y-4 text-xs">
          {/* Summary */}
          <div className="space-y-2">
            <span className="font-bold text-textPrimary flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-accentPrimary" />
              <span>Advisory Summary</span>
            </span>
            <div className="p-4 bg-bgSurfaceMuted border border-borderDefault rounded-xl text-textPrimary leading-relaxed">
              {parsedOutput.summary}
            </div>
          </div>

          {/* Classification Pill */}
          {parsedOutput.suggestedClassification && (
            <div className="flex items-center justify-between p-3 bg-bgSurfaceMuted border border-borderDefault rounded-xl">
              <span className="text-textSecondary font-medium flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-accentPrimary" />
                <span>Suggested Classification:</span>
              </span>
              <span className="px-3 py-1 bg-white border border-borderDefault rounded-full font-semibold text-accentPrimary text-xs shadow-sm">
                {parsedOutput.suggestedClassification}
              </span>
            </div>
          )}

          {/* Entities */}
          {parsedOutput.entities && (
            <div className="space-y-2.5 pt-2">
              <span className="font-bold text-textPrimary block">Suggested Entities</span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* People */}
                <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-info font-bold text-xs">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Persons</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedOutput.entities.people?.length > 0 ? (
                      parsedOutput.entities.people.map((p: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-white border border-borderDefault rounded-full text-[11px] text-textPrimary font-medium shadow-xs"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-textSecondary text-[11px]">None identified</span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-success font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Dates</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedOutput.entities.dates?.length > 0 ? (
                      parsedOutput.entities.dates.map((d: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-white border border-borderDefault rounded-full text-[11px] text-textPrimary font-medium shadow-xs"
                        >
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-textSecondary text-[11px]">None identified</span>
                    )}
                  </div>
                </div>

                {/* Locations */}
                <div className="p-3.5 bg-bgSurfaceMuted border border-borderDefault rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-warning font-bold text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedOutput.entities.locations?.length > 0 ? (
                      parsedOutput.entities.locations.map((l: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-white border border-borderDefault rounded-full text-[11px] text-textPrimary font-medium shadow-xs"
                        >
                          {l}
                        </span>
                      ))
                    ) : (
                      <span className="text-textSecondary text-[11px]">None identified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
