'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';

interface TestCase {
  name: string;
  function: string;
  parameters: Record<string, unknown>;
  description: string;
  destructive?: boolean;
}

interface TestResult {
  service: string;
  function: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  duration?: number;
}

interface ServiceFunction {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

interface Service {
  name: string;
  description: string;
  functions: ServiceFunction[];
  functionCount: number;
}

export default function MCPTestPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoTestRunning, setAutoTestRunning] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/mcp');
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const getTestCases = (): Record<string, TestCase[]> => {
    return {
      gmail: [
        {
          name: 'Get Recent Emails',
          function: 'get_emails',
          parameters: { maxResults: '5', includeBody: 'false' },
          description: 'Retrieve 5 most recent emails'
        },
        {
          name: 'Search Emails',
          function: 'search_emails',
          parameters: { searchTerm: 'test', isUnread: 'true' },
          description: 'Search for unread emails containing "test"'
        },
        {
          name: 'Create Draft Email',
          function: 'create_draft',
          parameters: { 
            to: 'test@example.com', 
            subject: 'MCP Test Draft', 
            body: 'This is a test draft created by MCP' 
          },
          description: 'Create a test draft email',
          destructive: false
        }
      ],
      calendar: [
        {
          name: 'Get Upcoming Events',
          function: 'get_upcoming_events',
          parameters: { limit: '5', timeframe: 'this week' },
          description: 'Get upcoming events for this week'
        },
        {
          name: 'Get Events This Month',
          function: 'get_events',
          parameters: { 
            startDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
            endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            maxResults: '10'
          },
          description: 'Get events for the next 30 days'
        },
        {
          name: 'Find Available Slots',
          function: 'find_available_slots',
          parameters: {
            duration: '60',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            workingHoursOnly: 'true'
          },
          description: 'Find 1-hour available slots in the next week'
        }
      ],
      outlook: [
        {
          name: 'Get Outlook Emails',
          function: 'get_outlook_emails',
          parameters: { folder: 'inbox', maxResults: '5' },
          description: 'Get recent emails from Outlook inbox'
        },
        {
          name: 'Get Outlook Events',
          function: 'get_outlook_events',
          parameters: { 
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            maxResults: '10'
          },
          description: 'Get Outlook events for the next week'
        }
      ],
      notion: [
        {
          name: 'Search Notion Content',
          function: 'search_notion',
          parameters: { query: 'test', filter: 'page' },
          description: 'Search for pages containing "test"'
        },
        {
          name: 'Get Notion Page',
          function: 'get_notion_page',
          parameters: { pageId: 'test-page-id' },
          description: 'Get a Notion page (placeholder test)'
        }
      ]
    };
  };

  const runSingleTest = async () => {
    if (!selectedService || !selectedFunction) {
      alert('Please select a service and function');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let parsedParameters;
      try {
        parsedParameters = JSON.parse(parameters);
      } catch (e) {
        throw new Error('Invalid JSON in parameters');
      }

      const response = await fetch(`/api/mcp/${selectedService}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: selectedFunction,
          parameters: parsedParameters
        })
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        service: selectedService,
        function: selectedFunction,
        success: result.success,
        data: result.data,
        error: result.error,
        duration
      };

      setTestResults(prev => [testResult, ...prev]);
    } catch (error) {
      const testResult: TestResult = {
        service: selectedService,
        function: selectedFunction,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };

      setTestResults(prev => [testResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setAutoTestRunning(true);
    setTestResults([]);
    const testCases = getTestCases();

    for (const [service, cases] of Object.entries(testCases)) {
      for (const testCase of cases) {
        const startTime = Date.now();
        
        try {
          const response = await fetch(`/api/mcp/${service}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: testCase.function,
              parameters: testCase.parameters
            })
          });

          const result = await response.json();
          const duration = Date.now() - startTime;

          const testResult: TestResult = {
            service,
            function: testCase.function,
            success: result.success,
            data: result.data,
            error: result.error,
            duration
          };

          setTestResults(prev => [testResult, ...prev]);
        } catch (error) {
          const testResult: TestResult = {
            service,
            function: testCase.function,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
          };

          setTestResults(prev => [testResult, ...prev]);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setAutoTestRunning(false);
  };

  const loadTestCase = (service: string, testCase: TestCase) => {
    setSelectedService(service);
    setSelectedFunction(testCase.function);
    setParameters(JSON.stringify(testCase.parameters, null, 2));
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runRealEmailTest = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/mcp/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'send_email',
          parameters: {
            to: userEmail,
            subject: 'MCP Test Email - Yeet!',
            body: `
              <h2>🎉 MCP Test Email</h2>
              <p><strong>Yeet!</strong></p>
              <p>This email was sent by the MCP Gmail server integration.</p>
              <p>If you received this, your Gmail MCP is working correctly!</p>
              <p><em>Sent at: ${new Date().toLocaleString()}</em></p>
            `
          }
        })
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        service: 'gmail',
        function: 'send_email (REAL)',
        success: result.success,
        data: result.data,
        error: result.error,
        duration
      };

      setTestResults(prev => [testResult, ...prev]);
      
      if (result.success) {
        alert(`Email sent successfully to ${userEmail}! Check your inbox.`);
      }
    } catch (error) {
      const testResult: TestResult = {
        service: 'gmail',
        function: 'send_email (REAL)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };

      setTestResults(prev => [testResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const runRealCalendarTest = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Create event for January 20th, 2025 at 8:00 AM
      const eventDate = new Date('2025-01-20T08:00:00.000Z');
      const endDate = new Date('2025-01-20T09:00:00.000Z');

      const response = await fetch('/api/mcp/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'create_event',
          parameters: {
            title: 'Yeet!',
            startDateTime: eventDate.toISOString(),
            endDateTime: endDate.toISOString(),
            description: `🎉 MCP Test Event - Yeet!\n\nThis event was created by the MCP Calendar server integration.\nIf you see this in your calendar, your Calendar MCP is working correctly!\n\nCreated at: ${new Date().toLocaleString()}`,
            location: 'MCP Test Location'
          }
        })
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        service: 'calendar',
        function: 'create_event (REAL)',
        success: result.success,
        data: result.data,
        error: result.error,
        duration
      };

      setTestResults(prev => [testResult, ...prev]);
      
      if (result.success) {
        alert('Calendar event created successfully! Check your Google Calendar for January 20th at 8:00 AM.');
      }
    } catch (error) {
      const testResult: TestResult = {
        service: 'calendar',
        function: 'create_event (REAL)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };

      setTestResults(prev => [testResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedServiceFunctions = services.find(s => s.name.toLowerCase().includes(selectedService))?.functions || [];

  const passedTests = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">MCP Test Suite</h1>
            <p className="text-gray-600">Test all Model Context Protocol server integrations</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Configuration */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Service</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select a service...</option>
                      <option value="gmail">Gmail</option>
                      <option value="calendar">Google Calendar</option>
                      <option value="outlook">Microsoft Outlook</option>
                      <option value="notion">Notion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Function</label>
                    <select
                      value={selectedFunction}
                      onChange={(e) => setSelectedFunction(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      disabled={!selectedService}
                    >
                      <option value="">Select a function...</option>
                      {selectedServiceFunctions.map((func) => (
                        <option key={func.name} value={func.name}>
                          {func.name} - {func.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Parameters (JSON)</label>
                    <textarea
                      value={parameters}
                      onChange={(e) => setParameters(e.target.value)}
                      className="w-full p-2 border rounded-lg h-32 font-mono text-sm"
                      placeholder='{"key": "value"}'
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={runSingleTest} 
                      disabled={isLoading || !selectedService || !selectedFunction}
                      className="flex-1"
                    >
                      {isLoading ? 'Testing...' : 'Run Test'}
                    </Button>
                    <Button 
                      onClick={runAllTests} 
                      disabled={autoTestRunning}
                      variant="outline"
                      className="flex-1"
                    >
                      {autoTestRunning ? 'Running All...' : 'Run All Tests'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Real Tests Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-yellow-800">🚨 Real Operations Test</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  These tests will perform REAL operations (send actual email and create actual calendar event).
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="your.email@gmail.com"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      onClick={runRealEmailTest}
                      disabled={isLoading || !userEmail}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      📧 Send Real Email &quot;Yeet&quot;
                    </Button>
                    <Button
                      onClick={runRealCalendarTest}
                      disabled={isLoading}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      📅 Create Real Calendar Event (Jan 20, 8am)
                    </Button>
                  </div>
                  
                  <p className="text-xs text-yellow-600">
                    Make sure you&apos;re signed in and Google services are connected!
                  </p>
                </div>
              </div>

              {/* Quick Test Cases */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Test Cases</h3>
                
                {Object.entries(getTestCases()).map(([service, cases]) => (
                  <div key={service} className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 uppercase mb-2">{service}</h4>
                    <div className="space-y-1">
                      {cases.map((testCase, index) => (
                        <button
                          key={index}
                          onClick={() => loadTestCase(service, testCase)}
                          className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                        >
                          <div className="font-medium">{testCase.name}</div>
                          <div className="text-gray-600 text-xs">{testCase.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Test Results</h2>
                  <div className="flex gap-2">
                    <div className="text-sm">
                      <span className="font-medium">{passedTests}/{totalTests}</span>
                      <span className="text-gray-500 ml-1">({successRate}% success)</span>
                    </div>
                    <Button onClick={clearResults} variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>

                {testResults.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No tests run yet. Select a test case or run all tests.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {result.service}.{result.function}
                            </div>
                            <div className="text-sm text-gray-600">
                              {result.duration}ms
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {result.success ? '✅ PASS' : '❌ FAIL'}
                          </div>
                        </div>
                        
                        {result.error && (
                          <div className="text-sm text-red-600 mt-2">
                            Error: {result.error}
                          </div>
                        )}
                        
                        {result.success && result.data && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer">
                              View result data
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Overview */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Available Services</h3>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">{service.description}</div>
                      </div>
                      <div className="text-sm font-medium">
                        {service.functionCount} functions
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}