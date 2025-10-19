import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Initialize ElevenLabs client
export const createElevenLabsClient = (apiKey: string) => {
  return new ElevenLabsClient({
    apiKey: apiKey,
  });
};

// Available voice models
export const ELEVENLABS_VOICES = {
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  DOMI: "AZnzlk1XvdvUeBnXmlld",
  BELLA: "EXAVITQu4vr4xnSDxMaL",
  ANTONI: "ErXwobaYiN019PkySvjV",
  ELLI: "MF3mGyEYCl7XYWbV9V6O",
  JOSH: "TxGEqnHWrfWFTfGW9XjX",
  ARNOLD: "VR6AewLTigWG4xSOukaG",
  ADAM: "pNInz6obpgDQGcFmaJgB",
  SAM: "yoZ06aMxZJJ28mfd3POQ",
};

// Voice settings interface
export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

// Default voice settings
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  useSpeakerBoost: true,
};

// Generate speech from text
export async function generateSpeech(
  apiKey: string,
  text: string,
  voiceId: string = ELEVENLABS_VOICES.RACHEL,
  settings: VoiceSettings = DEFAULT_VOICE_SETTINGS
) {
  const client = createElevenLabsClient(apiKey);
  
  try {
    const audio = await client.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: settings,
    });
    
    return audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
}

// Get available voices
export async function getVoices(apiKey: string) {
  const client = createElevenLabsClient(apiKey);
  
  try {
    const voices = await client.voices.getAll();
    return voices.voices;
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw error;
  }
}

// Get user subscription info
export async function getSubscriptionInfo(apiKey: string) {
  const client = createElevenLabsClient(apiKey);
  
  try {
    const user = await client.user.get();
    return user.subscription;
  } catch (error) {
    console.error("Error fetching subscription info:", error);
    throw error;
  }
}

// Text to speech with streaming
export async function streamSpeech(
  apiKey: string,
  text: string,
  voiceId: string = ELEVENLABS_VOICES.RACHEL,
  settings: VoiceSettings = DEFAULT_VOICE_SETTINGS
) {
  const client = createElevenLabsClient(apiKey);
  
  try {
    const audioStream = await client.generate({
      stream: true,
      voice: voiceId,
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: settings,
    });
    
    return audioStream;
  } catch (error) {
    console.error("Error streaming speech:", error);
    throw error;
  }
}

// Convert audio stream to blob for frontend playback
export async function streamToBlob(stream: ReadableStream): Promise<Blob> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return new Blob(chunks, { type: 'audio/mpeg' });
  } finally {
    reader.releaseLock();
  }
}