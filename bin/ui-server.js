#!/usr/bin/env node
import express from 'express';
import path from 'path';
import open from 'open';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Main UI route - serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Serve the test report if it exists
app.get('/automationTestReport.html', (req, res) => {
    const reportPath = path.join(__dirname, '..', 'automationTestReport.html');
    try {
        res.sendFile(reportPath);
    } catch (error) {
        res.status(404).send(`
            <html>
                <head><title>Report Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>🔍 Test Report Not Found</h1>
                    <p>The test report has not been generated yet.</p>
                    <p>Please run some tests first to generate the report.</p>
                    <a href="/" style="color: #16a34a; text-decoration: none;">← Back to Test Runner</a>
                </body>
            </html>
        `);
    }
});

app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`🚀 Super Pancake UI Server running at ${url}`);
    console.log(`📱 Opening browser...`);
    open(url);
});