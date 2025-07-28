import fs from 'fs';
import path from 'path';

export function initializeReportDirectory() {
  const reportDir = 'test-report';
  const resultsDir = path.join(reportDir, 'results');
  const screenshotsDir = path.join(reportDir, 'screenshots');

  console.log(`Initializing report directory at: ${path.resolve(reportDir)}`);

  try {
    global.allTestResults = new Map();

    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
      console.log('Cleared existing test-report directory');
    }

    fs.mkdirSync(path.join(reportDir, 'results'), { recursive: true });
    fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
    console.log('Created test-report, results, and screenshots directories');
  } catch (err) {
    console.error('Failed to initialize report directory:', err);
  }
}