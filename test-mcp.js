#!/usr/bin/env node

/**
 * MCP Test Suite
 * Comprehensive testing script for all MCP servers and functions
 * 
 * Usage:
 * node test-mcp.js [options]
 * 
 * Options:
 * --service=gmail|calendar|outlook|notion  Test specific service only
 * --function=function_name                 Test specific function only
 * --dry-run                               Show what would be tested without executing
 * --verbose                               Show detailed output
 */

const https = require('https');
const readline = require('readline');

class MCPTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.sessionCookie = null;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  // Color output for terminal
  colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  };

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.sessionCookie || ''
        }
      };

      if (body) {
        options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
      }

      const req = (url.protocol === 'https:' ? https : require('http')).request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  async authenticateUser() {
    this.log('\n🔐 Authentication Required', 'yellow');
    this.log('Please visit your app and sign in, then come back here.');
    this.log('Make sure you have a valid session cookie.');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Press Enter when you are signed in and ready to test...', () => {
        rl.close();
        resolve();
      });
    });
  }

  async testMCPOverview() {
    this.log('\n📊 Testing MCP Overview...', 'cyan');
    
    try {
      const response = await this.makeRequest('/api/mcp');
      
      if (response.status === 401) {
        await this.authenticateUser();
        return await this.testMCPOverview();
      }
      
      if (response.status === 200 && response.data.success) {
        this.log(`✅ MCP Overview: ${response.data.totalServices} services, ${response.data.totalFunctions} functions`, 'green');
        
        if (this.verbose) {
          response.data.services.forEach(service => {
            this.log(`   - ${service.name}: ${service.functionCount} functions`, 'blue');
          });
        }
        
        this.testResults.passed++;
        return response.data;
      } else {
        throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.log(`❌ MCP Overview failed: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({ test: 'MCP Overview', error: error.message });
      throw error;
    }
  }

  getTestCases() {
    return {
      gmail: [
        {
          name: 'Get Recent Emails',
          function: 'get_emails',
          parameters: { maxResults: '5', includeBody: 'false' },
          description: 'Retrieve 5 most recent emails'
        },
        {
          name: 'Search Unread Emails',
          function: 'search_emails',
          parameters: { searchTerm: 'test', isUnread: 'true' },
          description: 'Search for unread emails containing "test"'
        },
        {
          name: 'Create Draft Email',
          function: 'create_draft',
          parameters: { 
            to: 'test@example.com', 
            subject: 'MCP Test Draft', 
            body: 'This is a test draft created by MCP' 
          },
          description: 'Create a test draft email',
          destructive: false
        }
        // Note: Removed send_email test to avoid sending actual emails
      ],
      
      calendar: [
        {
          name: 'Get Upcoming Events',
          function: 'get_upcoming_events',
          parameters: { limit: '5', timeframe: 'this week' },
          description: 'Get upcoming events for this week'
        },
        {
          name: 'Get Events This Month',
          function: 'get_events',
          parameters: { 
            startDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
            endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            maxResults: '10'
          },
          description: 'Get events for the next 30 days'
        },
        {
          name: 'Find Available Slots',
          function: 'find_available_slots',
          parameters: {
            duration: '60',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            workingHoursOnly: 'true'
          },
          description: 'Find 1-hour available slots in the next week'
        }
        // Note: Skipping create_event test to avoid creating actual events
      ],
      
      outlook: [
        {
          name: 'Get Outlook Emails',
          function: 'get_outlook_emails',
          parameters: { folder: 'inbox', maxResults: '5' },
          description: 'Get recent emails from Outlook inbox'
        },
        {
          name: 'Get Outlook Events',
          function: 'get_outlook_events',
          parameters: { 
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            maxResults: '10'
          },
          description: 'Get Outlook events for the next week'
        }
        // Note: Skipping send and create tests to avoid actual operations
      ],
      
      notion: [
        {
          name: 'Search Notion Content',
          function: 'search_notion',
          parameters: { query: 'test', filter: 'page' },
          description: 'Search for pages containing "test"'
        },
        {
          name: 'Get Notion Page (placeholder)',
          function: 'get_notion_page',
          parameters: { pageId: 'test-page-id' },
          description: 'Get a Notion page (placeholder test)'
        }
        // Note: Using placeholder tests since Notion MCP is not fully implemented
      ]
    };
  }

  async testService(serviceName, specificFunction = null) {
    const testCases = this.getTestCases()[serviceName] || [];
    
    if (!testCases.length) {
      this.log(`⚠️  No test cases defined for ${serviceName}`, 'yellow');
      this.testResults.skipped++;
      return;
    }

    this.log(`\n🧪 Testing ${serviceName.toUpperCase()} MCP Server...`, 'magenta');
    
    const filteredTests = specificFunction 
      ? testCases.filter(test => test.function === specificFunction)
      : testCases;

    if (filteredTests.length === 0) {
      this.log(`⚠️  Function ${specificFunction} not found in ${serviceName}`, 'yellow');
      this.testResults.skipped++;
      return;
    }

    for (const testCase of filteredTests) {
      await this.runTestCase(serviceName, testCase);
    }
  }

  async runTestCase(serviceName, testCase) {
    this.testResults.total++;
    const testName = `${serviceName}.${testCase.function}`;
    
    if (this.dryRun) {
      this.log(`🔍 [DRY RUN] ${testName}: ${testCase.description}`, 'blue');
      this.log(`   Parameters: ${JSON.stringify(testCase.parameters)}`, 'blue');
      this.testResults.skipped++;
      return;
    }

    this.log(`\n🔄 Testing ${testName}: ${testCase.description}`, 'cyan');
    
    if (this.verbose) {
      this.log(`   Parameters: ${JSON.stringify(testCase.parameters, null, 2)}`, 'blue');
    }

    try {
      const response = await this.makeRequest(`/api/mcp/${serviceName}`, 'POST', {
        functionName: testCase.function,
        parameters: testCase.parameters
      });

      if (response.status === 200) {
        if (response.data.success) {
          this.log(`✅ ${testName}: SUCCESS`, 'green');
          
          if (this.verbose && response.data.data) {
            const dataStr = JSON.stringify(response.data.data, null, 2);
            const truncated = dataStr.length > 200 ? dataStr.substring(0, 200) + '...' : dataStr;
            this.log(`   Result: ${truncated}`, 'blue');
          }
          
          if (response.data.message) {
            this.log(`   Message: ${response.data.message}`, 'blue');
          }
          
          this.testResults.passed++;
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.log(`❌ ${testName}: FAILED - ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({ 
        test: testName, 
        error: error.message,
        parameters: testCase.parameters 
      });
    }
  }

  printResults() {
    this.log('\n' + '='.repeat(60), 'bright');
    this.log('📊 MCP TEST RESULTS', 'bright');
    this.log('='.repeat(60), 'bright');
    
    this.log(`\nTotal Tests: ${this.testResults.total}`, 'bright');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'green');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'red');
    this.log(`⏭️  Skipped: ${this.testResults.skipped}`, 'yellow');
    
    if (this.testResults.failed > 0) {
      this.log('\n🔍 FAILED TESTS:', 'red');
      this.testResults.errors.forEach((error, index) => {
        this.log(`\n${index + 1}. ${error.test}`, 'red');
        this.log(`   Error: ${error.error}`, 'red');
        if (error.parameters) {
          this.log(`   Parameters: ${JSON.stringify(error.parameters)}`, 'red');
        }
      });
    }
    
    const successRate = this.testResults.total > 0 
      ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
      : 0;
    
    this.log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
    
    if (successRate >= 90) {
      this.log('\n🎉 Excellent! MCP integration is working great!', 'green');
    } else if (successRate >= 70) {
      this.log('\n👍 Good! Most MCP functions are working.', 'yellow');
    } else {
      this.log('\n⚠️  Some issues detected. Check the errors above.', 'red');
    }
  }

  async run(options = {}) {
    this.log('🚀 Starting MCP Test Suite...', 'bright');
    this.log(`Base URL: ${this.baseUrl}`, 'blue');
    
    try {
      // Test MCP overview first
      const overview = await this.testMCPOverview();
      
      // Test specific service or all services
      if (options.service) {
        await this.testService(options.service, options.function);
      } else {
        const services = ['gmail', 'calendar', 'outlook', 'notion'];
        for (const service of services) {
          await this.testService(service, options.function);
        }
      }
      
    } catch (error) {
      this.log(`\n💥 Test suite failed to start: ${error.message}`, 'red');
    }
    
    this.printResults();
    
    // Exit with appropriate code
    process.exit(this.testResults.failed > 0 ? 1 : 0);
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    service: null,
    function: null,
    dryRun: false,
    verbose: false
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--service=')) {
      options.service = arg.split('=')[1];
    } else if (arg.startsWith('--function=')) {
      options.function = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help') {
      console.log(`
MCP Test Suite - Test all MCP server integrations

Usage: node test-mcp.js [options]

Options:
  --service=SERVICE    Test specific service (gmail|calendar|outlook|notion)
  --function=FUNCTION  Test specific function only
  --dry-run           Show what would be tested without executing
  --verbose           Show detailed output
  --help              Show this help message

Examples:
  node test-mcp.js                           # Test all services
  node test-mcp.js --service=gmail           # Test only Gmail
  node test-mcp.js --service=gmail --verbose # Test Gmail with details
  node test-mcp.js --dry-run                 # See what would be tested
  node test-mcp.js --function=get_emails     # Test specific function
      `);
      process.exit(0);
    }
  });
  
  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const tester = new MCPTester(options);
  tester.run(options);
}

module.exports = MCPTester;