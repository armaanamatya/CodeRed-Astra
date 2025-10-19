// Notion MCP Client with OAuth integration
interface NotionDatabase {
  id: string;
  title?: Array<{text?: {content?: string}}>;
  url?: string;
  [key: string]: unknown;
}

interface NotionPage {
  id: string;
  properties?: Record<string, unknown>;
  url?: string;
  [key: string]: unknown;
}

export class NotionMCPClient {
  private notionApiKey: string = '';
  private baseUrl: string = 'https://api.notion.com/v1';
  private mcpServerUrl: string = 'https://mcp.notion.com/mcp';

  async connect(): Promise<void> {
    try {
      // Check if we have a stored token first
      if (this.notionApiKey) {
        await this.validateToken();
        return;
      }

      // If no token, initiate OAuth flow
      await this.initiateOAuthFlow();
    } catch (error) {
      console.error('❌ Failed to connect to Notion MCP:', error);
      throw error;
    }
  }

  private async validateToken(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Invalid or expired Notion token');
    }

    console.log('✅ Notion token validated successfully');
  }

  private async initiateOAuthFlow(): Promise<void> {
    // Redirect to Notion OAuth
    const oauthUrl = `${this.mcpServerUrl}/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/api/notion-mcp/callback')}&response_type=code&scope=read+write`;
    
    // In a real implementation, this would redirect the user
    // For now, we'll throw an error asking for manual setup
    throw new Error('OAuth flow not yet implemented. Please use manual API key setup for now.');
  }

  async connectWithApiKey(notionApiKey: string): Promise<void> {
    try {
      this.notionApiKey = notionApiKey;
      await this.validateToken();
      console.log('✅ Notion API key validated successfully');
    } catch (error) {
      console.error('❌ Failed to validate Notion API key:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.notionApiKey = '';
    console.log('✅ Notion API client disconnected');
  }

  async listDatabases(): Promise<NotionDatabase[]> {
    if (!this.notionApiKey) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'database'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error listing databases:', error);
      throw error;
    }
  }

  async queryDatabase(databaseId: string, filter?: Record<string, unknown>): Promise<NotionPage[]> {
    if (!this.notionApiKey) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: filter || {},
          sorts: [
            {
              property: 'Date',
              direction: 'ascending'
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error querying database:', error);
      throw error;
    }
  }

  async createPage(databaseId: string, properties: Record<string, unknown>): Promise<NotionPage> {
    if (!this.notionApiKey) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: {
            database_id: databaseId
          },
          properties: properties
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  async updatePage(pageId: string, properties: Record<string, unknown>): Promise<NotionPage> {
    if (!this.notionApiKey) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: properties
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  }

  async getPage(pageId: string): Promise<NotionPage> {
    if (!this.notionApiKey) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting page:', error);
      throw error;
    }
  }

  async searchPages(query: string): Promise<NotionPage[]> {
    if (!this.notionApiKey) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          filter: {
            property: 'object',
            value: 'page'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching pages:', error);
      throw error;
    }
  }
}

// Singleton instance
let notionMCPClient: NotionMCPClient | null = null;

export const getNotionMCPClient = (): NotionMCPClient => {
  if (!notionMCPClient) {
    notionMCPClient = new NotionMCPClient();
  }
  return notionMCPClient;
};
