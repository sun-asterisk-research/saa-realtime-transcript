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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Invite Participants</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors text-xl"
          >
            x
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Invite people to join this session. They will be able to join using the session code.
        </p>

        <EmailChipInput
          value={emails}
          onChange={setEmails}
          label="Email Addresses"
          placeholder="Search by name or enter email..."
        />

        {error && (
          <div className="mt-3 p-3 bg-red-600/20 border border-red-600/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-3 space-y-2">
            {result.invited.length > 0 && (
              <div className="p-3 bg-green-600/20 border border-green-600/30 rounded text-green-400 text-sm">
                <div className="font-medium mb-1">Invitations sent:</div>
                <ul className="list-disc list-inside">
                  {result.invited.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.alreadyInvited.length > 0 && (
              <div className="p-3 bg-yellow-600/20 border border-yellow-600/30 rounded text-yellow-400 text-sm">
                <div className="font-medium mb-1">Already invited:</div>
                <ul className="list-disc list-inside">
                  {result.alreadyInvited.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleClose}
            className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleSendInvites}
              disabled={emails.length === 0 || isLoading}
              className="flex-1 bg-blue-600 border-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : `Send ${emails.length > 0 ? `(${emails.length})` : ''}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
