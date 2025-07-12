import WebSocket from 'ws';
import fetch from 'node-fetch';

async function waitForDebuggerReady(port = 9222, retries = 20) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`http://localhost:${port}/json`, {
                timeout: 2000 // 2 second timeout
            });
            const targets = await res.json();
            if (targets && targets.length > 0) {
                return targets;
            }
        } catch (err) {
            console.log(`🔄 Waiting for Chrome to be ready... [Attempt ${i + 1}/${retries}]`);
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    throw new Error(`❌ Chrome not responding on port ${port} after ${retries} attempts`);
}

export async function connectToChrome(port = 9222) {
    const targets = await waitForDebuggerReady(port);
    
    if (!targets || targets.length === 0) {
        throw new Error(`❌ No Chrome targets available on port ${port}`);
    }
    
    const wsUrl = targets[0].webSocketDebuggerUrl;
    if (!wsUrl) {
        throw new Error(`❌ No WebSocket URL available from Chrome target`);
    }

    const ws = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error(`❌ WebSocket connection timeout on port ${port}`));
        }, 10000); // 10 second timeout
        
        ws.once('open', () => {
            clearTimeout(timeout);
            console.log(`✅ Connected to Chrome WebSocket`);
            resolve(ws);
        });
        
        ws.once('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`❌ WebSocket connection failed: ${error.message}`));
        });
    });
}