const { app, BrowserWindow } = require('electron');
const path = require('path');

function criarJanela() {
    const janela = new BrowserWindow({ width: 520, height: 620 });
    janela.loadFile(path.join(__dirname, 'prototype', 'index.html'));
}

app.whenReady().then(criarJanela);

app.on('window-all-closed', () => app.quit());