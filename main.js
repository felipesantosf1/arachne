const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');

// ===== Tamanho do pet =====
const ESCALA = 0.42;
const LARGURA = Math.round(600 * ESCALA);
const ALTURA = Math.round(395 * ESCALA);

let janela;
let posInicial = [0, 0];

function criarJanela() {
    const area = screen.getPrimaryDisplay().workArea;   // tela sem a barra de tarefas

    janela = new BrowserWindow({
        width: LARGURA,
        height: ALTURA,
        x: area.x + area.width - LARGURA - 40,           // canto inferior direito
        y: area.y + area.height - ALTURA,                // "pés" logo acima da barra de tarefas
        transparent: true,    // fundo invisível
        frame: false,         // sem borda nem barra de título
        alwaysOnTop: true,    // fica por cima das outras janelas
        resizable: false,
        hasShadow: false,      // tira a sombra da janela (macOS)
        skipTaskbar: true,                               // não aparece como programa na barra
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')   // liga a portaria
        }
    });

    janela.setIgnoreMouseEvents(true);   // começa "fantasma"; o corpo.js a torna sólida sobre a aranha

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
// Pergunta ao sistema onde o mouse está e avisa a aranha
function iniciarRastreioDoMouse() {
    let ultimo = '';
    setInterval(() => {
        if (!janela || janela.isDestroyed()) return;

        const p = screen.getCursorScreenPoint();   // mouse na tela inteira
        const b = janela.getContentBounds();       // onde a janela está na tela
        const x = p.x - b.x;                       // mouse relativo ao canto da janela
        const y = p.y - b.y;

        const chave = p.x + ',' + p.y + ',' + b.x + ',' + b.y;
        if (chave === ultimo) return;              // nada mudou, não incomoda a página
        ultimo = chave;

        // manda também a posição na TELA (p.x, p.y), para a página saber
        // se foi o MOUSE que andou ou só a janela que se mexeu
        janela.webContents.send('mouse-global', x, y, p.x, p.y);
    }, 16);
}

// o arraste começou, guarda a posição atual da janela
ipcMain.on('arraste-inicio', () => {
    posInicial = janela.getPosition();
});

ipcMain.on('arraste-mover', (evento, dx, dy) => {
    janela.setBounds({
        x: Math.round(posInicial[0] + dx),
        y: Math.round(posInicial[1] + dy),
        width: LARGURA,
        height: ALTURA
    });
});


ipcMain.handle('estado', () => {
    const [x, y] = janela.getPosition();
    const area = screen.getDisplayMatching(janela.getBounds()).workArea;
    return { x, y, area, largura: LARGURA, altura: ALTURA };
});

// A página pede para mover a janela (andar e cair)
ipcMain.on('mover-janela', (evento, x, y) => {
    janela.setBounds({ x, y, width: LARGURA, height: ALTURA });
});

// A página avisa se o mouse está sobre a aranha (sólida) ou fora dela (atravessa)
ipcMain.on('interativo', (evento, sim) => {
    janela.setIgnoreMouseEvents(!sim);
});

// Clique direito: menu com "Sair"
ipcMain.on('menu', () => {
    Menu.buildFromTemplate([
        { label: 'Sair', click: () => app.quit() }
    ]).popup({ window: janela });
});

app.whenReady().then(criarJanela);

app.on('window-all-closed', () => app.quit());

