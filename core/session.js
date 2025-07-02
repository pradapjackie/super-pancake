let msgId = 0;

export function createSession(ws) {
    const send = (method, params = {}) => {
        return new Promise((resolve, reject) => {
            const id = ++msgId;
            ws.send(JSON.stringify({ id, method, params }));
            const listener = (msg) => {
                const data = JSON.parse(msg);
                if (data.id === id) {
                    ws.off('message', listener);
                    if (data.result) resolve(data.result);
                    else reject(data.error);
                }
            };
            ws.on('message', listener);
        });
    };

    return {
        send,

        // High-level helper methods
        async navigateTo(url) {
            await send('Page.enable');
            await send('Page.navigate', { url });
            await new Promise(resolve => {
                const listener = (msg) => {
                    const data = JSON.parse(msg);
                    if (data.method === 'Page.loadEventFired') {
                        ws.off('message', listener);
                        resolve();
                    }
                };
                ws.on('message', listener);
            });
        }
    };
}