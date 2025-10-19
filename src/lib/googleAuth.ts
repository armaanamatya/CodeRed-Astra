import { google } from 'googleapis';
import connectDB from './db/mongodb';
import User from '@/models/User';

export async function getFreshGoogleToken(email: string): Promise<string | null> {
  try {
    await connectDB();
    
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found in database:', email);
      return null;
    }

    // Check if token is expired
    const isTokenExpired = user.tokenExpiry && new Date() > new Date(user.tokenExpiry);
    
    if (isTokenExpired && user.refreshToken) {
      console.log('Google token expired, refreshing...');
      
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      // Refresh the token
      oauth2Client.setCredentials({
        refresh_token: user.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update user with new tokens
      await User.findOneAndUpdate(
        { email },
        {
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        }
      );

      console.log('✅ Google token refreshed successfully');
      return credentials.access_token || null;
    }

    return user.accessToken;
  } catch (error) {
    console.error('Error getting fresh Google token:', error);
    return null;
  }
}
