'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status, update } = useSession();

  return {
    session,
    status,
    update,
    signIn: () => signIn('google', { callbackUrl: '/dashboard' }),
    signOut: () => signOut({ callbackUrl: '/' }),
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}