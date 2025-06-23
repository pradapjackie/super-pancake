let msgId = 0;

export function createSession(ws) {
    return {
        send: (method, params = {}) => {
            return new Promise((resolve) => {
                const id = ++msgId;
                ws.send(JSON.stringify({ id, method, params }));
                const listener = (msg) => {
                    const data = JSON.parse(msg);
                    if (data.id === id) {
                        ws.off('message', listener);
                        resolve(data.result);
                    }
                };
                ws.on('message', listener);
            });
        },
    };
}