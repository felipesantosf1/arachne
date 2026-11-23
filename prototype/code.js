if (new URLSearchParams(location.search).get('modo') === 'desktop') document.documentElement.classList.add('desktop');
const $ = q => document.querySelector(q), $$ = q => [...document.querySelectorAll(q)];

// ---------- Emoção ----------
const cur = { ...EMO.normal };    // valores que aparecem na tela
const tgt = { ...EMO.normal };    // valores desejados: cur "persegue" tgt (transição suave)
let emo = 'normal';               // emoção do momento
let base = 'normal';              // emoção "de fundo", a que ela volta (normal ou sono)
let timer;
let rapidez = 5;                  // 5 = emoção "surge" devagar; ≥20 = instantâneo (surpresa)
const cv = {};                    // velocidade de cada valor (mola)
let settleUntil = 0;              // até quando os pés se ajeitam por inteiro (dormir/acordar)
let sustos = [];                  // Numero de sustos tomados

// ---------- Estado do corpo ----------
let by = 0, bv = 0;               // pulo: altura (negativo = no ar) e velocidade
let qs = 0, qv = 0;               // mola de amassar/esticar
let breathPhase = 0, hopPhase = 0;  // a fase AVANÇA (soma dt): mudar a velocidade não dá tranco

// ---------- Olhar ----------
let mx = innerWidth / 2, my = innerHeight / 2, pt = performance.now();
let lx = 0, ly = 0;               // para onde ela está virada (-1 a 1)
let wx = 0, wy = 0, gt = 0;       // olhar ao redor sozinha

// ---------- Tempo e piscadas ----------
let last = performance.now(), lastAct = last;
let blink = 0, nextBlink = 2000;
let lento = 0, faseLento = 0, proxLento = 2;
let afago = 0, mexS = 0, mxh = 0, myh = 0;     // cabeça no carinho (gato)
let pend = 0, pendV = 0, car = 0;            // balanço de pêndulo (radianos) e "quanto está carregada" (0 a 1)
let vxS = 0, vxAnt = 0, axS = 0, sxAnt = NaN;   // velocidade e aceleração da janela no arraste
const fl = new Array(EYES.length).fill(0);    // "tremida de luz" dos olhos secundários

// ---------- Interação ----------
let pet = 0, clk = [];
let calmaAte = 0;                 // depois de um susto, ela não se assusta de novo por um tempo
let press = false, arrastando = false, pressSx = 0, pressSy = 0;
let ultSx = NaN, ultSy = NaN;

// Troca de emoção. ms > 0: depois desse tempo ela volta para a emoção de fundo (base).
function set(n, ms) {
    if (n === 'surpreso' && emo !== 'surpreso' && by >= -1) bv = -320;              // pulinho de susto (só do chão)
    if (n === 'sono' || emo === 'sono') settleUntil = performance.now() / 1000 + 4; // dormir/acordar: pés se ajeitam
    emo = n;
    rapidez = n === 'surpreso' ? 30 : n === 'sono' ? 2.5 : 5;   // só a surpresa é brusca
    Object.assign(tgt, EMO[n]);
    clearTimeout(timer);
    if (ms) timer = setTimeout(() => set(base), ms);
    $$('.emotion-btn').forEach(b => b.classList.toggle('active', b.dataset.k === n));
}

// Registra atividade; se estava dormindo e é um "toque" de verdade (wake), acorda curiosa
function act(wake) {
    lastAct = performance.now();
    if (wake && base === 'sono') {
        base = 'normal';
        set('curioso', 1500);
    }
}

