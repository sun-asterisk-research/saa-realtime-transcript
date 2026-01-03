'use client';

import { Button } from '@/components/button';
import { CountdownTimer } from '@/components/countdown-timer';
import type { Session } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  session: Session;
  role: 'creator' | 'invited' | 'past';
  onJoin?: () => void;
  className?: string;
}

export function SessionCard({ session, role, onJoin, className }: SessionCardProps) {
  const isScheduled = session.scheduled_start_time && new Date(session.scheduled_start_time) > new Date();
  const scheduledDate = session.scheduled_start_time ? new Date(session.scheduled_start_time) : null;
  const isActive = session.status === 'active';
  const isPast = session.status === 'ended';

  // Determine translation mode display
  const getModeDisplay = () => {
    if (session.mode === 'one_way') {
      return `One-way → ${session.target_language}`;
    } else {
      return `Two-way (${session.language_a} ⟷ ${session.language_b})`;
    }
  };

  // Status badge styling
  const getStatusBadge = () => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-600/20 text-green-400 border-green-600' },
      ended: { label: 'Ended', className: 'bg-slate-600/20 text-slate-400 border-slate-600' },
    };

    const config = statusConfig[session.status] || statusConfig.active;

    return (
      <span className={cn('text-xs px-2 py-1 rounded border', config.className)}>
        {config.label}
      </span>
    );
  };

  // Role badge
  const getRoleBadge = () => {
    if (role === 'creator') {
      return (
        <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600">
          Creator
        </span>
      );
    } else if (role === 'invited') {
      return (
        <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600">
          Invited
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-all hover:shadow-lg',
        className,
      )}
    >
      {/* Header with Title and Badges */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold text-lg flex-1 mr-2 truncate">
          {session.title || `Session ${session.code}`}
        </h3>
        <div className="flex gap-2 flex-shrink-0">
          {getRoleBadge()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{session.description}</p>
      )}

      {/* Session Details */}
      <div className="space-y-1 text-sm text-slate-400 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Host:</span>
          <span className="text-slate-300">{session.host_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Mode:</span>
          <span className="text-slate-300">{getModeDisplay()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Code:</span>
          <span className="text-slate-300 font-mono">{session.code}</span>
        </div>
        {scheduledDate && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              {isPast ? 'Ended:' : isScheduled ? 'Scheduled:' : 'Started:'}
            </span>
            <span className="text-slate-300">
              {scheduledDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Countdown Timer */}
      {isScheduled && !isPast && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-md p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-400 text-sm font-medium">Starts in:</span>
            <CountdownTimer targetTime={session.scheduled_start_time!} />
          </div>
        </div>
      )}

      {/* Join Button */}
      {onJoin && isActive && (
        <Button onClick={onJoin} className="w-full mt-2">
          Join Session
        </Button>
      )}

      {/* Info for Past Sessions */}
      {isPast && session.ended_at && (
        <div className="text-slate-500 text-xs mt-2">
          Ended {new Date(session.ended_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}
