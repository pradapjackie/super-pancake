// TypeScript definitions for Super Pancake Automation Framework

declare module 'super-pancake-automation' {
  // ========================================
  // CORE ERROR TYPES
  // ========================================
  
  export interface ErrorContext {
    [key: string]: any;
  }
  
  export class SuperPancakeError extends Error {
    code: string;
    context: ErrorContext;
    timestamp: string;
    constructor(message: string, code?: string, context?: ErrorContext);
    toJSON(): {
      name: string;
      message: string;
      code: string;
      context: ErrorContext;
      timestamp: string;
      stack?: string;
    };
  }
  
  export class ElementNotFoundError extends SuperPancakeError {
    constructor(selector: string, context?: ErrorContext);
  }
  
  export class TimeoutError extends SuperPancakeError {
    constructor(operation: string, timeout: number, context?: ErrorContext);
  }
  
  export class ValidationError extends SuperPancakeError {
    constructor(parameter: string, expected: string, actual: any, context?: ErrorContext);
  }
  
  export class SessionError extends SuperPancakeError {
    constructor(message: string, context?: ErrorContext);
  }
  
  export class SecurityError extends SuperPancakeError {
    constructor(message: string, context?: ErrorContext);
  }
  
  // ========================================
  // BROWSER AND SESSION TYPES
  // ========================================
  
  export interface BrowserConfig {
    headless?: boolean;
    devtools?: boolean;
    args?: string[];
    userDataDir?: string;
    executablePath?: string;
    port?: number;
  }
  
  export interface Browser {
    wsEndpoint: string;
    port: number;
    process: any;
    close(): Promise<void>;
  }
  
  export interface Session {
    send(method: string, params?: any): Promise<any>;
    close(): Promise<void>;
  }
  
  // ========================================
  // DOM OPERATION TYPES
  // ========================================
  
  export type NodeId = number;
  export type Selector = string;
  
  export interface ElementInfo {
    tagName: string;
    className: string;
    id: string;
    name: string;
    value: string;
    textContent?: string;
    checked?: boolean;
    disabled?: boolean;
    selected?: boolean;
  }
  
  export interface BoundingRect {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    bottom: number;
    right: number;
  }
  
  export interface ScreenshotResult {
    fileName: string;
    isElementScreenshot: boolean;
  }
  
  export interface ScrollOptions {
    behavior?: 'auto' | 'smooth';
    block?: 'start' | 'center' | 'end' | 'nearest';
  }
  
  // ========================================
  // API TYPES
  // ========================================
  
