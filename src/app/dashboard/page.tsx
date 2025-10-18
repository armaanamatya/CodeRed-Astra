'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { session } = useAuth();

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <span className="text-lg font-medium">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Gmail Integration</h2>
              <p className="text-muted-foreground mb-4">
                Access and manage your Gmail messages
              </p>
              <Button className="w-full">View Gmail</Button>
            </div>

            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Calendar Integration</h2>
              <p className="text-muted-foreground mb-4">
                View and manage your Google Calendar events
              </p>
              <Button className="w-full">View Calendar</Button>
            </div>
          </div>

          <div className="mt-8 p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {session?.user?.email}</p>
              <p><strong>Name:</strong> {session?.user?.name}</p>
              <p><strong>Access Token:</strong> {session?.accessToken ? '✅ Available' : '❌ Not available'}</p>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}