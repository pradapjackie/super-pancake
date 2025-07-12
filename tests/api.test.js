

import {
  sendGet, sendPost, sendPut, sendPatch, sendDelete,
  sendOptions, sendHead, assertStatus, assertHeader, assertBodyContains,
  assertResponseTime, validateSchema, logResponse, assertJsonPath,
  assertRateLimitHeaders, uploadFile, sendGraphQL, getOAuth2Token,
  withBaseUrl, buildHeaders, buildUrlWithParams, setAuthToken,
  retryRequest, createWebSocketConnection, timedRequest
} from '../core/api.js';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Mock axios for testing
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock fs for file operations
vi.mock('fs');
const mockedFs = vi.mocked(fs);

describe('API Utility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear auth token to ensure clean state
    setAuthToken(null);
  });

  describe('Utility Functions', () => {
    it('buildHeaders should return default headers', () => {
      const headers = buildHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('buildHeaders should merge additional headers', () => {
      const headers = buildHeaders({ 'X-Custom': 'value' });
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'value'
      });
    });

    it('buildUrlWithParams should build URL with query parameters', () => {
      const url = buildUrlWithParams('https://api.example.com/test', { 
        param1: 'value1', 
        param2: 'value2' 
      });
      expect(url).toBe('https://api.example.com/test?param1=value1&param2=value2');
    });

    it('buildUrlWithParams should return original URL when no params', () => {
      const url = buildUrlWithParams('https://api.example.com/test');
      expect(url).toBe('https://api.example.com/test');
    });

    it('withBaseUrl should prepend base URL to relative paths', () => {
      const result = withBaseUrl('/users');
      expect(result).toBe('https://default.api.com/users');
    });

    it('withBaseUrl should return absolute URLs unchanged', () => {
      const result = withBaseUrl('https://custom.api.com/users');
      expect(result).toBe('https://custom.api.com/users');
    });

    it('setAuthToken should set global auth token', () => {
      setAuthToken('test-token');
      // Test that subsequent requests include the token
      const headers = buildHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('HTTP Methods', () => {
    const mockResponse = {
      data: { success: true },
      status: 200,
      headers: { 'content-type': 'application/json' },
      duration: 100
    };

    it('sendGet should make GET request', async () => {
      mockedAxios.get.mockResolvedValue(mockResponse);
      
      const result = await sendGet('https://api.example.com/test');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/test', {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });

    it('sendPost should make POST request', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const body = { name: 'test' };
      const result = await sendPost('https://api.example.com/test', body);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('https://api.example.com/test', body, {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });

    it('sendPut should make PUT request', async () => {
      mockedAxios.put.mockResolvedValue(mockResponse);
      
      const body = { update: true };
      const result = await sendPut('https://api.example.com/test', body);
      
      expect(mockedAxios.put).toHaveBeenCalledWith('https://api.example.com/test', body, {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });

    it('sendPatch should make PATCH request', async () => {
      mockedAxios.patch.mockResolvedValue(mockResponse);
      
      const body = { partial: true };
      const result = await sendPatch('https://api.example.com/test', body);
      
      expect(mockedAxios.patch).toHaveBeenCalledWith('https://api.example.com/test', body, {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });

    it('sendDelete should make DELETE request', async () => {
      mockedAxios.delete.mockResolvedValue(mockResponse);
      
      const result = await sendDelete('https://api.example.com/test');
      
      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/test', {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });

    it('sendOptions should make OPTIONS request', async () => {
      mockedAxios.options.mockResolvedValue(mockResponse);
      
      const result = await sendOptions('https://api.example.com/test');
      
      expect(mockedAxios.options).toHaveBeenCalledWith('https://api.example.com/test', {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });

    it('sendHead should make HEAD request', async () => {
      mockedAxios.head.mockResolvedValue(mockResponse);
      
      const result = await sendHead('https://api.example.com/test');
      
      expect(mockedAxios.head).toHaveBeenCalledWith('https://api.example.com/test', {
        headers: {}
      });
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('Assertion Functions', () => {
    const mockResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { name: 'John', age: 30 },
      duration: 150
    };

    it('assertStatus should pass for correct status', () => {
      expect(() => assertStatus(mockResponse, 200)).not.toThrow();
    });

    it('assertStatus should throw for incorrect status', () => {
      expect(() => assertStatus(mockResponse, 404)).toThrow('Expected status 404, got 200');
    });

    it('assertHeader should pass for correct header', () => {
      expect(() => assertHeader(mockResponse, 'content-type', 'application/json')).not.toThrow();
    });

    it('assertHeader should throw for incorrect header', () => {
      expect(() => assertHeader(mockResponse, 'content-type', 'text/html')).toThrow();
    });

    it('assertBodyContains should pass for correct value', () => {
      expect(() => assertBodyContains(mockResponse, 'name', 'John')).not.toThrow();
    });

    it('assertBodyContains should throw for incorrect value', () => {
      expect(() => assertBodyContains(mockResponse, 'name', 'Jane')).toThrow();
    });

    it('assertResponseTime should pass for acceptable time', () => {
      expect(() => assertResponseTime(mockResponse, 1000)).not.toThrow();
    });

    it('assertResponseTime should throw for slow response', () => {
      expect(() => assertResponseTime(mockResponse, 100)).toThrow('Response too slow');
    });

    it('assertRateLimitHeaders should pass for valid headers', () => {
      const responseWithRateLimit = {
        ...mockResponse,
        headers: {
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '99'
        }
      };
      expect(() => assertRateLimitHeaders(responseWithRateLimit)).not.toThrow();
    });

    it('assertRateLimitHeaders should throw for missing headers', () => {
      expect(() => assertRateLimitHeaders(mockResponse)).toThrow('Missing rate limit header');
    });
  });

  describe('Schema Validation', () => {
    it('validateSchema should pass for valid data', () => {
      const data = { name: 'John', age: 30 };
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name', 'age']
      };
      
      expect(() => validateSchema(data, schema)).not.toThrow();
    });

    it('validateSchema should throw for invalid data', () => {
      const data = { name: 'John' }; // missing age
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name', 'age']
      };
      
      expect(() => validateSchema(data, schema)).toThrow('Schema validation failed');
    });
  });

  describe('JSONPath Assertions', () => {
    it('assertJsonPath should pass for correct path value', () => {
      const data = { user: { name: 'John Doe', profile: { age: 30 } } };
      expect(() => assertJsonPath(data, '$.user.name', 'John Doe')).not.toThrow();
    });

    it('assertJsonPath should throw for incorrect path value', () => {
      const data = { user: { name: 'John Doe' } };
      expect(() => assertJsonPath(data, '$.user.name', 'Jane Doe')).toThrow();
    });
  });

  describe('GraphQL Support', () => {
    it('sendGraphQL should make POST request with query', async () => {
      const mockResponse = {
        data: { data: { hello: 'world' } },
        status: 200
      };
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const query = 'query { hello }';
      const variables = { id: 1 };
      
      const result = await sendGraphQL('https://api.example.com/graphql', query, variables);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        { query, variables },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result.data.data.hello).toBe('world');
    });
  });

  describe('OAuth2 Support', () => {
    it('getOAuth2Token should fetch token successfully', async () => {
      const mockResponse = {
        data: { access_token: 'test-token-123' },
        status: 200
      };
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const token = await getOAuth2Token('https://auth.example.com/token', 'client-id', 'client-secret');
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://auth.example.com/token',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      expect(token).toBe('test-token-123');
    });

    it('getOAuth2Token should throw on failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Unauthorized'));
      
      await expect(getOAuth2Token('https://auth.example.com/token', 'client-id', 'client-secret'))
        .rejects.toThrow('OAuth2 token fetch failed');
    });
  });

  describe('Retry Logic', () => {
    it('retryRequest should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await retryRequest(mockFn);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('retryRequest should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const result = await retryRequest(mockFn, 3, 10);
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('retryRequest should fail after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('fail');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('File Upload', () => {
    it('uploadFile should upload file successfully', async () => {
      const mockResponse = {
        data: { uploaded: true },
        status: 200
      };
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      // Mock fs.createReadStream
      const mockStream = { pipe: vi.fn() };
      mockedFs.createReadStream.mockReturnValue(mockStream);
      
      const filePath = '/path/to/test.txt';
      const result = await uploadFile('https://api.example.com/upload', filePath);
      
      expect(mockedFs.createReadStream).toHaveBeenCalledWith(filePath);
      expect(mockedAxios.post).toHaveBeenCalled();
      expect(result.data.uploaded).toBe(true);
    });
  });

  describe('WebSocket Support', () => {
    it('createWebSocketConnection should create WebSocket with handlers', () => {
      // Mock WebSocket
      const mockWebSocket = {
        on: vi.fn(),
        close: vi.fn()
      };
      
      // Mock WebSocket constructor
      vi.doMock('ws', () => ({
        default: vi.fn(() => mockWebSocket)
      }));
      
      const onMessage = vi.fn();
      const onOpen = vi.fn();
      const onError = vi.fn();
      
      const ws = createWebSocketConnection('ws://localhost:8080', onMessage, onOpen, onError);
      
      expect(mockWebSocket.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('Logging', () => {
    it('logResponse should log response data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const response = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: { test: 'data' }
      };
      
      logResponse(response);
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Response:', expect.stringContaining('200'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Timed Requests', () => {
    it('timedRequest should add duration to response', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
      
      const result = await timedRequest(mockFn);
      
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(result.data).toBe('test');
    });
  });
});