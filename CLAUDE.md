# Claude Memory for Super Pancake Automation Framework

## File Reading Guidelines
- When reading large files (>25000 tokens), always use `offset` and `limit` parameters
- Use the Grep tool to search for specific content instead of reading entire large files
- Example: `Read file_path="/path/to/large/file.js" offset=100 limit=50` to read lines 100-150

## Project Structure
- Main entry: `index.js`
- Reporter system: `reporter/htmlReporter.js` (large file - use offset/limit)
- Test report generator: `scripts/test-report-generator.js`
- NPM package: `super-pancake-automation`

## Known Issues Fixed
- Report opening mechanism in `test-report-generator.js` was using shell `open` command instead of npm `open` package
- Fixed to use cross-platform npm `open` package for proper browser opening

## Dependencies
- Uses `open` npm package for cross-platform file opening
- Express server for UI testing
- Vitest for testing framework