import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MCPRegistry } from '@/lib/mcp/mcp-registry';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const registry = MCPRegistry.getInstance();
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');

    if (format === 'ai') {
      // Return functions formatted for AI consumption
      return NextResponse.json({
        success: true,
        functions: registry.getFunctionsForAI(),
        summary: registry.getServicesSummary(),
      });
    }

    // Return detailed service information
    const services = registry.getAllServers().map(server => ({
      name: server.name,
      description: server.description,
      functions: server.functions,
      functionCount: server.functions.length,
    }));

    return NextResponse.json({
      success: true,
      services,
      totalServices: services.length,
      totalFunctions: services.reduce((sum, service) => sum + service.functionCount, 0),
    });
  } catch (error) {
    console.error('MCP overview error:', error);
    return NextResponse.json(
      { error: 'Failed to get MCP services overview' },
      { status: 500 }
    );
  }
}

// Execute function by name across all services
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { functionName, parameters } = body;

    if (!functionName) {
      return NextResponse.json({ error: 'Function name is required' }, { status: 400 });
    }

    const registry = MCPRegistry.getInstance();
    
    // Find which service has this function
    const functionInfo = registry.findFunctionByName(functionName);
    if (!functionInfo) {
      return NextResponse.json({ error: `Function '${functionName}' not found` }, { status: 404 });
    }

    const result = await registry.executeFunction(
      functionInfo.service,
      functionName,
      parameters || {},
      session.user.id
    );

    return NextResponse.json({
      ...result,
      service: functionInfo.service,
      functionName,
    });
  } catch (error) {
    console.error('MCP function execution error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}