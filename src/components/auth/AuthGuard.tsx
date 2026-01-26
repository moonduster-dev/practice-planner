'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginPage from './LoginPage';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard - Wraps pages that need authentication
 *
 * Behavior:
 * - If auth disabled (NEXT_PUBLIC_AUTH_ENABLED=false): renders children directly
 * - If auth enabled + not logged in: shows LoginPage
 * - If auth enabled + logged in: renders children
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading, authEnabled } = useAuth();

  // Auth disabled - render children directly (old behavior)
  if (!authEnabled) {
    return <>{children}</>;
  }

  // Auth enabled but still loading - show loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Auth enabled but not logged in - show login or fallback
  if (!user) {
    return <>{fallback ?? <LoginPage />}</>;
  }

  // Authenticated - render children
  return <>{children}</>;
}
