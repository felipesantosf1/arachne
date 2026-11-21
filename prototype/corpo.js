// corpo.js — o corpo no desktop: patas, andar, cair e mouse atravessando a janela

// ---------- Emoções nas patas ----------
// kn: altura dos joelhos | ft: pés levantados | spr: abre (+) ou fecha (-) as patas
// lw: amplitude do balanço (px) | lf: ritmo do balanço
const PATAS_PADRAO = { kn: 0, ft: 0, spr: 0, lw: 2, lf: 1.2 };
const PATAS = {
    normal:   {},
    curioso:  { kn: 10, lw: 3, lf: 1.6 },
    feliz:    { spr: 6, lw: 9, lf: 6 },
    triste:   { kn: -35, spr: -10, lw: .8, lf: .5 },
    medo:     { kn: 30, ft: 30, spr: -25, lw: 5, lf: 10 },
    surpreso: { kn: 20, ft: 18, spr: 10, lw: 1, lf: 1 },
    bravo:    { kn: 15, spr: 25, lw: 6, lf: 4 },
    sono:     { kn: -45, spr: -30, lw: .5, lf: .3 }
};
for (const k in E) Object.assign(E[k], PATAS_PADRAO, PATAS[k]);   // soma os valores das patas a cada emoção
Object.assign(cur, PATAS_PADRAO);   // cur precisa ter as chaves para a suavização funcionar
Object.assign(tgt, E[emo]);

// ---------- Geometria das patas ----------
// lado direito; o esquerdo é o espelho (dd = -1)
const PB = [[145, 205], [142, 232], [130, 258], [110, 280]];   // onde a pata nasce (lateral da cabeça)
const PK = [[225, 135], [248, 170], [252, 212], [236, 256]];   // joelho em repouso
const PF = [285, 262, 240, 215];                               // x do pé em repouso
const SOLO = 350;                                              // y do chão no desenho
$('#legs').innerHTML = '<path class="pr"/>'.repeat(8) + '<path class="pc"/>'.repeat(8);   // 8 contornos + 8 patas
const PR = $$('.pr'), PC = $$('.pc'), externo = $('#externo'), rosto = $('#rosto');

// ---------- Estado do corpo ----------
const VEL = 70;     // velocidade de andar (px/s)
const PASSO = 50;   // comprimento de uma passada completa (px)
let px = 0, py = 0;               // posição da janela na tela (px)
let wvy = 0;                      // velocidade de queda da janela (px/s)
let area = null;                  // área útil da tela (sem a barra de tarefas)
let dimJ = { l: 0, a: 0 };        // largura e altura da janela (px)
let pronto = false;               // já sabemos onde a janela está?
let vx = 0;                       // velocidade horizontal (px/s)
let face = 0;                     // direção do olhar: -1 esquerda, 0 parada, 1 direita
let fase = 0;                     // ponto da passada (rad)
let uX = NaN, uY = NaN;           // última posição enviada ao main.js
const modo = { dir: 0, ate: 0 };  // dir: -1 esquerda, 0 parada, 1 direita | ate: até quando (ms)
let hover = false;                // mouse está sobre a aranha?
let interativo = false;           // janela está sólida agora?
let estavaArrastando = false;     // para detectar o momento em que soltou

// Pergunta ao main.js onde a janela está e qual é a área útil
function sincronizar(e) {
    px = e.x; py = e.y; area = e.area;
    dimJ = { l: e.largura, a: e.altura };
    wvy = 0; uX = NaN; uY = NaN; pronto = true;
}
if (window.arachne) window.arachne.estado().then(sincronizar);

// ---------- Patas: o desenho de cada quadro ----------
function desenharPatas(t) {
    for (let j = 0; j < 8; j++) {
        const dd = j < 4 ? -1 : 1, i = j % 4;   // dd: lado (esquerdo/direito) | i: qual das 4 patas
        // alterna: metade levanta enquanto a outra metade apoia
        const phi = fase + Math.PI * ((i + (dd > 0 ? 1 : 0)) % 2);
        const lift = Math.max(0, Math.sin(phi)) * Math.abs(face);   // 0..1 (só levanta ao andar)
        const sweep = -Math.cos(phi) * face * 28;                   // pé: para trás no apoio, para frente no ar (px)
        const bal = Math.sin(t * cur.lf + j * .9) * cur.lw;         // balanço da emoção (px)

        const fx = 200 + dd * (PF[i] + cur.spr) + sweep + bal * .5;   // pé x
        const fy = SOLO - lift * 26 - cur.ft - Math.abs(bal) * .4;    // pé y
        const kx = 200 + dd * PK[i][0] + (fx - 200 - dd * PF[i]) * .5;   // joelho acompanha metade do pé
        const ky = PK[i][1] - cur.kn - lift * 16 - Math.abs(bal) * .6;   // joelho y

        const d = `M${200 + dd * PB[i][0]} ${PB[i][1]}L${kx} ${ky}L${fx} ${fy}`;   // base → joelho → pé
        PR[j].setAttribute('d', d); PC[j].setAttribute('d', d);
    }
}

