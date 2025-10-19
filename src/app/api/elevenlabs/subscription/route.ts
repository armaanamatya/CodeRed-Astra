import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubscriptionInfo } from '@/lib/elevenlabs';

export async function GET(request: NextRequest) {
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

    // Get subscription info
    const subscription = await getSubscriptionInfo(apiKey);

    return NextResponse.json({
      success: true,
      subscription: subscription,
    });

  } catch (error) {
    console.error('ElevenLabs subscription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}