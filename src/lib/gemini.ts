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
    parameters?: any;
  };
}

const systemPrompt = `You are an AI assistant integrated. You can execute actions for:
- Gmail: send emails, read emails
- Google Calendar: create events, view events
- ElevenLabs: text-to-speech synthesis

When the user asks you to perform an action, respond with:
1. A natural language response
2. If applicable, an action object specifying what to do

Examples:
- "Send an email to john@example.com" -> action: {type: 'gmail', command: 'send', parameters: {to: 'john@example.com'}}
- "What's on my calendar today?" -> action: {type: 'calendar', command: 'list', parameters: {timeMin: today, timeMax: today}}
- "Read this text aloud" -> action: {type: 'elevenlabs', command: 'speak', parameters: {text: '...'}}

Always be helpful and conversational while providing structured actions when needed.`;

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
        action = JSON.parse(actionMatch[1]);
      } catch (e) {
        console.error('Failed to parse action JSON:', e);
      }
    }
    
    // Clean the text response by removing JSON blocks
    const cleanText = text.replace(/```json[\s\S]*?```/g, '').trim();
    
    return {
      text: cleanText || text,
      action
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
