const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getApiKey: () => ipcRenderer.invoke('get-api-key')
})
