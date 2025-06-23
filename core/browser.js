import WebSocket from 'ws';
import fetch from 'node-fetch';

async function waitForDebuggerReady(port = 9222, retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`http://localhost:${port}/json`);
            return await res.json();
        } catch (err) {
            console.log(`🔄 Waiting for Chrome to be ready... [Attempt ${i + 1}]`);
            await new Promise(res => setTimeout(res, 500));
        }
    }
    throw new Error(`❌ Chrome not responding on port ${port}`);
}

export async function connectToChrome(port = 9222) {
    const targets = await waitForDebuggerReady(port);
    const wsUrl = targets[0].webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.once('open', resolve));
    console.log(`✅ Connected to Chrome WebSocket`);
    return ws;
}