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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Add Context Sets</h2>
            <button onClick={handleClose} className="text-slate-400 hover:text-white text-2xl leading-none" disabled={isSubmitting}>
              &times;
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search context sets..."
            className="text-white"
          />
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showPublic} onChange={(e) => setShowPublic(e.target.checked)} className="rounded" />
              Include public contexts
            </label>
            {selectedIds.length > 0 && <span className="text-blue-400">{selectedIds.length} selected</span>}
          </div>
        </div>

        {/* Context sets list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && <div className="text-center text-slate-400 py-4">Loading...</div>}

          {!isLoading && availableContextSets.length === 0 && (
            <div className="text-center text-slate-400 py-4">
              {search ? 'No context sets found matching your search' : 'No context sets available'}
            </div>
          )}

          {!isLoading && availableContextSets.length > 0 && (
            <div className="space-y-2">
              {availableContextSets.map((contextSet) => {
                const isSelected = selectedIds.includes(contextSet.id);
                const termCount = contextSet.term_count || contextSet.terms?.length || 0;
                const generalCount = contextSet.general_count || contextSet.general?.length || 0;
                const translationCount = contextSet.translation_term_count || contextSet.translation_terms?.length || 0;

                return (
                  <div
                    key={contextSet.id}
                    onClick={() => handleToggleSelection(contextSet.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-slate-700/30 border-slate-700 hover:border-slate-600'
                    }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{contextSet.name}</span>
                          {contextSet.is_public && (
                            <span className="px-1.5 py-0.5 bg-green-900/20 border border-green-900/50 rounded text-green-400 text-[10px]">
                              Public
                            </span>
                          )}
                        </div>
                        {contextSet.description && <p className="text-slate-400 text-sm mb-2">{contextSet.description}</p>}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {termCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-900/20 border border-blue-900/50 rounded text-blue-400">
                              {termCount} terms
                            </span>
                          )}
                          {generalCount > 0 && (
                            <span className="px-2 py-0.5 bg-purple-900/20 border border-purple-900/50 rounded text-purple-400">
                              {generalCount} metadata
                            </span>
                          )}
                          {translationCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-900/20 border border-amber-900/50 rounded text-amber-400">
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
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 justify-end">
          <Button onClick={handleClose} disabled={isSubmitting} className="px-6">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-6 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            {isSubmitting ? 'Adding...' : `Add ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
