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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-slate-400 hover:text-white mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Context Sets</h1>
            <Button onClick={handleOpenCreate} className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
              Create New
            </Button>
          </div>
          <p className="text-slate-400 mt-2">
            Manage domain-specific terms and keywords to improve transcription accuracy
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search context sets..."
              className="text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showPublic}
                onChange={(e) => setShowPublic(e.target.checked)}
                className="rounded"
              />
              Show public contexts
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-md">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading context sets...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && contextSets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              {search
                ? 'No context sets found matching your search'
                : showPublic
                  ? 'No public context sets available'
                  : "You haven't created any context sets yet"}
            </div>
            {!search && !showPublic && (
              <Button onClick={handleOpenCreate} className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">{contextSet.name}</h3>
          {contextSet.description && <p className="text-slate-400 text-sm">{contextSet.description}</p>}
        </div>
        {contextSet.is_public && (
          <span className="ml-2 px-2 py-1 bg-green-900/20 border border-green-900/50 rounded text-green-400 text-xs">
            Public
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        {termCount > 0 && (
          <div className="px-2 py-1 bg-blue-900/20 border border-blue-900/50 rounded text-blue-400 text-xs">
            {termCount} term{termCount !== 1 ? 's' : ''}
          </div>
        )}
        {generalCount > 0 && (
          <div className="px-2 py-1 bg-purple-900/20 border border-purple-900/50 rounded text-purple-400 text-xs">
            {generalCount} metadata
          </div>
        )}
        {translationCount > 0 && (
          <div className="px-2 py-1 bg-amber-900/20 border border-amber-900/50 rounded text-amber-400 text-xs">
            {translationCount} translation{translationCount !== 1 ? 's' : ''}
          </div>
        )}
        {hasText && (
          <div className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-400 text-xs">
            Text
          </div>
        )}
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-2">
          <Button onClick={onEdit} className="flex-1 text-sm h-9">
            Edit
          </Button>
          <Button
            onClick={onDelete}
            className="flex-1 text-sm h-9 bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/30">
            Delete
          </Button>
        </div>
      )}
      {!isOwner && (
        <div className="text-slate-500 text-xs italic">Created by another user</div>
      )}
    </div>
  );
}
