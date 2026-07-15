'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export function AuthGuard({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (adminOnly && user.role !== 'admin') {
      router.replace('/tickets?denied=admin');
    }
  }, [user, loading, router, pathname, adminOnly]);

  if (loading || !user || (adminOnly && user.role !== 'admin')) {
    return (
      <main className="body-pad">
        <div className="row-count">Loading...</div>
      </main>
    );
  }

  return <>{children}</>;
}
