// core/browserEvents.js

export function enableConsoleLogging(ws) {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.method === 'Runtime.consoleAPICalled') {
      const { type, args } = data.params;
      const message = args.map(arg => arg.value).join(' ');
      console.log(`[Browser Console][${type}] ${message}`);
    }
  });
}

export function enableRequestLogging(ws) {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.method === 'Network.requestWillBeSent') {
      const { url, method } = data.params.request;
      console.log(`🌐 [Request] ${method} ${url}`);
    }

    if (data.method === 'Network.responseReceived') {
      const { response } = data.params;
      console.log(`📥 [Response] ${response.status} ${response.url}`);
    }
  });
}

export function enableDialogHandling(ws, autoAccept = true, promptText = '') {
  ws.on('message', async (msg) => {
    const data = JSON.parse(msg);
    if (data.method === 'Page.javascriptDialogOpening') {
      const { message, type } = data.params;
      console.log(`🧾 [Dialog] ${type}: "${message}"`);

      ws.send(JSON.stringify({
        id: Date.now(),
        method: 'Page.handleJavaScriptDialog',
        params: {
          accept: autoAccept,
          promptText: promptText
        }
      }));
    }
  });
}

export async function enableAllEvents(ws, session, options = {}) {
  await session.send('Runtime.enable');
  await session.send('Network.enable');
  await session.send('Page.enable');

  enableConsoleLogging(ws);
  enableRequestLogging(ws);
  enableDialogHandling(ws, options.autoAcceptDialogs ?? true, options.promptText ?? '');
}
