import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './db/mongodb-adapter';
import connectDB from './db/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.modify', // Read and write emails
            'https://www.googleapis.com/auth/gmail.send', // Send emails
            'https://www.googleapis.com/auth/calendar', // Full calendar access
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          
          // Save or update user with OAuth tokens in our custom User model
          await User.findOneAndUpdate(
            { email: user.email },
            {
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              emailVerified: new Date(),
            },
            { upsert: true, new: true }
          );
          
          console.log(`✅ User ${user.email} saved to NAVI database`);
          return true;
        } catch (error) {
          console.error('Database save error during sign in:', error);
          return true; // Still allow sign in even if database save fails
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Add user ID to session
      session.user.id = user.id;
      
      // Get fresh access token from our custom User model
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser?.accessToken) {
          session.accessToken = dbUser.accessToken;
        }
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    // Update tokens in database
    try {
      await connectDB();
      await User.findOneAndUpdate(
        { email: token.email },
        {
          accessToken: refreshedTokens.access_token,
          tokenExpiry: new Date(Date.now() + refreshedTokens.expires_in * 1000),
        }
      );
    } catch (dbError) {
      console.error('Database update error during token refresh:', dbError);
      // Continue with token refresh even if database update fails
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}