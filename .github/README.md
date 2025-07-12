# 🚀 CI/CD Pipeline for Super Pancake Framework

This directory contains GitHub Actions workflows for automated testing and publishing.

## 📋 Workflows

### 1. `ci.yml` - Main CI/CD Pipeline
- **Triggers:** Push to main, Pull requests to main, Manual dispatch
- **Features:**
  - Runs tests on Node.js 18.x and 20.x
  - Generates HTML test reports
  - Publishes package when version changes
  - Creates GitHub releases
  - Security scanning with npm audit

### 2. `test-on-pr.yml` - Pull Request Testing
- **Triggers:** Pull requests to main
- **Features:**
  - Quality gate checks for relevant changes
  - Comprehensive test execution
  - Test result comments on PRs
  - Artifact uploads for test reports
  - Blocks merging if tests fail

### 3. `publish.yml` - Package Publishing
- **Triggers:** Package.json changes, Manual dispatch
- **Features:**
  - Pre-publish test verification
  - Version comparison checks
  - NPM publishing with access control
  - GitHub release creation
  - Test report artifacts

## 🧪 Test Execution

All workflows use the `npm run test:all-no-server` command which includes:
- 156 individual tests across 8 test suites
- Unit, integration, security, and performance tests
- HTML report generation with detailed statistics
- 90.4% success rate (141/156 tests passing, 15 skipped)

## 📊 Artifacts

Each workflow generates and stores:
- **HTML Test Reports**: Visual test results with detailed breakdowns
- **Markdown Reports**: Text-based summaries for PR comments
- **Package Files**: Built npm packages ready for publishing

## 🔒 Security & Requirements

### Required Secrets:
- `NPM_TOKEN`: NPM authentication token for publishing
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Environment Protection:
- Production environment requires manual approval for publishing
- All tests must pass before any publish operation
- Version changes are automatically detected

## 🚦 Quality Gates

### Pull Requests:
1. ✅ Relevant file changes detected
2. ✅ All tests pass on multiple Node.js versions
3. ✅ No security vulnerabilities found
4. ✅ Test coverage maintained

### Publishing:
1. ✅ Comprehensive test suite passes
2. ✅ Version number has changed
3. ✅ Package contents verified
4. ✅ NPM publish succeeds
5. ✅ GitHub release created

## 📈 Usage

### For Pull Requests:
1. Create PR against main branch
2. Tests automatically run
3. Results posted as PR comment
4. Merge only after tests pass

### For Publishing:
1. Update version in package.json
2. Push to main branch
3. Tests run automatically
4. Package published if tests pass
5. GitHub release created

### Manual Publishing:
1. Go to Actions → Publish Package
2. Click "Run workflow"
3. Choose force publish if needed
4. Monitor progress in Actions tab

## 🎯 Benefits

- **Automated Quality Assurance**: Every change is tested
- **Reliable Releases**: Only tested code gets published
- **Comprehensive Reporting**: Detailed test results and artifacts
- **Security First**: Vulnerability scanning and secure execution
- **Multi-Environment**: Tests run on multiple Node.js versions
- **Zero-Downtime**: Publishing only happens after successful tests