import { getSession } from './session-context.js';
import fs from 'fs';
import path from 'path';

// Screenshot storage and configuration
let screenshotDirectory = 'test-report/screenshots';
let currentTestScreenshots = [];

/**
 * Initialize screenshot directory
 */
function initializeScreenshotDirectory() {
  try {
    if (!fs.existsSync(screenshotDirectory)) {
      fs.mkdirSync(screenshotDirectory, { recursive: true });
    }
  } catch (error) {
    console.warn('⚠️ Failed to create screenshot directory:', error.message);
  }
}

/**
 * Generate unique screenshot filename
 */
function generateScreenshotFilename(testName, type = 'manual') {
  const sanitizedTestName = testName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const timestamp = Date.now();
  return `${sanitizedTestName}_${type}_${timestamp}.png`;
}

/**
 * Take screenshot with session context (backward compatible)
 */
export async function takeScreenshot(session, format = 'png') {
  const { data } = await session.send('Page.captureScreenshot', {
    format,
    fromSurface: true
  });
  const buffer = Buffer.from(data, 'base64');
  const fs = await import('fs');
  fs.writeFileSync(`screenshot-${Date.now()}.${format}`, buffer);
}

/**
 * Enhanced screenshot capture with automatic file management
 * @param {string} testName - Name of the test for filename
 * @param {string} type - Type of screenshot (failure, success, manual)
 * @param {Object} session - Optional session override
 * @returns {Promise<string|null>} Screenshot file path or null if failed
 */
export async function captureScreenshot(testName = 'unnamed_test', type = 'manual', session = null) {
  try {
    const currentSession = session || getSession();
    if (!currentSession) {
      console.warn('⚠️ No session available for screenshot capture');
      return null;
    }

    // Ensure screenshot directory exists
    initializeScreenshotDirectory();

    // Generate filename and full path
    const filename = generateScreenshotFilename(testName, type);
    const fullPath = path.join(screenshotDirectory, filename);
    const relativePath = path.relative(process.cwd(), fullPath);

    // Capture screenshot using Chrome DevTools Protocol
    const { data } = await currentSession.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: true
    });

    // Save screenshot to file
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(fullPath, buffer);

    console.log(`📸 Screenshot captured: ${relativePath}`);
    
    // Store screenshot info for test results
    const screenshotInfo = {
      path: relativePath,
      url: relativePath,
      filename: filename,
      type: type,
      timestamp: new Date().toISOString(),
      fullPath: fullPath
    };

    currentTestScreenshots.push(screenshotInfo);
    return relativePath;

  } catch (error) {
    console.warn(`⚠️ Failed to capture screenshot: ${error.message}`);
    return null;
  }
}

/**
 * Capture screenshot automatically on test failure
 * @param {string} testName - Name of the failing test
 * @returns {Promise<string|null>} Screenshot path or null
 */
export async function captureFailureScreenshot(testName) {
  return await captureScreenshot(testName, 'failure');
}

/**
 * Get all screenshots captured for current test
 * @returns {Array} Array of screenshot objects
 */
export function getCurrentTestScreenshots() {
  return [...currentTestScreenshots];
}

/**
 * Clear screenshots for new test
 */
export function clearCurrentTestScreenshots() {
  currentTestScreenshots = [];
}

/**
 * Set custom screenshot directory
 * @param {string} directory - Custom directory path
 */
export function setScreenshotDirectory(directory) {
  screenshotDirectory = directory;
  initializeScreenshotDirectory();
}

/**
 * Get current screenshot directory
 * @returns {string} Current screenshot directory
 */
export function getScreenshotDirectory() {
  return screenshotDirectory;
}