  export interface ApiResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
    duration?: number;
  }
  
  export interface ApiConfig {
    baseUrl: string;
  }
  
  export interface GraphQLVariables {
    [key: string]: any;
  }
  
  export interface JsonSchema {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  }
  
  // ========================================
  // CONFIGURATION TYPES
  // ========================================
  
  export interface FrameworkConfig {
    timeouts: {
      waitForSelector: number;
      reload: number;
      navigation: number;
    };
    pollInterval: number;
    screenshots: {
      onFailure: boolean;
      directory: string;
    };
    browser: BrowserConfig;
  }
  
  // ========================================
  // BROWSER LAUNCHER FUNCTIONS
  // ========================================
  
  export function launchBrowser(config?: BrowserConfig): Promise<Browser>;
  export function createSession(browser: Browser): Promise<Session>;
  export function closeBrowser(browser: Browser): Promise<void>;
  
  // ========================================
  // DOM MANIPULATION FUNCTIONS
  // ========================================
  
  // Core DOM functions
  export function enableDOM(session: Session): Promise<void>;
  export function navigateTo(session: Session, url: string): Promise<void>;
  export function querySelector(session: Session, selector: Selector): Promise<NodeId>;
  export function querySelectorAll(session: Session, selector: Selector): Promise<NodeId[]>;
  
  // Element interaction
  export function click(session: Session, selectorOrNodeId: Selector | NodeId): Promise<void>;
  export function type(session: Session, selector: Selector, text: string): Promise<void>;
  export function clearInput(session: Session, selector: Selector): Promise<void>;
  export function focus(session: Session, selector: Selector): Promise<void>;
  export function hover(session: Session, selector: Selector): Promise<void>;
  export function rightClick(session: Session, selector: Selector): Promise<void>;
  export function pressKey(session: Session, selector: Selector, key: string): Promise<void>;
  
  // Element properties
  export function getText(session: Session, nodeId: NodeId): Promise<string>;
  export function getValue(session: Session, selector: Selector): Promise<string>;
  export function getAttribute(session: Session, selector: Selector, attrName: string): Promise<string | null>;
  export function setAttribute(session: Session, selector: Selector, attrName: string, value: string): Promise<void>;
  export function isVisible(session: Session, selector: Selector): Promise<boolean>;
  export function isEnabled(session: Session, selector: Selector): Promise<boolean>;
  
  // Form operations
  export function fillInput(session: Session, selector: Selector, value: string): Promise<void>;
  export function check(session: Session, selector: Selector, checked?: boolean): Promise<void>;
  export function selectOption(session: Session, selector: Selector, values: string | string[]): Promise<void>;
  
  // Navigation and page operations
  export function reload(session: Session): Promise<void>;
  export function goBack(session: Session): Promise<void>;
  export function goForward(session: Session): Promise<void>;
  export function scrollIntoView(session: Session, selector: Selector): Promise<void>;
  
  // Wait functions
  export function waitForTimeout(ms: number): Promise<void>;
  export function waitForSelector(session: Session, selector: Selector, timeout?: number): Promise<NodeId>;
  export function waitForElementToBeVisible(session: Session, selector: Selector, timeout?: number): Promise<NodeId>;
  export function waitForElementToBeHidden(session: Session, selector: Selector, timeout?: number): Promise<boolean>;
  export function waitForElementToBeClickable(session: Session, selector: Selector, timeout?: number): Promise<NodeId>;
  
  // Screenshot functions
  export function takeScreenshot(session: Session, fileName?: string): Promise<void>;
  export function takeElementScreenshot(session: Session, selector: Selector, fileName?: string): Promise<ScreenshotResult>;
  
  // Advanced operations
  export function dragDrop(session: Session, sourceSelector: Selector, targetSelector: Selector): Promise<void>;
  export function uploadFileBuffer(session: Session, selector: Selector, filename: string, content: string): Promise<void>;
  export function paste(session: Session, selector: Selector, text: string): Promise<void>;
  
  // ========================================
  // API FUNCTIONS
  // ========================================
  
  // Configuration
  export function setAuthToken(token: string | null): void;
  export function buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string>;
  export function buildUrlWithParams(url: string, params?: Record<string, any>): string;
  export function withBaseUrl(path: string): string;
  
  // HTTP methods
  export function sendGet<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function sendPost<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function sendPut<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function sendPatch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function sendDelete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function sendOptions<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function sendHead<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  
  // Specialized operations
  export function sendGraphQL<T = any>(url: string, query: string, variables?: GraphQLVariables, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function uploadFile<T = any>(url: string, filePath: string, fieldName?: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  export function getOAuth2Token(tokenUrl: string, clientId: string, clientSecret: string, scope?: string): Promise<string>;
  
  // Utility functions
  export function timedRequest<T>(fn: () => Promise<T>): Promise<T & { duration: number }>;
  export function retryRequest<T>(requestFn: () => Promise<T>, retries?: number, delay?: number): Promise<T>;
  
  // Assertions
  export function assertStatus(response: ApiResponse, expectedStatus: number): void;
  export function assertHeader(response: ApiResponse, headerName: string, expectedValue: string): void;
  export function assertBodyContains(response: ApiResponse, key: string, expectedValue: any): void;
  export function assertResponseTime(response: ApiResponse, maxMs: number): void;
  export function assertRateLimitHeaders(response: ApiResponse): void;
  export function validateSchema(responseBody: any, schema: JsonSchema): void;
  export function assertJsonPath(responseBody: any, path: string, expectedValue: any): void;
  
  // Logging and debugging
  export function logResponse(response: ApiResponse): void;
  
  // WebSocket support
  export function createWebSocketConnection(
    url: string, 
    onMessage: (data: string, ws: any) => void, 
    onOpen?: (ws: any) => void, 
    onError?: (error: Error, ws: any) => void
  ): any;
  
  // ========================================
  // ASSERTION FUNCTIONS
  // ========================================
  
  export function shouldContainText(session: Session, selector: Selector, expectedText: string): Promise<void>;
  export function shouldNotContainText(session: Session, selector: Selector, unexpectedText: string): Promise<void>;
  export function shouldBeVisible(session: Session, selector: Selector): Promise<void>;
  export function shouldBeHidden(session: Session, selector: Selector): Promise<void>;
  export function shouldHaveValue(session: Session, selector: Selector, expectedValue: string): Promise<void>;
  export function shouldHaveAttribute(session: Session, selector: Selector, attrName: string, expectedValue: string): Promise<void>;
  export function shouldBeEnabled(session: Session, selector: Selector): Promise<void>;
  export function shouldBeDisabled(session: Session, selector: Selector): Promise<void>;
  export function shouldExist(session: Session, selector: Selector): Promise<void>;
  export function shouldNotExist(session: Session, selector: Selector): Promise<void>;
  
  // ========================================
  // REPORTER TYPES AND FUNCTIONS
  // ========================================
  
  export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skipped';
    error?: string;
    screenshot?: string;
    timestamp: string;
    duration?: number;
  }
  
  export function addTestResult(result: TestResult): void;
  export function clearPreviousResults(testFilePath?: string): void;
  export function writeReport(): void;
  
  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  export function testWithReport(
    name: string, 
    fn: () => Promise<void>, 
    session: Session, 
    testFilePath?: string
  ): Promise<void>;
  
  // ========================================
  // VALIDATION UTILITIES
  // ========================================
  
  export function validateSession(session: any): void;
  export function validateSelector(selector: any): void;
  export function validateTimeout(timeout: any): void;
  export function validateText(text: any, paramName?: string): void;
  export function validateFilePath(filePath: any): void;
  export function sanitizeForExecution(value: any): any;
  
  // Error recovery
  export function withRetry<T>(fn: (...args: any[]) => Promise<T>, maxRetries?: number, delay?: number): (...args: any[]) => Promise<T>;
  
  // ========================================
  // TEST SETUP UTILITIES
  // ========================================

  export interface TestEnvironmentOptions {
    headed?: boolean;
    port?: number;
    testName?: string;
  }

  export interface TestEnvironment {
    chrome: any;
    ws: any;
    session: Session;
  }

  export function createTestEnvironment(options?: TestEnvironmentOptions): Promise<TestEnvironment>;
  export function cleanupTestEnvironment(environment: TestEnvironment, testName?: string): Promise<void>;
  export function withTestEnvironment(options?: TestEnvironmentOptions): (testFn: (env: TestEnvironment, ...args: any[]) => Promise<any>) => (...args: any[]) => Promise<any>;
  export function createFormTestEnvironment(testName?: string): Promise<TestEnvironment>;
  export function createComprehensiveTestEnvironment(testName?: string): Promise<TestEnvironment>;
  export function createHeadedTestEnvironment(testName?: string): Promise<TestEnvironment>;

  // ========================================
  // SESSION CONTEXT UTILITIES
  // ========================================

  export function setSession(session: Session): void;
  export function clearSession(): void;
  export function getSession(): Session | null;

  // ========================================
  // ASSERTION UTILITIES  
  // ========================================

  export function assertEqual(actual: any, expected: any, message?: string): void;
  export function assertContainsText(text: string, substring: string, message?: string): void;
  export function assertNotEqual(actual: any, expected: any, message?: string): void;
  export function assertTrue(value: any, message?: string): void;
  export function assertFalse(value: any, message?: string): void;

  // ========================================
  // PORT UTILITIES
  // ========================================
  
  export function findAvailablePort(startPort?: number, maxAttempts?: number): Promise<number>;
  export function isPortAvailable(port: number): Promise<boolean>;
  export function ensurePortAvailable(preferredPort: number, killExisting?: boolean): Promise<number>;
  export function killPortProcess(port: number): Promise<boolean>;
  export function releasePort(port: number): void;
  export function getTestPort(testType?: "examples" | "integration" | "e2e" | "ui" | "api" | "default"): Promise<number>;

  // ========================================
  // CONFIGURATION EXPORT
  // ========================================
  
  export const config: FrameworkConfig;
  export const apiConfig: ApiConfig;
}