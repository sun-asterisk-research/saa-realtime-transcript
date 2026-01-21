'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import { ContextSelectorModal } from './ContextSelectorModal';
import type { ContextSetWithDetails, Context } from '@/lib/supabase/types';

interface ContextManagementPanelProps {
  sessionCode: string;
  sessionId: string;
  contextSets: ContextSetWithDetails[];
  mergedContext?: Context;
  isLoading: boolean;
  disabled?: boolean;
  isHost?: boolean;
  onContextChange: () => void | Promise<void>;
  onAddContextSets: (contextSetIds: string[]) => Promise<void>;
  onRemoveContextSet: (contextSetId: string) => Promise<void>;
}

export function ContextManagementPanel({
  sessionCode,
  sessionId,
  contextSets,
  mergedContext,
  isLoading,
  disabled = false,
  isHost = false,
  onContextChange,
  onAddContextSets,
  onRemoveContextSet,
}: ContextManagementPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddContexts = async (selectedIds: string[]) => {
    // Filter out already added context sets
    const newIds = selectedIds.filter((id) => !contextSets.some((cs) => cs.id === id));
    if (newIds.length > 0) {
      await onAddContextSets(newIds);
      await onContextChange();
    }
    setIsModalOpen(false);
  };

  const handleRemoveContext = async (contextSetId: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from this session?`)) {
      return;
    }

    await onRemoveContextSet(contextSetId);
    await onContextChange();
  };

  // Calculate stats from merged context
  const termCount = mergedContext?.terms?.length || 0;
  const generalCount = mergedContext?.general?.length || 0;
  const translationCount = mergedContext?.translation_terms?.length || 0;
  const hasText = !!mergedContext?.text;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-text-primary font-medium text-sm">Context Sets</label>
        {isHost && (
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            variant="primary"
            size="sm"
            className="text-xs h-7 px-3"
          >
            + Add Context
          </Button>
        )}
      </div>

      {isHost && disabled && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Stop recording to manage contexts
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-text-muted text-sm py-3">
          <div className="w-4 h-4 border-2 border-plum-200 border-t-plum-500 rounded-full animate-spin" />
          Loading contexts...
        </div>
      )}

      {!isLoading && contextSets.length === 0 && (
        <div className="text-text-muted text-sm py-3 text-center bg-surface-muted rounded-lg border border-gray-100">
          No context sets active
        </div>
      )}

      {!isLoading && contextSets.length > 0 && (
        <>
          {/* Active context sets */}
          <div className="space-y-2 mb-3">
            {contextSets.map((contextSet) => (
              <div
                key={contextSet.id}
                className="flex items-center justify-between bg-white border border-plum-100 rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md hover:border-plum-200 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium text-sm truncate">{contextSet.name}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(contextSet.term_count || contextSet.terms?.length || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-plum-50 text-plum-600 rounded-full border border-plum-100">
                        {contextSet.term_count || contextSet.terms?.length} terms
                      </span>
                    )}
                    {(contextSet.general_count || contextSet.general?.length || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100">
                        {contextSet.general_count || contextSet.general?.length} metadata
                      </span>
                    )}
                  </div>
                </div>
                {isHost && (
                  <button
                    onClick={() => handleRemoveContext(contextSet.id, contextSet.name)}
                    disabled={disabled}
                    className="ml-3 w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Merged context preview */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-sm text-text-secondary hover:text-plum-600 flex items-center justify-between py-1 transition-colors cursor-pointer"
            >
              <span className="font-medium">Merged Context Preview</span>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && mergedContext && (
              <div className="mt-3 space-y-2">
                {termCount > 0 && (
                  <div className="bg-plum-50 border border-plum-100 rounded-lg p-3">
                    <div className="text-plum-700 font-medium text-xs mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Terms ({termCount})
                    </div>
                    <div className="text-text-secondary text-xs line-clamp-2">
                      {mergedContext.terms?.slice(0, 10).join(', ')}
                      {termCount > 10 && '...'}
                    </div>
                  </div>
                )}

                {generalCount > 0 && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="text-purple-700 font-medium text-xs mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Metadata ({generalCount})
                    </div>
                    <div className="text-text-secondary text-xs space-y-0.5">
                      {mergedContext.general?.slice(0, 5).map((g: { key: string; value: string }, i: number) => (
                        <div key={i} className="flex gap-1">
                          <span className="font-medium text-purple-600">{g.key}:</span>
                          <span>{g.value}</span>
                        </div>
                      ))}
                      {generalCount > 5 && <div className="text-text-muted">...</div>}
                    </div>
                  </div>
                )}

                {translationCount > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div className="text-amber-700 font-medium text-xs mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Translations ({translationCount})
                    </div>
                    <div className="text-text-secondary text-xs space-y-0.5">
                      {mergedContext.translation_terms?.slice(0, 3).map((tt: { source: string; target: string }, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          <span>{tt.source}</span>
                          <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="font-medium text-amber-600">{tt.target}</span>
                        </div>
                      ))}
                      {translationCount > 3 && <div className="text-text-muted">...</div>}
                    </div>
                  </div>
                )}

                {hasText && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div className="text-text-primary font-medium text-xs mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Text
                    </div>
                    <div className="text-text-muted text-xs line-clamp-3">{mergedContext.text}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Context Selector Modal */}
      <ContextSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddContexts}
        excludeIds={contextSets.map((cs) => cs.id)}
      />
    </div>
  );
}
