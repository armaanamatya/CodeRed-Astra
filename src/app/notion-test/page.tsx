'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NotionTestPage() {
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const testApiKey = async () => {
    if (!apiKey) {
      setResult({ error: 'Please enter an API key' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/notion-mcp/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notionApiKey: apiKey }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test API key', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!apiKey) {
      setResult({ error: 'Please enter an API key' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/notion-mcp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notionApiKey: apiKey }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to connect', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testOAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/notion-mcp/oauth');
      const data = await response.json();
      
      if (response.ok && data.oauthUrl) {
        setResult({
          success: true,
          message: 'OAuth URL generated successfully',
          oauthUrl: data.oauthUrl,
          instructions: 'Click the OAuth URL to test the flow'
        });
      } else {
        setResult({ error: data.error || 'Failed to get OAuth URL' });
      }
    } catch (error) {
      setResult({ error: 'Failed to test OAuth', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Notion API Key Test</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notion Integration Token:
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_abc123..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Get your token from: <a href="https://www.notion.so/my-integrations" target="_blank" className="text-blue-600 hover:underline">https://www.notion.so/my-integrations</a>
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testApiKey} 
                disabled={loading || !apiKey}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Testing...' : 'Test API Key'}
              </Button>
              
              <Button 
                onClick={testConnection} 
                disabled={loading || !apiKey}
                variant="outline"
              >
                {loading ? 'Connecting...' : 'Test Full Connection'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">OAuth Test (Recommended)</h3>
              <Button 
                onClick={testOAuth} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Testing OAuth...' : 'Test OAuth Flow'}
              </Button>
            </div>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">How to get your Notion API key:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Go to <a href="https://www.notion.so/my-integrations" target="_blank" className="text-blue-600 hover:underline">https://www.notion.so/my-integrations</a></li>
              <li>2. Click &quot;New integration&quot;</li>
              <li>3. Give it a name (e.g., &quot;CodeRed Astra&quot;)</li>
              <li>4. Select your workspace</li>
              <li>5. Copy the &quot;Internal Integration Token&quot;</li>
              <li>6. Make sure it starts with &quot;secret_&quot;</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
