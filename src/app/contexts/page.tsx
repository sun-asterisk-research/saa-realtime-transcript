'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { useUser } from '@/lib/hooks/useUser';
import { useContextSets } from '@/lib/hooks/useContextSets';
import { ContextSetFormModal } from '@/components/context/ContextSetFormModal';
import type { ContextSetWithDetails, ContextSetFormData } from '@/lib/supabase/types';

export default function ContextsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [search, setSearch] = useState('');
  const [showPublic, setShowPublic] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContextSet, setEditingContextSet] = useState<ContextSetWithDetails | null>(null);
  const { contextSets, isLoading, error, createContextSet, updateContextSet, deleteContextSet } = useContextSets(
    showPublic ? undefined : user?.id,
    search,
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleOpenCreate = () => {
    setEditingContextSet(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contextSet: ContextSetWithDetails) => {
    setEditingContextSet(contextSet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContextSet(null);
  };

  const handleSubmit = async (data: ContextSetFormData) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (editingContextSet) {
      // Update existing context set
      await updateContextSet(editingContextSet.id, { ...data, userId: user.id });
    } else {
      // Create new context set
      await createContextSet({ ...data, userId: user.id });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteContextSet(id, user?.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete context set');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin" />
          <span className="text-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-plum-400 to-plum-600 blob opacity-50 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-40 right-0 w-80 h-80 bg-gradient-to-bl from-plum-300 to-plum-500 blob-2 opacity-40 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-tr from-plum-200 to-plum-400 blob-3 opacity-30 translate-y-1/3" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-plum-600 transition-colors mb-6 group"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Context Sets</h1>
                <p className="text-text-secondary mt-2">
                  Manage domain-specific terms and keywords to improve transcription accuracy
                </p>
              </div>
              <Button onClick={handleOpenCreate} variant="primary" className="md:w-auto">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-plum-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
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
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showPublic}
                    onChange={(e) => setShowPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-plum-500 transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-text-secondary">Show public contexts</span>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin mx-auto mb-4" />
              <div className="text-text-secondary">Loading context sets...</div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && contextSets.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-plum-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-plum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {search
                  ? 'No context sets found'
                  : showPublic
                    ? 'No public context sets available'
                    : 'No context sets yet'}
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                {search
                  ? 'Try adjusting your search terms'
                  : showPublic
                    ? 'Be the first to create a public context set!'
                    : 'Create your first context set to improve transcription accuracy for domain-specific terms.'}
              </p>
              {!search && !showPublic && (
                <Button onClick={handleOpenCreate} variant="primary">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Context Set
                </Button>
              )}
            </div>
          )}

          {/* Context sets grid */}
          {!isLoading && contextSets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contextSets.map((contextSet) => (
                <ContextSetCard
                  key={contextSet.id}
                  contextSet={contextSet}
                  isOwner={contextSet.user_id === user?.id}
                  onEdit={() => handleOpenEdit(contextSet)}
                  onDelete={() => handleDelete(contextSet.id, contextSet.name)}
                />
              ))}
            </div>
          )}

          {/* Modal */}
          <ContextSetFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            contextSet={editingContextSet}
            userId={user?.id || ''}
          />
        </div>
      </div>
    </div>
  );
}

interface ContextSetCardProps {
  contextSet: ContextSetWithDetails;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ContextSetCard({ contextSet, isOwner, onEdit, onDelete }: ContextSetCardProps) {
  const termCount = contextSet.term_count || contextSet.terms?.length || 0;
  const generalCount = contextSet.general_count || contextSet.general?.length || 0;
  const translationCount =
    contextSet.translation_term_count || contextSet.translation_terms?.length || 0;
  const hasText = !!contextSet.text;

  return (
    <div className="bg-white rounded-2xl border border-plum-100 p-5 hover:shadow-lg hover:border-plum-200 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-text-primary font-semibold text-lg mb-1 group-hover:text-plum-600 transition-colors">
            {contextSet.name}
          </h3>
          {contextSet.description && (
            <p className="text-text-secondary text-sm line-clamp-2">{contextSet.description}</p>
          )}
        </div>
        {contextSet.is_public && (
          <span className="ml-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 text-xs font-medium">
            Public
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        {termCount > 0 && (
          <div className="px-2.5 py-1 bg-plum-50 border border-plum-200 rounded-lg text-plum-600 text-xs font-medium">
            {termCount} term{termCount !== 1 ? 's' : ''}
          </div>
        )}
        {generalCount > 0 && (
          <div className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-600 text-xs font-medium">
            {generalCount} metadata
          </div>
        )}
        {translationCount > 0 && (
          <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-600 text-xs font-medium">
            {translationCount} translation{translationCount !== 1 ? 's' : ''}
          </div>
        )}
        {hasText && (
          <div className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-xs font-medium">
            Text
          </div>
        )}
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" className="flex-1 text-sm h-9">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="danger"
            className="flex-1 text-sm h-9"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      )}
      {!isOwner && (
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Created by another user</span>
        </div>
      )}
    </div>
  );
}
