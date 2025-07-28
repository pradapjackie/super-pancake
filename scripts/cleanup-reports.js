#!/usr/bin/env node

/**
 * Report Cleanup Script
 * Manages report files and test data cleanup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

function cleanupReports(options = {}) {
    console.log('🧹 Cleaning up report files...');
    
    const filesToRemove = [];
    const dirsToCheck = [];
    
    // Report files to remove
    const reportPatterns = [
        'automationTestReport.html',
        'test-report.html',
        '*TestReport.html',
        '*-report.html',
        'report-*.html'
    ];
    
    // JSON data files to remove (if requested)
    const dataPatterns = [
        'automationTestData.json',
        '*TestData.json',
        'test-data-*.json'
    ];
    
    // Debug files to remove
    const debugPatterns = [
        'debug-*.html',
        'test-*.html',
        'demo-*.js',
        'chart-*.html'
    ];
    
    // Core directory old reports
    const coreReports = [
        'core/automationTestReport.html',
        'core/modernTestReport.html',
        'core/test-report'
    ];
    
    // Screenshot files to remove
    const screenshotPatterns = [
        'screenshots/*.png',
        'screenshots/*.jpg',
        'screenshots/*.jpeg',
        '*.png', // Root level screenshots
        '*.jpg',
        '*.jpeg'
    ];
    
    // Collect files to remove
    function addFilesToRemove(patterns, description) {
        console.log(`\n📋 Checking ${description}:`);
        patterns.forEach(pattern => {
            try {
                if (pattern.includes('*')) {
                    // Glob pattern - simple implementation
                    if (pattern.includes('/')) {
                        // Handle directory patterns like 'screenshots/*.png'
                        const [dir, filePattern] = pattern.split('/');
                        const dirPath = path.join(rootDir, dir);
                        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                            const files = fs.readdirSync(dirPath);
                            const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*') + '$');
                            files.forEach(file => {
                                if (regex.test(file)) {
                                    const fullPath = path.join(dirPath, file);
                                    filesToRemove.push(fullPath);
                                    console.log(`  ❌ ${dir}/${file}`);
                                }
                            });
                        }
                    } else {
                        // Handle root level patterns
                        const files = fs.readdirSync(rootDir);
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                        files.forEach(file => {
                            if (regex.test(file)) {
                                const fullPath = path.join(rootDir, file);
                                filesToRemove.push(fullPath);
                                console.log(`  ❌ ${file}`);
                            }
                        });
                    }
                } else if (pattern.includes('/')) {
                    // Direct path
                    const fullPath = path.join(rootDir, pattern);
                    if (fs.existsSync(fullPath)) {
                        filesToRemove.push(fullPath);
                        console.log(`  ❌ ${pattern}`);
                    }
                } else {
                    // Direct filename
                    const fullPath = path.join(rootDir, pattern);
                    if (fs.existsSync(fullPath)) {
                        filesToRemove.push(fullPath);
                        console.log(`  ❌ ${pattern}`);
                    }
                }
            } catch (error) {
                console.log(`  ⚠️  Error checking ${pattern}:`, error.message);
            }
        });
    }
    
    // Check different types of files
    if (options.screenshotsOnly) {
        addFilesToRemove(screenshotPatterns, 'screenshot files');
    } else {
        addFilesToRemove(reportPatterns, 'HTML report files');
        addFilesToRemove(debugPatterns, 'debug and test files');
        addFilesToRemove(coreReports, 'old core reports');
        addFilesToRemove(screenshotPatterns, 'screenshot files');
        
        if (options.includeData) {
            addFilesToRemove(dataPatterns, 'JSON data files');
        }
    }
    
    // Remove files
    if (filesToRemove.length === 0) {
        console.log('\n✅ No files to remove');
        return;
    }
    
    console.log(`\n🗑️  Removing ${filesToRemove.length} files...`);
    
    let removed = 0;
    let errors = 0;
    
    filesToRemove.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`  ✅ Removed: ${path.relative(rootDir, filePath)}`);
                removed++;
            }
        } catch (error) {
            console.log(`  ❌ Error removing ${path.relative(rootDir, filePath)}:`, error.message);
            errors++;
        }
    });
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`  ✅ Files removed: ${removed}`);
    console.log(`  ❌ Errors: ${errors}`);
    
    if (errors === 0) {
        console.log('🎉 Cleanup completed successfully!');
    }
}

function showHelp() {
    console.log(`
🧹 Report Cleanup Tool

Usage:
  node scripts/cleanup-reports.js [options]
  
Options:
  --data          Also remove JSON data files
  --all           Remove all report-related files
  --screenshots   Remove only screenshot files
  --help          Show this help message
  
Examples:
  node scripts/cleanup-reports.js                    # Remove HTML reports and debug files
  node scripts/cleanup-reports.js --data            # Also remove JSON data files  
  node scripts/cleanup-reports.js --all             # Remove everything
  
Files that will be removed:
  📄 HTML Reports: automationTestReport.html, test-report.html, etc.
  🐛 Debug Files: debug-*.html, test-*.html, demo-*.js
  📸 Screenshots: screenshots/*.png, *.png in root, etc.
  📊 Data Files: automationTestData.json (with --data flag)
  📁 Old Reports: core/automationTestReport.html, etc.
    `);
}

// Command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        showHelp();
        process.exit(0);
    }
    
    const options = {
        includeData: args.includes('--data') || args.includes('--all'),
        all: args.includes('--all'),
        screenshotsOnly: args.includes('--screenshots')
    };
    
    cleanupReports(options);
}

export { cleanupReports };