const { app, BrowserWindow, protocol, net, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Keep an extra JSON copy in the project data folder, like the lecturer's tutorial.
// Local Storage remains the main storage used for Task 5.
ipcMain.handle('save-movies-json', (event, movies) => {
  // Only accept requests from our own MyMovie pages.
  if (!event.senderFrame?.url.startsWith('mymovie://app/')) {
    throw new Error('Invalid request source.');
  }
  if (!Array.isArray(movies)) throw new Error('Movies must be an array.');

  const jsonText = JSON.stringify(movies, null, 2);
  if (jsonText.length > 1_000_000) throw new Error('Watchlist is too large.');

  // In a packaged application, files inside the app are not writable.
  const dataFolder = app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(__dirname, 'data');
  fs.mkdirSync(dataFolder, { recursive: true });
  fs.writeFileSync(path.join(dataFolder, 'itenirarymovie.json'), jsonText + '\n', 'utf8');
  return true;
});

// Give both HTML pages the same secure origin, so they share localStorage.
protocol.registerSchemesAsPrivileged([
  { scheme: 'mymovie', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

app.whenReady().then(() => {
  const rendererFolder = path.join(__dirname, 'renderer');

  protocol.handle('mymovie', (request) => {
    const url = new URL(request.url);
    if (url.hostname !== 'app') return new Response('Not found', { status: 404 });

    let relativePath;
    try {
      relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    const filePath = path.resolve(rendererFolder, relativePath);
    if (!filePath.startsWith(rendererFolder + path.sep)) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  const win = new BrowserWindow({
    width: 1150,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  win.loadURL('mymovie://app/index.html');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
