import { formatPriorityLabel } from '@/lib/utils';
import { Priority } from '@/types';

const priorityClassMap: Record<Priority, string> = {
  low: 'priority-Low',
  medium: 'priority-Medium',
  high: 'priority-High',
  critical: 'priority-Critical',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${priorityClassMap[priority] ?? 'priority-Low'}`}>
      {formatPriorityLabel(priority)}
    </span>
  );
}
