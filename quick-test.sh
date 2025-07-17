#!/bin/bash

# Quick test script for super-pancake-setup
echo "🧪 Testing super-pancake-setup command..."

# Create input file with answers
cat > /tmp/setup-answers.txt << EOF
demo-project
Jose Demo
n
50
n
y
y
./screenshots
y
./report.html
n
25000
2
n
n
n
n
EOF

# Run setup with input file
super-pancake-setup < /tmp/setup-answers.txt

echo "📁 Checking generated project..."
if [ -d "demo-project" ]; then
    echo "✅ Project created successfully!"
    ls -la demo-project/
    echo "📄 Config file:"
    head -10 demo-project/super-pancake.config.js
else
    echo "❌ Project creation failed"
fi

# Cleanup
rm -f /tmp/setup-answers.txt