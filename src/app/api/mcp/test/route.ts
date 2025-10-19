import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MCPRegistry } from '@/lib/mcp/mcp-registry';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (false) { // Test mode - no auth required
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const registry = MCPRegistry.getInstance();
    
    // Test basic registry functionality
    const allServers = registry.getAllServers();
    const allFunctions = registry.getAllFunctions();
    const functionsForAI = registry.getFunctionsForAI();
    const summary = registry.getServicesSummary();

    return NextResponse.json({
      success: true,
      test: 'MCP Registry Test',
      servers: allServers.map(server => ({
        name: server.name,
        description: server.description,
        functionCount: server.functions.length,
        functions: server.functions.map(f => f.name)
      })),
      totalFunctions: allFunctions.reduce((total, service) => total + service.functions.length, 0),
      aiFunctionsCount: functionsForAI.length,
      summary,
      serverNames: allServers.map(s => s.name),
    });
  } catch (error) {
    console.error('MCP test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Test a specific function
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (false) { // Test mode - no auth required
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service, functionName, parameters } = body;

    if (!service || !functionName) {
      return NextResponse.json({ 
        error: 'Service and function name are required',
        example: {
          service: 'gmail',
          functionName: 'get_emails',
          parameters: { maxResults: '5' }
        }
      }, { status: 400 });
    }

    const registry = MCPRegistry.getInstance();
    const result = await registry.executeFunction(
      service,
      functionName,
      parameters || {},
      session?.user?.id || 'test-user-id'
    );

    return NextResponse.json({
      testExecution: true,
      service,
      functionName,
      parameters,
      result
    });
  } catch (error) {
    console.error('MCP function test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

