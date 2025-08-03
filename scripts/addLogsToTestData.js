#!/usr/bin/env node

/**
 * Quick script to add console logs to existing test data
 * This demonstrates the individual test logs functionality
 */

import fs from 'fs';
import path from 'path';

// Sample console logs for different types of tests
const sampleLogs = {
    "should load the npm package page successfully": [
        "[2025-07-31T18:31:19.882Z] 🚀 Starting npm package page load test...",
        "[2025-07-31T18:31:19.883Z] 🌐 Navigating to: https://www.npmjs.com/package/super-pancake-automation",
        "[2025-07-31T18:31:20.200Z] ⏳ Waiting for page to load...",
        "[2025-07-31T18:31:20.500Z] 🔍 Checking page title...",
        "[2025-07-31T18:31:20.750Z] ✅ Page title matches expected value",
        "[2025-07-31T18:31:21.000Z] 📦 Verifying package content is visible",
        "[2025-07-31T18:31:21.250Z] ✅ Package name 'super-pancake-automation' found",
        "[2025-07-31T18:31:21.500Z] ✅ Page loaded successfully in 5.4s"
    ],
    "should have the correct page title": [
        "[2025-07-31T18:31:22.000Z] 🔍 Testing page title validation...",
        "[2025-07-31T18:31:22.010Z] 📄 Getting document title from DOM",
        "[2025-07-31T18:31:22.015Z] 🎯 Expected: 'super-pancake-automation - npm'",
        "[2025-07-31T18:31:22.016Z] 📝 Actual: 'super-pancake-automation - npm'",
        "[2025-07-31T18:31:22.017Z] ✅ Page title validation passed"
    ],
    "should display the package name prominently": [
        "[2025-07-31T18:31:22.100Z] 🔍 Checking package name visibility...",
        "[2025-07-31T18:31:22.102Z] 🎯 Looking for main heading with package name",
        "[2025-07-31T18:31:22.103Z] ✅ Found package name in main heading",
        "[2025-07-31T18:31:22.104Z] 📦 Package name: 'super-pancake-automation'",
        "[2025-07-31T18:31:22.105Z] ✅ Package name is prominently displayed"
    ],
    "should show package version information": [
        "[2025-07-31T18:31:22.200Z] 🔍 Validating version information display...",
        "[2025-07-31T18:31:22.205Z] 🏷️ Searching for version badge/text",
        "[2025-07-31T18:31:22.210Z] ✅ Version information found",
        "[2025-07-31T18:31:22.215Z] 📊 Current version: v2.9.0",
        "[2025-07-31T18:31:22.220Z] ✅ Version is clearly visible to users"
    ],
    "should contain package installation instructions": [
        "[2025-07-31T18:31:22.300Z] 🔍 Checking installation instructions...",
        "[2025-07-31T18:31:22.305Z] 💻 Looking for npm install command",
        "[2025-07-31T18:31:22.310Z] ✅ Found installation section",
        "[2025-07-31T18:31:22.312Z] 📝 Command: 'npm install super-pancake-automation'",
        "[2025-07-31T18:31:22.315Z] 📋 Copy button is available",
        "[2025-07-31T18:31:22.318Z] ✅ Installation instructions are clear and accessible"
    ],
    "should be accessible and well-structured": [
        "[2025-07-31T18:31:22.400Z] 🔍 Running accessibility checks...",
        "[2025-07-31T18:31:22.405Z] 🏗️ Checking HTML structure and semantics",
        "[2025-07-31T18:31:22.408Z] ✅ Proper heading hierarchy found",
        "[2025-07-31T18:31:22.410Z] 🎯 Alt text present on images",
        "[2025-07-31T18:31:22.412Z] 🔗 Links have descriptive text",
        "[2025-07-31T18:31:22.415Z] ✅ Page meets accessibility standards"
    ]
};

// Sample screenshots for some tests
const sampleScreenshots = {
    "should load the npm package page successfully": [
        {
            path: "./screenshots/npm-page-loaded.png",
            description: "NPM package page fully loaded",
            timestamp: "2025-07-31T18:31:21.500Z"
        },
        {
            path: "./screenshots/package-header.png", 
            description: "Package header with title and version",
            timestamp: "2025-07-31T18:31:21.600Z"
        }
    ],
    "should contain package installation instructions": [
        {
            path: "./screenshots/install-section.png",
            description: "Installation instructions section",
            timestamp: "2025-07-31T18:31:22.318Z"
        }
    ]
};

function addLogsToTestData() {
    const testDataPath = path.join(process.cwd(), 'automationTestData.json');
    
    if (!fs.existsSync(testDataPath)) {
        console.error('❌ automationTestData.json not found');
        return;
    }
    
    console.log('📊 Loading current test data...');
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    
    console.log(`🔍 Processing ${testData.length} test entries...`);
    
    let logsAdded = 0;
    let screenshotsAdded = 0;
    
    for (const test of testData) {
        // Add logs if they don't exist and we have sample logs for this test
        if (!test.logs && sampleLogs[test.testName]) {
            test.logs = sampleLogs[test.testName];
            logsAdded++;
            console.log(`✅ Added logs to: ${test.testName}`);
        }
        
        // Add screenshots if they don't exist and we have sample screenshots
        if ((!test.screenshots || test.screenshots.length === 0) && sampleScreenshots[test.testName]) {
            test.screenshots = sampleScreenshots[test.testName];
            screenshotsAdded++;
            console.log(`📸 Added screenshots to: ${test.testName}`);
        }
        
        // Ensure screenshots array exists even if empty
        if (!test.screenshots) {
            test.screenshots = [];
        }
        
        // Add ID if missing (needed for individual test tracking)
        if (!test.id) {
            test.id = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    
    // Save updated test data
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    
    console.log('\n🎉 Update completed!');
    console.log(`📝 Added logs to ${logsAdded} tests`);
    console.log(`📸 Added screenshots to ${screenshotsAdded} tests`);
    console.log('💾 Test data saved to automationTestData.json');
    console.log('\n🚀 You can now refresh your report to see individual test logs and screenshot functionality!');
}

// Run the script
addLogsToTestData();