# Notion OAuth Setup Guide

## ✅ **You're Right! MCP Should Handle Everything Automatically**

The Model Context Protocol (MCP) is designed to provide seamless OAuth integration without manual API keys. Here's how to set it up properly:

## **Step 1: Configure Notion OAuth**

### **1.1 Create Notion OAuth App**
1. Go to: https://www.notion.so/my-integrations
2. Click **"New integration"**
3. Choose **"OAuth integration"** (not Internal integration)
4. Fill in the details:
   - **Name**: "CodeRed Astra"
   - **Logo**: Upload a logo (optional)
   - **Redirect URI**: `http://localhost:3000/api/notion-mcp/callback` (for development)
   - **Redirect URI**: `https://yourdomain.com/api/notion-mcp/callback` (for production)
5. Click **"Submit"**

### **1.2 Get OAuth Credentials**
After creating the OAuth integration, you'll get:
- **Client ID**: `abc123def456...`
- **Client Secret**: `secret_xyz789...`

## **Step 2: Add Environment Variables**

Add these to your `.env.local` file:

```bash
# Notion OAuth Configuration
NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_client_secret_here

# Your app URL
NEXTAUTH_URL=http://localhost:3000
```

## **Step 3: Test the OAuth Flow**

### **3.1 Start Your App**
```bash
npm run dev
```

### **3.2 Test OAuth Connection**
1. Go to: `http://localhost:3000/notion-test`
2. Click **"Test OAuth Flow"**
3. You should be redirected to Notion for authorization
4. After authorization, you'll be redirected back with a success message

### **3.3 Use in Dashboard**
1. Go to your dashboard
2. Click the **Notion** tab
3. Click **"Connect with OAuth (Recommended)"**
4. You'll be redirected to Notion for authorization
5. After authorization, you'll be redirected back to your dashboard

## **How It Works Now:**

### **✅ OAuth Flow (Automatic)**
1. **User clicks "Connect with OAuth"**
2. **App redirects to Notion OAuth page**
3. **User authorizes the app in Notion**
4. **Notion redirects back with authorization code**
5. **App exchanges code for access token**
6. **Token is stored securely in database**
7. **User can now use Notion features**

### **✅ Manual Flow (Fallback)**
1. **User clicks "Connect with API Key"**
2. **User enters integration token manually**
3. **App validates token and stores it**
4. **User can now use Notion features**

## **Benefits of OAuth:**

- **🔐 Secure**: No manual token handling
- **🔄 Automatic**: Token refresh handled automatically
- **👤 User-friendly**: One-click connection
- **🛡️ Safe**: Tokens are managed by Notion
- **🚀 Future-proof**: Works with MCP standards

## **Troubleshooting:**

### **❌ "OAuth not configured"**
- Make sure you've set `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` in `.env.local`
- Restart your dev server after adding environment variables

### **❌ "Invalid redirect URI"**
- Make sure your redirect URI in Notion matches exactly: `http://localhost:3000/api/notion-mcp/callback`
- Check that there are no trailing slashes or extra characters

### **❌ "OAuth flow not yet implemented"**
- This means the OAuth endpoints aren't working
- Check that all the API routes are created correctly
- Make sure your environment variables are set

## **Production Setup:**

For production, update your Notion OAuth app:
1. Go to your integration settings
2. Add production redirect URI: `https://yourdomain.com/api/notion-mcp/callback`
3. Update `NEXTAUTH_URL` in your production environment

## **What's Different Now:**

### **Before (Manual API Keys):**
- ❌ Users had to create integrations manually
- ❌ Users had to copy/paste tokens
- ❌ No automatic token refresh
- ❌ Security concerns with token storage

### **After (OAuth + MCP):**
- ✅ One-click connection
- ✅ Automatic token management
- ✅ Secure OAuth flow
- ✅ MCP-compliant integration
- ✅ Better user experience

The MCP approach is much better! Users just click "Connect with OAuth" and everything happens automatically. 🎉
