const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

function createWindow() {
  const win = new BrowserWindow({
    width: 700,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

// Register handler for get-api-key
ipcMain.handle('get-api-key', async () => {
  return process.env.GOOGLE_MAPS_API_KEY || '';
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
