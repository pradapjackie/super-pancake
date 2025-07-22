export async function takeScreenshot(session, format = 'png') {
  const { data } = await session.send('Page.captureScreenshot', {
    format,
    fromSurface: true
  });
  const buffer = Buffer.from(data, 'base64');
  const fs = await import('fs');
  fs.writeFileSync(`screenshot-${Date.now()}.${format}`, buffer);
}
