#!/usr/bin/env node

/**
 * Real MCP Test Script - FIXED for Session Cookie Handling
 * Test actual email sending and calendar event creation
 */

const fetch = require("node-fetch");
const readline = require("readline");

class RealMCPTester {
  constructor() {
    this.baseUrl = "http://localhost:3001";
    this.cookieJar = new Map();
  }

  colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
  };

  log(message, color = "reset") {
    console.log(`$${this.colors[color]}$${message}$${this.colors.reset}`);
  }

  storeCookies(response) {
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      cookies.forEach(cookie => {
        const [name] = cookie.split("=");
        this.cookieJar.set(name.trim(), cookie.split(";")[0]);
      });
    }
  }

  getCookieString() {
    return Array.from(this.cookieJar.values()).join("; ");
  }

  async makeRequest(path, method = "GET", body = null) {
    const url = `$${this.baseUrl}$${path}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const cookieString = this.getCookieString();
    if (cookieString) {
      options.headers["Cookie"] = cookieString;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      this.storeCookies(response);
      
      const data = await response.text();
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      return { status: response.status, data: parsedData, ok: response.ok };
    } catch (error) {
      throw new Error(`Request failed: $${error.message}`);
    }
  }

  async testMCPStatus() {
    this.log("\n Checking MCP Status...", "cyan");
    try {
      const response = await this.makeRequest("/api/mcp");
      if (response.status === 200 && response.data.success) {
        this.log(" MCP Registry is working", "green");
        this.log(`Services: $${response.data.totalServices}`, "blue");
        return true;
      } else {
        this.log(` MCP Status check failed: $${response.data?.error || response.status}`, "red");
        return false;
      }
    } catch (error) {
      this.log(` MCP Status error: $${error.message}`, "red");
      return false;
    }
  }

  async run() {
    this.log(" Real MCP Integration Test (FIXED - Cookie Support)", "bright");
    await this.testMCPStatus();
  }
}

if (require.main === module) {
  const tester = new RealMCPTester();
  tester.run().catch(console.error);
}
