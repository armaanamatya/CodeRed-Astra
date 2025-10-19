import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 3GB)
    if (audioFile.size > 3 * 1024 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 3GB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use MP3, WAV, FLAC, M4A, or OGG.' },
        { status: 400 }
      );
    }

    // Prepare form data for ElevenLabs API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('file', audioFile);
    elevenLabsFormData.append('language', language);

    // Call ElevenLabs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { 
          error: 'ElevenLabs API error',
          details: errorData.error || errorData.message || 'Failed to transcribe audio'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      transcription: result.transcription || result.text || '',
      language: result.language || language,
      duration: result.duration || null,
      wordCount: result.wordCount || null,
    });

  } catch (error) {
    console.error('ElevenLabs Speech-to-Text error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
