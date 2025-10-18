'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestDBPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
        }),
      });
      const data = await response.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Database Test Page</h1>
      
      <div className="flex gap-4 mb-8">
        <Button onClick={testConnection} disabled={loading}>
          Test DB Connection
        </Button>
        <Button onClick={createTestUser} disabled={loading} variant="secondary">
          Create Test User
        </Button>
      </div>

      {status && (
        <pre className="bg-muted p-4 rounded-lg max-w-2xl overflow-auto">
          {status}
        </pre>
      )}
    </main>
  );
}