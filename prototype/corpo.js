// ============================================================
// corpo.js — o CORPO no desktop: cair, arrastar e deixar o mouse atravessar.
// O desenho (pernas, rosto) vive no aranha.js; aqui só se move a JANELA.
// Carregue DEPOIS do code.js (usa: svg, press, arrastando, emo, base, act, qs)
// ============================================================

const VEL = 70;                  // velocidade de andar (px/s)
const ANDAR_SOZINHA = false;     // andar pela tela fica DESLIGADO até a etapa 6 (veja a explicação)

let px = 0, py = 0, wvy = 0, area = null, dimJ = { l: 0, a: 0 }, pronto = false, vx = 0, uX = NaN, uY = NaN;
const modo = { dir: 0, ate: 0 };   // dir: -1 esquerda, 0 parada, 1 direita
let hover = false, interativo = false, estavaArrastando = false;

// Pergunta ao main.js onde a janela está e qual é a área útil da tela
function sincronizar(e) {
    px = e.x; py = e.y; area = e.area; dimJ = { l: e.largura, a: e.altura };
    wvy = 0; uX = NaN; uY = NaN; pronto = true;
}
if (window.arachne) window.arachne.estado().then(sincronizar);

// ---------- Laço do corpo: cair, (andar) e mover a janela ----------
let ult = performance.now();
function loopCorpo(n) {
    const dt = Math.min(0.05, (n - ult) / 1000);
    ult = n;

    if (pronto && (arrastando || press)) {          // o mouse está segurando: a janela é dele
        vx = 0; modo.ate = n + 1500;
        if (arrastando) estavaArrastando = true;
    } else if (estavaArrastando) {                  // acabou de ser solta: descobre onde ficou
        estavaArrastando = false; pronto = false;
        window.arachne.estado().then(sincronizar);
    } else if (pronto) {
        const chao = area.y + area.height - dimJ.a, minX = area.x, maxX = area.x + area.width - dimJ.l;

        if (py < chao - 1) {                        // no ar: cai com gravidade
            wvy += 1800 * dt; py = Math.min(chao, py + wvy * dt);
            if (py >= chao) { if (wvy > 300) qs = 0.15; wvy = 0; }   // pousou: amassadinha
            vx = 0;
        } else {                                    // no chão: decide se anda
            py = chao;
            const livre = ANDAR_SOZINHA && (emo === 'normal' || emo === 'curioso') && base !== 'sono' && !hover;
            let dir = 0;
            if (livre) {
                if (n > modo.ate) {
                    if (modo.dir) { modo.dir = 0; modo.ate = n + 2500 + Math.random() * 5000; }            // para um pouco
                    else { modo.dir = Math.random() < 0.5 ? -1 : 1; modo.ate = n + 2000 + Math.random() * 4000; } // anda
                }
                if (px <= minX + 2 && modo.dir) modo.dir = 1;    // bateu na borda: volta
                if (px >= maxX - 2 && modo.dir) modo.dir = -1;
                dir = modo.dir;
            } else modo.ate = n + 800;
            vx += (dir * VEL - vx) * Math.min(1, dt * 5);        // acelera e freia suavemente
            if (!dir && Math.abs(vx) < 1) vx = 0;
        }

        px = Math.max(minX, Math.min(maxX, px + vx * dt));
        const X = Math.round(px), Y = Math.round(py);
        if (X !== uX || Y !== uY) { uX = X; uY = Y; window.arachne.moverJanela(X, Y); }
    }

    requestAnimationFrame(loopCorpo);
}
if (window.arachne) requestAnimationFrame(loopCorpo);   // no navegador não há janela para mover

// ---------- Mouse atravessa as partes vazias da janela ----------
// A janela começa "fantasma" (ignora o mouse). Só fica sólida quando o cursor está sobre o corpo.
if (window.arachne) {
    window.arachne.aoMoverMouse((x, y) => {
        const e = document.elementFromPoint(x, y);
        hover = !!(e && e.closest('#bodyG'));            // o cursor está sobre algum pedaço da aranha?
        const quer = hover || press;                     // durante o arraste continua sólida
        if (quer !== interativo) { interativo = quer; window.arachne.interativo(quer); if (quer) act(true); }
    });
    // Clique direito: menu com "Sair"
    svg.addEventListener('contextmenu', e => { e.preventDefault(); window.arachne.menu(); });
}