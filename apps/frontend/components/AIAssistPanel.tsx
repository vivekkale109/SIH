'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, FileText, UserCheck, Calendar, MapPin, RefreshCw } from 'lucide-react';
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
    <div className="bg-bgSurface border border-borderDefault rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderDefault pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-accentPrimary/10 border border-accentPrimary/30 rounded-sm text-accentPrimary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-textPrimary">AI Advisory Assistance</h4>
            <span className="text-[10px] text-textSecondary font-mono block">Summarization & Entity Triage</span>
          </div>
        </div>

        <button
          onClick={handleGenerateAI}
          disabled={loading}
          className="px-3 py-1.5 bg-accentPrimary/10 hover:bg-accentPrimary/20 border border-accentPrimary/30 text-accentPrimary text-xs font-medium rounded-sm inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
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
      <div className="p-2.5 bg-warning/10 border border-warning/30 rounded-sm flex items-start space-x-2 text-xs text-warning">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold block">AI-Generated — Advisory Only, Not Verified</span>
          <p className="text-[11px] text-textSecondary leading-normal">
            Does not replace human investigator, legal, or judicial judgment. Does not determine guilt, innocence, or legal admissibility.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error/15 border border-error/30 rounded-md text-xs text-error">
          {error}
        </div>
      )}

      {!currentResult && !loading && (
        <p className="text-xs text-textSecondary text-center py-4">
          Click "Run AI Analysis" to extract automated advisory summary and entity suggestions from OCR text.
        </p>
      )}

      {loading && (
        <div className="py-6 text-center text-xs text-textSecondary space-y-2">
          <RefreshCw className="w-5 h-5 text-accentPrimary animate-spin mx-auto" />
          <p className="font-mono">Processing OCR text through advisory AI layer...</p>
        </div>
      )}

      {parsedOutput && !loading && (
        <div className="space-y-4 text-xs">
          {/* Summary */}
          <div className="space-y-1.5">
            <span className="font-semibold text-textPrimary flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-accentPrimary" />
              <span>Advisory Summary</span>
            </span>
            <div className="p-3 bg-bgBase border border-borderDefault rounded-sm text-textSecondary leading-relaxed font-sans">
              {parsedOutput.summary}
            </div>
          </div>

          {/* Classification */}
          {parsedOutput.suggestedClassification && (
            <div className="flex items-center justify-between p-2.5 bg-bgBase border border-borderDefault rounded-sm">
              <span className="text-textSecondary">Suggested Document Type:</span>
              <span className="font-mono font-medium text-accentPrimary">
                {parsedOutput.suggestedClassification}
              </span>
            </div>
          )}

          {/* Entities */}
          {parsedOutput.entities && (
            <div className="space-y-2">
              <span className="font-semibold text-textPrimary block">Extracted Entities (Suggestions)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* People */}
                <div className="p-2.5 bg-bgBase border border-borderDefault rounded-sm space-y-1">
                  <div className="flex items-center space-x-1.5 text-textSecondary font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-info" />
                    <span>Persons</span>
                  </div>
                  <div className="space-y-1">
                    {parsedOutput.entities.people?.map((p: string, idx: number) => (
                      <div key={idx} className="font-mono text-[11px] text-textPrimary truncate">{p}</div>
                    )) || <span className="text-textSecondary text-[10px]">None identified</span>}
                  </div>
                </div>

                {/* Dates */}
                <div className="p-2.5 bg-bgBase border border-borderDefault rounded-sm space-y-1">
                  <div className="flex items-center space-x-1.5 text-textSecondary font-medium">
                    <Calendar className="w-3.5 h-3.5 text-success" />
                    <span>Dates</span>
                  </div>
                  <div className="space-y-1">
                    {parsedOutput.entities.dates?.map((d: string, idx: number) => (
                      <div key={idx} className="font-mono text-[11px] text-textPrimary truncate">{d}</div>
                    )) || <span className="text-textSecondary text-[10px]">None identified</span>}
                  </div>
                </div>

                {/* Locations */}
                <div className="p-2.5 bg-bgBase border border-borderDefault rounded-sm space-y-1">
                  <div className="flex items-center space-x-1.5 text-textSecondary font-medium">
                    <MapPin className="w-3.5 h-3.5 text-warning" />
                    <span>Locations</span>
                  </div>
                  <div className="space-y-1">
                    {parsedOutput.entities.locations?.map((l: string, idx: number) => (
                      <div key={idx} className="font-mono text-[11px] text-textPrimary truncate">{l}</div>
                    )) || <span className="text-textSecondary text-[10px]">None identified</span>}
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
