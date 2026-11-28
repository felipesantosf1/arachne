// preload.js — ponte entre a página e o main.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arachne', {
    // ---------- Arraste ----------
    comecarArraste: () => ipcRenderer.send('arraste-inicio'),              // guarda onde a janela estava
    arrastar: (dx, dy) => ipcRenderer.send('arraste-mover', dx, dy),       // desloca a janela dx, dy (px)

    // ---------- Mouse da tela inteira ----------
    aoMoverMouse: (funcao) => ipcRenderer.on('mouse-global', (evento, x, y, sx, sy) => funcao(x, y, sx, sy)),

    // ---------- Corpo ----------
    estado: () => ipcRenderer.invoke('estado'),                            // pergunta: posição da janela e área útil
    moverJanela: (x, y) => ipcRenderer.send('mover-janela', x, y),         // pede para mover a janela
    interativo: (sim) => ipcRenderer.send('interativo', sim),              // true = janela sólida, false = mouse atravessa
    menu: () => ipcRenderer.send('menu'),                                  // abre o menu do clique direito

    // ---------- Teia ----------
    fio: (...a) => ipcRenderer.send('fio', ...a),                             // aranha pede o desenho (sem args = apagar)
    aoDesenharFio: (f) => ipcRenderer.on('fio', (e, ...a) => f(...a)),        // o overlay recebe
    aoTesteFio: (f) => ipcRenderer.on('fio-teste', () => f())                 // aranha recebe o item do menu
});