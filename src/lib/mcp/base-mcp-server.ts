import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export interface MCPFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export abstract class BaseMCPServer {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Abstract methods that each MCP server must implement
  abstract getFunctions(): MCPFunction[];
  abstract executeFunction(functionName: string, parameters: any, userId: string): Promise<MCPResponse>;

  // Common authentication helper
  protected async getAuthenticatedUser() {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error('User not authenticated');
      }

      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error(`Authentication error in ${this.serviceName}:`, error);
      throw error;
    }
  }

  // Common error handling
  protected createErrorResponse(error: string): MCPResponse {
    return {
      success: false,
      error,
    };
  }

  // Common success response
  protected createSuccessResponse(data?: any, message?: string): MCPResponse {
    return {
      success: true,
      data,
      message,
    };
  }

  // Validate required parameters
  protected validateParameters(parameters: any, required: string[]): string | null {
    for (const param of required) {
      if (!parameters[param]) {
        return `Missing required parameter: ${param}`;
      }
    }
    return null;
  }

  // Get service-specific tokens
  protected async getServiceTokens(user: any): Promise<{ accessToken: string; refreshToken?: string } | null> {
    try {
      switch (this.serviceName) {
        case 'gmail':
        case 'calendar':
          if (!user.accessToken) {
            throw new Error('Google access token not found');
          }
          return {
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
          };
        
        case 'outlook':
          if (!user.microsoftAccessToken) {
            throw new Error('Microsoft access token not found');
          }
          return {
            accessToken: user.microsoftAccessToken,
            refreshToken: user.microsoftRefreshToken,
          };
        
        default:
          throw new Error(`Unknown service: ${this.serviceName}`);
      }
    } catch (error) {
      console.error(`Token retrieval error for ${this.serviceName}:`, error);
      return null;
    }
  }

  // Token refresh logic (to be implemented per service)
  protected abstract refreshTokenIfNeeded(user: any): Promise<string>;
}