'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui';
import { getTransitions } from '@/lib/api';
import { formatStatusLabel } from '@/lib/utils';
import { Status } from '@/types';

const transitionIconMap: Record<Status, 'circle' | 'play-circle' | 'check-circle' | 'lock' | 'ban'> = {
  open: 'circle',
  in_progress: 'play-circle',
  resolved: 'check-circle',
  closed: 'lock',
  cancelled: 'ban',
};

const allStatuses: Status[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
  'cancelled',
];

export function TransitionPanel({
  currentStatus,
  onTransition,
  disabled,
}: {
  currentStatus: Status;
  onTransition: (status: Status) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [validNext, setValidNext] = useState<Status[]>([]);

  useEffect(() => {
    getTransitions(currentStatus)
      .then((response) => setValidNext(response.transitions))
      .catch(() => setValidNext([]));
  }, [currentStatus]);

  return (
    <div>
      <div className="section-label" style={{ marginBottom: 8 }}>
        Move to
      </div>
      <div className="transitions">
        {allStatuses.map((status) => {
          const isValid = validNext.includes(status);
          return (
            <button
              key={status}
              type="button"
              className={`transition-btn ${!isValid || disabled ? 'disabled' : ''}`}
              disabled={!isValid || disabled}
              onClick={() => onTransition(status)}
            >
              <Icon name={transitionIconMap[status]} className="icon icon-sm" />
              {formatStatusLabel(status)}
            </button>
          );
        })}
      </div>
      <p className="transitions-note">
        Only valid transitions are enabled. Invalid moves are rejected by the backend.
      </p>
    </div>
  );
}
