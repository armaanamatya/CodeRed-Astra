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

// Generate speech from text using REST API directly
export async function generateSpeech(
  apiKey: string,
  text: string,
  voiceId: string = ELEVENLABS_VOICES.RACHEL,
  settings: VoiceSettings = DEFAULT_VOICE_SETTINGS
): Promise<ReadableStream<Uint8Array>> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
            style: settings.style || 0,
            use_speaker_boost: settings.useSpeakerBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${JSON.stringify(error)}`);
    }

    if (!response.body) {
      throw new Error('No response body from ElevenLabs API');
    }

    return response.body;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

// Get available voices
export async function getVoices(apiKey: string) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
}

// Get user subscription info
export async function getSubscriptionInfo(apiKey: string) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    throw error;
  }
}

// Text to speech with streaming (same as generateSpeech)
export async function streamSpeech(
  apiKey: string,
  text: string,
  voiceId: string = ELEVENLABS_VOICES.RACHEL,
  settings: VoiceSettings = DEFAULT_VOICE_SETTINGS
): Promise<ReadableStream<Uint8Array>> {
  return generateSpeech(apiKey, text, voiceId, settings);
}

// Convert audio stream to blob for frontend playback
export async function streamToBlob(stream: ReadableStream<Uint8Array>): Promise<Blob> {
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

// Speech-to-Text interfaces
export interface SpeechToTextOptions {
  language?: string;
  model?: string;
}

export interface SpeechToTextResult {
  transcription: string;
  language: string;
  duration?: number;
  wordCount?: number;
}

// Speech-to-Text using ElevenLabs API
export async function transcribeAudio(
  apiKey: string,
  audioFile: File,
  options: SpeechToTextOptions = {}
): Promise<SpeechToTextResult> {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('language', options.language || 'en');
    
    if (options.model) {
      formData.append('model', options.model);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs Speech-to-Text API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return {
      transcription: result.transcription || result.text || '',
      language: result.language || options.language || 'en',
      duration: result.duration || null,
      wordCount: result.wordCount || null,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Get supported languages for speech-to-text
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'pl': 'Polish',
  'tr': 'Turkish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'uk': 'Ukrainian',
  'el': 'Greek',
  'he': 'Hebrew',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'sw': 'Swahili',
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'az': 'Azerbaijani',
  'be': 'Belarusian',
  'bn': 'Bengali',
  'bs': 'Bosnian',
  'ca': 'Catalan',
  'cy': 'Welsh',
  'eu': 'Basque',
  'fa': 'Persian',
  'ga': 'Irish',
  'gl': 'Galician',
  'gu': 'Gujarati',
  'is': 'Icelandic',
  'ka': 'Georgian',
  'kk': 'Kazakh',
  'ky': 'Kyrgyz',
  'lo': 'Lao',
  'mk': 'Macedonian',
  'ml': 'Malayalam',
  'mn': 'Mongolian',
  'mr': 'Marathi',
  'my': 'Burmese',
  'ne': 'Nepali',
  'pa': 'Punjabi',
  'si': 'Sinhala',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ur': 'Urdu',
  'uz': 'Uzbek',
  'zu': 'Zulu',
};