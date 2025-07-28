import axios from 'axios';
import Ajv from 'ajv';
import {
  SuperPancakeError,
  ValidationError,
  SecurityError,
  validateText
} from './errors.js';

let authToken = null;

// Set a global auth token
export function setAuthToken(token) {
  if (token !== null && typeof token !== 'string') {
    throw new ValidationError('token', 'string or null', typeof token);
  }
  authToken = token;
}

// Merge headers with auth token if present
function withAuth(headers) {
  return authToken ? { ...headers, Authorization: `Bearer ${authToken}` } : headers;
}

// Build headers with content type and additional custom headers
export function buildHeaders(additionalHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}

// Build URL with query parameters
export function buildUrlWithParams(url, params = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new ValidationError('url', 'valid URL', url);
  }

  if (params && typeof params !== 'object') {
    throw new ValidationError('params', 'object', typeof params);
  }

  const query = new URLSearchParams(params).toString();
  return query ? `${url}?${query}` : url;
}

// Wrap a request to measure duration
export async function timedRequest(fn) {
  const start = Date.now();
  const response = await fn();
  const duration = Date.now() - start;

  // Only add duration if response is an object
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    response.duration = duration;
  }

  console.log(`🕒 ${fn.name || 'anonymous'} duration: ${duration}ms`);
  return response;
}

// Retry a request with exponential backoff
export async function retryRequest(requestFn, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      if (attempt === retries) {throw err;}
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// HTTP Methods
export async function sendGet(url, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.get(url, { headers: withAuth(headers) }));
}

export async function sendPost(url, body = {}, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.post(url, body, { headers: withAuth(headers) }));
}

export async function sendPut(url, body = {}, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.put(url, body, { headers: withAuth(headers) }));
}

export async function sendPatch(url, body = {}, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.patch(url, body, { headers: withAuth(headers) }));
}

export async function sendDelete(url, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.delete(url, { headers: withAuth(headers) }));
}

export async function sendOptions(url, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.options(url, { headers: withAuth(headers) }));
}

// HEAD request
export async function sendHead(url, headers = {}) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('url', 'non-empty string', typeof url);
  }
  return await timedRequest(() => axios.head(url, { headers: withAuth(headers) }));
}

// Assertions
export function assertStatus(response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(`❌ Expected status ${expectedStatus}, got ${response.status}`);
  }
}

export function assertHeader(response, headerName, expectedValue) {
  const value = response.headers[headerName.toLowerCase()];
  if (value !== expectedValue) {
    throw new Error(`❌ Expected header '${headerName}' to be '${expectedValue}', got '${value}'`);
  }
}

export function assertBodyContains(response, key, expectedValue) {
  const actualValue = response.data[key];
  if (actualValue !== expectedValue) {
    throw new Error(`❌ Expected response.${key} = '${expectedValue}', got '${actualValue}'`);
  }
}

export function assertResponseTime(response, maxMs) {
  if (response.duration > maxMs) {
    throw new Error(`⏱ Response too slow: ${response.duration}ms (limit: ${maxMs}ms)`);
  }
}

// Schema validation
export function validateSchema(responseBody, schema) {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(responseBody);
  if (!valid) {
    throw new Error(`❌ Schema validation failed:\n${JSON.stringify(validate.errors, null, 2)}`);
  }
}

// Log full response data
export function logResponse(response) {
  console.log('🔍 Response:', JSON.stringify({
    status: response.status,
    headers: response.headers,
    body: response.data
  }, null, 2));
}

// JSONPath assertion (simplified implementation)
export async function assertJsonPath(responseBody, path, expectedValue) {
  try {
    // Simple path traversal for basic JSONPath expressions like $.address.city
    let actual = responseBody;
    
    // Remove leading $ and split by dots
    const pathParts = path.replace(/^\$\.?/, '').split('.');
    
    // Traverse the object
    for (const part of pathParts) {
      if (actual && typeof actual === 'object' && part in actual) {
        actual = actual[part];
      } else {
        throw new Error(`❌ JSONPath ${path} not found in response`);
      }
    }
    
    // Check if the value matches
    if (actual !== expectedValue) {
      throw new Error(`❌ JSONPath ${path} expected '${expectedValue}' but got '${actual}'`);
    }
    
    console.log(`✅ JSONPath ${path} assertion passed: ${actual}`);
  } catch (error) {
    throw new Error(`❌ JSONPath assertion failed: ${error.message}`);
  }
}

// Assert rate limit headers
export function assertRateLimitHeaders(response) {
  ['x-ratelimit-limit', 'x-ratelimit-remaining'].forEach(h => {
    if (!(h in response.headers)) {
      throw new Error(`❌ Missing rate limit header: ${h}`);
    }
  });
}

import FormData from 'form-data';
import fs from 'fs';

// Multipart/form-data file upload
export async function uploadFile(url, filePath, fieldName = 'file', headers = {}) {
  const form = new FormData();
  form.append(fieldName, fs.createReadStream(filePath));

  const finalHeaders = withAuth({ ...headers, ...form.getHeaders() });

  return await timedRequest(() =>
    axios.post(url, form, {
      headers: finalHeaders,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })
  );
}

// GraphQL support
export async function sendGraphQL(url, query, variables = {}, headers = {}) {
  const body = { query, variables };
  return await timedRequest(() =>
    axios.post(url, body, {
      headers: withAuth({
        'Content-Type': 'application/json',
        ...headers
      })
    })
  );
}

// Token refresh handling (automatic retry on 401)
let refreshingToken = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

// Interceptor for refreshing token on 401
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!refreshingToken) {
        refreshingToken = true;
        try {
          const { data } = await axios.post('/auth/refresh-token');
          const newToken = data.token;
          setAuthToken(newToken);
          onRefreshed(newToken);
        } catch (refreshError) {
          refreshingToken = false;
          return Promise.reject(refreshError);
        }
        refreshingToken = false;
      }

      return new Promise(resolve => {
        subscribeTokenRefresh(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          originalRequest._retry = true;
          resolve(axios(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);
// Dynamic base URL
export const apiConfig = {
  baseUrl: process.env.API_BASE_URL || 'https://default.api.com'
};

// Prepend base URL to relative paths
export function withBaseUrl(path) {
  if (!path || typeof path !== 'string') {
    throw new ValidationError('path', 'non-empty string', typeof path);
  }

  return path.startsWith('http') ? path : `${apiConfig.baseUrl}${path}`;
}

// OAuth2 Token Flow (client_credentials)
export async function getOAuth2Token(tokenUrl, clientId, clientSecret, scope = '') {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  if (scope) {params.append('scope', scope);}

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const token = response.data.access_token;
    setAuthToken(token);
    return token;
  } catch (err) {
    throw new Error(`❌ OAuth2 token fetch failed: ${err.message}`);
  }
}

// WebSocket support
import WebSocket from 'ws';

export function createWebSocketConnection(url, onMessage, onOpen = null, onError = null) {
  const ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('🔌 WebSocket connected');
    if (onOpen) {onOpen(ws);}
  });

  ws.on('message', data => {
    console.log('📨 WebSocket message received:', data.toString());
    if (onMessage) {onMessage(data.toString(), ws);}
  });

  ws.on('error', err => {
    console.error('❌ WebSocket error:', err);
    if (onError) {onError(err, ws);}
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
  });

  return ws;
}
