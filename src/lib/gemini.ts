import { GoogleGenerativeAI } from '@google/generative-ai';

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
    type: 'gmail' | 'calendar' | 'elevenlabs' | 'general';
    command: string;
    parameters?: Record<string, unknown>;
  };
}

const systemPrompt = `You are Navi, a friendly and helpful AI voice assistant. You have access to:
- Gmail: Send and read emails
- Google Calendar: Create and view events
- Voice: Speak responses naturally

IMPORTANT RULES:
1. Always respond in a natural, conversational, and friendly tone
2. Keep responses concise (2-3 sentences max) since they will be spoken aloud
3. When you need more information, ask for it clearly
4. For email actions, you MUST have a valid email address (not just a name), subject, and body
5. If information is missing, tell the user what you need in your response, but DON'T create an action

Response Format:
- First provide your natural language response
- Then if you can execute an action (with ALL required info), provide it in a JSON code block

Examples:

User: "Send an email to john@example.com saying hello"
Response: "Sure! I'll send an email to john@example.com with your message."
\`\`\`json
{"type": "gmail", "command": "send", "parameters": {"to": "john@example.com", "subject": "Hello", "body": "Hello!"}}
\`\`\`

User: "Send an email to John"
Response: "I'd be happy to send an email to John! However, I need John's email address. Could you provide that along with what you'd like to say?"

User: "Create a meeting tomorrow at 2 PM about project review"
Response: "I'll create a meeting for tomorrow at 2 PM about the project review!"
\`\`\`json
{"type": "calendar", "command": "create", "parameters": {"title": "Project Review", "start": "tomorrow 2pm", "end": "tomorrow 3pm"}}
\`\`\`

Always be helpful, conversational, and make sure you have complete information before creating actions.`;

export async function processUserCommand(transcript: string): Promise<GeminiResponse> {
  try {
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
        action = JSON.parse(jsonStr);
        console.log('Extracted action:', action);
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
