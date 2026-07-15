import { Priority, Status } from '@/types';

export function safeRedirect(path: string | null | undefined, fallback = '/tickets'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }
  return path;
}

export function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

export function formatPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[priority] ?? priority;
}

function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function formatDate(value: string): string {
  if (!isValidDate(value)) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  if (!isValidDate(value)) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

export function shortTicketId(id: string): string {
  return `#${id.slice(0, 8)}`;
}

export function filterAssignableUsers<T extends { role: string }>(users: T[]): T[] {
  return users.filter((user) => user.role !== 'viewer');
}

export type SortField = 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status';
export type SortOrder = 'asc' | 'desc';

export const sortableColumns: Array<{ field: SortField; label: string }> = [
  { field: 'title', label: 'Title' },
  { field: 'priority', label: 'Priority' },
  { field: 'status', label: 'Status' },
  { field: 'createdAt', label: 'Created' },
  { field: 'updatedAt', label: 'Updated' },
];