// ---------- Botões de teste (só aparecem no navegador) ----------
Object.keys(EMO).forEach(k => {
    const b = document.createElement('button');
    b.className = 'emotion-btn';
    b.dataset.k = k;
    b.textContent = NOME[k];
    b.onclick = () => {
        base = k === 'sono' ? 'sono' : 'normal';
        lastAct = performance.now();
        set(k, k === 'sono' ? 0 : 4000);
    };
    $('#btns').append(b);
});
{
    let escuro = false;
    const b = document.createElement('button');
    b.textContent = 'Fundo';
    b.onclick = () => { escuro = !escuro; document.body.style.background = escuro ? '#111111' : '#ffffff'; };
    $('#btns').append(b);
}

// ---------- Centro da aranha na tela ----------
function centro() {
    const r = svg.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height * 0.64, r.width];   // 0.64: onde fica o centro da cabeça no desenho
}

// ---------- Mouse ----------
// No Electron, o movimento vem da TELA INTEIRA (via main.js); no navegador, da própria página.
function moveuMouse(x, y, sx, sy) {
    const n = performance.now();
    const dist = Math.hypot(x - mx, y - my);
    const v = dist / Math.max(1, n - pt);
    const ox = mx, oy = my;
    pt = n; mx = x; my = y;

    // Quem andou: o MOUSE ou só a janela? Só o mouse conta como atividade.
    const real = sx === undefined || sx !== ultSx || sy !== ultSy;
    ultSx = sx; ultSy = sy;

    // Arraste (só no Electron): se o botão está apertado e o mouse andou, vira arraste
    if (press && window.arachne && sx !== undefined) {
        if (!arrastando && Math.hypot(sx - pressSx, sy - pressSy) > 4) {
            arrastando = true;
            set('carregada');
            pressSx = sx; pressSy = sy;            // a conta do arraste começa daqui (sem "pulo")
            window.arachne.comecarArraste();
        }
        if (arrastando) window.arachne.arrastar(sx - pressSx, sy - pressSy);
    }

    if (base !== 'sono') {
        if (real) lastAct = n;

        // Susto só se o movimento brusco for PERTO da aranha
        const [cx, cy, larg] = centro();
        const perto = Math.hypot(x - cx, y - cy) < larg * 0.6;
        if (real && v > 4 && perto && Math.hypot(x - cx, y - cy) < Math.hypot(ox - cx, oy - cy) && !arrastando && n > calmaAte && emo !== 'medo') {
            sustos = sustos.filter(s => n - s < 8000);
            sustos.push(n);
            if (sustos.length >= 3) set('medo', 3500);
            else set('surpreso', 900);
            calmaAte = n + 2500;      // 2,5 s de calma antes do próximo susto
        }

        const [ccx, ccy, lg] = centro(), s = lg / 360;
        const sobreCorpo = ((x - ccx) / (100 * s)) ** 2 + ((y - ccy + 5 * s) / (75 * s)) ** 2 < 1;
        if (real && sobreCorpo && v < 3 && !press && !arrastando && emo !== 'surpreso') {
            pet = Math.min(pet + dist, 120);
            if (pet >= 90) set('carinho', 1800);      // enquanto faz carinho, o tempo é renovado
        }
    }
}

if (window.arachne) window.arachne.aoMoverMouse(moveuMouse);
else addEventListener('pointermove', e => moveuMouse(e.clientX, e.clientY));

svg.addEventListener('pointerenter', () => act(true));

// Clique x arraste: ao apertar ainda não sabemos o que a pessoa quer. Só ao ver se o mouse andou.
svg.addEventListener('pointerdown', e => {
    press = true;
    arrastando = false;
    pressSx = isNaN(ultSx) ? e.screenX : ultSx;    // posição na TELA (não muda quando a janela se move)
    pressSy = isNaN(ultSy) ? e.screenY : ultSy;
    svg.setPointerCapture(e.pointerId);            // continua recebendo o mouse mesmo que ele saia da janela
    act(true);
});

