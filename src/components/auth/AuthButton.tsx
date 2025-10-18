'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function AuthButton() {
  const { session, isAuthenticated, isLoading, signIn, signOut } = useAuth();

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (isAuthenticated && session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium">
            Welcome, {session.user.name || session.user.email}
          </span>
        </div>
        <Button onClick={signOut} className="bg-white text-[#8A817C] hover:bg-gray-100 border-white">
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={signIn} className="bg-white text-[#8A817C] hover:bg-gray-100">
      Sign in
    </Button>
  );
}