const readline = require('readline');
const http = require('http');

class RealMCPTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.sessionCookie = null;
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = { method, headers: { 'Content-Type': 'application/json' } };
      
      if (this.sessionCookie) options.headers['Cookie'] = this.sessionCookie;
      if (body) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));

      const req = http.request(url, options, (res) => {
        let data = '';
        if (res.headers['set-cookie']) {
          const setCookie = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'][0] : res.headers['set-cookie'];
          if (setCookie) this.sessionCookie = setCookie.split(';')[0];
        }
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch (e) { resolve({ status: res.statusCode, data }); }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  async testMCPStatus() {
    console.log('\n📊 Checking MCP Status...');
    try {
      const response = await this.makeRequest('/api/mcp/test');
      if (response.status === 200 && response.data.success) {
        console.log('✅ MCP Registry is working');
        console.log('Services:', response.data.serverNames?.join(', '));
        return true;
      } else {
        console.log('❌ MCP Status failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
      return false;
    }
  }

  async testSendEmail(userEmail) {
    console.log('\n📧 Testing Email Send...');
    try {
      const response = await this.makeRequest('/api/mcp/test', 'POST', {
        service: 'gmail',
        functionName: 'send_email',
        parameters: {
          to: userEmail,
          subject: 'MCP Test Email - Yeet!',
          body: '<h2>MCP Test Email</h2><p>This is a test from the MCP integration test script.</p>'
        }
      });

      if (response.status === 200 && response.data.result?.success) {
        console.log('✅ Email sent successfully!');
        return true;
      } else {
        console.log('❌ Email send failed:', response.data?.result?.error || response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Email test error:', error.message);
      return false;
    }
  }

  async testCreateEvent() {
    console.log('\n📅 Testing Calendar Event Creation...');
    try {
      const eventDate = new Date('2025-01-20T08:00:00.000Z');
      const endDate = new Date('2025-01-20T09:00:00.000Z');

      const response = await this.makeRequest('/api/mcp/test', 'POST', {
        service: 'calendar',
        functionName: 'create_event',
        parameters: {
          title: 'Yeet!',
          startDateTime: eventDate.toISOString(),
          endDateTime: endDate.toISOString(),
          description: 'MCP Test Event',
          location: 'MCP Test Location'
        }
      });

      if (response.status === 200 && response.data.result?.success) {
        console.log('✅ Calendar event created successfully!');
        return true;
      } else {
        console.log('❌ Calendar test failed:', response.data?.result?.error || response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Calendar test error:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Real MCP Integration Test');
    console.log('='.repeat(50));

    const mcpWorking = await this.testMCPStatus();
    if (!mcpWorking) {
      console.log('\n❌ MCP services not available.');
      return;
    }

    const userEmail = await this.prompt('\nEnter your email address for test: ');
    if (!userEmail.includes('@')) {
      console.log('❌ Invalid email');
      return;
    }

    let results = {
      email: false,
      calendar: false
    };

    results.email = await this.testSendEmail(userEmail);
    results.calendar = await this.testCreateEvent();

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS');
    console.log('='.repeat(50));
    console.log(`📧 Email: ${results.email ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📅 Calendar: ${results.calendar ? '✅ SUCCESS' : '❌ FAILED'}`);

    const successRate = Math.round(((results.email ? 1 : 0) + (results.calendar ? 1 : 0)) / 2 * 100);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
  }
}

const tester = new RealMCPTester();
tester.run().catch(console.error);