svg.addEventListener('pointerup', () => {
    if (!press) return;
    press = false;
    if (arrastando) { arrastando = false; set(base); return; }   // foi arraste, então não conta como clique

    const n = performance.now();                      // foi clique
    clk = clk.filter(t => n - t < 2500);
    clk.push(n);
    if (by >= -1) { bv = -360; qs = -0.12; }          // só pula se estiver no chão
    set(clk.length >= 5 ? 'bravo' : 'feliz', 2500);   // 5 cliques seguidos: fica brava
});

svg.addEventListener('pointercancel', () => { if (arrastando) set(base); press = false; arrastando = false; });
addEventListener('keydown', () => act(true));

// Olhos secundários piscando aleatoriamente
(function flick() {
    if (emo !== 'sono') fl[[2, 3, 4, 5, 6, 7][Math.random() * 6 | 0]] = 1;
    setTimeout(flick, 1000 + Math.random() * 2500);
})();

// ---------- O laço principal ----------
function frame(n) {
    const dt = Math.min(0.05, (n - last) / 1000);
    last = n;
    const t = n / 1000;

    // 1. suaviza todos os valores em direção à emoção desejada
    for (const k in cur) {
        let d = tgt[k] - cur[k];
        if (k === 'h') d = ((d + 540) % 360) - 180;          // cor: caminho mais curto no círculo
        if (rapidez >= 20) { cur[k] += d * Math.min(1, dt * rapidez); cv[k] = 0; }   // surpresa: seco
        else {                                                // demais: mola, começa devagar e "surge"
            cv[k] = (cv[k] || 0) + (rapidez * rapidez * d - 2 * rapidez * (cv[k] || 0)) * dt;
            cur[k] += cv[k] * dt;
        }
    }
    cur.h = (cur.h + 360) % 360;

    // 2. 20 segundos sem atividade: dorme
    if (base !== 'sono' && n - lastAct > 20000) { base = 'sono'; set('sono'); }

    // 3. carinho esfria, piscadas
    pet = Math.max(0, pet - 120 * dt);
    nextBlink -= dt * 1000;
    if (nextBlink < 0) { blink = 1; nextBlink = 2000 + Math.random() * 3500; }
    blink = Math.max(0, blink - dt * 8);
        // piscada lenta de gato: só durante o carinho (~1,4 s, fecha no meio e reabre)
    if (emo === 'carinho') {
        proxLento -= dt;
        if (proxLento < 0 && faseLento === 0) { faseLento = 0.001; proxLento = 3 + Math.random() * 3; }
    }
    if (faseLento > 0) { faseLento += dt / 1.4; if (faseLento >= 1) faseLento = 0; }
    lento = faseLento > 0 ? Math.min(1, Math.sin(Math.PI * faseLento) * 1.3) : 0;
    for (let i = 0; i < fl.length; i++) fl[i] = Math.max(0, fl[i] - dt * 6);

    // 4. olhar: segue o cursor; parada há 4s, olha ao redor sozinha
    const [cx, cy, larg] = centro();
    let ax = mx - cx, ay = my - cy;
    if (base !== 'sono' && n - lastAct > 4000) {
        if (n > gt) {
            gt = n + 1500 + Math.random() * 2000;
            wx = Math.random() * 400 - 200;
            wy = Math.random() * 240 - 120;
        }
        ax = wx; ay = wy;
    }
    const d = Math.hypot(ax, ay) || 1;
    const m = Math.min(1, d / 200) * cur.lk;          // cur.lk: cada emoção segue o mouse num grau (sono = 0)
    const f = Math.min(1, dt * 10);
    lx += (ax / d * m - lx) * f;
    ly += (ay / d * m - ly) * f;
    const lyv = ly + cur.gb;                          // triste olha um pouco para baixo

    // 4b. cabeça no carinho (gato): vai até a mão, esfrega no ritmo, ergue o queixo, empurra quando a mão para
    afago += ((emo === 'carinho' ? 1 : 0) - afago) * Math.min(1, dt * 3);       // 0 a 1: o carinho está rolando
    mexS  += (Math.min(1, pet / 60) - mexS) * Math.min(1, dt * 8);              // a mão está se mexendo agora?
    const k6 = Math.min(1, dt * 6);
    mxh += (Math.max(-1, Math.min(1, (mx - cx) / (larg * 0.25))) * afago - mxh) * k6;   // mão à esquerda/direita
    myh += (Math.max(-1, Math.min(1, (my - cy) / (larg * 0.2))) * afago - myh) * k6;    // mão acima/abaixo
    const esfrega = Math.sin(t * 6) * mexS * afago;                             // vai e volta no ritmo da mão
    const empurra = afago * (1 - mexS);                                         // mão parou: empurra de volta
    const cabX = mxh * 8 + esfrega * 3 + mxh * empurra * 4;                     // desloca para a mão
    const cabY = -afago * 4 - Math.max(0, myh) * 4;                             // queixo sobe (mais com a mão embaixo)
    const cabR = mxh * 10 + esfrega * 3;                                        // inclina a lateral contra a mão
    const cabS = 1 + afago * 0.04 + empurra * 0.03;                             // pescoço estica para a frente

    // 5. física: pulo + mola de amassar/esticar
    bv += 2600 * dt;
    by += bv * dt;
    if (by < -40) { by = -40; bv = Math.max(bv, 0); }   // teto: nunca sobe mais que isso
    if (by > 0) { if (bv > 150) qs = 0.15; by = 0; bv = 0; }   // pousou: amassadinha
    qv += (-220 * qs - 14 * qv) * dt;
    qs += qv * dt;

    // 5b. carregada: pêndulo preso no ponto onde ela é segurada
    car += ((emo === 'carregada' ? 1 : 0) - car) * Math.min(1, dt * 8);
    let acel = 0;
    if (arrastando && !isNaN(ultSx)) {
        if (!isNaN(sxAnt)) {
            vxS += ((ultSx - sxAnt) / Math.max(dt, 0.001) - vxS) * Math.min(1, dt * 15);   // velocidade (px/s)
            axS += ((vxS - vxAnt) / Math.max(dt, 0.001) - axS) * Math.min(1, dt * 10);     // aceleração (px/s²)
            vxAnt = vxS;
        }
        sxAnt = ultSx;
        acel = axS;
    } else { sxAnt = NaN; vxS = 0; vxAnt = 0; axS = 0; }
    const alvoP = Math.max(-0.5, Math.min(0.5, Math.atan(acel / GRAV)));   // ângulo de equilíbrio (máx. ~29°)
    const W0 = 9, Z = arrastando ? 0.22 : 0.5;                              // frequência e amortecimento
    pendV += (W0 * W0 * (alvoP - pend) - 2 * Z * W0 * pendV) * dt;
    pend += pendV * dt;

    // 6. respiração e quicar (a fase avança; mudar a velocidade não dá tranco)
    breathPhase += dt * 2 * cur.bs;
    hopPhase += dt * 3 * cur.bs;
    const breath = Math.sin(breathPhase) * cur.ba;
    const hop = Math.abs(Math.sin(hopPhase)) * cur.hop;
    const shx = (Math.random() - 0.5) * cur.sh * 2;
    const shy = (Math.random() - 0.5) * cur.sh * 2;

    // 7. desenha
    desenharAranha({
        dt, t, lx, ly: lyv, blink: Math.max(blink, lento), fl, cabX, cabY, cabR, cabS, pend: pend * 57.3, car,
        btx: shx + lx * 5,                              // o peso se desloca para onde ela olha
        bty: by - hop + cur.dy + shy + lyv * 2,
        brot: cur.rot + lx * 1.5 + Math.sin(t * 2.2) * cur.bal,
        bsx: cur.sc * (1 + breath + qs),
        bsy: cur.sc * (1 - breath - qs)
    });

    requestAnimationFrame(frame);
}

set('normal');
requestAnimationFrame(frame);