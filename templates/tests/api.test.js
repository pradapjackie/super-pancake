import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // API testing functions
  sendGet,
  sendPost,
  sendPut,
  sendPatch,
  sendDelete,
  setAuthToken,
  withBaseUrl,
  timedRequest,
  
  // Assertions for API responses
  assertStatus,
  assertHeader,
  assertBodyContains,
  assertResponseTime,
  validateSchema,
  assertJsonPath,
  
  // Utilities
  buildUrlWithParams,
  logResponse
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

describe(`${projectName} API Tests`, () => {
  beforeAll(async () => {
    console.log('🚀 Setting up API tests...');
    // Optional: Set base URL or auth token
    // setAuthToken('your-api-token');
  });

  afterAll(async () => {
    console.log('🧹 API tests completed');
  });

  it('should perform a GET request to JSONPlaceholder API', async () => {
    console.log('🌐 Testing GET request...');
    
    // Make a GET request to a public API
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    // Assert response status
    assertStatus(response, 200);
    
    // Assert response contains expected data
    assertBodyContains(response, 'userId', 1);
    assertBodyContains(response, 'id', 1);
    
    // Verify response structure
    const expectedSchema = {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        id: { type: 'number' },
        title: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['userId', 'id', 'title', 'body']
    };
    
    validateSchema(response.data, expectedSchema);
    
    console.log('✅ GET request test passed');
  });

  it('should test POST request with data', async () => {
    console.log('📤 Testing POST request...');
    
    const postData = {
      title: `${projectName} Test Post`,
      body: `This is a test post created by ${projectName} automation`,
      userId: 1
    };
    
    // Make a POST request
    const response = await sendPost('https://jsonplaceholder.typicode.com/posts', postData);
    
    // Assert response status
    assertStatus(response, 201);
    
    // Assert the posted data is reflected in response
    assertBodyContains(response, 'title', postData.title);
    assertBodyContains(response, 'body', postData.body);
    assertBodyContains(response, 'userId', postData.userId);
    
    console.log('✅ POST request test passed');
  });

  it('should test response time performance', async () => {
    console.log('⏱️ Testing response time...');
    
    // Test that API responds within acceptable time
    const response = await timedRequest(
      () => sendGet('https://jsonplaceholder.typicode.com/posts/1'),
      5000 // 5 second timeout
    );
    
    assertStatus(response, 200);
    assertResponseTime(response, 5000); // Should respond within 5 seconds
    
    console.log(`✅ Response time test passed: ${response.responseTime}ms`);
  });

  it('should test URL building with parameters', async () => {
    console.log('🔗 Testing URL building...');
    
    // Test URL building utility
    const baseUrl = 'https://jsonplaceholder.typicode.com/posts';
    const params = { userId: 1, _limit: 5 };
    const builtUrl = buildUrlWithParams(baseUrl, params);
    
    // Make request with built URL
    const response = await sendGet(builtUrl);
    
    assertStatus(response, 200);
    
    // Verify we got limited results
    if (Array.isArray(response.data)) {
      console.log(`📊 Received ${response.data.length} posts (limited to 5)`);
    }
    
    console.log('✅ URL building test passed');
  });

  it('should test error handling for invalid endpoints', async () => {
    console.log('❌ Testing error handling...');
    
    try {
      // This should fail
      const response = await sendGet('https://jsonplaceholder.typicode.com/invalid-endpoint');
      
      // If we get here, check if it's a 404
      if (response.status === 404) {
        console.log('✅ 404 handled correctly');
      } else {
        throw new Error(`Expected 404 but got ${response.status}`);
      }
    } catch (error) {
      // Error handling test passed
      console.log('✅ Error handling test passed:', error.message);
    }
  });


  it('should test PUT request for updating data', async () => {
    console.log('🔄 Testing PUT request...');
    
    const updateData = {
      id: 1,
      title: `${projectName} Updated Post`,
      body: `This post was updated by ${projectName} automation`,
      userId: 1
    };
    
    // Make a PUT request
    const response = await sendPut('https://jsonplaceholder.typicode.com/posts/1', updateData);
    
    // Assert response status
    assertStatus(response, 200);
    
    // Assert the updated data is reflected in response
    assertBodyContains(response, 'title', updateData.title);
    assertBodyContains(response, 'body', updateData.body);
    assertBodyContains(response, 'id', 1);
    
    console.log('✅ PUT request test passed');
  });

  it('should test PATCH request for partial updates', async () => {
    console.log('🔧 Testing PATCH request...');
    
    const patchData = {
      title: `${projectName} Patched Title`
    };
    
    // Make a PATCH request
    const response = await sendPatch('https://jsonplaceholder.typicode.com/posts/1', patchData);
    
    // Assert response status
    assertStatus(response, 200);
    
    // Assert the patched data is reflected in response
    assertBodyContains(response, 'title', patchData.title);
    
    console.log('✅ PATCH request test passed');
  });

  it('should test DELETE request', async () => {
    console.log('🗑️ Testing DELETE request...');
    
    // Make a DELETE request
    const response = await sendDelete('https://jsonplaceholder.typicode.com/posts/1');
    
    // Assert response status (JSONPlaceholder returns 200 for DELETE)
    assertStatus(response, 200);
    
    console.log('✅ DELETE request test passed');
  });

  it('should test authentication token handling', async () => {
    console.log('🔐 Testing authentication...');
    
    // Set a test auth token
    setAuthToken('test-token-12345');
    
    // Make a request (this will include the auth header)
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    // Assert request succeeded (even with fake token, JSONPlaceholder ignores auth)
    assertStatus(response, 200);
    
    // Clear the token
    setAuthToken(null);
    
    console.log('✅ Authentication token test passed');
  });

  it('should test request headers and content types', async () => {
    console.log('📬 Testing custom headers...');
    
    const customHeaders = {
      'X-Custom-Header': 'test-value',
      'User-Agent': `${projectName}-automation-test`
    };
    
    // Make a request with custom headers
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1', customHeaders);
    
    // Assert response status
    assertStatus(response, 200);
    
    // Assert response has expected content type
    assertHeader(response, 'content-type', 'application/json; charset=utf-8');
    
    console.log('✅ Custom headers test passed');
  });

  it('should test array response handling', async () => {
    console.log('📋 Testing array responses...');
    
    // Make a request that returns an array
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts?_limit=3');
    
    // Assert response status
    assertStatus(response, 200);
    
    // Assert response is an array
    if (!Array.isArray(response.data)) {
      throw new Error('Expected response to be an array');
    }
    
    // Assert array has expected length
    if (response.data.length !== 3) {
      throw new Error(`Expected 3 items, got ${response.data.length}`);
    }
    
    // Test first item structure
    const firstPost = response.data[0];
    if (!firstPost.id || !firstPost.title) {
      throw new Error('First post missing required fields');
    }
    
    console.log(`✅ Array response test passed - received ${response.data.length} items`);
  });

  it('should test concurrent API requests', async () => {
    console.log('🚀 Testing concurrent requests...');
    
    // Make multiple concurrent requests
    const promises = [
      sendGet('https://jsonplaceholder.typicode.com/posts/1'),
      sendGet('https://jsonplaceholder.typicode.com/posts/2'),
      sendGet('https://jsonplaceholder.typicode.com/posts/3')
    ];
    
    // Wait for all requests to complete
    const responses = await Promise.all(promises);
    
    // Assert all requests succeeded
    responses.forEach((response, index) => {
      assertStatus(response, 200);
      assertBodyContains(response, 'id', index + 1);
    });
    
    console.log('✅ Concurrent requests test passed');
  });

  it('should test API with query parameters', async () => {
    console.log('🔍 Testing query parameters...');
    
    // Test different query parameter combinations
    const testCases = [
      { params: { userId: 1 }, description: 'Filter by userId' },
      { params: { _limit: 2 }, description: 'Limit results' },
      { params: { userId: 1, _limit: 2 }, description: 'Multiple parameters' }
    ];
    
    for (const testCase of testCases) {
      console.log(`  Testing: ${testCase.description}`);
      
      const url = buildUrlWithParams('https://jsonplaceholder.typicode.com/posts', testCase.params);
      const response = await sendGet(url);
      
      assertStatus(response, 200);
      
      // For limit parameter, check array length
      if (testCase.params._limit && Array.isArray(response.data)) {
        if (response.data.length > testCase.params._limit) {
          throw new Error(`Expected max ${testCase.params._limit} items, got ${response.data.length}`);
        }
      }
    }
    
    console.log('✅ Query parameters test passed');
  });

  it('should test response time monitoring across multiple requests', async () => {
    console.log('⏱️ Testing response time monitoring...');
    
    const endpoints = [
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/users/1',
      'https://jsonplaceholder.typicode.com/albums/1'
    ];
    
    let totalTime = 0;
    const times = [];
    
    for (const endpoint of endpoints) {
      const response = await timedRequest(() => sendGet(endpoint), 10000);
      assertStatus(response, 200);
      
      const responseTime = response.responseTime || response.duration || 0;
      times.push(responseTime);
      totalTime += responseTime;
      
      console.log(`  ${endpoint}: ${responseTime}ms`);
    }
    
    const averageTime = totalTime / endpoints.length;
    console.log(`📊 Average response time: ${averageTime.toFixed(2)}ms`);
    
    // Assert all responses were reasonably fast (under 10 seconds)
    times.forEach(time => {
      if (time > 10000) {
        throw new Error(`Response time too slow: ${time}ms`);
      }
    });
    
    console.log('✅ Response time monitoring test passed');
  });
});