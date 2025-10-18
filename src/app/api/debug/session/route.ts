import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        hasAccessToken: !!session.accessToken,
        accessTokenLength: session.accessToken?.length || 0,
        hasError: !!session.error,
        error: session.error,
      } : null,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