// ---------- Laço do corpo: andar, cair, virar e desenhar ----------
let ult = performance.now();   // instante do quadro anterior (ms)
function loopCorpo(n) {
    const dt = Math.min(.05, (n - ult) / 1000); ult = n;   // tempo entre quadros (s), limitado a 50 ms
    const t = n / 1000;                                    // tempo total (s)

    if (pronto && (arrastando || press)) {   // mouse segurando: a janela é dele
        vx = 0; modo.ate = n + 1500;
        if (arrastando) estavaArrastando = true;
    } else if (estavaArrastando) {           // acabou de soltar: descobre onde ficou
        estavaArrastando = false; pronto = false;
        window.arachne.estado().then(sincronizar);
    } else if (pronto) {
        const chao = area.y + area.height - dimJ.a;           // y da janela quando os pés tocam o chão
        const minX = area.x, maxX = area.x + area.width - dimJ.l;   // limites laterais

        if (py < chao - 1) {   // no ar: cai com gravidade
            wvy += 1800 * dt;                   // gravidade da janela (px/s²)
            py = Math.min(chao, py + wvy * dt);
            if (py >= chao) { if (wvy > 300) qs = .15; wvy = 0; }   // pousou: amassadinha
            vx = 0;
        } else {               // no chão: decide se anda
            py = chao;
            const livre = (emo === 'normal' || emo === 'curioso') && base !== 'sono' && !hover;   // só anda tranquila
            let dir = 0;
            if (livre) {
                if (n > modo.ate) {
                    if (modo.dir) { modo.dir = 0; modo.ate = n + 2500 + Math.random() * 5000; }            // para um pouco
                    else { modo.dir = Math.random() < .5 ? -1 : 1; modo.ate = n + 2000 + Math.random() * 4000; }   // anda
                }
                if (px <= minX + 2 && modo.dir) modo.dir = 1;    // bateu na borda: volta
                if (px >= maxX - 2 && modo.dir) modo.dir = -1;
                dir = modo.dir;
            } else modo.ate = n + 800;
            vx += (dir * VEL - vx) * Math.min(1, dt * 5);   // acelera e freia suavemente
            if (!dir && Math.abs(vx) < 1) vx = 0;
        }

        px = Math.max(minX, Math.min(maxX, px + vx * dt));
        fase += Math.abs(vx * dt) / PASSO * 2 * Math.PI;   // passada avança com a distância percorrida
        const X = Math.round(px), Y = Math.round(py);
        if (X !== uX || Y !== uY) { uX = X; uY = Y; window.arachne.moverJanela(X, Y); }   // só envia se mudou
    }

    // Olha na direção do movimento: corpo inclina, rosto desliza e o corpo balança a cada passo
    face = vx / VEL;
    externo.setAttribute('transform', `translate(0 ${-Math.abs(Math.sin(fase)) * 3 * Math.abs(face)}) rotate(${face * 5} 200 330)`);
    rosto.setAttribute('transform', `translate(${face * 16} 0)`);
    desenharPatas(t);
    requestAnimationFrame(loopCorpo);
}
requestAnimationFrame(loopCorpo);

// ---------- Mouse atravessa as partes vazias ----------
// A janela começa "fantasma" e só fica sólida com o cursor sobre a aranha
if (window.arachne) {
    window.arachne.aoMoverMouse((x, y) => {
        const el = document.elementFromPoint(x, y);
        hover = !!(el && el.closest('#root'));   // cursor sobre alguma parte da aranha?
        const quer = hover || press;             // durante o arraste continua sólida
        if (quer !== interativo) { interativo = quer; window.arachne.interativo(quer); if (quer) act(true); }
    });
    // Clique direito: menu com "Sair"
    s.addEventListener('contextmenu', e => { e.preventDefault(); window.arachne.menu(); });
}