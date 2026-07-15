import { Icon } from '@/components/ui';

export function EmptyState({
  title = 'No tickets found',
  description = 'Try adjusting your search or filter, or create a new ticket.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="state-box">
      <div className="emoji">
        <Icon name="inbox" className="icon icon-lg" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
