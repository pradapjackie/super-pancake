import fs from 'fs';
import path from 'path';

export default class VitestConsoleReporter {
  constructor(options = {}) {
    this.options = options;
    this.consoleOutput = new Map(); // testId -> logs array
    this.currentTestId = null;
    
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    // Override console methods to capture output
    this.interceptConsole();
    
    console.log('🎤 Vitest Console Reporter initialized');
  }

  interceptConsole() {
    const self = this;
    
    ['log', 'error', 'warn', 'info'].forEach(method => {
      console[method] = function(...args) {
        // Call original method
        self.originalConsole[method].apply(console, args);
        
        // Capture output for current test
        if (self.currentTestId) {
          if (!self.consoleOutput.has(self.currentTestId)) {
            self.consoleOutput.set(self.currentTestId, []);
          }
          
          const logEntry = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          
          const timestamp = new Date().toISOString();
          self.consoleOutput.get(self.currentTestId).push(`[${timestamp}] ${logEntry}`);
        }
      };
    });
  }

  restoreConsole() {
    Object.keys(this.originalConsole).forEach(method => {
      console[method] = this.originalConsole[method];
    });
  }

  onInit(ctx) {
    this.ctx = ctx;
  }

  onTestBegin(test) {
    // Generate unique test ID
    this.currentTestId = `${test.file.name}-${test.name}`.replace(/[^a-zA-Z0-9-_]/g, '_');
    this.consoleOutput.set(this.currentTestId, []);
  }

  onTestFinished(test) {
    if (!this.currentTestId) return;
    
    // Get console logs for this test
    const logs = this.consoleOutput.get(this.currentTestId) || [];
    
    // Create enhanced result with console logs
    const enhancedResult = {
      id: this.currentTestId,
      testName: test.name,
      description: test.name,
      status: test.result?.state || 'unknown',
      duration: test.result?.duration || 0,
      timestamp: new Date().toISOString(),
      fileName: test.file.name,
      browser: process.env.SUPER_PANCAKE_BROWSER || 'chrome',
      environment: 'test',
      logs: logs, // This is the key addition
      error: test.result?.errors?.[0]?.message || null,
      screenshots: [],
      tags: [],
      metadata: {
        framework: 'Super Pancake Automation',
        version: '2.9.0',
        nodeVersion: process.version,
        platform: process.platform,
        captureTime: Date.now()
      }
    };

    // Save individual test result with logs
    this.saveTestResult(enhancedResult);
    
    // Clear current test
    this.currentTestId = null;
  }

  saveTestResult(result) {
    const dir = 'test-report/results';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create directory structure based on file path
    const filePathParts = result.fileName.split('/');
    const dirPath = path.join(dir, ...filePathParts.slice(0, -1));
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Generate filename
    const testFileName = filePathParts[filePathParts.length - 1].replace('.test.js', '');
    const filename = `${result.id}-${Date.now()}.json`;
    const filepath = path.join(dirPath, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`📝 Test result with console logs saved: ${filepath}`);
    } catch (error) {
      console.error('❌ Failed to save test result:', error.message);
    }
  }

  onFinished(files, errors) {
    console.log(`✅ Console Reporter finished. Captured logs for ${this.consoleOutput.size} tests`);
    
    // Generate summary with console logs data
    const summary = {
      totalTests: files?.reduce((acc, file) => acc + file.result?.numTotalTests || 0, 0) || 0,
      totalLogs: Array.from(this.consoleOutput.values()).reduce((acc, logs) => acc + logs.length, 0),
      timestamp: new Date().toISOString(),
      testFiles: Array.from(this.consoleOutput.keys())
    };
    
    try {
      fs.writeFileSync('test-report/console-summary.json', JSON.stringify(summary, null, 2));
      console.log(`📊 Console logs summary saved: ${summary.totalLogs} total log entries`);
    } catch (error) {
      console.error('❌ Failed to save console summary:', error.message);
    }
    
    // Restore original console
    this.restoreConsole();
  }
}