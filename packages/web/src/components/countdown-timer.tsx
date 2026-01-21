'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: string; // ISO timestamp
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ targetTime, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Session is starting now!');
        if (!isComplete) {
          setIsComplete(true);
          onComplete?.();
        }
        return true;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format the time left based on how far away it is
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }

      return false;
    };

    // Calculate immediately
    const isDone = calculateTimeLeft();

    // Set up interval only if not complete
    if (!isDone) {
      const interval = setInterval(() => {
        const done = calculateTimeLeft();
        if (done) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [targetTime, onComplete, isComplete]);

  return (
    <div className={className}>
      <span className={isComplete ? 'text-green-400 font-semibold' : 'text-slate-300'}>{timeLeft}</span>
    </div>
  );
}
