#!/usr/bin/env node

/**
 * Test Report Generator
 * Generates HTML report from JSON test data for testing purposes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTestReport(jsonFilePath, outputPath = 'test-report.html') {
    console.log('🔧 Test Report Generator');
    console.log('📂 Input JSON:', jsonFilePath);
    console.log('📄 Output HTML:', outputPath);
    
    // Check if JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
        console.error('❌ JSON file not found:', jsonFilePath);
        process.exit(1);
    }
    
    // Read and validate JSON data
    let testData;
    try {
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        testData = JSON.parse(jsonContent);
        console.log('✅ JSON loaded:', testData.length, 'tests');
    } catch (error) {
        console.error('❌ Failed to parse JSON:', error.message);
        process.exit(1);
    }
    
    // Generate the HTML report directly
    try {
        const templatePath = path.join(__dirname, '../reporter/templates/baseTemplate.js');
        console.log('📊 Loading template generator from:', templatePath);
        
        // Import the template generator
        const { generateSelfContainedTemplate } = await import(templatePath);
        
        // Calculate the summary manually with correct field names
        const summary = {
            totalTests: testData.length,
            passedTests: testData.filter(t => t.status === 'passed').length,
            failedTests: testData.filter(t => t.status === 'failed').length,
            skippedTests: testData.filter(t => t.status === 'skipped').length,
            totalDuration: Math.round(testData.reduce((sum, test) => sum + (test.duration || 0), 0) * 100) / 100,
            successRate: 0
        };
        summary.successRate = summary.totalTests > 0 ? Math.round((summary.passedTests / summary.totalTests) * 100) : 0;
        
        console.log('📊 Calculated summary:', summary);
        
        // Generate the HTML content
        const htmlContent = generateSelfContainedTemplate(summary, testData);
        
        // Write the report
        fs.writeFileSync(outputPath, htmlContent);
        
        console.log('✅ Report generated successfully!');
        console.log('🌐 Open the report:', outputPath);
        
        // Optionally open the report
        if (process.argv.includes('--open')) {
            const { exec } = await import('child_process');
            exec(`open ${outputPath}`, (error) => {
                if (error) {
                    console.log('💡 Manually open:', outputPath);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to generate report:', error.message);
        process.exit(1);
    }
}

// Command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
        console.log(`
🔧 Test Report Generator

Usage:
  node scripts/test-report-generator.js <json-file> [output-file]
  
Examples:
  node scripts/test-report-generator.js automationTestData.json
  node scripts/test-report-generator.js automationTestData.json my-report.html
  node scripts/test-report-generator.js automationTestData.json --open
  
Options:
  --open    Automatically open the generated report
  --help    Show this help message
        `);
        process.exit(0);
    }
    
    const jsonFile = args[0];
    const outputFile = args.find(arg => arg.endsWith('.html')) || 'test-report.html';
    
    await generateTestReport(jsonFile, outputFile);
}

export { generateTestReport };