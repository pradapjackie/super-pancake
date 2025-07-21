#!/bin/bash

# Run Stability Report Generator for Super Pancake Framework
# This script executes the stability report generator and provides output

echo "🎯 Super Pancake Framework - Stability Report Generator"
echo "========================================================"
echo ""

# Change to the project directory
cd "$(dirname "$0")/.."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

echo "📊 Generating comprehensive stability report..."
echo ""

# Run the stability report generator
node scripts/generate-stability-report.js

# Check if the report was generated successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Stability report generated successfully!"
    echo ""
    echo "📋 Report files created:"
    if [ -d "stability-reports" ]; then
        ls -la stability-reports/
    else
        echo "⚠️ No stability-reports directory found"
    fi
    echo ""
    echo "🔍 To view the latest report:"
    echo "   cat stability-reports/latest-stability-report.md"
    echo ""
    echo "📱 To view the executive summary:"
    echo "   cat stability-reports/executive-summary-*.md"
else
    echo ""
    echo "❌ Failed to generate stability report"
    exit 1
fi