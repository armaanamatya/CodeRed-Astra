# MCP Test Suite

Comprehensive testing suite for all Model Context Protocol (MCP) server integrations.

## 🚀 Quick Start

### Method 1: Command Line (Recommended for CI/CD)

```bash
# Test all services
npm run test:mcp

# Test with detailed output
npm run test:mcp:verbose

# Test specific service
npm run test:mcp:gmail
npm run test:mcp:calendar
npm run test:mcp:outlook
npm run test:mcp:notion

# Dry run (see what would be tested)
npm run test:mcp:dry
```

### Method 2: Web Interface

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3001/mcp-test`
3. Use the interactive test interface

## 📋 Available Tests

### Gmail MCP Server
- ✅ **Get Recent Emails** - Retrieve recent emails from inbox
- ✅ **Search Emails** - Search for specific emails with filters
- ✅ **Create Draft** - Create draft emails (non-destructive)

### Google Calendar MCP Server
- ✅ **Get Upcoming Events** - Fetch upcoming calendar events
- ✅ **Get Events This Month** - Retrieve events for next 30 days
- ✅ **Find Available Slots** - Find free time slots in calendar

### Outlook MCP Server
- ✅ **Get Outlook Emails** - Retrieve emails from Outlook/Exchange
- ✅ **Get Outlook Events** - Fetch calendar events from Outlook

### Notion MCP Server
- ✅ **Search Notion Content** - Search for pages and content
- ✅ **Get Notion Page** - Retrieve specific Notion pages

## 🔐 Authentication Requirements

Before running tests, ensure you're signed in to the application:

1. Visit `http://localhost:3001`
2. Sign in with your Google/Microsoft accounts
3. Make sure your services are connected in the Account dropdown
4. Run the tests

## 📊 Test Results

### Command Line Output
```
🚀 Starting MCP Test Suite...
📊 Testing MCP Overview...
✅ MCP Overview: 4 services, 20 functions

🧪 Testing GMAIL MCP Server...
✅ gmail.get_emails: SUCCESS
✅ gmail.search_emails: SUCCESS
✅ gmail.create_draft: SUCCESS

📊 MCP TEST RESULTS
==================
Total Tests: 12
✅ Passed: 10
❌ Failed: 2
⏭️ Skipped: 0
🎯 Success Rate: 83.3%
```

### Web Interface
- Interactive test configuration
- Real-time results with detailed output
- Quick test case buttons
- Service overview and statistics

## 🛠️ Advanced Usage

### Command Line Options

```bash
# Test specific function across all services
node test-mcp.js --function=get_emails

# Test with custom parameters
node test-mcp.js --service=gmail --function=get_emails --verbose

# Dry run to see test plan
node test-mcp.js --dry-run
```

### Custom Test Parameters

In the web interface, you can modify test parameters using JSON:

```json
{
  "maxResults": "10",
  "includeBody": "true",
  "query": "from:important@company.com"
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Sign in to the web app first
   - Check that your services are connected
   - Refresh tokens may need renewal

2. **Service Not Found**
   - Ensure the MCP server is registered in `mcp-registry.ts`
   - Check that the service name matches exactly

3. **Function Failures**
   - Verify you have proper permissions for the service
   - Check API rate limits
   - Ensure parameters match the function schema

### Debug Mode

Use verbose output to see detailed request/response data:

```bash
npm run test:mcp:verbose
```

## 📁 Test Files

- **`test-mcp.js`** - Main command-line test runner
- **`src/app/mcp-test/page.tsx`** - Web-based test interface
- **`src/lib/mcp/`** - MCP server implementations
- **`src/app/api/mcp/`** - MCP API endpoints

## 🎯 Expected Results

### Healthy System
- 90%+ success rate across all tests
- All core functions (get, search, create non-destructive) working
- Response times under 5 seconds

### Common Patterns
- **Gmail**: Should retrieve emails and create drafts successfully
- **Calendar**: Should fetch events and find available slots
- **Outlook**: May fail if Microsoft tokens need refresh
- **Notion**: Placeholder implementation, limited functionality

## 🔮 Future Enhancements

- [ ] Automated daily test runs
- [ ] Performance benchmarking
- [ ] Integration with CI/CD pipeline
- [ ] Mock mode for testing without real API calls
- [ ] Test data cleanup and isolation

---

**Need Help?** Check the console output for detailed error messages and verify your authentication status.