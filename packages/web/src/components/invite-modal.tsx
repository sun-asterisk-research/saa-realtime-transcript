'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import { EmailChipInput } from '@/components/email-chip-input';

interface InviteModalProps {
  sessionCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ sessionCode, isOpen, onClose }: InviteModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    invited: string[];
    alreadyInvited: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendInvites = async () => {
    if (emails.length === 0) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/sessions/${sessionCode}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations');
      }

      setResult({
        invited: data.invited || [],
        alreadyInvited: data.alreadyInvited || [],
      });
      setEmails([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmails([]);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-text-primary">Invite Participants</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-text-secondary text-sm mb-5">
          Invite people to join this session. They will be able to join using the session code.
        </p>

        <EmailChipInput
          value={emails}
          onChange={setEmails}
          label="Email Addresses"
          placeholder="Search by name or enter email..."
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            {result.invited.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Invitations sent:
                </div>
                <ul className="list-disc list-inside ml-1 space-y-1">
                  {result.invited.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.alreadyInvited.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Already invited:
                </div>
                <ul className="list-disc list-inside ml-1 space-y-1">
                  {result.alreadyInvited.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button onClick={handleClose} variant="outline" className="flex-1">
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleSendInvites}
              disabled={emails.length === 0 || isLoading}
              variant="primary"
              className="flex-1">
              {isLoading ? 'Sending...' : `Send ${emails.length > 0 ? `(${emails.length})` : ''}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
