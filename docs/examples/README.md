# 📚 Super Pancake Examples

This directory contains **educational examples** and **usage demonstrations** for the Super Pancake Automation Framework.

> **Note**: These are **not tests** - they're learning materials and code samples.

## 📋 Available Examples

### **Assertion Examples**
- **`assertion-examples.test.js`** (426 lines)  
  Complete demonstration of all 24+ assertion functions
  - Basic assertions: `assertEqual`, `assertTrue`, `assertExists`
  - Text assertions: `assertContainsText`, `assertMatch`
  - Numeric assertions: `assertGreaterThan`, `assertInRange`
  - Array assertions: `assertArrayIncludes`, `assertLength`

### **UI Interaction Examples**
- **`comprehensive-ui-interactions.test.js`** (400 lines)  
  Advanced UI automation patterns
  - Form handling and validation
  - Complex element interactions
  - Screenshot capture techniques
  - Error handling strategies

- **`ui-automation-examples-fixed.test.js`** (350 lines)  
  Practical UI automation scenarios
  - Real-world form testing
  - Navigation patterns
  - Element selection strategies

### **Timing and Synchronization**
- **`timing-and-waits-examples.test.js`** (242 lines)  
  Best practices for timing and waits
  - `waitForSelector` usage patterns
  - Handling dynamic content
  - Performance considerations
  - Timeout strategies

### **Advanced Features**
- **`advanced-framework-features.test.js`** (363 lines)  
  Advanced framework capabilities
  - Session management
  - Browser configuration
  - Custom setup patterns
  - Error recovery

### **Logging and Debugging** 
- **`test-with-individual-logs.test.js`** (282 lines)  
  Logging and debugging techniques
  - Test execution tracking
  - Debug output patterns
  - Error logging strategies

## 🚀 How to Use These Examples

### **1. Copy and Modify**
```bash
# Copy an example to your tests directory
cp docs/examples/assertion-examples.test.js tests/my-assertions.test.js

# Modify for your needs
```

### **2. Learn Patterns**
```javascript
// Study the patterns used in examples
import { assertEqual, assertTrue } from 'super-pancake-automation';

// Example pattern from assertion-examples.test.js
assertEqual(actualValue, expectedValue, 'Clear description of what is being tested');
```

### **3. Run Examples (Optional)**
```bash
# You can run examples to see them in action
npm test docs/examples/assertion-examples.test.js
```

## 📖 Related Documentation

- **[API Reference](../API.md)** - Complete function documentation
- **[Getting Started](../README.md)** - Framework setup and basics  
- **[Best Practices](../BEST_PRACTICES.md)** - Recommended patterns
- **[Templates](../../templates/)** - Ready-to-use test templates

## 💡 Contributing Examples

To add new examples:
1. Create descriptive, well-commented code
2. Include clear explanations of what each section demonstrates
3. Follow existing naming patterns
4. Add entry to this README

---

**Remember**: These are learning materials, not tests. For actual testing templates, see the `/templates/` directory.