const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Correctif écran noir sur PC anciens / Windows 7 (pilotes GPU incompatibles)
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');

// ─── Emplacement des données (persistant, propre à ton PC) ───
const userDataPath = app.getPath('userData');
const dataFile = path.join(userDataPath, 'dupont-data.json');

function loadData() {
  if (!fs.existsSync(dataFile)) {
    const initial = {
      artistes: [
        {
          id: 'ww',
          nom: 'WW',
          style: 'Artiste Mélodique · Urbain',
          bio: "Artiste à l'univers mélodique moderne mêlant énergie urbaine, esthétique contemporaine et identité forte.",
          photoUrl: '',
          spotifyUrl: '',
          youtubeUrl: '',
          appleMusicUrl: '',
          deezerUrl: '',
          paysEcoute: 14,
          statut: 'actif',
          ordre: 1
        },
        {
          id: 'joff',
          nom: 'Joff',
          style: 'Artiste Rap · Hip-Hop',
          bio: "Artiste au style rap et hip-hop affirmé, ancré dans la scène francophone.",
          photoUrl: '',
          spotifyUrl: '',
          youtubeUrl: '',
          appleMusicUrl: '',
          deezerUrl: '',
          paysEcoute: 1,
          statut: 'actif',
          ordre: 2
        }
      ],
      demandes: []
    };
    fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  } catch (e) {
    return { artistes: [], demandes: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050505',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── IPC : communication entre la fenêtre et les données ───
ipcMain.handle('data:get', () => loadData());

ipcMain.handle('data:save', (event, data) => {
  saveData(data);
  return true;
});

// Exporter les artistes dans un fichier prêt pour le site
ipcMain.handle('data:export', async (event, artistes) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter les artistes pour le site',
    defaultPath: path.join(app.getPath('desktop'), 'artistes-data.js'),
    filters: [{ name: 'Fichier JavaScript', extensions: ['js'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false };

  const sorted = [...artistes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  const content =
`/* ═══════════════════════════════════════
   ARTISTES DUPONT PRODUCTIONS
   Généré automatiquement par l'application Dupont Admin
   Ne modifie pas ce fichier à la main — utilise l'application.
   ═══════════════════════════════════════ */
window.DUPONT_ARTISTES = ${JSON.stringify(sorted, null, 2)};
`;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return { ok: true, path: result.filePath };
});
