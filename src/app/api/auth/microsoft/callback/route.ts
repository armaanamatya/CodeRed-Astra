import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('Microsoft callback received:', { code: !!code, state, error });

    if (error) {
      console.error('Microsoft OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=microsoft_auth_failed`);
    }

    if (!code || !state) {
      console.error('Missing code or state parameters');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=missing_parameters`);
    }

    // Exchange code for tokens first
    const tokenResponse = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
        scope: 'openid profile email offline_access Calendars.ReadWrite Mail.ReadWrite Mail.Send User.Read',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed&details=${encodeURIComponent(tokenData.error_description || 'Unknown error')}`);
    }

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error('Failed to fetch Microsoft user profile:', profileData);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=profile_fetch_failed`);
    }

    console.log('Microsoft user profile:', profileData);

    // Get the current Google user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('No Google session found');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_google_session`);
    }

    // Update the existing Google user with Microsoft credentials
    await connectDB();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        microsoftId: profileData.id,
        microsoftAccessToken: tokenData.access_token,
        microsoftRefreshToken: tokenData.refresh_token,
        microsoftTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error('Google user not found in database. Creating new user record...');
      
      // Create a new user record if it doesn't exist
      const newUser = new User({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        googleId: session.user.id,
        microsoftId: profileData.id,
        microsoftAccessToken: tokenData.access_token,
        microsoftRefreshToken: tokenData.refresh_token,
        microsoftTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        emailVerified: new Date(),
      });
      
      await newUser.save();
      console.log('Created new user record with Microsoft credentials');
    } else {
      console.log('Successfully connected Microsoft account to Google user:', updatedUser.email);
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?microsoft_connected=true`);

  } catch (error) {
    console.error('Microsoft callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=microsoft_callback_failed`);
  }
}
