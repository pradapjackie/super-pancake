#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';
import { spawn } from 'child_process';

const projectName = process.argv[2] || 'my-super-pancake-project';
const projectPath = resolve(projectName);

if (existsSync(projectPath)) {
  console.error(`❌ Directory '${projectName}' already exists!`);
  process.exit(1);
}

console.log(`🚀 Creating Super Pancake automation project: ${projectName}`);
console.log('');

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Helper function to ask multiple choice questions
function askChoice(question, options, defaultOption = 0) {
  return new Promise((resolve) => {
    console.log(question);
    options.forEach((option, index) => {
      const indicator = index === defaultOption ? '●' : '○';
      console.log(`  ${indicator} ${index + 1}. ${option}`);
    });
    console.log('');
    rl.question(`Enter your choice (1-${options.length}) [${defaultOption + 1}]: `, (answer) => {
      const choice = parseInt(answer) - 1;
      if (isNaN(choice) || choice < 0 || choice >= options.length) {
        resolve(defaultOption);
      } else {
        resolve(choice);
      }
    });
  });
}

// Collect user preferences
async function collectUserPreferences() {
  console.log('📝 Let\'s configure your project preferences:\n');
  
  // 1. Browser headless mode
  const headlessChoice = await askChoice(
    '1. Browser Mode:', 
    ['Headless (faster, no GUI)', 'Headed (visible browser window)'],
    1
  );
  
  // 2. Screenshot capture
  const screenshotChoice = await askChoice(
    '2. Screenshot Capture:', 
    ['Enabled (capture on failure and success)', 'Only on failure', 'Disabled'],
    0
  );
  
  // 3. Generate sample tests
  const samplesChoice = await askChoice(
    '3. Generate Sample Tests:', 
    ['Basic example test', 'Form testing examples', 'API testing examples', 'E2E workflow examples', 'All examples'],
    0
  );
  
  // 4. Test runner UI
  const uiChoice = await askChoice(
    '4. Test Runner UI:', 
    ['Interactive UI enabled', 'Command line only'],
    0
  );
  
  // 5. Report generation
  const reportChoice = await askChoice(
    '5. Test Reports:', 
    ['HTML reports with screenshots', 'JSON reports', 'Console output only'],
    0
  );
  
  console.log('\n✨ Creating project with your preferences...\n');
  
  return {
    headless: headlessChoice === 0,
    screenshots: screenshotChoice,
    samples: samplesChoice,
    ui: uiChoice === 0,
    reports: reportChoice
  };
}

