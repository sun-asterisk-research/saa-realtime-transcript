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
      <div className="flex items-center justify-between mb-2">
        <label className="block text-slate-300 text-sm">Context Sets</label>
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="text-xs h-7 px-2 bg-blue-600 border-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          + Add Context
        </Button>
      </div>

      {disabled && (
        <div className="text-xs text-amber-400 mb-2">⚠️ Stop recording to manage contexts</div>
      )}

      {isLoading && (
        <div className="text-xs text-slate-500 py-2">Loading contexts...</div>
      )}

      {!isLoading && contextSets.length === 0 && (
        <div className="text-xs text-slate-500 py-2">No context sets active</div>
      )}

      {!isLoading && contextSets.length > 0 && (
        <>
          {/* Active context sets */}
          <div className="space-y-1 mb-2">
            {contextSets.map((contextSet) => (
              <div
                key={contextSet.id}
                className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{contextSet.name}</div>
                  <div className="text-slate-500 text-[10px]">
                    {(contextSet.term_count || contextSet.terms?.length || 0) > 0 && (
                      <span>{contextSet.term_count || contextSet.terms?.length} terms</span>
                    )}
                    {(contextSet.general_count || contextSet.general?.length || 0) > 0 && (
                      <span className="ml-2">{contextSet.general_count || contextSet.general?.length} metadata</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveContext(contextSet.id, contextSet.name)}
                  disabled={disabled}
                  className="ml-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Merged context preview */}
          <div className="border-t border-slate-700 pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs text-slate-400 hover:text-slate-300 flex items-center justify-between">
              <span>Merged Context Preview</span>
              <span>{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && mergedContext && (
              <div className="mt-2 space-y-2 text-[10px]">
                {termCount > 0 && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-blue-400 font-medium mb-1">Terms ({termCount})</div>
                    <div className="text-slate-400 line-clamp-2">
                      {mergedContext.terms?.slice(0, 10).join(', ')}
                      {termCount > 10 && '...'}
                    </div>
                  </div>
                )}

                {generalCount > 0 && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-purple-400 font-medium mb-1">Metadata ({generalCount})</div>
                    <div className="text-slate-400 space-y-0.5">
                      {mergedContext.general?.slice(0, 5).map((g: { key: string; value: string }, i: number) => (
                        <div key={i}>
                          {g.key}: {g.value}
                        </div>
                      ))}
                      {generalCount > 5 && <div>...</div>}
                    </div>
                  </div>
                )}

                {translationCount > 0 && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-amber-400 font-medium mb-1">Translations ({translationCount})</div>
                    <div className="text-slate-400 space-y-0.5">
                      {mergedContext.translation_terms?.slice(0, 3).map((tt: { source: string; target: string }, i: number) => (
                        <div key={i}>
                          {tt.source} → {tt.target}
                        </div>
                      ))}
                      {translationCount > 3 && <div>...</div>}
                    </div>
                  </div>
                )}

                {hasText && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-slate-400 font-medium mb-1">Text</div>
                    <div className="text-slate-500 line-clamp-3 text-[9px]">{mergedContext.text}</div>
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
