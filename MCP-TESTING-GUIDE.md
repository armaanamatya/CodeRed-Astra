# MCP Integration Testing Guide

## Overview
The MCP (Model Context Protocol) test suite includes both mock tests and real integration tests. The \	est:mcp:real\ command is an interactive test that sends actual emails and creates real calendar events.

## Prerequisites for Real MCP Testing

### 1. Development Server Must Be Running
\\\ash
npm run dev
\\\
Make sure the server is running on \http://localhost:3001\ and fully compiled.

### 2. Authentication Required
Before running the test:
1. Visit \http://localhost:3001\ in your browser
2. Sign in with your credentials
3. Ensure Google services are connected (check the account dropdown)
4. Verify that you have:
   - Google Calendar access
   - Gmail access
   - Valid access tokens stored in your session

### 3. Network Connectivity
- The dev server must be accessible at \http://localhost:3001\
- You need internet access for Google API calls
- Port 3001 must not be blocked

## Running the Real MCP Test

### Basic Usage
\\\ash
npm run test:mcp:real
\\\

### Step-by-Step Guide

1. **Start your dev server** (in another terminal):
   \\\ash
   npm run dev
   \\\

2. **Sign in to the web app**:
   - Visit http://localhost:3001
   - Sign in with your Google account
   - Verify Google services are connected

3. **Run the test** (in your main terminal):
   \\\ash
   npm run test:mcp:real
   \\\

4. **Follow the prompts**:
   - Press Enter when ready (after signing in)
   - Enter your email address for test email recipient
   - Wait for tests to complete

## Available MCP Test Commands

\\\ash
# Mock tests (no API calls)
npm run test:mcp              # Run all mock tests
npm run test:mcp:verbose      # Run with detailed output
npm run test:mcp:dry          # Dry-run mode

# Service-specific tests
npm run test:mcp:gmail        # Test Gmail service
npm run test:mcp:calendar     # Test Calendar service
npm run test:mcp:outlook      # Test Outlook service
npm run test:mcp:notion       # Test Notion service

# Real integration test
npm run test:mcp:real         # Send real emails and events
\\\

## Common Issues and Solutions

### 401 Unauthorized Error
**Issue**: \ Authentication required. Please sign in to the web app first.\

**Solutions**:
1. Make sure you're signed in at \http://localhost:3001\
2. Open the account dropdown in the dashboard to verify Google is connected
3. Clear browser cookies if needed and sign in again
4. Verify your session is still valid

### MCP Services Not Available
**Issue**: \ MCP Status check failed\

**Solutions**:
1. Check that the dev server fully compiled - look for \ Compiled /api/mcp\ in logs
2. Wait 10-15 seconds after starting npm run dev before running the test
3. Ensure port 3001 is not blocked
4. Check server logs for MCP initialization

### Email or Calendar Operations Fail
**Issue**: \ Email test error\ or \ Calendar test error\

**Solutions**:
1. Verify Google account has both Gmail and Calendar enabled
2. Check that Google services are connected in the dashboard
3. Ensure you have valid authentication tokens
4. Try signing out and back in to refresh tokens
5. Check browser console (F12) for more error details

## What the Test Does

The real MCP test performs these operations:

### 1. MCP Status Check
- Calls GET /api/mcp to verify services are available
- Checks for Gmail and Calendar services

### 2. Send Test Email (Gmail)
- Sends email to provided address
- Subject: "MCP Test Email - Yeet!"
- Contains timestamp and success message

### 3. Create Test Event (Calendar)
- Creates event for January 20, 2025
- Title: "Yeet!"
- Time: 8:00 AM - 9:00 AM
- Includes description and location

## Expected Results

### Success 
- Email arrives in your inbox within 1-2 minutes
- Event appears in your Google Calendar
- Test shows 100% success rate

### Partial Success 
- One service works, one doesn't
- Check specific error messages
- Verify permissions for failing service

### Complete Failure 
- No email received
- No calendar event created
- Check prerequisites section above

## Verifying Test Success

### Email
1. Check your email inbox (the address you provided)
2. Look for subject: "MCP Test Email - Yeet!"
3. Should show current timestamp

### Calendar Event
1. Open Google Calendar
2. Navigate to January 2025
3. Look for "Yeet!" event on 20th
4. Time should be 8:00 AM

## MCP Architecture

The MCP system consists of:

- **MCP Registry** (\/lib/mcp/mcp-registry.ts\): Central service coordinator
- **Base MCP Server** (\/lib/mcp/base-mcp-server.ts\): Abstract base class
- **Service Servers**:
  - Gmail MCP (\gmail-mcp-server.ts\)
  - Calendar MCP (\calendar-mcp-server.ts\)
  - Outlook MCP (\outlook-mcp-server.ts\)
  - Notion MCP (\
otion-mcp-server.ts\)
- **API Route** (\/api/mcp/route.ts\): HTTP interface

## Next Steps

Once testing passes successfully:
1.  MCP services are working
2.  Authentication is properly configured
3.  Ready to integrate with AI/LLM services
4.  Can enable smart email/calendar features

For support, check the server logs and error messages in the test output.
