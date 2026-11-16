const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arachne', {
    comecarArraste: () => ipcRenderer.send('arraste-inicio'),
    arrastar: (dx, dy) => ipcRenderer.send('arraste-mover', dx, dy),
    // A página entrega uma função e ela é chamada a cada recado do mouse
    aoMoverMouse: (funcao) => ipcRenderer.on('mouse-global', (evento, x, y) => funcao(x, y))
});