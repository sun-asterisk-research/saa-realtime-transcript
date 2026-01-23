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
      return `One-way → ${session.target_language?.toUpperCase()}`;
    } else {
      return `Two-way (${session.language_a?.toUpperCase()} ⟷ ${session.language_b?.toUpperCase()})`;
    }
  };

  // Status badge styling
  const getStatusBadge = () => {
    const statusConfig = {
      active: {
        label: 'Active',
        className: 'bg-green-50 text-green-600 border-green-200',
      },
      ended: {
        label: 'Ended',
        className: 'bg-gray-100 text-gray-500 border-gray-200',
      },
    };

    const config = statusConfig[session.status] || statusConfig.active;

    return (
      <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', config.className)}>
        {config.label}
      </span>
    );
  };

  // Role badge
  const getRoleBadge = () => {
    if (role === 'creator') {
      return (
        <span className="text-xs px-2.5 py-1 rounded-full bg-plum-50 text-plum-600 border border-plum-200 font-medium">
          Creator
        </span>
      );
    } else if (role === 'invited') {
      return (
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium">
          Invited
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'bg-white border border-plum-100 rounded-xl p-5 hover:border-plum-300 hover:shadow-lg transition-all duration-200',
        className,
      )}>
      {/* Header with Title and Badges */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-text-primary font-semibold text-lg flex-1 mr-2 truncate">
          {session.title || `Session ${session.code}`}
        </h3>
        <div className="flex gap-2 flex-shrink-0">
          {getRoleBadge()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-text-muted text-sm mb-4 line-clamp-2">{session.description}</p>
      )}

      {/* Session Details */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2">
          <span className="text-text-light w-14">Host:</span>
          <span className="text-text-secondary">{session.host_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-light w-14">Mode:</span>
          <span className="text-text-secondary">{getModeDisplay()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-light w-14">Code:</span>
          <span className="text-plum-600 font-mono font-medium bg-plum-50 px-2 py-0.5 rounded">{session.code}</span>
        </div>
        {scheduledDate && (
          <div className="flex items-center gap-2">
            <span className="text-text-light w-14">
              {isPast ? 'Ended:' : isScheduled ? 'Start:' : 'Started:'}
            </span>
            <span className="text-text-secondary">
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-amber-700 text-sm font-medium">Starts in:</span>
            <CountdownTimer targetTime={session.scheduled_start_time!} />
          </div>
        </div>
      )}

      {/* Join Button */}
      {onJoin && isActive && (
        <Button onClick={onJoin} variant="primary" className="w-full">
          Join Session
        </Button>
      )}

      {/* View History Button for Past Sessions */}
      {isPast && session.ended_at && (
        <div className="space-y-2">
          <div className="text-text-light text-xs">
            Ended{' '}
            {new Date(session.ended_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </div>
          <Button
            onClick={() => (window.location.href = `/history/${session.code}`)}
            variant="secondary"
            className="w-full">
            View History
          </Button>
        </div>
      )}
    </div>
  );
}
