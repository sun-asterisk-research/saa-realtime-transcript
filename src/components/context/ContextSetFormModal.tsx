'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import type { ContextSetWithDetails, ContextSetFormData } from '@/lib/supabase/types';

interface ContextSetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContextSetFormData) => Promise<void>;
  contextSet?: ContextSetWithDetails | null;
  userId: string;
}

type TabType = 'basic' | 'terms' | 'general' | 'translation' | 'text';

export function ContextSetFormModal({ isOpen, onClose, onSubmit, contextSet, userId }: ContextSetFormModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [terms, setTerms] = useState<string[]>(['']);
  const [general, setGeneral] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [translationTerms, setTranslationTerms] = useState<Array<{ source: string; target: string }>>([
    { source: '', target: '' },
  ]);
  const [text, setText] = useState('');

  // Load context set data when editing
  useEffect(() => {
    if (contextSet) {
      setName(contextSet.name);
      setDescription(contextSet.description || '');
      setIsPublic(contextSet.is_public);
      setTerms(contextSet.terms?.map((t) => t.term) || ['']);
      setGeneral(
        contextSet.general?.length > 0 ? contextSet.general.map((g) => ({ key: g.key, value: g.value })) : [{ key: '', value: '' }],
      );
      setTranslationTerms(
        contextSet.translation_terms?.length > 0
          ? contextSet.translation_terms.map((tt) => ({ source: tt.source, target: tt.target }))
          : [{ source: '', target: '' }],
      );
      setText(contextSet.text || '');
    } else {
      // Reset form for new context set
      setName('');
      setDescription('');
      setIsPublic(false);
      setTerms(['']);
      setGeneral([{ key: '', value: '' }]);
      setTranslationTerms([{ source: '', target: '' }]);
      setText('');
    }
    setActiveTab('basic');
    setError('');
  }, [contextSet, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      setActiveTab('basic');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: ContextSetFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        text: text.trim() || undefined,
        is_public: isPublic,
        terms: terms.filter((t) => t.trim()).map((t) => t.trim()),
        general: general.filter((g) => g.key.trim() && g.value.trim()).map((g) => ({ key: g.key.trim(), value: g.value.trim() })),
        translation_terms: translationTerms
          .filter((tt) => tt.source.trim() && tt.target.trim())
          .map((tt) => ({ source: tt.source.trim(), target: tt.target.trim() })),
      };

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save context set');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{contextSet ? 'Edit Context Set' : 'Create Context Set'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none" disabled={isSubmitting}>
              &times;
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6">
          {[
            { id: 'basic' as TabType, label: 'Basic' },
            { id: 'terms' as TabType, label: 'Terms' },
            { id: 'general' as TabType, label: 'Metadata' },
            { id: 'translation' as TabType, label: 'Translations' },
            { id: 'text' as TabType, label: 'Text' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <>
                <div>
                  <label className="block text-slate-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Medical Terms, Technology Vocabulary"
                    maxLength={100}
                    required
                    className="text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of what this context set contains"
                    className="flex w-full rounded-md border border-primary text-white bg-transparent px-3 py-2 text-base shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[80px]"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" />
                    <span>Make this context set public</span>
                  </label>
                  <p className="text-slate-500 text-sm mt-1">Public context sets can be used by anyone</p>
                </div>
              </>
            )}

            {/* Terms Tab */}
            {activeTab === 'terms' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300">Terms (Keywords)</label>
                  <Button
                    type="button"
                    onClick={() => setTerms([...terms, ''])}
                    className="text-sm h-8 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                    Add Term
                  </Button>
                </div>
                <p className="text-slate-500 text-sm -mt-4">Add domain-specific terms, names, or keywords (max 500)</p>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {terms.map((term, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={term}
                        onChange={(e) => {
                          const newTerms = [...terms];
                          newTerms[index] = e.target.value;
                          setTerms(newTerms);
                        }}
                        placeholder={`Term ${index + 1}`}
                        maxLength={200}
                        className="text-white flex-1"
                      />
                      {terms.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setTerms(terms.filter((_, i) => i !== index))}
                          className="h-10 px-3 bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/30">
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* General Metadata Tab */}
            {activeTab === 'general' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300">General Metadata (Key-Value Pairs)</label>
                  <Button
                    type="button"
                    onClick={() => setGeneral([...general, { key: '', value: '' }])}
                    className="text-sm h-8 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                    Add Metadata
                  </Button>
                </div>
                <p className="text-slate-500 text-sm -mt-4">
                  Add contextual information (e.g., domain: Technology, topic: Cloud Computing)
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {general.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item.key}
                        onChange={(e) => {
                          const newGeneral = [...general];
                          newGeneral[index].key = e.target.value;
                          setGeneral(newGeneral);
                        }}
                        placeholder="Key"
                        className="text-white flex-1"
                      />
                      <Input
                        value={item.value}
                        onChange={(e) => {
                          const newGeneral = [...general];
                          newGeneral[index].value = e.target.value;
                          setGeneral(newGeneral);
                        }}
                        placeholder="Value"
                        className="text-white flex-1"
                      />
                      {general.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setGeneral(general.filter((_, i) => i !== index))}
                          className="h-10 px-3 bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/30">
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Translation Terms Tab */}
            {activeTab === 'translation' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300">Translation Terms</label>
                  <Button
                    type="button"
                    onClick={() => setTranslationTerms([...translationTerms, { source: '', target: '' }])}
                    className="text-sm h-8 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                    Add Translation
                  </Button>
                </div>
                <p className="text-slate-500 text-sm -mt-4">Force specific translations for certain terms (max 500)</p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {translationTerms.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item.source}
                        onChange={(e) => {
                          const newTranslationTerms = [...translationTerms];
                          newTranslationTerms[index].source = e.target.value;
                          setTranslationTerms(newTranslationTerms);
                        }}
                        placeholder="Source (original)"
                        className="text-white flex-1"
                      />
                      <Input
                        value={item.target}
                        onChange={(e) => {
                          const newTranslationTerms = [...translationTerms];
                          newTranslationTerms[index].target = e.target.value;
                          setTranslationTerms(newTranslationTerms);
                        }}
                        placeholder="Target (translation)"
                        className="text-white flex-1"
                      />
                      {translationTerms.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setTranslationTerms(translationTerms.filter((_, i) => i !== index))}
                          className="h-10 px-3 bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/30">
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Text Tab */}
            {activeTab === 'text' && (
              <>
                <div>
                  <label className="block text-slate-300 mb-2">Context Text</label>
                  <p className="text-slate-500 text-sm mb-2">
                    Add longer context information, examples, or relevant text (max 10,000 characters)
                  </p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter contextual text, examples, or additional information..."
                    className="flex w-full rounded-md border border-primary text-white bg-transparent px-3 py-2 text-base shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[300px] font-mono text-sm"
                    maxLength={10000}
                  />
                  <div className="text-slate-500 text-xs mt-1 text-right">{text.length} / 10,000 characters</div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700 bg-slate-900/50">
            {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

            <div className="flex gap-3 justify-end">
              <Button type="button" onClick={onClose} disabled={isSubmitting} className="px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-6 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                {isSubmitting ? 'Saving...' : contextSet ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
