import { Button, Icon } from '@/components/ui';

export function ErrorState({
  title = "Couldn't load tickets",
  description = 'Something went wrong while fetching data. Please retry.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-box error">
      <div className="emoji">
        <Icon name="alert" className="icon icon-lg" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} style={{ marginTop: 6 }}>
          <Icon name="refresh" className="icon" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
