export default {
  "browser": {
    "headless": true,
    "devtools": true,
    "slowMo": 100
  },
  "test": {
    "timeout": 30000,
    "retries": 1,
    "parallel": true
  },
  "screenshot": {
    "enabled": true,
    "onFailure": true,
    "path": "./screenshots",
    "quality": 90,
    "fullPage": true
  },
  "report": {
    "enabled": true,
    "path": "./test-report.html",
    "autoOpen": true,
    "format": "html"
  },
  "video": {
    "enabled": true,
    "path": "./videos",
    "quality": "medium"
  },
  "logging": {
    "network": true,
    "console": true,
    "level": "info"
  },
  "timeouts": {
    "testTimeout": 30000,
    "pageTimeout": 30000,
    "elementTimeout": 10000
  }
};