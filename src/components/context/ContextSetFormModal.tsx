'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import type { ContextSetWithDetails, ContextSetFormData } from '@/lib/supabase/types';
import { generateContextSetTemplate, generateAnnotatedTemplate, generateChatGPTPrompt } from '@/lib/context/json-template';
import { validateImportedJson } from '@/lib/context/json-validator';

interface ContextSetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContextSetFormData) => Promise<void>;
  contextSet?: ContextSetWithDetails | null;
  userId: string;
}

type TabType = 'basic' | 'terms' | 'general' | 'translation' | 'text' | 'import';

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

  // Import JSON state
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

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

  const handleLoadTemplate = () => {
    const template = generateContextSetTemplate();
    setImportJson(template);
    setImportError('');
    setImportSuccess(false);
  };

  const handleCopyTemplate = async () => {
    const template = generateContextSetTemplate();
    try {
      await navigator.clipboard.writeText(template);
      alert('Template copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard. Please copy manually from the textarea after clicking "Load Template".');
    }
  };

  const handleCopyChatGPTPrompt = async () => {
    const prompt = generateChatGPTPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      alert('ChatGPT prompt copied to clipboard! Paste it into ChatGPT to generate your JSON.');
    } catch (err) {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleImportJson = () => {
    setImportError('');
    setImportSuccess(false);

    const result = validateImportedJson(importJson);

    if (!result.isValid) {
      setImportError(result.errors.join('\n'));
      return;
    }

    if (result.warnings.length > 0) {
      console.warn('Import warnings:', result.warnings);
    }

    const data = result.data!;
    setName(data.name);
    setDescription(data.description || '');
    setIsPublic(data.is_public);

    setTerms(data.terms.length > 0 ? data.terms : ['']);
    setGeneral(data.general.length > 0 ? data.general : [{ key: '', value: '' }]);
    setTranslationTerms(data.translation_terms.length > 0 ? data.translation_terms : [{ source: '', target: '' }]);
    setText(data.text || '');

    setImportSuccess(true);

    setTimeout(() => {
      setActiveTab('basic');
    }, 1500);
  };

  const handleExportJson = async () => {
    const formData: ContextSetFormData = {
      name: name.trim() || 'Untitled Context Set',
      description: description.trim() || undefined,
      text: text.trim() || undefined,
      is_public: isPublic,
      terms: terms.filter((t) => t.trim()).map((t) => t.trim()),
      general: general.filter((g) => g.key.trim() && g.value.trim()),
      translation_terms: translationTerms.filter((tt) => tt.source.trim() && tt.target.trim()),
    };

    const jsonString = JSON.stringify(formData, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      alert('JSON copied to clipboard!');
    } catch (err) {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as TabType, label: 'Basic', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'terms' as TabType, label: 'Terms', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
    { id: 'general' as TabType, label: 'Metadata', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'translation' as TabType, label: 'Translations', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
    { id: 'text' as TabType, label: 'Text', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'import' as TabType, label: 'Import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn border border-plum-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-plum-500 to-plum-700 rounded-xl flex items-center justify-center shadow-lg shadow-plum-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={contextSet ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' : 'M12 4v16m8-8H4'} />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary">{contextSet ? 'Edit Context Set' : 'Create Context Set'}</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 bg-surface-muted/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-plum-500 text-plum-600'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
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
                  <label className="block text-text-primary font-medium mb-2">
                    Name <span className="text-plum-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Medical Terms, Technology Vocabulary"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-primary font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of what this context set contains"
                    className="w-full px-4 py-3 bg-white border-2 border-plum-200 rounded-xl text-text-primary placeholder:text-text-muted min-h-[100px] resize-y focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all"
                    maxLength={500}
                  />
                </div>

                <div className="bg-surface-muted rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-plum-500 peer-checked:bg-plum-500 transition-colors flex items-center justify-center">
                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="text-text-primary font-medium">Make this context set public</span>
                      <p className="text-text-muted text-sm">Public context sets can be used by anyone</p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-text-primary font-medium mb-2">Export Current Data</label>
                  <p className="text-text-muted text-sm mb-3">Export the current form data as JSON (useful for backups or sharing)</p>
                  <Button type="button" onClick={handleExportJson} variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export as JSON
                  </Button>
                </div>
              </>
            )}

            {/* Terms Tab */}
            {activeTab === 'terms' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-text-primary font-medium">Terms (Keywords)</h3>
                    <p className="text-text-muted text-sm">Add domain-specific terms, names, or keywords (max 500)</p>
                  </div>
                  <Button type="button" onClick={() => setTerms([...terms, ''])} variant="primary" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Term
                  </Button>
                </div>

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
                        className="flex-1"
                      />
                      {terms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTerms(terms.filter((_, i) => i !== index))}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
                  <div>
                    <h3 className="text-text-primary font-medium">General Metadata (Key-Value Pairs)</h3>
                    <p className="text-text-muted text-sm">Add contextual information (e.g., domain: Technology)</p>
                  </div>
                  <Button type="button" onClick={() => setGeneral([...general, { key: '', value: '' }])} variant="primary" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Metadata
                  </Button>
                </div>

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
                        className="flex-1"
                      />
                      <Input
                        value={item.value}
                        onChange={(e) => {
                          const newGeneral = [...general];
                          newGeneral[index].value = e.target.value;
                          setGeneral(newGeneral);
                        }}
                        placeholder="Value"
                        className="flex-1"
                      />
                      {general.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setGeneral(general.filter((_, i) => i !== index))}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
                  <div>
                    <h3 className="text-text-primary font-medium">Translation Terms</h3>
                    <p className="text-text-muted text-sm">Force specific translations for certain terms (max 500)</p>
                  </div>
                  <Button type="button" onClick={() => setTranslationTerms([...translationTerms, { source: '', target: '' }])} variant="primary" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Translation
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {translationTerms.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={item.source}
                        onChange={(e) => {
                          const newTranslationTerms = [...translationTerms];
                          newTranslationTerms[index].source = e.target.value;
                          setTranslationTerms(newTranslationTerms);
                        }}
                        placeholder="Source (original)"
                        className="flex-1"
                      />
                      <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <Input
                        value={item.target}
                        onChange={(e) => {
                          const newTranslationTerms = [...translationTerms];
                          newTranslationTerms[index].target = e.target.value;
                          setTranslationTerms(newTranslationTerms);
                        }}
                        placeholder="Target (translation)"
                        className="flex-1"
                      />
                      {translationTerms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTranslationTerms(translationTerms.filter((_, i) => i !== index))}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Text Tab */}
            {activeTab === 'text' && (
              <div>
                <label className="block text-text-primary font-medium mb-2">Context Text</label>
                <p className="text-text-muted text-sm mb-3">
                  Add longer context information, examples, or relevant text (max 10,000 characters)
                </p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter contextual text, examples, or additional information..."
                  className="w-full px-4 py-3 bg-white border-2 border-plum-200 rounded-xl text-text-primary placeholder:text-text-muted min-h-[300px] resize-y focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all font-mono text-sm"
                  maxLength={10000}
                />
                <div className="text-text-muted text-xs mt-2 text-right">{text.length} / 10,000 characters</div>
              </div>
            )}

            {/* Import JSON Tab */}
            {activeTab === 'import' && (
              <div>
                <label className="block text-text-primary font-medium mb-2">Import Context Set from JSON</label>
                <p className="text-text-muted text-sm mb-4">
                  Paste JSON data below to auto-populate all tabs. You can review and modify before saving.
                </p>

                {/* Template section */}
                <div className="mb-4 flex gap-2 flex-wrap">
                  <Button type="button" onClick={handleLoadTemplate} variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load Template
                  </Button>
                  <Button type="button" onClick={handleCopyTemplate} variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Template
                  </Button>
                  <Button type="button" onClick={handleCopyChatGPTPrompt} variant="primary" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    ChatGPT Prompt
                  </Button>
                </div>

                {/* JSON editor textarea */}
                <textarea
                  value={importJson}
                  onChange={(e) => {
                    setImportJson(e.target.value);
                    setImportError('');
                    setImportSuccess(false);
                  }}
                  placeholder="Paste JSON here or click 'Load Template' to see the structure..."
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-text-primary placeholder:text-text-muted min-h-[350px] resize-y focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all font-mono text-xs"
                  spellCheck={false}
                />

                <div className="text-text-muted text-xs mt-2 text-right">{importJson.length} characters</div>

                {importError && (
                  <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm whitespace-pre-wrap flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>JSON imported successfully! Review the other tabs and click Create/Update to save.</span>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={handleImportJson}
                    disabled={!importJson.trim()}
                    variant="primary"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import and Populate Form
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted/30">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" onClick={onClose} disabled={isSubmitting} variant="outline">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                variant="primary"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : contextSet ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
