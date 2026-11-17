const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arachne', {
    // arraste
    comecarArraste: () => ipcRenderer.send('arraste-inicio'),
    arrastar: (dx, dy) => ipcRenderer.send('arraste-mover', dx, dy),
    // mouse da tela inteira (x, y relativos à janela; sx, sy na tela)
    aoMoverMouse: (funcao) => ipcRenderer.on('mouse-global', (evento, x, y, sx, sy) => funcao(x, y, sx, sy)),
    // corpo
    estado: () => ipcRenderer.invoke('estado'),
    moverJanela: (x, y) => ipcRenderer.send('mover-janela', x, y),
    interativo: (sim) => ipcRenderer.send('interativo', sim),
    menu: () => ipcRenderer.send('menu')
});