import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tool, parameters } = await request.json();
    
    // Determine which MCP server to use based on the tool
    let mcpServer = '';
    let mcpArgs: string[] = [];
    
    if (tool.startsWith('gmail_')) {
      mcpServer = 'gmail-mcp';
      mcpArgs = [];
    } else if (tool.startsWith('calendar_')) {
      mcpServer = 'google-calendar-mcp';
      mcpArgs = [];
    } else {
      return NextResponse.json({ error: 'Unknown tool type' }, { status: 400 });
    }

    // Create MCP client
    const client = new Client({
      name: 'codered-astra-client',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    // Check if MCP server is installed
    const mcpPath = path.join(process.cwd(), 'node_modules', '.bin', mcpServer);
    
    try {
      const transport = new StdioClientTransport({
        command: process.platform === 'win32' ? `${mcpServer}.cmd` : mcpServer,
        args: mcpArgs,
        cwd: process.cwd(),
      });

      await client.connect(transport);

      // List available tools to verify
      const tools = await client.listTools();
      console.log('Available tools:', tools);

      // Execute the requested tool
      const result = await client.callTool({
        name: tool,
        arguments: parameters,
      });

      await client.close();

      return NextResponse.json({ success: true, result });
    } catch (error) {
      console.error('MCP execution error:', error);
      
      // Fallback to direct API calls if MCP fails
      if (tool === 'gmail_send_email') {
        // Use existing Gmail API
        const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            to: parameters.to,
            subject: parameters.subject || 'No subject',
            body: parameters.body || '',
          }),
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send email');
        }

        return NextResponse.json({ success: true, result: await emailResponse.json() });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    return NextResponse.json(
      { error: 'Failed to execute tool', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}