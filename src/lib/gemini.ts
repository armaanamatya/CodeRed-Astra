import { GoogleGenerativeAI } from '@google/generative-ai';
import { MCPRegistry } from './mcp/mcp-registry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
});

export interface GeminiResponse {
  text: string;
  action?: {
    functionName: string;
    parameters?: Record<string, unknown>;
  };
}

// Get available MCP functions for AI context
function getMCPFunctionsContext(): string {
  const registry = MCPRegistry.getInstance();
  const allServers = registry.getAllServers();
  
  let context = '\n\nAVAILABLE TOOLS:\n';
  
  for (const server of allServers) {
    context += `\n${server.name} (${server.description}):\n`;
    for (const func of server.functions) {
      context += `- ${func.name}: ${func.description}\n`;
      if (func.parameters?.properties) {
        const props = Object.entries(func.parameters.properties);
        const required = func.parameters.required || [];
        context += `  Parameters: ${props.map(([key, val]) => 
          `${key}${required.includes(key) ? '*' : ''} (${val.type}): ${val.description}`
        ).join(', ')}\n`;
      }
    }
  }
  
  return context;
}

function buildSystemPrompt(): string {
  const mcpContext = getMCPFunctionsContext();
  
  return `You are Navi, a friendly and helpful AI voice assistant with access to powerful tools.

${mcpContext}

IMPORTANT RULES:
1. Always respond in a natural, conversational, and friendly tone
2. Keep responses concise (2-3 sentences max) since they will be spoken aloud
3. When you need more information, ask for it clearly
4. Only create actions when you have ALL required parameters (marked with *)
5. If information is missing, tell the user what you need in your response, but DON'T create an action

Response Format:
- First provide your natural language response
- Then if you can execute an action (with ALL required info), provide it in a JSON code block
- Use the exact function names from the AVAILABLE TOOLS list above

Examples:

User: "Send an email to john@example.com saying hello"
Response: "Sure! I'll send an email to john@example.com with your message."
\`\`\`json
{"functionName": "send_email", "parameters": {"to": "john@example.com", "subject": "Hello", "body": "Hello!"}}
\`\`\`

User: "Send an email to John"
Response: "I'd be happy to send an email to John! However, I need John's email address. Could you provide that along with what you'd like to say?"

User: "What emails do I have?"
Response: "Let me check your recent emails for you!"
\`\`\`json
{"functionName": "get_emails", "parameters": {"maxResults": "10"}}
\`\`\`

User: "Create a meeting tomorrow at 2 PM about project review"
Response: "I'll create a meeting for tomorrow at 2 PM about the project review!"
\`\`\`json
{"functionName": "create_event", "parameters": {"summary": "Project Review", "start": "tomorrow 2pm", "end": "tomorrow 3pm"}}
\`\`\`

User: "What's on my calendar this week?"
Response: "Let me check your calendar for this week!"
\`\`\`json
{"functionName": "get_upcoming_events", "parameters": {"timeframe": "this week", "limit": "10"}}
\`\`\`

Always be helpful, conversational, and make sure you have complete information before creating actions.`;
}

export async function processUserCommand(transcript: string): Promise<GeminiResponse> {
  try {
    const systemPrompt = buildSystemPrompt();
    const prompt = `${systemPrompt}\n\nUser command: "${transcript}"\n\nProvide a response and if applicable, an action in JSON format.`;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract action from response
    let action;
    const actionMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try {
        const jsonStr = actionMatch[1].trim();
        const parsedAction = JSON.parse(jsonStr);
        
        // Validate that we have a functionName
        if (parsedAction.functionName) {
          action = {
            functionName: parsedAction.functionName,
            parameters: parsedAction.parameters || {}
          };
          console.log('Extracted MCP action:', action);
        }
      } catch (e) {
        console.error('Failed to parse action JSON:', e, '\nJSON string:', actionMatch[1]);
      }
    }
    
    // Clean the text response by removing JSON blocks
    let cleanText = text.replace(/```json[\s\S]*?```/g, '').trim();
    
    // Remove any remaining markdown code blocks
    cleanText = cleanText.replace(/```[\s\S]*?```/g, '').trim();
    
    // If the response is empty after cleaning, use original text
    if (!cleanText) {
      cleanText = text;
    }
    
    console.log('Gemini Response:', { text: cleanText, hasAction: !!action });
    
    return {
      text: cleanText,
      action
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to process your command. Please try again.');
  }
}
