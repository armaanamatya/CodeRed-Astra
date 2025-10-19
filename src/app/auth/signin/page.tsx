'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const error = searchParams?.get('error');
  const callbackUrl = searchParams?.get('callbackUrl');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your account
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h3 className="font-semibold text-destructive mb-2">Authentication Error</h3>
            <p className="text-sm text-destructive">
              {error === 'OAuthCallback' && 'There was an error with the OAuth callback. Please try again.'}
              {error === 'Configuration' && 'There was a configuration error. Please contact support.'}
              {error === 'AccessDenied' && 'Access was denied. Please try again.'}
              {error === 'Verification' && 'The verification link was invalid or has expired.'}
              {!['OAuthCallback', 'Configuration', 'AccessDenied', 'Verification'].includes(error) && 
                `Authentication error: ${error}`
              }
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <AuthButton />
        </div>

        {callbackUrl && (
          <p className="text-xs text-center text-muted-foreground">
            You will be redirected to: {decodeURIComponent(callbackUrl)}
          </p>
        )}
      </div>
    </main>
  );
}