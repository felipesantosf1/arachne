const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const TAMANHO = 320; // lado da janela, em pixels
let janela;                 // fora da função, para os recados enxergarem a janela
let posInicial = [0, 0];    // onde a janela estava quando o arraste começou

function criarJanela() {
    janela = new BrowserWindow({
        width: TAMANHO,
        height: TAMANHO,
        transparent: true,    // fundo invisível
        frame: false,         // sem borda nem barra de título
        alwaysOnTop: true,    // fica por cima das outras janelas
        resizable: false,
        hasShadow: false,      // tira a sombra da janela (macOS)
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')   // liga a portaria
        }
    });

    janela.loadFile(path.join(__dirname, 'prototype', 'index.html'), {
        query: { modo: 'desktop' }   // vira index.html?modo=desktop
    }).catch(console.error);

    // Sem moldura não existe o "X" para fechar. Por enquanto, Esc fecha o programa.
    janela.webContents.on('before-input-event', (evento, input) => {
        if (input.type === 'keyDown' && input.key === 'Escape') app.quit();
    });
    
    iniciarRastreioDoMouse();
}

// Pergunta ao sistema onde o mouse está e avisa a aranha, em coordenadas da JANELA
function iniciarRastreioDoMouse() {
    let ultimo = '';
    setInterval(() => {
        if (!janela || janela.isDestroyed()) return;

        const p = screen.getCursorScreenPoint();   // mouse na tela inteira
        const b = janela.getContentBounds();       // onde a janela está na tela
        const x = p.x - b.x;                       // mouse relativo ao canto da janela
        const y = p.y - b.y;

        const chave = x + ',' + y;
        if (chave === ultimo) return;              // nada mudou, não incomoda a página
        ultimo = chave;

        janela.webContents.send('mouse-global', x, y);
    }, 16);                                        // ~60 vezes por segundo
}

// o arraste começou, guarda a posição atual da janela
ipcMain.on('arraste-inicio', () => {
    posInicial = janela.getPosition();
});

// o mouse andou (dx, dy) desde o começo, então posição nova = inicial + deslocamento
ipcMain.on('arraste-mover', (evento, dx, dy) => {
    janela.setBounds({
        x: Math.round(posInicial[0] + dx),
        y: Math.round(posInicial[1] + dy),
        width: TAMANHO,
        height: TAMANHO
    });
});

app.whenReady().then(criarJanela);

app.on('window-all-closed', () => app.quit());

