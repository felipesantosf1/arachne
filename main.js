// main.js — processo principal: cria a janela, vigia o mouse e atende pedidos da página
const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');

// ---------- Tamanho do pet ----------
const ESCALA = 0.42;                        // fator de redução da aranha
const LARGURA = Math.round(500 * ESCALA);   // largura da janela (px)
const ALTURA = Math.round(295 * ESCALA);    // altura da janela (px)

let janela;                // a janela do pet
let posInicial = [0, 0];   // posição da janela ao começar a arrastar [x, y]

// ---------- Criar a janela ----------
function criarJanela() {
    const area = screen.getPrimaryDisplay().workArea;   // tela sem a barra de tarefas

    janela = new BrowserWindow({
        width: LARGURA,
        height: ALTURA,
        x: area.x + area.width - LARGURA - 40,   // canto inferior direito
        y: area.y + area.height - ALTURA,        // "pés" logo acima da barra de tarefas
        transparent: true,     // fundo invisível
        frame: false,          // sem borda nem barra de título
        alwaysOnTop: true,     // fica por cima das outras janelas
        resizable: false,
        hasShadow: false,      // sem sombra da janela (macOS)
        skipTaskbar: true,     // não aparece na barra de tarefas
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')   // liga a ponte (window.arachne)
        }
    });

    janela.setIgnoreMouseEvents(true);   // começa "fantasma"; o corpo.js a torna sólida sobre a aranha
    janela.setAlwaysOnTop(true, 'screen-saver');   // nível acima da barra de tarefas (no Windows, "floating" fica abaixo dela)

    janela.loadFile(path.join(__dirname, 'prototype', 'index.html'), {
        query: { modo: 'desktop' }       // vira index.html?modo=desktop
    }).catch(console.error);

    // Sem moldura não há "X"; por enquanto Esc fecha o programa
    janela.webContents.on('before-input-event', (evento, input) => {
        if (input.type === 'keyDown' && input.key === 'Escape') app.quit();
    });

    iniciarRastreioDoMouse();
}

// ---------- Rastreio do mouse ----------
// Lê o mouse da tela inteira e avisa a página (coordenadas relativas à janela)
function iniciarRastreioDoMouse() {
    let ultimo = '';   // última posição enviada, para não repetir
    setInterval(() => {
        if (!janela || janela.isDestroyed()) return;

        const p = screen.getCursorScreenPoint();   // mouse na tela inteira
        const b = janela.getContentBounds();       // onde a janela está na tela
        const x = p.x - b.x;                       // mouse relativo ao canto da janela
        const y = p.y - b.y;

        const chave = p.x + ',' + p.y + ',' + b.x + ',' + b.y;
        if (chave === ultimo) return;              // nada mudou, não incomoda a página
        ultimo = chave;

        // envia também p.x, p.y (tela) para a página distinguir se o MOUSE andou ou só a janela
        janela.webContents.send('mouse-global', x, y, p.x, p.y);
    }, 16);   // ~60 vezes por segundo
}

// ---------- Arraste ----------
ipcMain.on('arraste-inicio', () => {
    posInicial = janela.getPosition();   // guarda onde a janela estava
});

ipcMain.on('arraste-mover', (evento, dx, dy) => {
    janela.setBounds({
        x: Math.round(posInicial[0] + dx),
        y: Math.round(posInicial[1] + dy),
        width: LARGURA,
        height: ALTURA
    });
});

// ---------- Corpo ----------
// A página pergunta: onde a janela está e qual é a área útil da tela?
ipcMain.handle('estado', () => {
    const [x, y] = janela.getPosition();
    const tela = screen.getDisplayMatching(janela.getBounds());
    return { x, y, area: tela.workArea, bounds: tela.bounds, largura: LARGURA, altura: ALTURA };
});

// A página pede para mover a janela (andar e cair)
ipcMain.on('mover-janela', (evento, x, y) => {
    janela.setBounds({ x, y, width: LARGURA, height: ALTURA });
});

// A página avisa se o mouse está sobre a aranha (sólida) ou fora (atravessa)
ipcMain.on('interativo', (evento, sim) => {
    janela.setIgnoreMouseEvents(!sim);
});

// ---------- Menu e ciclo de vida ----------
ipcMain.on('menu', () => {
    Menu.buildFromTemplate([
        { label: 'Sair', click: () => app.quit() }
    ]).popup({ window: janela });
});

app.whenReady().then(criarJanela);                  // abre a janela quando o Electron estiver pronto
app.on('window-all-closed', () => app.quit());      // fechou tudo, encerra o programa