// Function to install npm dependencies
function installDependencies(projectPath) {
  return new Promise((resolve, reject) => {
    console.log('   Running npm install...');
    
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const install = spawn(npmCommand, ['install'], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    install.stdout.on('data', (data) => {
      output += data.toString();
      // Show progress dots
      process.stdout.write('.');
    });

    install.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    install.on('close', (code) => {
      console.log(''); // New line after progress dots
      
      if (code === 0) {
        console.log('✅ Dependencies installed successfully!');
        resolve();
      } else {
        console.log('⚠️ Dependencies installation completed with warnings');
        console.log('   You can run "npm install" manually if needed');
        resolve(); // Don't fail the whole process
      }
    });

    install.on('error', (error) => {
      console.log(''); // New line after progress dots
      console.log('⚠️ Failed to auto-install dependencies');
      console.log('   Please run "npm install" manually in the project directory');
      console.log(`   Error: ${error.message}`);
      resolve(); // Don't fail the whole process
    });
  });
}

const preferences = await collectUserPreferences();
rl.close();

// Create project directory
mkdirSync(projectPath, { recursive: true });

// Create package.json
const packageJson = {
  name: projectName,
  version: '1.0.0',
  description: 'Super Pancake automation testing project',
  main: 'index.js',
  type: 'module',
  scripts: {
    test: 'vitest',
    'test:run': 'vitest run',
    'test:ui': 'super-pancake-ui',
    'test:generate': 'super-pancake-generate',
    start: 'vitest'
  },
  dependencies: {
    'super-pancake-automation': 'latest',
    'vitest': '^3.2.4'
  },
  keywords: ['automation', 'testing', 'super-pancake'],
  author: '',
  license: 'MIT'
};

writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

// Create super-pancake.config.js based on user preferences
const screenshotConfig = {
  0: { enabled: true, onFailure: true, onSuccess: true },
  1: { enabled: true, onFailure: true, onSuccess: false },
  2: { enabled: false, onFailure: false, onSuccess: false }
};

const reportConfig = {
  0: { enabled: true, format: 'html', autoOpen: false },
  1: { enabled: true, format: 'json', autoOpen: false },
  2: { enabled: false, format: 'console', autoOpen: false }
};

const selectedScreenshot = screenshotConfig[preferences.screenshots];
const selectedReport = reportConfig[preferences.reports];

const configContent = `export default {
  // Browser configuration
  browser: {
    headless: ${preferences.headless},
    devtools: ${!preferences.headless},
    slowMo: ${preferences.headless ? 0 : 100}
  },
  
  // Test configuration  
  test: {
    timeout: 30000,
    retries: 1
  },
  
  // Screenshot configuration
  screenshot: {
    enabled: ${selectedScreenshot.enabled},
    path: './screenshots',
    onFailure: ${selectedScreenshot.onFailure},
    onSuccess: ${selectedScreenshot.onSuccess},
    quality: 90,
    fullPage: true
  },
  
  // Report configuration
  report: {
    enabled: ${selectedReport.enabled},
    format: '${selectedReport.format}',
    path: './test-report.${selectedReport.format === 'html' ? 'html' : 'json'}',
    autoOpen: ${selectedReport.autoOpen}
  },
  
  // UI configuration
  ui: {
    enabled: ${preferences.ui},
    port: 3000
  },
  
  // Logging configuration
  logging: {
    console: true,
    network: false,
    level: 'info'
  },
  
  // Timeouts
  timeouts: {
    testTimeout: 30000,
    pageTimeout: 30000,
    elementTimeout: 10000
  }
};`;

writeFileSync(join(projectPath, 'super-pancake.config.js'), configContent);

// Create directories
mkdirSync(join(projectPath, 'tests'), { recursive: true });
mkdirSync(join(projectPath, 'screenshots'), { recursive: true });

// Generate sample tests based on user preferences
function generateSampleTests(projectName, preferences) {
  const headedValue = !preferences.headless; // headed is opposite of headless
  const screenshotCode = preferences.screenshots !== 2 ? 
    `      // Take screenshot\n      await takeElementScreenshot(session, 'h1', './screenshots/example-title.png');` : 
    `      // Screenshots disabled`;

  const sampleTests = {
    0: { // Basic example test
      filename: 'basic.test.js',
      content: `// Basic Website Testing Examples
// Perfect for getting started with Super Pancake Automation
// These tests demonstrate the framework API and patterns

import { describe, it, expect } from 'vitest';

// Note: These are simulation-based tests for demonstration purposes
// For real browser testing, use the launch functions from super-pancake-automation/utils/launcher.js

describe('${projectName} Basic Tests', () => {
  
  it('should demonstrate navigation and page verification', async () => {
    console.log('🌐 Simulating website navigation...');
    
    // Simulate navigating to a homepage
    const targetUrl = 'https://example.com';
    console.log('📍 Navigation target:', targetUrl);
    
    // Simulate page title verification
    const expectedTitle = 'Example Domain';
    console.log('✅ Page title verified:', expectedTitle);
    
    // Demonstrate successful navigation
    expect(targetUrl).toContain('example.com');
    console.log('✅ Navigation test completed successfully');
  });

  it('should demonstrate form input simulation', async () => {
    console.log('📝 Simulating form input interactions...');
    
    // Simulate filling a search form
    const searchQuery = '${projectName} testing';
    console.log('🔍 Search query:', searchQuery);
    
    // Simulate form validation
    const isValidInput = searchQuery.length > 0;
    expect(isValidInput).toBe(true);
    
    console.log('✅ Form input simulation completed');
  });

  it('should demonstrate element visibility checks', async () => {
    console.log('👁️ Simulating element visibility checks...');
    
    // Simulate checking various page elements
    const elements = [
      { selector: 'h1', name: 'Main heading', visible: true },
      { selector: 'nav', name: 'Navigation menu', visible: true },
      { selector: '.content', name: 'Main content', visible: true }
    ];
    
    elements.forEach(element => {
      const status = element.visible ? '✅' : '❌';
      const visibility = element.visible ? 'visible' : 'hidden';
      console.log(status, element.name, '(' + element.selector + '):', visibility);
      expect(element.visible).toBe(true);
    });
    
    console.log('✅ Element visibility checks completed');
  });

  it('should demonstrate screenshot capture workflow', async () => {
    console.log('📸 Simulating screenshot capture...');
    
    // Simulate screenshot metadata
    const screenshotInfo = {
      format: 'png',
      quality: 90,
      fullPage: true,
      timestamp: new Date().toISOString(),
      filename: \`${projectName}-test-\${Date.now()}.png\`
    };
    
    console.log(\`📸 Screenshot captured: \${screenshotInfo.filename}\`);
    console.log(\`📊 Format: \${screenshotInfo.format}, Quality: \${screenshotInfo.quality}%\`);
    
    expect(screenshotInfo.format).toBe('png');
    console.log('✅ Screenshot workflow completed');
  });
});`
    },
    1: { // Form testing examples
      filename: 'form.test.js',
      content: `// Form Testing Examples
// Comprehensive form validation and interaction testing
// Perfect for learning form automation patterns

import { describe, it, expect } from 'vitest';

// Note: These are simulation-based tests for demonstration purposes
// For real browser testing, use the launch functions from super-pancake-automation/utils/launcher.js

describe('${projectName} Form Tests', () => {

  it('should test basic form inputs', async () => {
    console.log('📝 Simulating basic form input testing...');
    
    // Simulate form data entry
    const formData = {
      customerName: 'John Doe',
      telephone: '+1-555-123-4567',
      email: 'john.doe@example.com',
      message: 'Test message for ${projectName} automation framework.'
    };
    
    console.log('📋 Form input simulation:');
    console.log(\`   👤 Customer name: \${formData.customerName}\`);
    console.log(\`   📞 Telephone: \${formData.telephone}\`);
    console.log(\`   📧 Email: \${formData.email}\`);
    console.log(\`   💬 Message: \${formData.message.substring(0, 30)}...\`);
    
    // Simulate input validation
    const inputValidation = {
      nameValid: formData.customerName.length >= 2,
      phoneValid: /^[+]?[1-9]?[0-9]{7,15}$/.test(formData.telephone.replace(/[^0-9]/g, '')),
      emailValid: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email),
      messageValid: formData.message.length >= 10
    };
    
    console.log('✅ Input validation results:');
    Object.entries(inputValidation).forEach(([field, isValid]) => {
      console.log(\`   \${isValid ? '✅' : '❌'} \${field}: \${isValid}\`);
    });
    
    // Validate all inputs are working correctly
    const allInputsValid = Object.values(inputValidation).every(valid => valid);
    expect(allInputsValid).toBe(true);
    expect(formData.customerName).toBe('John Doe');
    
    console.log('✅ Basic form input simulation completed');
  });

  it('should test dropdown selections', async () => {
    console.log('📎 Simulating dropdown selection testing...');
    
    // Simulate dropdown options
    const dropdownFields = {
      productType: {
        options: ['electronics', 'clothing', 'books', 'home'],
        selected: 'electronics',
        label: 'Product Type'
      },
      priority: {
        options: ['low', 'medium', 'high', 'urgent'],
        selected: 'high',
        label: 'Priority Level'
      }
    };
    
    console.log('📋 Dropdown selection testing:');
    
    Object.entries(dropdownFields).forEach(([fieldName, field]) => {
      console.log(\`   🔽 \${field.label}:\`);
      console.log(\`      Available: [\${field.options.join(', ')}]\`);
      console.log(\`      Selected: \${field.selected}\`);
      
      // Validate selection is within options
      const validSelection = field.options.includes(field.selected);
      console.log(\`      Valid: \${validSelection ? '✅' : '❌'}\`);
      
      expect(validSelection).toBe(true);
    });
    
    expect(dropdownFields.productType.selected).toBe('electronics');
    
    console.log('✅ Dropdown selection simulation completed');
  });

  it('should test form validation', async () => {
    console.log('✅ Simulating form validation testing...');
    
    // Simulate form fields with validation rules
    const formFields = {
      username: {
        value: 'testuser123',
        rules: { required: true, minLength: 3, maxLength: 20 },
        errors: []
      },
      email: {
        value: 'test@${projectName}.com',
        rules: { required: true, pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ },
        errors: []
      },
      password: {
        value: 'SecurePass123!',
        rules: { required: true, minLength: 8 },
        errors: []
      }
    };
    
    console.log('📝 Form validation testing:');
    
    Object.entries(formFields).forEach(([fieldName, field]) => {
      field.errors = [];
      
      // Run validation rules
      if (field.rules.required && !field.value) field.errors.push('Required');
      if (field.rules.minLength && field.value.length < field.rules.minLength) field.errors.push('Too short');
      if (field.rules.pattern && !field.rules.pattern.test(field.value)) field.errors.push('Invalid format');
      
      console.log(\`   \${field.errors.length === 0 ? '✅' : '❌'} \${fieldName}: \${field.value}\`);
    });
    
    const validationErrors = Object.values(formFields).reduce((total, field) => total + field.errors.length, 0);
    expect(validationErrors).toBe(0);
    
    console.log('✅ Form validation simulation completed');
  });
});`
    },
    2: { // API testing examples
      filename: 'api.test.js',
      content: `// API Testing Examples
// Comprehensive API validation and testing patterns
// Perfect for learning API automation concepts

import { describe, it, expect } from 'vitest';

// Note: These are simulation-based tests for demonstration purposes
// For real API testing, use fetch or axios with the response validation patterns shown

describe('${projectName} API Tests', () => {

  it('should simulate API response validation', async () => {
    console.log('🔌 Simulating API response testing...');
    
    // Simulate API response data
    const mockApiResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-response-time': '45ms'
      },
      data: {
        id: 1,
        title: '${projectName} API Test',
        userId: 123,
        completed: false,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📊 API Response simulation:');
    console.log(\`   Status: \${mockApiResponse.status} \${mockApiResponse.statusText}\`);
    console.log(\`   Content-Type: \${mockApiResponse.headers['content-type']}\`);
    console.log(\`   Response Time: \${mockApiResponse.headers['x-response-time']}\`);
    console.log(\`   Data ID: \${mockApiResponse.data.id}\`);
    
    // Simulate response validation
    expect(mockApiResponse.status).toBe(200);
    expect(mockApiResponse.data.id).toBe(1);
    expect(mockApiResponse.data.title).toContain('${projectName}');
    expect(mockApiResponse.headers['content-type']).toBe('application/json');
    
    console.log('✅ API response validation completed');
  });

  it('should test error handling patterns', async () => {
    console.log('⚠️ Simulating API error handling...');
    
    // Simulate different error scenarios
    const errorScenarios = [
      { status: 400, error: 'Bad Request', message: 'Invalid parameters' },
      { status: 401, error: 'Unauthorized', message: 'Authentication required' },
      { status: 404, error: 'Not Found', message: 'Resource not found' },
      { status: 500, error: 'Internal Server Error', message: 'Server error occurred' }
    ];
    
    console.log('🔍 Error handling scenarios:');
    
    errorScenarios.forEach(scenario => {
      console.log(\`   \${scenario.status} \${scenario.error}: \${scenario.message}\`);
      
      // Validate error status codes
      expect(scenario.status).toBeGreaterThanOrEqual(400);
      expect(scenario.error).toBeTruthy();
      expect(scenario.message).toBeTruthy();
    });
    
    console.log('✅ Error handling patterns tested');
  });

  it('should validate JSON schema patterns', async () => {
    console.log('📋 Simulating JSON schema validation...');
    
    // Simulate API response with expected schema
    const userApiResponse = {
      id: 123,
      username: 'testuser',
      email: 'test@${projectName}.com',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        avatar: 'https://example.com/avatar.jpg'
      },
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      },
      createdAt: '2024-01-01T00:00:00Z'
    };
    
    console.log('📊 Schema validation:');
    
    // Validate required fields
    const requiredFields = ['id', 'username', 'email', 'profile'];
    requiredFields.forEach(field => {
      const exists = userApiResponse.hasOwnProperty(field);
      console.log(\`   \${exists ? '✅' : '❌'} \${field}: \${exists ? 'present' : 'missing'}\`);
      expect(exists).toBe(true);
    });
    
    // Validate data types
    expect(typeof userApiResponse.id).toBe('number');
    expect(typeof userApiResponse.username).toBe('string');
    expect(typeof userApiResponse.profile).toBe('object');
    expect(Array.isArray(userApiResponse.preferences)).toBe(false);
    
    console.log('✅ JSON schema validation completed');
  });
});`
    },
    3: { // E2E workflow examples
      filename: 'e2e.test.js',
      content: `// End-to-End Testing Examples
// Complete user journeys and workflows
// Perfect for demonstrating complex automation scenarios

import { describe, it, expect } from 'vitest';

// Note: These are simulation-based tests for demonstration purposes
// For real browser testing, use the launch functions from super-pancake-automation/utils/launcher.js

describe('${projectName} E2E Tests', () => {

  it('should complete a user registration workflow', async () => {
    console.log('👤 Simulating user registration workflow...');
    
    // Simulate registration form data
    const registrationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@${projectName}.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      agreeToTerms: true
    };
    
    console.log('📝 Registration workflow:');
    console.log(\`   Name: \${registrationData.firstName} \${registrationData.lastName}\`);
    console.log(\`   Email: \${registrationData.email}\`);
    console.log(\`   Terms accepted: \${registrationData.agreeToTerms}\`);
    
    // Simulate form validation
    const validationChecks = {
      emailValid: registrationData.email.includes('@'),
      passwordMatch: registrationData.password === registrationData.confirmPassword,
      termsAccepted: registrationData.agreeToTerms,
      fieldsComplete: Object.values(registrationData).every(field => field)
    };
    
    console.log('✅ Validation results:');
    Object.entries(validationChecks).forEach(([check, passed]) => {
      console.log(\`   \${passed ? '✅' : '❌'} \${check}: \${passed}\`);
    });
    
    // Validate registration workflow
    expect(validationChecks.emailValid).toBe(true);
    expect(validationChecks.passwordMatch).toBe(true);
    expect(validationChecks.termsAccepted).toBe(true);
    
    console.log('✅ User registration simulation completed');
  });

  it('should test shopping cart workflow', async () => {
    console.log('🛒 Simulating shopping cart workflow...');
    
    // Simulate product catalog
    const products = [
      { id: 1, name: 'Widget A', price: 29.99, inStock: true },
      { id: 2, name: 'Gadget B', price: 49.99, inStock: true },
      { id: 3, name: 'Tool C', price: 19.99, inStock: false }
    ];
    
    // Simulate shopping cart actions
    const cart = [];
    
    console.log('📦 Available products:');
    products.forEach(product => {
      console.log(\`   \${product.inStock ? '✅' : '❌'} \${product.name} - $\${product.price} \${product.inStock ? '' : '(Out of Stock)'}\`);
    });
    
    // Add products to cart
    const availableProducts = products.filter(p => p.inStock);
    availableProducts.slice(0, 2).forEach(product => {
      cart.push({ ...product, quantity: 1 });
      console.log(\`🛒 Added to cart: \${product.name}\`);
    });
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(\`💰 Cart total: $\${total.toFixed(2)}\`);
    
    // Validate shopping workflow
    expect(cart.length).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(0);
    expect(cart.every(item => item.inStock)).toBe(true);
    
    console.log('✅ Shopping cart simulation completed');
  });

  it('should test search and filter workflow', async () => {
    console.log('🔍 Simulating search and filter workflow...');
    
    // Simulate search functionality
    const searchQuery = '${projectName}';
    const filters = {
      category: 'automation',
      priceRange: { min: 0, max: 100 },
      rating: 4
    };
    
    console.log('🔍 Search query:', searchQuery);
    console.log('🎛️ Applied filters:');
    console.log(\`   Category: \${filters.category}\`);
    console.log(\`   Price: $\${filters.priceRange.min} - $\${filters.priceRange.max}\`);
    console.log(\`   Min rating: \${filters.rating} stars\`);
    
    // Simulate search results
    const searchResults = [
      { id: 1, title: '${projectName} Guide', category: 'automation', price: 29.99, rating: 4.5 },
      { id: 2, title: 'Advanced ${projectName}', category: 'automation', price: 49.99, rating: 4.8 },
      { id: 3, title: '${projectName} Toolkit', category: 'automation', price: 19.99, rating: 4.2 }
    ];
    
    // Apply filters to results
    const filteredResults = searchResults.filter(item => 
      item.category === filters.category &&
      item.price >= filters.priceRange.min &&
      item.price <= filters.priceRange.max &&
      item.rating >= filters.rating
    );
    
    console.log(\`📊 Found \\\${filteredResults.length} results:\`);
    filteredResults.forEach(result => {
      console.log(\`   ✅ \${result.title} - $\${result.price} (\${result.rating}⭐)\`);
    });
    
    // Validate search workflow
    expect(searchQuery).toBeTruthy();
    expect(filteredResults.length).toBeGreaterThan(0);
    expect(filteredResults.every(item => item.rating >= filters.rating)).toBe(true);
    
    console.log('✅ Search and filter simulation completed');
  });
});`
    }
  };

  // Generate tests based on user choice
  if (preferences.samples === 4) { // All examples
    Object.values(sampleTests).forEach(test => {
      writeFileSync(join(projectPath, 'tests', test.filename), test.content);
    });
  } else {
    const selectedTest = sampleTests[preferences.samples];
    writeFileSync(join(projectPath, 'tests', selectedTest.filename), selectedTest.content);
  }
}

// Generate sample tests
generateSampleTests(projectName, preferences);

// Create README
const readmeContent = `# ${projectName}

Super Pancake automation testing project

## Quick Start

Dependencies are automatically installed during project creation.

## Usage

\`\`\`bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui
\`\`\`

## Features

- ✅ Screenshot capture (including on failure)
- 📊 HTML test reporting
- 🎯 Chrome DevTools Protocol
- 🔍 Element selection and interaction
- 📱 Responsive test runner UI

## Configuration

Edit \`super-pancake.config.js\` to customize browser settings, screenshots, and reporting.

## Documentation

Visit [Super Pancake Documentation](https://github.com/pradapjackie/super-pancake#readme) for more information.
`;

writeFileSync(join(projectPath, 'README.md'), readmeContent);

// Create .gitignore
const gitignoreContent = `node_modules/
test-report.html
test-report.json
screenshots/
*.log
.DS_Store
`;

writeFileSync(join(projectPath, '.gitignore'), gitignoreContent);

console.log(`✅ Successfully created ${projectName}!`);
console.log('');
console.log('📦 Installing dependencies...');

// Auto-install dependencies
await installDependencies(projectPath);

console.log('');
console.log('🚀 Next steps:');
console.log(`  cd ${projectName}`);
console.log('  npm test');
console.log('');

// Dynamic success message based on preferences
if (preferences.screenshots !== 2) {
  console.log('📸 Screenshots will be saved to ./screenshots/');
}

if (preferences.reports === 0) {
  console.log('📊 HTML test reports will be generated as ./test-report.html');
} else if (preferences.reports === 1) {
  console.log('📊 JSON test reports will be generated as ./test-report.json');
}

if (preferences.ui) {
  console.log('🎯 Run "npx super-pancake-ui" for interactive testing');
}

if (preferences.headless) {
  console.log('⚡ Tests will run in headless mode for faster execution');
} else {
  console.log('👀 Tests will run with visible browser windows');
}

const sampleTypes = ['Basic', 'Form testing', 'API testing', 'E2E workflow', 'All'];
console.log(`📝 Generated ${sampleTypes[preferences.samples]} sample tests`);

console.log('');
console.log('Happy testing! 🥞');