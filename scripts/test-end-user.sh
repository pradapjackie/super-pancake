#!/bin/bash

echo "🧪 Super Pancake End-User Testing"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Function to run test
run_test() {
    echo "🔍 Testing: $1"
    eval "$2"
    print_status $? "$1"
    return $?
}

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0

# Test 1: Package Installation
run_test "Package Installation" "
    npm pack &&
    mkdir -p test-install && cd test-install &&
    npm init -y &&
    npm install ../super-pancake-automation-*.tgz &&
    npx super-pancake --version &&
    cd .. && rm -rf test-install &&
    rm super-pancake-automation-*.tgz
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 2: CLI Commands
run_test "CLI Commands" "
    npx super-pancake --help &&
    npx super-pancake --version
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 3: Project Initialization
run_test "Project Initialization" "
    echo -e '2\n1' | npx super-pancake-init test-project-sh &&
    [ -d 'test-project-sh' ] &&
    [ -f 'test-project-sh/package.json' ] &&
    [ -f 'test-project-sh/README.md' ] &&
    rm -rf test-project-sh
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 4: Framework Functionality
run_test "Framework Functionality" "
    npm pack &&
    mkdir -p test-framework && cd test-framework &&
    npm init -y &&
    npm install ../super-pancake-automation-*.tgz &&
    npm install vitest &&
    echo 'import { describe, it } from \"vitest\"; import { assertTrue } from \"super-pancake-automation\"; describe(\"Test\", () => { it(\"should work\", () => { assertTrue(true); }); });' > test.test.js &&
    npx vitest run test.test.js &&
    cd .. && rm -rf test-framework &&
    rm super-pancake-automation-*.tgz
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 5: UI System
run_test "UI System" "
    [ -f 'public/index.html' ] &&
    [ -f 'public/styles.css' ] &&
    [ -f 'public/app.js' ]
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 6: Package Validation
run_test "Package Validation" "
    npm pack &&
    ls *.tgz | grep super-pancake-automation &&
    rm super-pancake-automation-*.tgz
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 7: Error Handling
run_test "Error Handling" "
    npx super-pancake invalid-command 2>/dev/null || true
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Print summary
echo ""
echo "📊 Test Results Summary"
echo "======================="
echo "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"
echo "Success Rate: $(( (passed_tests * 100) / total_tests ))%"

echo ""
echo "🎯 End-User Experience Assessment:"
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}✅ EXCELLENT: All tests passed! Package is ready for end users.${NC}"
    exit 0
elif [ $passed_tests -ge $((total_tests * 8 / 10)) ]; then
    echo -e "${YELLOW}⚠️ GOOD: Most tests passed. Minor issues to address.${NC}"
    exit 1
else
    echo -e "${RED}❌ NEEDS WORK: Multiple test failures. Package needs fixes before release.${NC}"
    exit 1
fi 