// Type definitions for super-pancake-automation
// Generated for IDE autocomplete and IntelliSense support

export interface ChromeOptions {
  headed?: boolean;
  headless?: boolean;
  port?: number;
  viewport?: {
    width: number;
    height: number;
  };
  userDataDir?: string;
  executablePath?: string;
}

export interface SessionOptions {
  timeout?: number;
  retries?: number;
}

export interface ElementSelector {
  nodeId: number;
}

export interface TestConfig {
  timeouts: {
    testTimeout: number;
    navigationTimeout: number;
  };
  browser: {
    headless: boolean;
    viewport: {
      width: number;
      height: number;
    };
  };
  screenshots: {
    enabled: boolean;
    path: string;
  };
}

export interface AssertionOptions {
  message?: string;
  timeout?: number;
}

// Core browser functions
export function launchChrome(options?: ChromeOptions): Promise<any>;
export function connectToChrome(port?: number): Promise<WebSocket>;
export function createSession(ws: WebSocket): any;
export function enableDOM(session: any): Promise<void>;

// DOM manipulation functions
export function navigateTo(session: any, url: string): Promise<void>;
export function querySelector(session: any, selector: string): Promise<ElementSelector | null>;
export function querySelectorAll(session: any, selector: string): Promise<ElementSelector[]>;
export function getText(session: any, element: ElementSelector): Promise<string>;
export function getAttribute(session: any, element: ElementSelector, name: string): Promise<string>;
export function click(session: any, element: ElementSelector): Promise<void>;
export function type(session: any, element: ElementSelector, text: string): Promise<void>;
export function fillInput(session: any, selector: string, value: string): Promise<void>;
export function check(session: any, selector: string, checked: boolean): Promise<void>;
export function selectOption(session: any, selector: string, value: string): Promise<void>;
export function waitForSelector(session: any, selector: string, options?: { timeout?: number }): Promise<ElementSelector>;
export function waitForElement(session: any, selector: string, options?: { timeout?: number }): Promise<ElementSelector>;
export function takeElementScreenshot(session: any, selector: string, filename: string): Promise<void>;
export function takeScreenshot(session: any, filename: string): Promise<void>;

// Assertion functions
export function assertEqual(actual: any, expected: any, message?: string): void;
export function assertNotEqual(actual: any, expected: any, message?: string): void;
export function assertContainsText(text: string, substring: string, message?: string): void;
export function assertTrue(condition: boolean, message?: string): void;
export function assertFalse(condition: boolean, message?: string): void;

// API utilities
export function buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string>;
export function timedRequest<T>(fn: () => Promise<T>, timeout?: number): Promise<T>;

// Test utilities
export function testWithReport(name: string, testFn: () => Promise<void>, session: any, testFile: string): Promise<void>;

// Reporter functions
export function addTestResult(result: {
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
  file: string;
}): void;
export function writeReport(): void;

// Configuration
export const config: TestConfig;

// Environment utilities
export function getEnv(): Record<string, string>;