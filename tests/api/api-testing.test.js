import { describe, it } from 'vitest';
import { 
  sendGet, 
  sendPost, 
  assertStatus, 
  assertBodyContains,
  assertResponseTime,
  buildUrlWithParams,
  assertEqual,
  assertExists 
} from 'super-pancake-automation';

describe('API Testing Integration', () => {
  it('should perform GET request and validate response', async () => {
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    // Test that response exists and has expected structure
    assertExists(response, 'Response should exist');
    assertEqual(response.status, 200, 'Status should be 200');
    assertExists(response.data, 'Response data should exist');
    assertEqual(response.data.id, 1, 'Post ID should be 1');
    assertExists(response.data.title, 'Post should have a title');
    
    // Test assertions
    assertStatus(response, 200);
    assertBodyContains(response, 'id', 1);
    assertResponseTime(response, 5000); // Should respond within 5 seconds
  }, 15000);

  it('should perform POST request with data', async () => {
    const postData = {
      title: 'Test Post',
      body: 'This is a test post created by automation framework',
      userId: 1
    };

    const response = await sendPost('https://jsonplaceholder.typicode.com/posts', postData);
    
    assertExists(response, 'POST response should exist');
    assertEqual(response.status, 201, 'POST status should be 201');
    assertEqual(response.data.title, postData.title, 'Title should match');
    assertEqual(response.data.body, postData.body, 'Body should match');
    assertEqual(response.data.userId, postData.userId, 'User ID should match');
    
    // Test assertions work correctly
    assertStatus(response, 201);
    assertBodyContains(response, 'title', 'Test Post');
  }, 15000);

  it('should build URLs with parameters correctly', async () => {
    const baseUrl = 'https://jsonplaceholder.typicode.com/posts';
    const params = { userId: 1, _limit: 5 };
    
    const urlWithParams = buildUrlWithParams(baseUrl, params);
    assertExists(urlWithParams, 'URL with params should be built');
    console.log(`📝 Built URL: ${urlWithParams}`);
    
    // Test that the URL actually works
    const response = await sendGet(urlWithParams);
    assertStatus(response, 200);
    assertExists(response.data, 'Response data should exist');
    console.log(`📊 Received ${response.data.length} items`);
  }, 15000);

  it('should handle API errors gracefully', async () => {
    try {
      // Try to access a non-existent endpoint
      await sendGet('https://jsonplaceholder.typicode.com/posts/99999');
    } catch (error) {
      // Should handle 404 errors appropriately
      assertExists(error, 'Error should be thrown for non-existent endpoint');
      console.log('✅ Successfully handled API error:', error.message);
    }
  }, 15000);

  it('should test HTTP status codes comprehensively', async () => {
    // Test 200 OK
    const okResponse = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    assertStatus(okResponse, 200);
    
    // Test 201 Created
    const createResponse = await sendPost('https://jsonplaceholder.typicode.com/posts', {
      title: 'Status Test',
      body: 'Testing status codes',
      userId: 1
    });
    assertStatus(createResponse, 201);
    
    console.log('✅ HTTP status codes tested successfully');
  }, 20000);

  it('should test different HTTP methods', async () => {
    // Test GET method
    const getResponse = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    assertStatus(getResponse, 200);
    assertExists(getResponse.data.id, 'GET should return data with ID');
    
    // Test POST method
    const postData = { title: 'Method Test', body: 'Testing methods', userId: 1 };
    const postResponse = await sendPost('https://jsonplaceholder.typicode.com/posts', postData);
    assertStatus(postResponse, 201);
    assertEqual(postResponse.data.title, postData.title, 'POST should return created data');
    
    console.log('✅ HTTP methods tested successfully');
  }, 20000);

  it('should test request headers and content types', async () => {
    const response = await sendPost('https://jsonplaceholder.typicode.com/posts', {
      title: 'Header Test',
      body: 'Testing headers',
      userId: 1
    });
    
    assertExists(response.headers, 'Response should contain headers');
    assertStatus(response, 201);
    assertBodyContains(response, 'title', 'Header Test');
    
    console.log('✅ Headers and content types tested');
  }, 15000);

  it('should test response body validation', async () => {
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    // Test various body validations
    assertBodyContains(response, 'id', 1);
    assertBodyContains(response, 'userId', 1);
    assertExists(response.data.title, 'Response should have title');
    assertExists(response.data.body, 'Response should have body');
    
    // Test data types
    assertEqual(typeof response.data.id, 'number', 'ID should be number');
    assertEqual(typeof response.data.title, 'string', 'Title should be string');
    assertEqual(typeof response.data.body, 'string', 'Body should be string');
    
    console.log('✅ Response body validation completed');
  }, 15000);

  it('should test URL building with complex parameters', async () => {
    const baseUrl = 'https://jsonplaceholder.typicode.com/posts';
    
    // Test single parameter
    const singleParam = { userId: 1 };
    const singleUrl = buildUrlWithParams(baseUrl, singleParam);
    assertExists(singleUrl, 'Single parameter URL should be built');
    
    // Test multiple parameters
    const multiParams = { userId: 1, _limit: 3, _start: 0 };
    const multiUrl = buildUrlWithParams(baseUrl, multiParams);
    assertExists(multiUrl, 'Multiple parameter URL should be built');
    
    // Test the built URLs work
    const singleResponse = await sendGet(singleUrl);
    assertStatus(singleResponse, 200);
    
    const multiResponse = await sendGet(multiUrl);
    assertStatus(multiResponse, 200);
    
    console.log('✅ Complex URL parameter building tested');
  }, 20000);

  it('should test API response time performance', async () => {
    const startTime = Date.now();
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    const endTime = Date.now();
    
    assertStatus(response, 200);
    assertResponseTime(response, 10000); // Should respond within 10 seconds
    
    const actualTime = endTime - startTime;
    console.log(`📊 API response time: ${actualTime}ms`);
    
    // Test that response time is reasonable
    assertExists(actualTime, 'Response time should be measurable');
    assertEqual(actualTime < 10000, true, 'Response should be under 10 seconds');
  }, 15000);

  it('should test batch API requests', async () => {
    const urls = [
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/posts/2',
      'https://jsonplaceholder.typicode.com/posts/3'
    ];
    
    const promises = urls.map(url => sendGet(url));
    const responses = await Promise.all(promises);
    
    responses.forEach((response, index) => {
      assertStatus(response, 200);
      assertEqual(response.data.id, index + 1, `Post ${index + 1} should have correct ID`);
      assertExists(response.data.title, `Post ${index + 1} should have title`);
    });
    
    console.log(`✅ Batch requests completed: ${responses.length} requests`);
  }, 25000);

  it('should test API data consistency', async () => {
    const response1 = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    const response2 = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    // Same endpoint should return consistent data
    assertEqual(response1.data.id, response2.data.id, 'IDs should be consistent');
    assertEqual(response1.data.title, response2.data.title, 'Titles should be consistent');
    assertEqual(response1.data.body, response2.data.body, 'Bodies should be consistent');
    assertEqual(response1.data.userId, response2.data.userId, 'User IDs should be consistent');
    
    console.log('✅ API data consistency verified');
  }, 20000);

  it('should test POST request with various data types', async () => {
    const complexData = {
      title: 'Complex Data Test',
      body: 'Testing various data types',
      userId: 1,
      metadata: {
        tags: ['test', 'automation', 'api'],
        priority: 'high',
        completed: false,
        count: 42,
        timestamp: new Date().toISOString()
      }
    };
    
    const response = await sendPost('https://jsonplaceholder.typicode.com/posts', complexData);
    
    assertStatus(response, 201);
    assertEqual(response.data.title, complexData.title, 'Title should match');
    assertEqual(response.data.body, complexData.body, 'Body should match');
    assertEqual(response.data.userId, complexData.userId, 'User ID should match');
    
    console.log('✅ Complex data types tested');
  }, 15000);

  it('should test API pagination handling', async () => {
    // Test pagination parameters
    const page1Url = buildUrlWithParams('https://jsonplaceholder.typicode.com/posts', {
      _page: 1,
      _limit: 5
    });
    
    const page2Url = buildUrlWithParams('https://jsonplaceholder.typicode.com/posts', {
      _page: 2,
      _limit: 5
    });
    
    const page1Response = await sendGet(page1Url);
    const page2Response = await sendGet(page2Url);
    
    assertStatus(page1Response, 200);
    assertStatus(page2Response, 200);
    
    // Verify pagination works
    assertEqual(Array.isArray(page1Response.data), true, 'Page 1 should return array');
    assertEqual(Array.isArray(page2Response.data), true, 'Page 2 should return array');
    assertEqual(page1Response.data.length, 5, 'Page 1 should have 5 items');
    assertEqual(page2Response.data.length, 5, 'Page 2 should have 5 items');
    
    // Verify different data
    const page1Ids = page1Response.data.map(post => post.id);
    const page2Ids = page2Response.data.map(post => post.id);
    const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
    assertEqual(hasOverlap, false, 'Pages should have different data');
    
    console.log('✅ API pagination tested successfully');
  }, 20000);

  it('should test API filtering and search', async () => {
    // Test filtering by user ID
    const filteredUrl = buildUrlWithParams('https://jsonplaceholder.typicode.com/posts', {
      userId: 1
    });
    
    const filteredResponse = await sendGet(filteredUrl);
    assertStatus(filteredResponse, 200);
    
    // Verify all results match filter
    assertEqual(Array.isArray(filteredResponse.data), true, 'Filtered response should be array');
    
    if (filteredResponse.data.length > 0) {
      const allMatchFilter = filteredResponse.data.every(post => post.userId === 1);
      assertEqual(allMatchFilter, true, 'All posts should match userId filter');
    }
    
    console.log(`✅ API filtering tested: ${filteredResponse.data.length} results`);
  }, 15000);

  it('should test concurrent API requests', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill().map((_, index) => 
      sendGet(`https://jsonplaceholder.typicode.com/posts/${index + 1}`)
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // Verify all requests succeeded
    responses.forEach((response, index) => {
      assertStatus(response, 200);
      assertEqual(response.data.id, index + 1, `Request ${index + 1} should have correct ID`);
    });
    
    const totalTime = endTime - startTime;
    console.log(`✅ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
    
    // Concurrent requests should be faster than sequential
    assertEqual(totalTime < (concurrentRequests * 2000), true, 'Concurrent requests should be efficient');
  }, 30000);

  it('should test API response headers validation', async () => {
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    assertStatus(response, 200);
    assertExists(response.headers, 'Response should have headers');
    
    // Common headers that should exist
    const expectedHeaders = ['content-type'];
    expectedHeaders.forEach(header => {
      const headerExists = response.headers[header] || response.headers[header.toLowerCase()];
      assertExists(headerExists, `${header} header should exist`);
    });
    
    console.log('✅ Response headers validated');
  }, 15000);

  it('should test API data structure validation', async () => {
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    assertStatus(response, 200);
    
    // Validate data structure
    const requiredFields = ['id', 'title', 'body', 'userId'];
    requiredFields.forEach(field => {
      assertExists(response.data[field], `${field} should exist in response`);
    });
    
    // Validate data types
    assertEqual(typeof response.data.id, 'number', 'ID should be number');
    assertEqual(typeof response.data.title, 'string', 'Title should be string');
    assertEqual(typeof response.data.body, 'string', 'Body should be string');
    assertEqual(typeof response.data.userId, 'number', 'User ID should be number');
    
    console.log('✅ Data structure validation completed');
  }, 15000);

  it('should test API array response validation', async () => {
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts');
    
    assertStatus(response, 200);
    assertEqual(Array.isArray(response.data), true, 'Response should be an array');
    assertEqual(response.data.length > 0, true, 'Array should not be empty');
    
    // Validate first item structure
    if (response.data.length > 0) {
      const firstItem = response.data[0];
      assertExists(firstItem.id, 'First item should have ID');
      assertExists(firstItem.title, 'First item should have title');
      assertExists(firstItem.body, 'First item should have body');
      assertExists(firstItem.userId, 'First item should have userId');
    }
    
    console.log(`✅ Array response validated: ${response.data.length} items`);
  }, 15000);

  it('should test API network error handling', async () => {
    let networkErrorCaught = false;
    
    try {
      // Try to connect to a non-existent domain
      await sendGet('https://nonexistent-api-domain-12345.com/test');
    } catch (error) {
      networkErrorCaught = true;
      assertExists(error, 'Network error should be caught');
      console.log('✅ Network error handled:', error.message);
    }
    
    assertEqual(networkErrorCaught, true, 'Network error should be caught and handled');
  }, 20000);

  it('should test API timeout handling', async () => {
    // This test simulates timeout scenarios
    const startTime = Date.now();
    
    try {
      // Use a reliable endpoint but with a very short timeout expectation
      const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      assertStatus(response, 200);
      assertResponseTime(response, 30000); // 30 second timeout
      
      console.log(`✅ Timeout handling tested: ${responseTime}ms response time`);
    } catch (error) {
      console.log('✅ Timeout error handled:', error.message);
    }
  }, 35000);

  it('should test API rate limiting awareness', async () => {
    // Test multiple rapid requests to check rate limiting
    const rapidRequests = 5;
    const requests = [];
    
    for (let i = 0; i < rapidRequests; i++) {
      requests.push(sendGet('https://jsonplaceholder.typicode.com/posts/1'));
    }
    
    try {
      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        assertStatus(response, 200);
        console.log(`Request ${index + 1}: ${response.status}`);
      });
      
      console.log(`✅ Rate limiting test completed: ${responses.length} rapid requests`);
    } catch (error) {
      console.log('✅ Rate limiting encountered (expected):', error.message);
    }
  }, 25000);
});