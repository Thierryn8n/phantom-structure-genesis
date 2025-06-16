const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Settings API
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Testing API
  testConnection: () => ipcRenderer.invoke('test-connection'),
  testPrinter: () => ipcRenderer.invoke('test-printer'),
  
  // Impressão em lote
  printAllPending: () => ipcRenderer.invoke('print-all-pending'),
  
  // Detecção de múltiplos dispositivos
  checkMultipleDevices: () => ipcRenderer.invoke('check-multiple-devices'),
  
  // Listeners
  onConnectionStatus: (callback) => 
    ipcRenderer.on('connection-status', (_, connected) => callback(connected)),
    
  onMultipleDevicesUpdate: (callback) =>
    ipcRenderer.on('multiple-devices-update', (_, multipleDevices) => callback(multipleDevices)),
  
  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('connection-status');
    ipcRenderer.removeAllListeners('multiple-devices-update');
  }
}); 