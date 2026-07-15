'use client';

import { useEffect, useRef } from 'react';
import { Icon, IconButton } from '@/components/ui';

export function Toast({
  title,
  message,
  onClose,
  duration = 4000,
}: {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, title, message]);

  return (
    <div className="toast">
      <Icon name="alert" className="icon" />
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      <IconButton
        type="button"
        className="sm ghost"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <Icon name="x" className="icon icon-sm" />
      </IconButton>
    </div>
  );
}
