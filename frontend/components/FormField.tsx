import { Icon } from '@/components/ui';
import { ReactNode } from 'react';

export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label>
        {label} {required ? <span className="req">*</span> : null}
      </label>
      {children}
      {error ? (
        <span className="error-msg">
          <Icon name="alert" className="icon icon-sm" />
          {error}
        </span>
      ) : null}
    </div>
  );
}
