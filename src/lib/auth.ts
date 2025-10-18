import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './db/mongodb-adapter';
import connectDB from './db/mongodb';
import User from '@/models/User';
import NotionProvider from './notion-oauth';

export const authOptions: NextAuthOptions = {
  // Temporarily disable MongoDB adapter due to SSL issues and account linking conflicts
  // adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
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
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    NotionProvider({
      clientId: process.env.NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If redirecting after sign in and no specific URL, go to dashboard
      if (url === baseUrl || url === `${baseUrl}/` || url === `${baseUrl}/auth/signin`) {
        return `${baseUrl}/dashboard`;
      }
      // If the URL is within our domain, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to dashboard for external URLs
      return `${baseUrl}/dashboard`;
    },
    async signIn({ user, account, profile }) {
<<<<<<< HEAD
      // Always allow sign in - we handle user creation/updates in the JWT callback
      return true;
=======
      if (account?.provider === 'google') {
        try {
          await connectDB();
          
          // Save or update user in database
          const updateData: any = {
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
          };

          // Handle Google OAuth
          if (account.provider === 'google') {
            updateData.googleId = account.providerAccountId;
            updateData.accessToken = account.access_token;
            updateData.refreshToken = account.refresh_token;
            updateData.tokenExpiry = account.expires_at ? new Date(account.expires_at * 1000) : undefined;
          }

          // Handle Notion OAuth
          if (account.provider === 'notion') {
            updateData.notionToken = account.access_token;
            updateData.notionWorkspaceId = account.workspace_id;
          }

          const updatedUser = await User.findOneAndUpdate(
            { email: user.email },
            updateData,
            { upsert: true, new: true }
          );

          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            id: updatedUser._id.toString(),
          };
        } catch (error) {
          console.error('Database save error during sign in:', error);
          // Continue with sign in even if database save fails
        }
      }
      return true; // Always allow sign in
>>>>>>> bb97474 (Notion Cal tab)
    },
    async session({ session, user }) {
      // Add guard to check if user exists
      if (!user) {
        return session;
      }
      
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
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        try {
          await connectDB();
          
          // Create or update user in database
          const updatedUser = await User.findOneAndUpdate(
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

          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            id: (updatedUser as any)._id.toString(),
          };
        } catch (error) {
          console.error('Database save error:', error);
          // Continue with JWT-only auth if database fails
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            id: user.id,
          };
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
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