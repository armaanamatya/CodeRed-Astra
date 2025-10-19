# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 3001 as configured in .env.local)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Project Architecture

**CodeRed Astra** is a Next.js 15 application with TypeScript, providing OAuth authentication and integration with Google, Microsoft, and ElevenLabs services. The app enables users to manage Gmail, Google Calendar, Outlook email, Microsoft Calendar, and AI-powered text-to-speech through a unified dashboard interface.

### Core Technology Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js v4 with database sessions
- **Database**: MongoDB (NAVI database) via Mongoose
- **Styling**: Tailwind CSS v4 with Shadcn UI components
- **APIs**: Google APIs (Gmail, Calendar), Microsoft Graph API, and ElevenLabs AI

### Database Architecture

The application uses dual database storage:
1. **NextAuth Collections**: Standard NextAuth.js collections (users, sessions, accounts) managed by MongoDB adapter
2. **Custom User Model**: Enhanced user model (`src/models/User.ts`) storing OAuth tokens for both Google and Microsoft services

The custom User model includes:
- Basic user info (email, name, image)
- Google OAuth tokens (accessToken, refreshToken, tokenExpiry, googleId)
- Microsoft OAuth tokens (microsoftAccessToken, microsoftRefreshToken, microsoftTokenExpiry, microsoftId)

**Current Session Strategy**: Uses database sessions for persistent authentication across devices.

### Authentication Flow

**Google OAuth**: Configured with extensive scopes including Gmail read/write/send and full Calendar access. Uses JWT tokens with automatic refresh handling.

**Microsoft OAuth**: Configured for Outlook email and Calendar access through Microsoft Graph API.

**Key Configuration**: 
- Database sessions with MongoDB adapter
- Custom callbacks in `src/lib/auth.ts` handle token storage and refresh
- Protected routes use `ProtectedRoute` component wrapper

### API Architecture

**Google Integration APIs** (`/api/gmail/`, `/api/calendar/`):
- Session-based authentication with fallback to database tokens
- Automatic token refresh with error handling
- Direct Google APIs integration using googleapis library

**Microsoft Integration APIs** (`/api/outlook/`, `/api/microsoft/`):
- Microsoft Graph SDK integration
- Separate token management for Microsoft services

**ElevenLabs Integration APIs** (`/api/elevenlabs/`):
- AI-powered text-to-speech functionality
- Voice selection and audio generation
- Subscription management and usage tracking
- Audio streaming and file download capabilities

**Database Connection**:
- Mongoose connection with SSL/TLS configuration optimized for MongoDB Atlas
- Connection caching for serverless environments
- Robust error handling and fallback mechanisms

### Component Structure

- **Auth Components**: `AuthButton`, `ProtectedRoute` in `/components/auth/`
- **Service Views**: Dedicated components for Gmail, Calendar, Outlook in respective folders
- **UI Components**: Shadcn UI components in `/components/ui/`
- **Modals**: Service-specific modals for creating events and sending emails
- **ElevenLabs Components**: AI voice synthesis components with subscription management in `/components/elevenlabs/`

### Environment Configuration

Required environment variables in `.env.local`:
- `MONGODB_URI` and `MONGODB_DB=NAVI`
- `PORT=3001` for consistent development port
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Microsoft OAuth: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`
- ElevenLabs: `ELEVENLABS_API_KEY`

### Key Implementation Details

**OAuth Scopes**: 
- Google: Full Gmail access (`gmail.modify`, `gmail.send`) and Calendar management
- Microsoft: Mail read/write and Calendar access

**Token Management**: Custom refresh logic in auth callbacks with database persistence and error recovery

**SSL Configuration**: MongoDB connections include specific SSL/TLS settings for Atlas compatibility

**Session Strategy**: Database sessions for persistent authentication across devices

**Authentication Redirects**: After successful sign-in, users are automatically redirected to `/dashboard`

### File Organization

- **`/src/app/`**: Next.js App Router pages and API routes
- **`/src/lib/`**: Database connections, authentication configuration, utility functions
- **`/src/models/`**: Mongoose data models
- **`/src/components/`**: React components organized by feature
- **`/src/hooks/`**: Custom React hooks for authentication
- **`/src/types/`**: TypeScript type definitions

### Development Notes

- Always run linting before committing changes
- MongoDB connection uses connection pooling and caching for optimal performance
- API routes include comprehensive error handling and logging
- Authentication tokens are automatically refreshed when expired
- The app is configured to handle both development (localhost:3001) and production environments