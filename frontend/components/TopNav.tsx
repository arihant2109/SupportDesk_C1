'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Button, Icon } from '@/components/ui';

export function TopNav() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="topnav">
      <div className="logo-group">
        <div className="logo-mark" />
        <Link href="/tickets" className="logo-text" style={{ textDecoration: 'none', color: 'inherit' }}>
          SupportDesk
        </Link>
      </div>
      <div className="user-group">
        {isAdmin ? (
          <Link
            href="/admin/users"
            className={`view-link ${pathname.startsWith('/admin') ? 'highlight' : ''}`}
            style={{ marginRight: 8 }}
          >
            Users
          </Link>
        ) : null}
        <div className="user-text">
          <div className="user-name">{user?.name ?? 'Loading...'}</div>
          <div className="user-role capitalize">{user?.role ?? ''}</div>
        </div>
        <div className="avatar" />
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
