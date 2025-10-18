'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There was a problem with the server configuration. Please contact support.',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You denied access to your account. Please try again and allow access.',
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          description: 'The verification link was invalid or has expired.',
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          description: 'There was an error during the OAuth callback. This might be due to invalid credentials or redirect URI mismatch.',
        };
      default:
        return {
          title: 'Authentication Error',
          description: error ? `Error: ${error}` : 'An unknown authentication error occurred.',
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-destructive">{errorInfo.title}</h1>
          <p className="text-muted-foreground">{errorInfo.description}</p>
        </div>

        {error === 'OAuthCallback' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Steps:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check that your Google OAuth credentials are correct</li>
              <li>• Verify redirect URIs in Google Cloud Console</li>
              <li>• Ensure all required APIs are enabled (Gmail, Calendar)</li>
              <li>• Clear browser cache and cookies</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link href="/auth/signin">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}