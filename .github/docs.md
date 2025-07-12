# 🚀 CI/CD Pipeline for Super Pancake Framework

This directory contains GitHub Actions workflows for automated testing and manual publishing.

## 📋 Workflows

### 1. `ci.yml` - Continuous Integration
- **Triggers:** Push to main, Pull requests to main, Manual dispatch
- **Purpose:** Ensures code quality and test coverage
- **Features:**
  - Runs tests on Node.js 18.x and 20.x
  - Generates HTML test reports
  - Security scanning with npm audit
  - **NO automatic publishing** (quality gates only)

### 2. `test-on-pr.yml` - Pull Request Testing
- **Triggers:** Pull requests to main
- **Purpose:** Validates changes before merge
- **Features:**
  - Quality gate checks for relevant changes
  - Comprehensive test execution
  - Test result comments on PRs
  - Artifact uploads for test reports
  - **Blocks merging if tests fail**

### 3. `publish.yml` - Manual Package Publishing
- **Triggers:** Manual dispatch only
- **Purpose:** Controlled releases when ready
- **Features:**
  - Pre-publish test verification
  - Automatic version bumping
  - NPM publishing with access control
  - GitHub release creation
  - Custom release notes

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

### Dependency Management:
- Uses `package.json` only (no lock files)
- `npm install` for fresh dependency resolution
- Ensures latest compatible versions in CI

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
5. ✅ **Merge blocked until tests pass**

### Publishing (Manual Only):
1. ✅ Comprehensive test suite passes
2. ✅ Version automatically bumped
3. ✅ Package contents verified
4. ✅ NPM publish succeeds
5. ✅ GitHub release created

## 📈 Usage

### For Pull Requests:
1. Create PR against main branch
2. Tests automatically run on PR
3. Results posted as PR comment
4. **Cannot merge until tests pass**
5. Merge after approval + passing tests

### For Publishing (Manual):
1. Go to Actions → Manual Publish Package
2. Click "Run workflow"
3. Choose version type (patch/minor/major)
4. Add optional release notes
5. Workflow runs tests, bumps version, publishes
6. GitHub release created automatically

### Merging to Main:
1. Tests run automatically on merge
2. **NO automatic publishing**
3. Code is validated but not published
4. Publish manually when ready for release

## 🎯 Benefits

- **Automated Quality Assurance**: Every change is tested before merge
- **Manual Release Control**: You decide when to publish new versions
- **Reliable Releases**: Only tested code gets published
- **Comprehensive Reporting**: Detailed test results and artifacts
- **Security First**: Vulnerability scanning and secure execution
- **Multi-Environment**: Tests run on multiple Node.js versions
- **Protected Main Branch**: Tests must pass before any merge