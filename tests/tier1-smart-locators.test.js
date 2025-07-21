// 🎯 TIER 1 SMART LOCATORS TEST - Focused validation of all smart locator methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import { 
  navigateTo, setDefaultTimeout,
  getByRole, getByText, getByLabel,
  getByPlaceholder, getByTestId, getByTitle, getByAltText,
  fillInput, getValue, click, takeScreenshot
} from '../core/simple-dom-v2.js';
import { getFormPath, getScreenshotsDir, getTestTimeouts, getEnvironmentInfo } from '../utils/ci-config.js';

describe('🎯 TIER 1 Smart Locators Test', () => {
  let testEnv;
  const formUrl = getFormPath();
  const timeouts = getTestTimeouts();
  
  // Log environment info for debugging
  console.log('🌍 Environment:', getEnvironmentInfo());

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Smart Locators Test');
    setDefaultTimeout(timeouts.medium);
  }, timeouts.long);

  afterAll(async () => {
    // Skip cleanup if DEBUG environment variable is set
    if (testEnv && !process.env.DEBUG) {
      await cleanupTestEnvironment(testEnv, 'Smart Locators Test');
    } else if (process.env.DEBUG) {
      console.log('🐛 DEBUG mode: Keeping Chrome open for inspection');
      console.log('🌐 Chrome debugging available at: http://localhost:9222');
      console.log('💡 Kill Chrome manually with: pkill -f "chrome.*--remote-debugging-port=9222"');
    }
  });

  it('should find elements using getByRole', async () => {
    // Enable DOM for this specific test
    const { enableDOM } = await import('../core/simple-dom-v2.js');
    await enableDOM();
    
    await navigateTo(formUrl);
    
    const submitButton = await getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDefined();
    
    await takeScreenshot(`${getScreenshotsDir()}/getByRole-test.png`);
    console.log('✅ getByRole working correctly');
  });

  it('should find elements using getByText', async () => {
    const heading = await getByText('Comprehensive UI Testing Playground');
    expect(heading).toBeDefined();
    
    const smartLocatorText = await getByText('Smart Locator Elements');
    expect(smartLocatorText).toBeDefined();
    
    console.log('✅ getByText working correctly');
  });

  it('should find elements using getByLabel', async () => {
    const nameInput = await getByLabel('Full Name:');
    expect(nameInput).toBeDefined();
    
    await fillInput(nameInput, 'Test User');
    const value = await getValue(nameInput);
    expect(value).toBe('Test User');
    
    console.log('✅ getByLabel working correctly');
  });

  it('should find elements using getByPlaceholder', async () => {
    const emailInput = await getByPlaceholder('Enter your email');
    expect(emailInput).toBeDefined();
    
    await fillInput(emailInput, 'test@example.com');
    const value = await getValue(emailInput);
    expect(value).toBe('test@example.com');
    
    const searchInput = await getByPlaceholder('Search for products');
    expect(searchInput).toBeDefined();
    
    console.log('✅ getByPlaceholder working correctly');
  });

  it('should find elements using getByTestId', async () => {
    const testInput = await getByTestId('test-input');
    expect(testInput).toBeDefined();
    
    await fillInput(testInput, 'Test ID works!');
    const value = await getValue(testInput);
    expect(value).toBe('Test ID works!');
    
    const testButton = await getByTestId('test-button');
    expect(testButton).toBeDefined();
    
    const testSelect = await getByTestId('test-select');
    expect(testSelect).toBeDefined();
    
    console.log('✅ getByTestId working correctly');
  });

  it('should find elements using getByTitle', async () => {
    const submitButton = await getByTitle('Click me');
    expect(submitButton).toBeDefined();
    
    const emailInput = await getByTitle('Enter your email address');
    expect(emailInput).toBeDefined();
    
    const testInput = await getByTitle('Test input with data-testid');
    expect(testInput).toBeDefined();
    
    console.log('✅ getByTitle working correctly');
  });

  it('should find images using getByAltText', async () => {
    const profileImage = await getByAltText('Profile picture');
    expect(profileImage).toBeDefined();
    
    const companyLogo = await getByAltText('Company logo');
    expect(companyLogo).toBeDefined();
    
    const productImage = await getByAltText('Product image');
    expect(productImage).toBeDefined();
    
    const bannerImage = await getByAltText('Banner image');
    expect(bannerImage).toBeDefined();
    
    console.log('✅ getByAltText working correctly');
  });

  it('should combine multiple smart locators in a workflow', async () => {
    // Test combining different locator strategies
    const nameByLabel = await getByLabel('Full Name:');
    const emailByPlaceholder = await getByPlaceholder('Enter your email');
    const testByTestId = await getByTestId('test-input');
    const buttonByRole = await getByRole('button', { name: 'Submit' });
    
    // Fill using different locators
    await fillInput(nameByLabel, 'John Doe');
    await fillInput(emailByPlaceholder, 'john@example.com');
    await fillInput(testByTestId, 'Combined test');
    
    // Verify values
    expect(await getValue(nameByLabel)).toBe('John Doe');
    expect(await getValue(emailByPlaceholder)).toBe('john@example.com');
    expect(await getValue(testByTestId)).toBe('Combined test');
    
    await takeScreenshot(`${getScreenshotsDir()}/smart-locators-combined.png`);
    console.log('✅ Combined smart locators workflow working correctly');
  });
});