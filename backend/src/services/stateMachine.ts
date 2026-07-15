import { Status } from '@prisma/client';

export const VALID_TRANSITIONS: Record<Status, Status[]> = {
  open: [Status.in_progress, Status.cancelled],
  in_progress: [Status.resolved, Status.cancelled],
  resolved: [Status.closed],
  closed: [],
  cancelled: [],
};

export function canTransition(from: Status, to: Status): boolean {
  if (from === to) {
    return false;
  }

  return VALID_TRANSITIONS[from].includes(to);
}

export function getValidNextStatuses(from: Status): Status[] {
  return VALID_TRANSITIONS[from];
}
