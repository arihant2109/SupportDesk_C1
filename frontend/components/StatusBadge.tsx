import { formatStatusLabel } from '@/lib/utils';
import { Status } from '@/types';

const statusClassMap: Record<Status, string> = {
  open: 'status-Open',
  in_progress: 'status-In-Progress',
  resolved: 'status-Resolved',
  closed: 'status-Closed',
  cancelled: 'status-Cancelled',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge ${statusClassMap[status] ?? 'status-Open'}`}>
      {formatStatusLabel(status)}
    </span>
  );
}
