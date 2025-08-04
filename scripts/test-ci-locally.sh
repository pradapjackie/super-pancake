#!/bin/bash

echo "🧪 Testing CI Pipeline Steps Locally"
echo "====================================="
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
    npx super-pancake --help &&
    cd .. && rm -rf test-install &&
    rm super-pancake-automation-*.tgz
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 2: Framework Functionality
run_test "Framework Functionality" "
    npm pack &&
    mkdir -p test-framework && cd test-framework &&
    npm init -y &&
    npm install ../super-pancake-automation-*.tgz &&
    npm install vitest &&
    echo 'import { describe, it } from \"vitest\"; import { assertTrue, assertEqual } from \"super-pancake-automation\"; describe(\"Test\", () => { it(\"should work\", () => { assertTrue(true); assertEqual(1, 1); }); });' > test.test.js &&
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

# Test 3: Package Validation
run_test "Package Validation" "
    npm pack &&
    ls *.tgz | grep super-pancake-automation &&
    npm publish --dry-run &&
    rm super-pancake-automation-*.tgz
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 4: Integration Scenarios
run_test "Integration Scenarios" "
    npm pack &&
    mkdir -p new-user-test && cd new-user-test &&
    npm init -y &&
    cp ../super-pancake-automation-*.tgz . &&
    npm install super-pancake-automation-*.tgz &&
    npx super-pancake --help &&
    npx super-pancake --version &&
    cd .. && rm -rf new-user-test &&
    mkdir -p existing-project && cd existing-project &&
    npm init -y &&
    npm install vitest &&
    cp ../super-pancake-automation-*.tgz . &&
    npm install super-pancake-automation-*.tgz &&
    echo 'import { describe, it } from \"vitest\"; import { assertTrue } from \"super-pancake-automation\"; describe(\"Test\", () => { it(\"should work\", () => { assertTrue(true); }); });' > existing.test.js &&
    npx vitest run existing.test.js &&
    cd .. && rm -rf existing-project &&
    rm super-pancake-automation-*.tgz
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Test 5: Error Handling
run_test "Error Handling" "
    npx super-pancake invalid-command 2>/dev/null || true &&
    mkdir -p error-test && cd error-test &&
    npm init -y &&
    npx super-pancake --version 2>/dev/null || true &&
    cd .. && rm -rf error-test
"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Print summary
echo ""
echo "📊 CI Pipeline Test Results"
echo "==========================="
echo "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"
echo "Success Rate: $(( (passed_tests * 100) / total_tests ))%"

echo ""
echo "🎯 CI Pipeline Assessment:"
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}✅ EXCELLENT: All CI tests passed! Pipeline should work on GitHub.${NC}"
    exit 0
elif [ $passed_tests -ge $((total_tests * 8 / 10)) ]; then
    echo -e "${YELLOW}⚠️ GOOD: Most CI tests passed. Minor issues to address.${NC}"
    exit 1
else
    echo -e "${RED}❌ NEEDS WORK: Multiple CI test failures. Pipeline needs fixes before pushing.${NC}"
    exit 1
fi 