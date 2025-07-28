#!/usr/bin/env node

import { writeReport } from '../reporter/htmlReporter.js';

try {
    // Generate the HTML report with external JSON data
    const reportPath = writeReport();
    console.log('📊 Enhanced test report generated successfully!');
} catch (error) {
    console.error('❌ Failed to generate test report:', error);
    process.exit(1);
}