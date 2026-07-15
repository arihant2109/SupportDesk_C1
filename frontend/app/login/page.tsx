'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { FormField } from '@/components/FormField';
import { Button, Icon } from '@/components/ui';
import { safeRedirect } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/tickets');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="body-pad">Loading...</div>;
  }

  if (user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      const redirect = safeRedirect(searchParams.get('redirect'));
      router.push(redirect);
    } catch (submitError) {
      setError((submitError as Error).message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ minHeight: '100vh' }}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Sign in to SupportDesk</h2>
        </div>

        <FormField label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@supportdesk.local"
            autoComplete="email"
            required
          />
        </FormField>

        <FormField label="Password" required>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </FormField>

        {error ? (
          <span className="error-msg">
            <Icon name="alert" className="icon icon-sm" />
            {error}
          </span>
        ) : null}

        <div className="modal-footer">
          <Button type="submit" variant="primary" disabled={submitting}>
            Sign In
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="body-pad">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
