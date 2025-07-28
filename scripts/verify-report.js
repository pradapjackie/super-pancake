#!/usr/bin/env node

/**
 * Report Verification Script
 * Automatically tests if the generated HTML report works correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyReport(reportPath = 'automationTestReport.html') {
    console.log('🔍 Verifying HTML Report...');
    console.log('📄 Report file:', reportPath);
    
    if (!fs.existsSync(reportPath)) {
        console.error('❌ Report file not found:', reportPath);
        process.exit(1);
    }
    
    const htmlContent = fs.readFileSync(reportPath, 'utf8');
    
    console.log('\n📋 Report Verification Checklist:');
    
    // Test 1: Check if embedded test data exists
    const hasEmbeddedData = htmlContent.includes('window.embeddedTestData = [');
    console.log(hasEmbeddedData ? '✅' : '❌', 'Embedded test data present');
    
    // Test 2: Check if all tab functions exist  
    const requiredFunctions = [
        'renderTestFiles',
        'renderPerformanceTab', 
        'renderFlakyTab',
        'renderMemoryTab',
        'renderParallelTab',
        'renderResultsTab'
    ];
    
    let functionsOk = true;
    for (const func of requiredFunctions) {
        const hasFunction = htmlContent.includes(`function ${func}(`);
        console.log(hasFunction ? '✅' : '❌', `Function ${func} defined`);
        if (!hasFunction) functionsOk = false;
    }
    
    // Test 3: Check for duplicate initializeReport functions
    const initializeCounts = (htmlContent.match(/function initializeReport/g) || []).length;
    const windowInitializeCounts = (htmlContent.match(/window\.initializeReport.*=/g) || []).length;
    const duplicateCheck = initializeCounts === 0 && windowInitializeCounts === 1;
    console.log(duplicateCheck ? '✅' : '❌', 
        `Single initializeReport function (found ${initializeCounts + windowInitializeCounts} total)`);
    
    // Test 4: Check for isDataLoaded function
    const hasIsDataLoaded = htmlContent.includes('window.isDataLoaded') && 
                           htmlContent.includes('window.dataLoaded === true');
    console.log(hasIsDataLoaded ? '✅' : '❌', 'isDataLoaded function properly defined');
    
    // Test 5: Check Chart.js integration
    const hasChartJS = htmlContent.includes('Chart.js') || htmlContent.includes('typeof Chart');
    console.log(hasChartJS ? '✅' : '❌', 'Chart.js integration present');
    
    // Test 6: Check tab navigation
    const hasTabSwitching = htmlContent.includes('switchTab') && htmlContent.includes('initializeTabContent');
    console.log(hasTabSwitching ? '✅' : '❌', 'Tab navigation functions present');
    
    // Summary
    const allTestsPassed = hasEmbeddedData && functionsOk && duplicateCheck && 
                          hasIsDataLoaded && hasChartJS && hasTabSwitching;
    
    console.log('\n📊 Verification Summary:');
    if (allTestsPassed) {
        console.log('🎉 All checks passed! Report should work correctly.');
        console.log('💡 Test by opening:', reportPath);
        return true;
    } else {
        console.log('❌ Some checks failed. Report may not work correctly.');
        console.log('🔧 Run: npm run report:test to regenerate');
        return false;
    }
}

// Command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const reportFile = process.argv[2] || 'automationTestReport.html';
    const success = await verifyReport(reportFile);
    process.exit(success ? 0 : 1);
}

export { verifyReport };