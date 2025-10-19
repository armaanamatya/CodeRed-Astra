import { BaseMCPServer, MCPFunction } from './base-mcp-server';
import { GmailMCPServer } from './gmail-mcp-server';
import { CalendarMCPServer } from './calendar-mcp-server';
import { OutlookMCPServer } from './outlook-mcp-server';

export interface MCPServerInfo {
  name: string;
  description: string;
  server: BaseMCPServer;
  functions: MCPFunction[];
}

export class MCPRegistry {
  private static instance: MCPRegistry;
  private servers: Map<string, MCPServerInfo> = new Map();

  private constructor() {
    this.initializeServers();
  }

  public static getInstance(): MCPRegistry {
    if (!MCPRegistry.instance) {
      MCPRegistry.instance = new MCPRegistry();
    }
    return MCPRegistry.instance;
  }

  private initializeServers() {
    // Gmail MCP Server
    const gmailServer = new GmailMCPServer();
    this.servers.set('gmail', {
      name: 'Gmail',
      description: 'Gmail email management and operations',
      server: gmailServer,
      functions: gmailServer.getFunctions(),
    });

    // Calendar MCP Server
    const calendarServer = new CalendarMCPServer();
    this.servers.set('calendar', {
      name: 'Google Calendar',
      description: 'Google Calendar event management',
      server: calendarServer,
      functions: calendarServer.getFunctions(),
    });

    // Outlook MCP Server
    const outlookServer = new OutlookMCPServer();
    this.servers.set('outlook', {
      name: 'Microsoft Outlook',
      description: 'Outlook email and calendar management via Microsoft Graph',
      server: outlookServer,
      functions: outlookServer.getFunctions(),
    });

    console.log(`MCP Registry initialized with ${this.servers.size} servers`);
  }

  public getServer(serviceName: string): MCPServerInfo | undefined {
    return this.servers.get(serviceName);
  }

  public getAllServers(): MCPServerInfo[] {
    return Array.from(this.servers.values());
  }

  public getAllFunctions(): { service: string; functions: MCPFunction[] }[] {
    return Array.from(this.servers.entries()).map(([service, info]) => ({
      service,
      functions: info.functions,
    }));
  }

  public findFunctionByName(functionName: string): { service: string; function: MCPFunction } | null {
    for (const [serviceName, serverInfo] of this.servers.entries()) {
      const func = serverInfo.functions.find(f => f.name === functionName);
      if (func) {
        return { service: serviceName, function: func };
      }
    }
    return null;
  }

  public async executeFunction(
    serviceName: string, 
    functionName: string, 
    parameters: Record<string, unknown>, 
    userId: string
  ) {
    const serverInfo = this.getServer(serviceName);
    if (!serverInfo) {
      throw new Error(`MCP server '${serviceName}' not found`);
    }

    return await serverInfo.server.executeFunction(functionName, parameters, userId);
  }

  // Helper method to get all available functions formatted for AI models
  public getFunctionsForAI(): Record<string, unknown>[] {
    const allFunctions: Record<string, unknown>[] = [];
    
    for (const [serviceName, serverInfo] of this.servers.entries()) {
      for (const func of serverInfo.functions) {
        allFunctions.push({
          name: `${serviceName}_${func.name}`,
          description: `[${serverInfo.name}] ${func.description}`,
          parameters: func.parameters,
          service: serviceName,
          originalName: func.name,
        });
      }
    }
    
    return allFunctions;
  }

  // Get summary of available services
  public getServicesSummary(): string {
    const summaries = Array.from(this.servers.values()).map(server => {
      const functionNames = server.functions.map(f => f.name).join(', ');
      return `${server.name}: ${server.description}\nFunctions: ${functionNames}`;
    });
    
    return summaries.join('\n\n');
  }
}