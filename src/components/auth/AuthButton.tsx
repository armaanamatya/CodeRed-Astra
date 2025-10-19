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
          <span className="text-sm font-medium text-[#98CD85]">
            Welcome, {session.user.name || session.user.email}
          </span>
        </div>
        <Button onClick={signOut} className="bg-[#98CD85] text-[#26200D] hover:bg-[#7AB370] border border-[#98CD85]">
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={signIn} className="bg-[#98CD85] text-[#26200D] hover:bg-[#7AB370] border border-[#98CD85]">
      Sign in
    </Button>
  );
}