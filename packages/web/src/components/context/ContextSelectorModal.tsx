'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { useUser } from '@/lib/hooks/useUser';
import { useContextSets } from '@/lib/hooks/useContextSets';

interface ContextSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedIds: string[]) => Promise<void> | void;
  excludeIds?: string[]; // Context sets already added to the session
}

export function ContextSelectorModal({ isOpen, onClose, onSelect, excludeIds = [] }: ContextSelectorModalProps) {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [showPublic, setShowPublic] = useState(true); // Show both user's and public by default
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { contextSets, isLoading } = useContextSets(showPublic ? undefined : user?.id, search);

  // Filter out excluded context sets
  const availableContextSets = contextSets.filter((cs) => !excludeIds.includes(cs.id));

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSelect(selectedIds);
      setSelectedIds([]);
      setSearch('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add context sets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn border border-plum-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-plum-500 to-plum-700 rounded-xl flex items-center justify-center shadow-lg shadow-plum-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary">Add Context Sets</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-4 bg-surface-muted/50">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search context sets..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showPublic}
                  onChange={(e) => setShowPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-plum-500 peer-checked:bg-plum-500 transition-colors flex items-center justify-center">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-text-secondary text-sm">Include public contexts</span>
            </label>
            {selectedIds.length > 0 && (
              <span className="px-3 py-1 bg-plum-100 text-plum-700 text-sm font-medium rounded-full">
                {selectedIds.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Context sets list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin mb-3" />
              <span className="text-text-muted text-sm">Loading context sets...</span>
            </div>
          )}

          {!isLoading && availableContextSets.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-text-secondary">
                {search ? 'No context sets found matching your search' : 'No context sets available'}
              </p>
            </div>
          )}

          {!isLoading && availableContextSets.length > 0 && (
            <div className="space-y-3">
              {availableContextSets.map((contextSet) => {
                const isSelected = selectedIds.includes(contextSet.id);
                const termCount = contextSet.term_count || contextSet.terms?.length || 0;
                const generalCount = contextSet.general_count || contextSet.general?.length || 0;
                const translationCount = contextSet.translation_term_count || contextSet.translation_terms?.length || 0;

                return (
                  <div
                    key={contextSet.id}
                    onClick={() => handleToggleSelection(contextSet.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-plum-50 border-plum-500 shadow-md shadow-plum-500/10'
                        : 'bg-white border-gray-100 hover:border-plum-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative mt-0.5">
                        <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-colors ${
                          isSelected ? 'border-plum-500 bg-plum-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${isSelected ? 'text-plum-700' : 'text-text-primary'}`}>
                            {contextSet.name}
                          </span>
                          {contextSet.is_public && (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 text-[10px] font-medium">
                              Public
                            </span>
                          )}
                        </div>
                        {contextSet.description && (
                          <p className="text-text-secondary text-sm mb-3 line-clamp-2">{contextSet.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {termCount > 0 && (
                            <span className="px-2.5 py-1 bg-plum-50 border border-plum-200 rounded-lg text-plum-600 text-xs font-medium">
                              {termCount} terms
                            </span>
                          )}
                          {generalCount > 0 && (
                            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-600 text-xs font-medium">
                              {generalCount} metadata
                            </span>
                          )}
                          {translationCount > 0 && (
                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-600 text-xs font-medium">
                              {translationCount} translations
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted/30 flex gap-3 justify-end">
          <Button onClick={handleClose} disabled={isSubmitting} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            variant="primary"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              `Add${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
