'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MigrateDatabasePage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate-database');
      const data = await response.json();
      setDbStatus(data);
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const migrateDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate-database', {
        method: 'POST',
      });
      const data = await response.json();
      setStatus(JSON.stringify(data, null, 2));
      
      // Refresh status after migration
      if (data.success) {
        setTimeout(() => {
          checkDatabaseStatus();
        }, 1000);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Database Migration Tool</h1>
      
      <div className="max-w-4xl w-full space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Migration Overview</h2>
          <p className="text-yellow-700">
            This tool will migrate users from the "test" database to the "NAVI" database 
            and then delete the old "test" database collections.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={checkDatabaseStatus} disabled={loading} variant="outline">
            Check Database Status
          </Button>
          <Button onClick={migrateDatabase} disabled={loading} variant="destructive">
            Migrate & Clean Database
          </Button>
        </div>

        {dbStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Test Database</h3>
              <p><strong>User Count:</strong> {dbStatus.testDatabase?.userCount || 0}</p>
              <p><strong>Collections:</strong> {dbStatus.testDatabase?.collections?.length || 0}</p>
              {dbStatus.testDatabase?.collections?.length > 0 && (
                <ul className="text-sm text-blue-700">
                  {dbStatus.testDatabase.collections.map((col: string) => (
                    <li key={col}>• {col}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">NAVI Database</h3>
              <p><strong>User Count:</strong> {dbStatus.naviDatabase?.userCount || 0}</p>
              <p><strong>Collections:</strong> {dbStatus.naviDatabase?.collections?.length || 0}</p>
              {dbStatus.naviDatabase?.collections?.length > 0 && (
                <ul className="text-sm text-green-700">
                  {dbStatus.naviDatabase.collections.map((col: string) => (
                    <li key={col}>• {col}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {status && (
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Operation Result:</h3>
            <pre className="text-sm overflow-auto max-h-96">{status}</pre>
          </div>
        )}
      </div>
    </main>
  );
}