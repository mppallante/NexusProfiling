import { app, BrowserWindow, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Server } from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiPort = Number(process.env.PORT ?? 3333);
let apiServer: Server | undefined;
let mainWindow: BrowserWindow | undefined;

async function startEmbeddedApi() {
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  const logsDir = path.join(userDataPath, 'logs');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  process.env.NEXUS_DATA_DIR = dataDir;
  process.env.NEXUS_LOG_DIR = logsDir;
  process.env.PORT = String(apiPort);
  process.env.NEXUS_SQL_WASM_PATH = path.join(process.resourcesPath, 'sql-wasm.wasm');

  const serverModule = await import(pathToFileURL(path.join(__dirname, '../dist-server/server/app.js')).href);
  const started = serverModule.startServer(apiPort, '127.0.0.1') as { server: Server };
  apiServer = started.server;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#0b0d10',
    title: 'NexusProfiling',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1:3333')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    await mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  if (app.isPackaged) {
    await startEmbeddedApi();
  }

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('before-quit', () => {
  apiServer?.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
