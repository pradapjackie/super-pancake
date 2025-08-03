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
        
        // Deduplicate tests using the same logic as the frontend
        function deduplicateTests(tests) {
            const testsByFileAndName = {};
            
            // First pass: collect all tests by file and test name
            tests.forEach(test => {
                const fileName = test.fileName || test.file || test.metadata?.testFile || 'Unknown File';
                const testName = test.testName || test.description || test.name || 'Unknown Test';
                
                if (!testsByFileAndName[fileName]) {
                    testsByFileAndName[fileName] = {};
                }
                
                if (!testsByFileAndName[fileName][testName]) {
                    testsByFileAndName[fileName][testName] = [];
                }
                
                testsByFileAndName[fileName][testName].push(test);
            });
            
            // Second pass: deduplicate by prioritizing individual test entries with logs
            const deduplicatedTests = [];
            
            Object.entries(testsByFileAndName).forEach(([fileName, testsByName]) => {
                Object.entries(testsByName).forEach(([testName, duplicateTests]) => {
                    if (duplicateTests.length === 1) {
                        // No duplicates, add the single test
                        deduplicatedTests.push(duplicateTests[0]);
                    } else {
                        // Handle duplicates by prioritizing individual test entries with logs
                        const individualTestsWithLogs = duplicateTests.filter(test => 
                            test.metadata?.individualTest && test.logs && Array.isArray(test.logs) && test.logs.length > 0
                        );
                        
                        const individualTestsWithoutLogs = duplicateTests.filter(test => 
                            test.metadata?.individualTest && (!test.logs || !Array.isArray(test.logs) || test.logs.length === 0)
                        );
                        
                        const suiteTestsWithLogs = duplicateTests.filter(test => 
                            !test.metadata?.individualTest && test.logs && Array.isArray(test.logs) && test.logs.length > 0
                        );
                        
                        const suiteTestsWithoutLogs = duplicateTests.filter(test => 
                            !test.metadata?.individualTest && (!test.logs || !Array.isArray(test.logs) || test.logs.length === 0)
                        );
                        
                        // Pick the best test entry based on priority
                        let selectedTest = null;
                        
                        if (individualTestsWithLogs.length > 0) {
                            selectedTest = individualTestsWithLogs[0];
                        } else if (individualTestsWithoutLogs.length > 0) {
                            selectedTest = individualTestsWithoutLogs[0];
                        } else if (suiteTestsWithLogs.length > 0) {
                            selectedTest = suiteTestsWithLogs[0];
                        } else if (suiteTestsWithoutLogs.length > 0) {
                            selectedTest = suiteTestsWithoutLogs[0];
                        } else {
                            // Fallback to first test if none match criteria
                            selectedTest = duplicateTests[0];
                        }
                        
                        if (selectedTest) {
                            deduplicatedTests.push(selectedTest);
                        }
                    }
                });
            });
            
            return deduplicatedTests;
        }
        
        // Apply deduplication to get the actual tests that will be displayed
        const deduplicatedTests = deduplicateTests(testData);
        
        console.log('📊 Deduplication results:', testData.length, '→', deduplicatedTests.length, 'tests');
        
        // Calculate the summary using deduplicated data
        const summary = {
            totalTests: deduplicatedTests.length,
            passedTests: deduplicatedTests.filter(t => t.status === 'passed').length,
            failedTests: deduplicatedTests.filter(t => t.status === 'failed').length,
            skippedTests: deduplicatedTests.filter(t => t.status === 'skipped').length,
            totalDuration: Math.round(deduplicatedTests.reduce((sum, test) => sum + (test.duration || 0), 0) * 100) / 100,
            successRate: 0
        };
        summary.successRate = summary.totalTests > 0 ? Math.round((summary.passedTests / summary.totalTests) * 100) : 0;
        
        console.log('📊 Calculated summary:', summary);
        
        // Generate the HTML content using deduplicated test data
        const htmlContent = generateSelfContainedTemplate(summary, deduplicatedTests);
        
        // Write the report
        fs.writeFileSync(outputPath, htmlContent);
        
        console.log('✅ Report generated successfully!');
        console.log('🌐 Open the report:', outputPath);
        
        // Optionally open the report
        if (process.argv.includes('--open')) {
            try {
                const openModule = await import('open');
                const open = openModule.default;
                await open(outputPath);
                console.log('🌐 Report opened in browser');
            } catch (error) {
                console.log('💡 Manually open:', outputPath);
                console.error('Failed to auto-open report:', error.message);
            }
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