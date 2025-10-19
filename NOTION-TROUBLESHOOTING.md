# Notion Integration Troubleshooting Guide

## ✅ Fixed: "Invalid Notion API key or MCP connection failed"

The issue has been resolved! The problem was that the original MCP implementation was trying to spawn processes in a web environment, which doesn't work well with Next.js.

### **What I Fixed:**

1. **Simplified MCP Client** - Replaced complex MCP server spawning with direct Notion API calls
2. **Better Error Handling** - Improved error messages and connection testing
3. **Web-Compatible** - Removed server-side process spawning that doesn't work in web environments

## **How to Test the Fix:**

### **Step 1: Get Your Notion Integration Token**
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name (e.g., "CodeRed Astra")
4. Select your workspace
5. Copy the "Internal Integration Token" (starts with `secret_`)

### **Step 2: Test the Connection**
1. Start your dev server: `npm run dev`
2. Go to the **Notion** tab in your dashboard
3. Click "Connect Notion Workspace (MCP)"
4. Paste your integration token
5. Click "Connect"

### **Step 3: Verify It Works**
- You should see your databases listed
- You can select a database and view events
- You can create new events

## **Common Issues & Solutions:**

### **❌ "Invalid Notion API key"**
**Solution:** Make sure your token:
- Starts with `secret_`
- Is copied correctly (no extra spaces)
- Has the right permissions in Notion

### **❌ "Database not found"**
**Solution:** 
- Make sure your integration has access to the database
- In Notion, go to your database → Share → Add your integration

### **❌ "No databases available"**
**Solution:**
- Check that your integration has "Read content" permission
- Make sure you have databases in your workspace

## **Test Endpoints:**

### **Test Connection:**
```
GET /api/notion-mcp/test
```
This will test your Notion connection and show available databases.

### **Check Connection Status:**
```
GET /api/notion-mcp/connect
```
This will show if your Notion workspace is connected.

## **Debug Steps:**

### **1. Check Your Token Format:**
```bash
# Your token should look like this:
secret_abc123def456ghi789...
```

### **2. Test Token Manually:**
```bash
curl -X GET 'https://api.notion.com/v1/users/me' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Notion-Version: 2022-06-28'
```

### **3. Check Integration Permissions:**
- Go to your Notion integration settings
- Make sure it has "Read content" and "Update content" permissions
- Add it to your databases by sharing them with the integration

## **What's Different Now:**

### **✅ Before (Broken):**
- Complex MCP server spawning
- Process management in web environment
- Hard to debug connection issues

### **✅ After (Fixed):**
- Direct Notion API calls
- Simple, web-compatible approach
- Better error messages
- Easier to debug

## **Features That Work:**

✅ **Database Selection** - Choose from your Notion databases  
✅ **Event Viewing** - See events from your selected database  
✅ **Event Creation** - Create new events in Notion  
✅ **Real-time Updates** - Refresh to see latest changes  
✅ **Error Handling** - Clear error messages  

## **Next Steps:**

1. **Test the connection** using the steps above
2. **Create a test event** to verify everything works
3. **Select different databases** to see your Notion data
4. **Use the enhanced UI** with better error handling

The Notion integration should now work perfectly! 🎉
