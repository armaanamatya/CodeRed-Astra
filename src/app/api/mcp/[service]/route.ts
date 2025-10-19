import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MCPRegistry } from '@/lib/mcp/mcp-registry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = await params;
    const registry = MCPRegistry.getInstance();
    const serverInfo = registry.getServer(service);

    if (!serverInfo) {
      return NextResponse.json({ error: `MCP server '${service}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      service: {
        name: serverInfo.name,
        description: serverInfo.description,
        functions: serverInfo.functions,
      },
    });
  } catch (error) {
    console.error('MCP service info error:', error);
    return NextResponse.json(
      { error: 'Failed to get service information' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = await params;
    const body = await request.json();
    const { functionName, parameters } = body;

    if (!functionName) {
      return NextResponse.json({ error: 'Function name is required' }, { status: 400 });
    }

    const registry = MCPRegistry.getInstance();
    const result = await registry.executeFunction(
      service,
      functionName,
      parameters || {},
      session.user.id
    );

    return NextResponse.json(result);
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