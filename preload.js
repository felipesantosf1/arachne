const { contextBridge, ipcRenderer } = require('electron');

// Expõe para a página só estas duas funções, e nada além disso (segurança)
contextBridge.exposeInMainWorld('arachne', {
    comecarArraste: () => ipcRenderer.send('arraste-inicio'),
    arrastar: (dx, dy) => ipcRenderer.send('arraste-mover', dx, dy)
});