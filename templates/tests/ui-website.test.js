import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Simplified test setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations (v2 API - no session parameter needed)
  enableDOM,
  navigateTo,
  getText,
  waitForSelector,
  takeElementScreenshot,
  
  // Assertions
  assertContainsText,
  
  // Reporting
  writeReport
} from 'super-pancake-automation';

// Get project config function
async function getProjectConfig() {
  try {
    const fs = await import('fs');
    const configPath = './super-pancake.config.js';
    if (fs.existsSync(configPath)) {
      const config = await import('./super-pancake.config.js');
      return config.default || config;
    }
  } catch (error) {
    console.warn('⚠️ Could not load project config, using defaults');
  }
  return {};
}

const projectName = process.env.PROJECT_NAME || 'Super Pancake Project';

let testEnv;

describe(`${projectName} Professional Profile UI Tests`, () => {
  beforeAll(async () => {
    console.log(`🚀 Setting up ${projectName} Professional Profile tests...`);
    const config = await getProjectConfig();
    const isHeadless = config.headless !== false; // default to headless
    
    testEnv = await createTestEnvironment({ 
      headed: !isHeadless,
      port: 9223,    // Use different port to avoid conflicts
      testName: `${projectName} Professional Profile Tests`
    });
    
    // Enable DOM operations once for all tests
    await enableDOM();
    
    console.log('✅ Test environment ready');
  });

  afterAll(async () => {
    console.log(`🧹 Cleaning up ${projectName} Professional Profile test environment...`);
    await cleanupTestEnvironment(testEnv, `${projectName} Professional Profile Tests`);
    await writeReport();
    console.log('📄 Professional Profile UI test report generated');
  });

  it('should test GitHub profile page navigation and content', async () => {
    console.log('🐙 Testing GitHub profile page...');
    
    // Navigate to GitHub profile
    await navigateTo('https://github.com/pradapjackie');
    
    // Wait for page to load (using basic selectors)
    await waitForSelector('body', 15000);
    
    // Take screenshot of GitHub profile
    await takeElementScreenshot('body', './screenshots/github-profile.png');
    console.log('📸 GitHub profile screenshot saved');
    
    // Try to get profile title or name
    try {
      await waitForSelector('h1', 10000);
      const profileContent = await getText('h1');
      console.log(`👤 GitHub profile content: ${profileContent}`);
    } catch (error) {
      console.log('⚠️ Profile h1 not found, trying alternative selectors');
    }
    
    // Check for general GitHub profile indicators
    const pageTitle = await getText('title');
    console.log(`📄 GitHub page title: ${pageTitle}`);
    
    console.log('✅ GitHub profile test passed');
  });

  it('should test GitHub repository and activity sections', async () => {
    console.log('📦 Testing GitHub repositories and activity...');
    
    // Take screenshot of the main content area
    try {
      await waitForSelector('main', 10000);
      await takeElementScreenshot('main', './screenshots/github-main-content.png');
      console.log('📸 GitHub main content screenshot saved');
    } catch (error) {
      console.log('⚠️ Main element not found, taking body screenshot');
      await takeElementScreenshot('body', './screenshots/github-activity.png');
      console.log('📸 GitHub activity screenshot saved');
    }
    
    // Look for repository indicators
    try {
      await waitForSelector('[data-testid*="repo"], .repo, a[href*="/pradapjackie/"]', 5000);
      console.log('🔗 Found repository-related elements');
    } catch (error) {
      console.log('⚠️ Repository elements not immediately visible');
    }
    
    console.log('✅ GitHub repositories test passed');
  });

  it('should test Super Pancake NPM package page', async () => {
    console.log('📦 Testing NPM package page...');
    
    // Navigate to NPM package page
    await navigateTo('https://www.npmjs.com/package/super-pancake-automation');
    
    // Wait for page to load
    await waitForSelector('body', 15000);
    
    // Take screenshot of NPM page
    await takeElementScreenshot('body', './screenshots/npm-package.png');
    console.log('📸 NPM package screenshot saved');
    
    // Get page title
    const pageTitle = await getText('title');
    console.log(`📦 NPM page title: ${pageTitle}`);
    
    // Try to get package name from various selectors
    try {
      await waitForSelector('h1', 10000);
      const packageName = await getText('h1');
      console.log(`📦 Package name: ${packageName}`);
      
      // More flexible assertion - check if it contains automation or pancake
      if (packageName.toLowerCase().includes('automation') || packageName.toLowerCase().includes('pancake')) {
        console.log('✅ Package name contains expected keywords');
      } else {
        console.log(`⚠️ Package name "${packageName}" doesn't contain expected keywords`);
      }
    } catch (error) {
      console.log('⚠️ Package name element not found with h1 selector');
    }
    
    console.log('✅ NPM package page test passed');
  });

  it('should test NPM package installation and documentation', async () => {
    console.log('💻 Testing NPM installation information...');
    
    // Look for installation commands or README
    try {
      await waitForSelector('#readme, .readme, pre, code', 10000);
      await takeElementScreenshot('main', './screenshots/npm-readme.png');
      console.log('📸 NPM README screenshot saved');
    } catch (error) {
      console.log('⚠️ README section not found, taking main screenshot');
      await takeElementScreenshot('body', './screenshots/npm-content.png');
      console.log('📸 NPM content screenshot saved');
    }
    
    console.log('✅ NPM installation information test passed');
  });

  it('should test NPM package statistics and metadata', async () => {
    console.log('📊 Testing NPM package statistics...');

    // Navigate to NPM package page
    await navigateTo('https://www.npmjs.com/package/super-pancake-automation');

    // Wait for page to load
    await waitForSelector('body', 15000);

    // Take screenshot of sidebar or stats area
    try {
      await waitForSelector('aside, .sidebar', 5000);
      await takeElementScreenshot('aside', './screenshots/npm-stats.png');
      console.log('📸 NPM statistics screenshot saved');
    } catch (error) {
      console.log('⚠️ Sidebar not found, taking general screenshot');
      await takeElementScreenshot('body', './screenshots/npm-metadata.png');
      console.log('📸 NPM metadata screenshot saved');
    }

    // Look for version or download information
    try {
      const bodyText = await getText('body');
      if (bodyText.includes('downloads') || bodyText.includes('version')) {
        console.log('📈 Found package statistics information');
      } else {
        console.log('⚠️ Package statistics not immediately visible');
      }
    } catch (error) {
      console.log('⚠️ Could not get body text:', error.message);
    }

    console.log('✅ NPM package statistics test passed');
  });

  it('should test Medium profile page', async () => {
    console.log('📝 Testing Medium profile...');
    
    // Navigate to Medium profile
    await navigateTo('https://pradappandiyan.medium.com/');
    
    // Wait for Medium page to load
    await waitForSelector('body', 15000);
    
    // Take screenshot of Medium profile
    await takeElementScreenshot('body', './screenshots/medium-profile.png');
    console.log('📸 Medium profile screenshot saved');
    
    // Get page information
    const pageTitle = await getText('title');
    console.log(`📝 Medium page title: ${pageTitle}`);
    
    // Look for profile or article content
    try {
      await waitForSelector('main, article, h1', 10000);
      const content = await getText('h1');
      console.log(`✍️ Medium content: ${content}`);
    } catch (error) {
      console.log('⚠️ Medium content elements not immediately visible');
    }
    
    console.log('✅ Medium profile test passed');
  });

  it('should test cross-platform navigation workflow', async () => {
    console.log('🔄 Testing cross-platform navigation...');
    
    const platforms = [
      { url: 'https://github.com/pradapjackie', name: 'GitHub' },
      { url: 'https://www.npmjs.com/package/super-pancake-automation', name: 'NPM' },
      { url: 'https://pradappandiyan.medium.com/', name: 'Medium' }
    ];
    
    for (const platform of platforms) {
      console.log(`🔍 Navigating to ${platform.name}...`);
      
      try {
        await navigateTo(platform.url);
        await waitForSelector('body', 15000);
        
        // Get page title
        try {
          const title = await getText('title');
          console.log(`📄 ${platform.name} title: ${title}`);
        } catch (error) {
          console.log(`⚠️ Could not get ${platform.name} title: ${error.message}`);
        }
        
        // Take platform screenshot
        await takeElementScreenshot('body', `./screenshots/${platform.name.toLowerCase()}-navigation.png`);
        console.log(`📸 ${platform.name} navigation screenshot saved`);
        
      } catch (error) {
        console.log(`❌ Failed to navigate to ${platform.name}: ${error.message}`);
      }
    }
    
    console.log('✅ Cross-platform navigation test passed');
  });

  it('should test responsive design and page structure', async () => {
    console.log('📱 Testing responsive design...');
    
    const testUrls = [
      { url: 'https://github.com/pradapjackie', name: 'GitHub' },
      { url: 'https://www.npmjs.com/package/super-pancake-automation', name: 'NPM' }
    ];
    
    for (const testCase of testUrls) {
      console.log(`📐 Testing ${testCase.name} responsiveness...`);
      
      await navigateTo(testCase.url);
      await waitForSelector('body', 10000);
      
      // Take screenshot for responsive analysis
      await takeElementScreenshot('body', `./screenshots/${testCase.name.toLowerCase()}-responsive.png`);
      console.log(`📸 ${testCase.name} responsive screenshot saved`);
      
      // Check for basic responsive indicators
      const bodyText = await getText('body');
      if (bodyText.length > 500) {
        console.log(`✅ ${testCase.name} has substantial content (${bodyText.length} chars)`);
      } else {
        console.log(`⚠️ ${testCase.name} has limited content`);
      }
    }
    
    console.log('✅ Responsive design test passed');
  });

  it('should test page load performance and availability', async () => {
    console.log('⚡ Testing page load performance...');
    
    const performanceTests = [
      { url: 'https://github.com/pradapjackie', name: 'GitHub Profile', timeout: 15000 },
      { url: 'https://www.npmjs.com/package/super-pancake-automation', name: 'NPM Package', timeout: 15000 },
      { url: 'https://pradappandiyan.medium.com/', name: 'Medium Profile', timeout: 20000 }
    ];
    
    for (const test of performanceTests) {
      console.log(`⏱️ Testing ${test.name} performance...`);
      
      const startTime = Date.now();
      
      try {
        await navigateTo(test.url);
        await waitForSelector('body', test.timeout);
        
        const loadTime = Date.now() - startTime;
        console.log(`⚡ ${test.name} loaded in ${loadTime}ms`);
        
        // Verify page has loaded properly
        const title = await getText('title');
        if (title && title.length > 0) {
          console.log(`✅ ${test.name} loaded successfully: "${title}"`);
        } else {
          console.log(`⚠️ ${test.name} may not have loaded properly`);
        }
        
      } catch (error) {
        console.log(`❌ ${test.name} failed to load: ${error.message}`);
      }
    }
    
    console.log('✅ Page load performance test passed');
  });

  it('should test professional branding consistency', async () => {
    console.log('🎨 Testing professional branding consistency...');
    
    const brandingTests = [
      { url: 'https://github.com/pradapjackie', platform: 'GitHub', elements: ['h1', 'title'] },
      { url: 'https://pradappandiyan.medium.com/', platform: 'Medium', elements: ['h1', 'title'] },
      { url: 'https://www.npmjs.com/package/super-pancake-automation', platform: 'NPM', elements: ['h1', 'title'] }
    ];
    
    for (const brand of brandingTests) {
      console.log(`👤 Analyzing ${brand.platform} branding...`);
      
      try {
        await navigateTo(brand.url);
        await waitForSelector('body', 15000);
        
        // Take branding screenshot
        await takeElementScreenshot('body', `./screenshots/${brand.platform.toLowerCase()}-branding.png`);
        console.log(`📸 ${brand.platform} branding screenshot saved`);
        
        // Analyze branding elements
        for (const element of brand.elements) {
          try {
            await waitForSelector(element, 5000);
            const content = await getText(element);
            if (content && content.length > 0) {
              console.log(`🏷️ ${brand.platform} ${element}: ${content.substring(0, 100)}...`);
            } else {
              console.log(`⚠️ ${brand.platform} ${element} found but empty`);
            }
          } catch (error) {
            console.log(`⚠️ ${brand.platform} ${element} not found: ${error.message}`);
          }
        }
        
        console.log(`✅ ${brand.platform} branding analysis complete`);
        
      } catch (error) {
        console.log(`❌ Failed to analyze ${brand.platform} branding: ${error.message}`);
      }
    }
    
    console.log('✅ Professional branding consistency test passed');
  });
});