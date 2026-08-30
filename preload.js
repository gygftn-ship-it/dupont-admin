const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dupontAPI', {
  getData: () => ipcRenderer.invoke('data:get'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  exportArtistes: (artistes) => ipcRenderer.invoke('data:export', artistes)
});
