'use client';

import { AuthGuard } from '@/components/AuthGuard';

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
