#!/bin/bash

echo "🧹 Super Pancake Automation Framework - PR Cleanup Script"
echo "========================================================="
echo ""

# Function to safely remove files/directories
safe_remove() {
    local path="$1"
    local description="$2"
    
    if [ -e "$path" ]; then
        echo "🗑️  Removing: $description"
        rm -rf "$path"
        echo "   ✅ Removed: $path"
    else
        echo "   ⚠️  Not found: $path (already clean)"
    fi
}

echo "📋 Starting cleanup process..."
echo ""

# Remove major unnecessary directories
echo "🔸 Cleaning up temporary directories..."
safe_remove "temp-test-simplified/" "Temporary test directory"
safe_remove "test-app/" "Test app directory"
safe_remove "test-screenshots/" "Test screenshots directory"

echo ""
echo "🔸 Cleaning up generated files..."

# Remove generated reports
safe_remove "automationTestReport.html" "Generated automation test report"
safe_remove "sample-test-report.html" "Sample test report"
safe_remove "test-report.html" "Test report HTML"

# Remove development scripts
safe_remove "test-simulation.js" "Test simulation script"
safe_remove "quick-test.sh" "Quick test script"

echo ""
echo "🔸 Cleaning up screenshots and logs..."

# Remove screenshots (they should be gitignored anyway)
if [ -d "screenshots" ]; then
    screenshot_count=$(find screenshots/ -name "*.png" 2>/dev/null | wc -l)
    if [ "$screenshot_count" -gt 0 ]; then
        echo "🗑️  Removing $screenshot_count screenshot files..."
        find screenshots/ -name "*.png" -delete
        echo "   ✅ Removed screenshot files"
    else
        echo "   ⚠️  No screenshot files found"
    fi
fi

# Remove any log files (excluding node_modules)
log_count=$(find . -name "*.log" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$log_count" -gt 0 ]; then
    echo "🗑️  Removing $log_count log files..."
    find . -name "*.log" -not -path "./node_modules/*" -not -path "./.git/*" -delete
    echo "   ✅ Removed log files"
else
    echo "   ⚠️  No log files found"
fi

echo ""
echo "🔸 Cleaning up miscellaneous files..."

# Remove any backup files
find . -name "*~" -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null
find . -name "*.bak" -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null

# Remove any .DS_Store files (macOS)
find . -name ".DS_Store" -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null

echo ""
echo "🔸 Verifying .gitignore compliance..."

# Check if there are files that should be gitignored but aren't
gitignored_files=0

# Check for common files that should be gitignored
for pattern in "*.log" "*.png" "node_modules" ".DS_Store" "*.tmp"; do
    if git ls-files --ignored --exclude-standard | grep -q "$pattern" 2>/dev/null; then
        gitignored_files=$((gitignored_files + 1))
    fi
done

if [ "$gitignored_files" -gt 0 ]; then
    echo "   ⚠️  Found $gitignored_files files that should be gitignored"
    echo "   💡 Consider running: git rm --cached <filename>"
else
    echo "   ✅ No gitignored files found in repository"
fi

echo ""
echo "📊 Cleanup Summary:"
echo "==================="
echo "✅ Removed temporary directories"
echo "✅ Removed generated reports" 
echo "✅ Removed development scripts"
echo "✅ Removed screenshot files"
echo "✅ Removed log files"
echo "✅ Removed backup and system files"
echo ""

# Show final repository size
if command -v du >/dev/null 2>&1; then
    echo "📦 Current repository size:"
    du -sh . 2>/dev/null | grep -v "Permission denied" || echo "   Unable to calculate size"
    echo ""
fi

echo "🎉 Cleanup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes: git status"
echo "2. Stage the changes: git add ."
echo "3. Commit the cleanup: git commit -m 'chore: cleanup unnecessary files before PR'"
echo "4. Create your PR!"
echo ""
echo "💡 Tip: You can now safely delete this cleanup script:"
echo "   rm cleanup-before-pr.sh"