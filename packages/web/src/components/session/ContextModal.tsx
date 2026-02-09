'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import { ContextSelectorModal } from '@/components/context/ContextSelectorModal';
import type { Context } from '@soniox/speech-to-text-web';

interface ContextSet {
  id: string;
  name: string;
  term_count?: number;
  general_count?: number;
  terms?: Array<{ term: string }>;
  general?: Array<{ key: string; value: string }>;
}

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextSets: ContextSet[];
  mergedContext?: Context;
  isLoading: boolean;
  disabled: boolean;
  isHost: boolean;
  onContextChange: () => void;
  onAddContextSets: (ids: string[]) => Promise<void>;
  onRemoveContextSet: (id: string) => Promise<void>;
}

export function ContextModal({
  isOpen,
  onClose,
  contextSets,
  mergedContext,
  isLoading,
  disabled,
  isHost,
  onContextChange,
  onAddContextSets,
  onRemoveContextSet,
}: ContextModalProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleAddContexts = async (ids: string[]) => {
    await onAddContextSets(ids);
    setIsSelectorOpen(false);
    onContextChange();
  };

  const handleRemoveContext = async (id: string) => {
    await onRemoveContextSet(id);
    onContextChange();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Context Sets</h2>
          <div className="flex items-center gap-2">
            {isHost && (
              <Button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                variant="secondary"
                size="sm"
                disabled={disabled}
              >
                + Add Context
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-plum-200 border-t-plum-600 rounded-full animate-spin" />
            </div>
          ) : contextSets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No context sets active</p>
              <p className="text-gray-400 text-xs mt-1">
                Add context sets to improve transcription accuracy
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contextSets.map((cs) => {
                const termCount = cs.term_count || cs.terms?.length || 0;
                const generalCount = cs.general_count || cs.general?.length || 0;

                return (
                  <div
                    key={cs.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {cs.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {termCount > 0 && <span>{termCount} terms</span>}
                        {termCount > 0 && generalCount > 0 && <span className="mx-1">·</span>}
                        {generalCount > 0 && <span>{generalCount} metadata</span>}
                      </div>
                    </div>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContext(cs.id)}
                        disabled={disabled}
                        className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Remove context"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Merged Context Preview */}
          {mergedContext && typeof mergedContext === 'object' && (mergedContext.terms?.length || mergedContext.general?.length) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer w-full"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>View merged context</span>
              </button>

              {isExpanded && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs">
                  {mergedContext.terms && mergedContext.terms.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Terms:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mergedContext.terms.map((term, i) => (
                          <span key={i} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {mergedContext.general && mergedContext.general.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Metadata:</span>
                      <div className="mt-1 space-y-1">
                        {mergedContext.general.map((item, i) => (
                          <div key={i} className="text-gray-600">
                            <span className="font-medium">{item.key}:</span> {item.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {disabled && (
            <p className="mt-4 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Stop recording to modify context sets
            </p>
          )}
        </div>
      </div>

      {/* Context Selector Modal */}
      <ContextSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleAddContexts}
        excludeIds={contextSets.map((cs) => cs.id)}
      />
    </>
  );
}
