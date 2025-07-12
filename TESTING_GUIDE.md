# 🧪 Super Pancake Framework - Testing Guide

## 📋 What You Need Running

### **No Server Required**
```bash
npm run test:unit           # ✅ Core DOM methods
npm run test:security       # ✅ Security features  
npm run test:performance    # ✅ Performance & caching
npm run test:config         # ✅ Configuration system
npm run test:reporter       # ✅ HTML reporting
npm run test:errors         # ✅ Error handling
```

### **Servers Auto-Started**
```bash
npm run test:all            # 🚀 All tests (auto-starts servers)
npm run test:integration    # 🚀 UI server API tests
npm run test:e2e           # 🚀 End-to-end workflows
```

### **Manual Server Management**
```bash
# Start test application server manually
npm run test:app-server     # Runs on localhost:8080

# Start UI server manually  
npm run test:ui             # Runs on localhost:3000

# Run tests without auto-server management
npm run test:all-no-server  # Requires manual server setup
```

## 🎯 Test Application Features

The test app at `test-app/index.html` includes:

### **📝 Form Elements**
- Text inputs (name, email, password)
- Date/datetime inputs 
- Dropdowns (single & multi-select)
- Checkboxes and radio buttons
- Textarea and file upload
- Submit/reset buttons

### **📊 Data Elements**
- Test data table with sortable columns
- Unordered list with test items
- Dynamic content area
- Hidden/visible elements
- Enabled/disabled states

### **🔄 Interactive Features**
- Form submission with success messages
- Dynamic content updates
- Delayed element visibility changes
- Loading states and spinners
- API endpoints for testing

## 🚀 Quick Test Commands

```bash
# ✅ RECOMMENDED: Quick reliable tests (95 tests, all passing)
npm run test:quick          # Unit + config + performance (Chrome-free)

# Individual stable test categories  
npm run test:unit-stable    # Core functionality (72 tests ✅)
npm run test:config         # Configuration (8 tests ✅)
npm run test:performance-stable # Caching (15 tests ✅)

# Full test suite (includes Chrome-dependent tests)
npm run test:all            # All tests + HTML report generation

# Other test categories
npm run test:security       # Security features
npm run test:integration    # API endpoints  
npm run test:e2e           # End-to-end workflows

# Manual testing setup - auto-finds available ports
npm run test:app-server &   # Start test app
npm run test:ui &          # Start UI server
```

## 📊 What Gets Tested

### **🔧 Core DOM Methods**
- Element selection (`querySelector`, `querySelectorAll`)
- Text manipulation (`getText`, `fillInput`)
- Interactions (`click`, `selectOption`, `check`)
- Wait strategies (`waitForSelector`, `waitForVisible`)
- Table operations (`getTableData`, `getTableRow`)

### **🖥️ UI Server & APIs**  
- Test file discovery and listing
- Test case extraction from files
- Test execution via REST API
- WebSocket connections for real-time logs
- HTML report generation

### **⚡ Performance & Caching**
- DOM query caching effectiveness
- Memory usage during operations
- Execution time measurements
- Resource cleanup validation

### **🔒 Security Features**
- Secure function execution
- Input validation and sanitization
- Error handling with proper context
- Code injection prevention

### **🎛️ Configuration System**
- Environment detection and switching
- Configuration value access/updates
- Validation of config structure
- Environment-specific overrides

### **📈 Error Scenarios**
- Configuration errors (wrong paths)
- Import/module resolution failures
- Network timeouts and failures
- Malformed test result handling

## 🎪 Complete Test Workflow

1. **Automated Setup**: Servers start automatically
2. **Core Testing**: Unit tests validate individual functions  
3. **Integration**: API endpoints and server functionality
4. **End-to-End**: Complete user workflows with real interactions
5. **Reporting**: Comprehensive test reports generated
6. **Cleanup**: Servers stopped automatically

## 🐛 Troubleshooting

### **Port Management** 
✅ **Automatic Port Finding**: Servers now automatically find available ports!
- If preferred port is in use, it tries to free it
- If that fails, finds the next available port
- No more manual port conflict resolution needed

### **Manual Port Conflicts** (if needed)
```bash
# Kill existing processes manually
lsof -ti:3000 | xargs kill -9  # UI Server
lsof -ti:8080 | xargs kill -9  # Test App
```

### **Test Failures**
```bash
# Run with verbose output
npm run test:all -- --reporter=verbose

# Run specific failing test
npx vitest run tests/path/to/failing.test.js
```

### **Server Issues**
```bash
# Check if servers are running
curl http://localhost:8080/health  # Test app
curl http://localhost:3000/        # UI server
```

## 📄 Test Reports

After running tests, check these files:
- `TEST_REPORT.md` - Comprehensive test summary (Markdown)
- `test-report.html` - **Beautiful HTML dashboard** with visual charts
- `automationTestReport.html` - Legacy visual test results  
- Console output - Real-time test execution details

### **🌐 HTML Test Report Features:**
```bash
npm run test:report         # Generate sample HTML report
npm run test:all           # Runs tests + generates HTML report
```

**HTML Report includes:**
- 📊 Visual dashboard with statistics
- 🎯 Progress bars and success rates
- 📋 Test suite status indicators  
- 🎨 Beautiful responsive design
- 📱 Mobile-friendly layout
- 🔍 Detailed coverage breakdown

---

*Run `npm run test:all` to validate all framework functionality!* 🚀