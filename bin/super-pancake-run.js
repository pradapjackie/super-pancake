#!/usr/bin/env node

import { exec } from 'child_process';

exec('npx vitest run', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ Error running tests:', err.message);
        return;
    }
    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
});