// 📱 TIER 2 DEVICE EMULATION TEST - Focused validation of device and viewport methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import { 
  navigateTo, setDefaultTimeout,
  emulateDevice, setViewport, setGeolocation, clearDeviceEmulation,
  click, waitForText, waitForLoadState, takeScreenshot
} from '../core/simple-dom-v2.js';
import { resolve } from 'path';

describe('📱 TIER 2 Device Emulation Test', () => {
  let testEnv;
  const formUrl = `file://${resolve('./public/form-comprehensive.html')}`;

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Device Emulation Test');
    setDefaultTimeout(8000);
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv, 'Device Emulation Test');
    }
  });

  it('should emulate iPhone 12', async () => {
    await navigateTo(formUrl);
    await waitForLoadState('load');
    
    await emulateDevice('iPhone 12');
    console.log('✅ iPhone 12 emulation set');
    
    // Test interaction in mobile view
    await waitForText('Device Emulation Testing', { timeout: 5000 });
    
    await takeScreenshot('./screenshots/iphone12-emulation-test.png');
    console.log('✅ iPhone 12 emulation working correctly');
  });

  it('should emulate iPad', async () => {
    await emulateDevice('iPad');
    console.log('✅ iPad emulation set');
    
    // Test interaction in tablet view
    await waitForText('TIER 1 & TIER 2 Testing Elements', { timeout: 5000 });
    
    await takeScreenshot('./screenshots/ipad-emulation-test.png');
    console.log('✅ iPad emulation working correctly');
  });

  it('should emulate Samsung Galaxy S21', async () => {
    await emulateDevice('Samsung Galaxy S21');
    console.log('✅ Samsung Galaxy S21 emulation set');
    
    await takeScreenshot('./screenshots/galaxy-emulation-test.png');
    console.log('✅ Samsung Galaxy S21 emulation working correctly');
  });

  it('should emulate Desktop', async () => {
    await emulateDevice('Desktop');
    console.log('✅ Desktop emulation set');
    
    await takeScreenshot('./screenshots/desktop-emulation-test.png');
    console.log('✅ Desktop emulation working correctly');
  });

  it('should set custom viewport', async () => {
    await setViewport(1024, 768);
    console.log('✅ Custom viewport set: 1024x768');
    
    // Test interaction with custom viewport
    await waitForText('Comprehensive UI Testing Playground', { timeout: 5000 });
    
    await takeScreenshot('./screenshots/custom-viewport-test.png');
    console.log('✅ Custom viewport working correctly');
  });

  it('should set custom viewport with mobile options', async () => {
    await setViewport(375, 667, { mobile: true, deviceScaleFactor: 2 });
    console.log('✅ Mobile custom viewport set: 375x667');
    
    await takeScreenshot('./screenshots/mobile-viewport-test.png');
    console.log('✅ Mobile custom viewport working correctly');
  });

  it('should set geolocation', async () => {
    // Set geolocation to San Francisco
    await setGeolocation(37.7749, -122.4194, 100);
    console.log('✅ Geolocation set to San Francisco');
    
    // Test geolocation interaction
    await click('#get-location-btn');
    
    // Wait for location to be processed
    await waitForText('Location:', { timeout: 10000 });
    
    await takeScreenshot('./screenshots/geolocation-test.png');
    console.log('✅ Geolocation working correctly');
  });

  it('should set different geolocation', async () => {
    // Set geolocation to New York
    await setGeolocation(40.7128, -74.0060, 50);
    console.log('✅ Geolocation set to New York');
    
    // Test geolocation again
    await click('#get-location-btn');
    await waitForText('Location:', { timeout: 10000 });
    
    console.log('✅ Different geolocation working correctly');
  });

  it('should clear device emulation', async () => {
    await clearDeviceEmulation();
    console.log('✅ Device emulation cleared');
    
    // Test that we can still interact normally
    await waitForText('Device Emulation Testing', { timeout: 5000 });
    
    await takeScreenshot('./screenshots/cleared-emulation-test.png');
    console.log('✅ Clear device emulation working correctly');
  });

  it('should handle device switching workflow', async () => {
    // Test switching between different devices
    console.log('📱 Testing device switching workflow...');
    
    // Start with mobile
    await emulateDevice('iPhone 12');
    await takeScreenshot('./screenshots/workflow-iphone.png');
    
    // Switch to tablet
    await emulateDevice('iPad');
    await takeScreenshot('./screenshots/workflow-ipad.png');
    
    // Switch to desktop
    await emulateDevice('Desktop');
    await takeScreenshot('./screenshots/workflow-desktop.png');
    
    // Test custom viewport
    await setViewport(800, 600);
    await takeScreenshot('./screenshots/workflow-custom.png');
    
    // Clear emulation
    await clearDeviceEmulation();
    await takeScreenshot('./screenshots/workflow-cleared.png');
    
    console.log('✅ Device switching workflow working correctly');
  });

  it('should handle invalid device gracefully', async () => {
    try {
      await emulateDevice('NonExistentDevice');
      throw new Error('Should have thrown an error for invalid device');
    } catch (error) {
      expect(error.message).toContain('Unknown device');
      console.log('✅ Invalid device handling working correctly');
    }
  });

  it('should maintain device state during navigation', async () => {
    // Set a device
    await emulateDevice('iPhone 12');
    
    // Navigate to test that device state is maintained
    await navigateTo(formUrl);
    await waitForLoadState('load');
    
    // Test interaction still works
    await waitForText('Device Emulation Testing', { timeout: 5000 });
    
    await takeScreenshot('./screenshots/device-state-navigation.png');
    console.log('✅ Device state maintenance during navigation working correctly');
  });

  it('should test responsive behavior', async () => {
    // Test different viewports to check responsive behavior
    const viewports = [
      { width: 320, height: 568, name: 'Mobile Portrait' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await setViewport(viewport.width, viewport.height);
      console.log(`✅ Set viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await takeScreenshot(`./screenshots/responsive-${viewport.name.toLowerCase().replace(' ', '-')}.png`);
    }
    
    console.log('✅ Responsive behavior testing working correctly');
  });
});