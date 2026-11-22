const svgNS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('spiderSvg');
const legsLayer = document.getElementById('legs-layer');

const COLORS = {
    armorDark: '#0b0b0f',
    armorBorder: '#52525b',
    pistonMetal: '#71717a',
    jointShell: '#121216'
};

// Pose de DESCANSO (coordenadas originais, absolutas).
const legs = [
    // === LADO ESQUERDO ===
    { side: -1, root: [386, 232], knee: [324, 166], ankle: [280, 212], tip: [256, 256], scale: 0.90 },
    { side: -1, root: [382, 244], knee: [312, 194], ankle: [272, 244], tip: [254, 286], scale: 0.96 },
    { side: -1, root: [382, 256], knee: [314, 224], ankle: [282, 272], tip: [272, 310], scale: 1.00 },
    { side: -1, root: [388, 268], knee: [330, 250], ankle: [306, 294], tip: [304, 326], scale: 1.04 },

    // === LADO DIREITO ===
    { side: 1, root: [426, 232], knee: [488, 166], ankle: [532, 212], tip: [556, 256], scale: 0.90 },
    { side: 1, root: [430, 244], knee: [500, 194], ankle: [540, 244], tip: [558, 286], scale: 0.96 },
    { side: 1, root: [430, 256], knee: [498, 224], ankle: [530, 272], tip: [540, 310], scale: 1.00 },
    { side: 1, root: [424, 268], knee: [482, 250], ankle: [506, 294], tip: [508, 326], scale: 1.04 }
];

function el(tag, attrs) {
    const node = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
}

// ============================================================
// PERNA = criar UMA vez, atualizar a cada quadro
// ============================================================

// Placa de blindagem curva. Cria os elementos e devolve update(p1, p2).
function makePlate(parent, { w1, w2, arch, side, vein }) {
    const shape = el('path', {
        fill: COLORS.armorDark, stroke: COLORS.armorBorder,
        'stroke-width': 1.4, 'stroke-linejoin': 'round'
    });
    const piston = el('line', {
        stroke: COLORS.pistonMetal, 'stroke-width': 1.3,
        'stroke-opacity': 0.55, 'stroke-linecap': 'round'
    });
    parent.appendChild(shape);
    parent.appendChild(piston);

    let veinEl = null;
    if (vein) {
        veinEl = el('path', { class: 'vein', 'stroke-width': 1.4, 'stroke-opacity': 0.85, 'stroke-linecap': 'round' });
        parent.appendChild(veinEl);
    }

    return function update(p1, p2) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        // Normal apontando para fora/cima do arco da perna
        let nx = -dy / len;
        let ny = dx / len;
        if (side === -1) { nx = -nx; ny = -ny; }

        const midX = (p1[0] + p2[0]) / 2 + nx * arch;
        const midY = (p1[1] + p2[1]) / 2 + ny * arch;

        const p1Outer = [p1[0] + nx * (w1 * 0.55), p1[1] + ny * (w1 * 0.55)];
        const p2Outer = [p2[0] + nx * (w2 * 0.55), p2[1] + ny * (w2 * 0.55)];
        const ctrlOuter = [midX + nx * ((w1 + w2) * 0.28), midY + ny * ((w1 + w2) * 0.28)];

        const p2Inner = [p2[0] - nx * (w2 * 0.45), p2[1] - ny * (w2 * 0.45)];
        const p1Inner = [p1[0] - nx * (w1 * 0.45), p1[1] - ny * (w1 * 0.45)];
        const ctrlInner = [midX - nx * ((w1 + w2) * 0.18), midY - ny * ((w1 + w2) * 0.18)];

        shape.setAttribute('d', [
            `M ${p1Outer[0]} ${p1Outer[1]}`,
            `Q ${ctrlOuter[0]} ${ctrlOuter[1]} ${p2Outer[0]} ${p2Outer[1]}`,
            `L ${p2Inner[0]} ${p2Inner[1]}`,
            `Q ${ctrlInner[0]} ${ctrlInner[1]} ${p1Inner[0]} ${p1Inner[1]}`,
            'Z'
        ].join(' '));

        // Pistão interno
        piston.setAttribute('x1', p1[0] - nx * (w1 * 0.22));
        piston.setAttribute('y1', p1[1] - ny * (w1 * 0.22));
        piston.setAttribute('x2', p2[0] - nx * (w2 * 0.22));
        piston.setAttribute('y2', p2[1] - ny * (w2 * 0.22));

        // Filete de energia
        if (veinEl) {
            const v1 = [p1[0] + dx * 0.24 + nx * (w1 * 0.2), p1[1] + dy * 0.24 + ny * (w1 * 0.2)];
            const v2 = [p1[0] + dx * 0.76 + nx * (w2 * 0.2), p1[1] + dy * 0.76 + ny * (w2 * 0.2)];
            const vCtrl = [midX + nx * ((w1 + w2) * 0.1), midY + ny * ((w1 + w2) * 0.1)];
            veinEl.setAttribute('d', `M ${v1[0]} ${v1[1]} Q ${vCtrl[0]} ${vCtrl[1]} ${v2[0]} ${v2[1]}`);
        }
    };
}

// Junta (anel metálico + núcleo de energia). Devolve update(ponto).
function makeJoint(parent, radius) {
    const shell = el('circle', { r: radius, fill: COLORS.jointShell, stroke: COLORS.pistonMetal, 'stroke-width': 1.8 });
    const core = el('circle', { r: radius * 0.42, class: 'glow' });
    parent.appendChild(shell);
    parent.appendChild(core);
    return (pt) => {
        shell.setAttribute('cx', pt[0]); shell.setAttribute('cy', pt[1]);
        core.setAttribute('cx', pt[0]); core.setAttribute('cy', pt[1]);
    };
}

// Perna completa. Devolve update(root, knee, ankle, tip).
function makeLeg(side, scale) {
    const g = el('g', {});

    const femur = makePlate(g, { w1: 10.5 * scale, w2: 7.5 * scale, arch: 7.5 * scale, side, vein: true });
    const tibia = makePlate(g, { w1: 7.4 * scale, w2: 5.0 * scale, arch: 4.5 * scale, side, vein: false });
    const tarsus = makePlate(g, { w1: 4.8 * scale, w2: 3.4 * scale, arch: 2.0 * scale, side, vein: false });

    const claw = el('path', { class: 'glow' });
    g.appendChild(claw);

    const kneeJoint = makeJoint(g, 5.4 * scale);
    const ankleJoint = makeJoint(g, 3.8 * scale);

    legsLayer.appendChild(g);

    return function update(root, knee, ankle, tip) {
        femur(root, knee);
        tibia(knee, ankle);

        const dx = tip[0] - ankle[0];
        const dy = tip[1] - ankle[1];
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        let nx = -uy;
        let ny = ux;
        if (side === -1) { nx = -nx; ny = -ny; }

        const clawJoint = [tip[0] - ux * (13 * scale), tip[1] - uy * (13 * scale)];
        tarsus(ankle, clawJoint);

        // Garra curva na ponta
        const baseOuter = [clawJoint[0] + nx * (2.2 * scale), clawJoint[1] + ny * (2.2 * scale)];
        const baseInner = [clawJoint[0] - nx * (1.8 * scale), clawJoint[1] - ny * (1.8 * scale)];
        const clawCtrl = [
            (clawJoint[0] + tip[0]) / 2 + nx * (2.4 * scale),
            (clawJoint[1] + tip[1]) / 2 + ny * (2.4 * scale)
        ];
        claw.setAttribute('d',
            `M ${baseOuter[0]} ${baseOuter[1]} Q ${clawCtrl[0]} ${clawCtrl[1]} ${tip[0]} ${tip[1]} L ${baseInner[0]} ${baseInner[1]} Z`);

        kneeJoint(knee);
        ankleJoint(ankle);
    };
}

function solveIK(O, A, l1, l2, s) {
    const dx = A[0] - O[0];
    const dy = A[1] - O[1];
    const d = Math.hypot(dx, dy) || 0.001;
    // se o alvo está longe/perto demais, limitamos ao alcance possível
    const dc = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
    const a = Math.acos((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc));
    const th = Math.atan2(dy, dx) + s * a;
    const knee = [O[0] + Math.cos(th) * l1, O[1] + Math.sin(th) * l1];
    const k = dc / d;
    const ankle = [O[0] + dx * k, O[1] + dy * k];
    return { knee, ankle };
}

// Centro da cabeça no desenho original. Subtraímos dele para ficar relativo.
const C = [406, 254];
const rel = (p) => [p[0] - C[0], p[1] - C[1]];

const CHAO_Y = 72;
const PROFUNDIDADE = 0;     // 0 = todos os pés na mesma linha (antes: 18)
const RAIZ_Y = 0.4;         // 1 = raízes das pernas espalhadas na vertical (leque); 0.4 = mais juntas
const ABD_Y = -14;          // altura do abdômen atrás da cabeça (antes: -30)

const legObjs = legs.map((l) => {
    const root = rel(l.root);
    const knee = rel(l.knee);
    const ankle = rel(l.ankle);
    const tip = rel(l.tip);

    // de que lado o joelho dobra? (olhamos a pose de descanso)
    const cross = (ankle[0] - root[0]) * (knee[1] - root[1]) - (ankle[1] - root[1]) * (knee[0] - root[0]);

    return {
        update: makeLeg(l.side, l.scale),
        root: [root[0], root[1] * RAIZ_Y],
        rest: [tip[0], CHAO_Y - (1 - (tip[1] - 2) / 70) * PROFUNDIDADE],                                          // onde o pé fica em repouso
        l1: Math.hypot(knee[0] - root[0], knee[1] - root[1]),
        l2: Math.hypot(ankle[0] - knee[0], ankle[1] - knee[1]),
        s: Math.sign(cross) || 1,
        tars: [tip[0] - ankle[0], tip[1] - ankle[1]]        // vetor tornozelo -> ponta (fixo)
    };
});

// ============================================================
// ROSTO
// ============================================================
const bodyG = document.getElementById('bodyG');
const contactsG = document.getElementById('contacts');
const head = document.getElementById('head');
const abd = document.getElementById('abd');
const abdMark = document.getElementById('abdMark');
const face = document.getElementById('face');
const ex = document.getElementById('ex');
const zzz = document.getElementById('zzz');
const shadow = document.getElementById('shadow');

const LID = '#0e0e12';   // cor da pálpebra = cor da cabeça

// Quanto cada camada se move (x, y). Ajuste aqui para sentir a perspectiva.
const PARALAXE = {
    head: [3, 2],     // cabeça: pouco
    face: [4, 3],     // olhos e presas: um pouco mais (camada da frente)
    abd: [16, 10]     // abdômen: vai no sentido OPOSTO (camada de trás)
};

// Olhos: [x, y, raio], relativos ao centro da cabeça
const EYES = [
    [-12, 1, 7.2], [12, 1, 7.2],        // 0,1: par principal
    [-23, -12, 4.6], [23, -12, 4.6],    // 2,3: par superior
    [-22, 14, 4.3], [22, 14, 4.3],      // 4,5: par inferior
    [-34, -18, 3.2], [34, -18, 3.2]     // 6,7: par externo
];

const eyes = EYES.map(([x, y, r], i) => {
    const g = el('g', {});

    // máscara circular: a pálpebra só aparece DENTRO do olho
    const clip = el('clipPath', { id: `eyeClip${i}` });
    clip.appendChild(el('circle', { r }));
    g.appendChild(clip);

    const inner = el('g', { 'clip-path': `url(#eyeClip${i})` });
    inner.appendChild(el('circle', { r, class: 'glow' }));
    inner.appendChild(el('circle', { cx: -r * 0.3, cy: -r * 0.35, r: r * 0.25, fill: '#fff7ed', opacity: 0.85 }));

    // pálpebras: dois retângulos escuros (de cima e de baixo)
    const lids = el('g', {});
    const top = el('rect', { x: -r * 2, y: -r * 2, width: r * 4, fill: LID });
    const bot = el('rect', { x: -r * 2, width: r * 4, fill: LID });
    lids.appendChild(top);
    lids.appendChild(bot);
    inner.appendChild(lids);
    g.appendChild(inner);

    // olho fechado vira um traço luminoso
    const line = el('path', {
        class: 'vein', d: `M ${-r * 0.8} 0 Q 0 ${r * 0.45} ${r * 0.8} 0`,
        'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0
    });
    g.appendChild(line);

    face.appendChild(g);
    return { x, y, r, side: x < 0 ? -1 : 1, g, top, bot, lids, line };
});

// Presas: um grupo por presa, com o pivô no topo
const fangs = [-1, 1].map((side) => {
    const g = el('g', {});
    g.appendChild(el('rect', { x: -1.8, y: 0, width: 3.6, height: 12, rx: 1.8, class: 'glow' }));
    face.appendChild(g);
    return { side, g };
});

// Gotas: lágrima (triste) e suor (medo)
const GOTA = 'M0 -9Q7 2 0 8Q-7 2 0 -9Z';
const tear = el('path', { class: 'glow', d: GOTA, opacity: 0 });
const sweat = el('path', { class: 'glow', d: GOTA, opacity: 0 });
face.appendChild(tear);
face.appendChild(sweat);

// ============================================================
// PÉS PLANTADOS E PASSOS
// ============================================================
const STEP_TIME = 0.22;   // duração de um passo (segundos)
const STEP_LIFT = 6;      // altura que o pé sobe durante o passo
const STEP_MIN = 12;      // diferença mínima para dar passo (em trocas de emoção comuns)
                          // TESTE: coloque 9999 para desligar os passos de emoção
const STEP_GAP = 0.15;    // intervalo entre o início de um passo e o próximo

// Estado de cada pé: posição atual (x, y) NO CHÃO, e o passo em andamento
const feet = legObjs.map((leg) => ({
    x: leg.rest[0], y: leg.rest[1],
    from: [0, 0], to: [0, 0],
    t: 1,         // 1 = parado; entre 0 e 1 = dando um passo
    lift: 0
}));

// Sombrinha embaixo de cada pé: junto com a sombra do corpo, é a pista de que existe um chão.
const contacts = legObjs.map(() => {
    const c = el('ellipse', { rx: 9, ry: 1.6, fill: '#000', opacity: 0.55 });
    contactsG.appendChild(c);
    return c;
});

// Onde o pé i DEVERIA estar (depende da postura da emoção)
const desired = (i) => [legObjs[i].rest[0] * tgt.lgx, legObjs[i].rest[1] * tgt.lgy];

// Uma perna só dá passo se a vizinha e a do lado oposto estiverem paradas
function canStep(i) {
    const k = i % 4;
    const vizinhas = [(i + 4) % 8];
    if (k > 0) vizinhas.push(i - 1);
    if (k < 3) vizinhas.push(i + 1);
    return vizinhas.every((j) => feet[j].t >= 1);
}

function startStep(i, to) {
    const f = feet[i];
    f.from = [f.x, f.y];
    f.to = to;
    f.t = 0;
}

// Converte um ponto do MUNDO (espaço da aranha) para o espaço LOCAL do corpo.
// É a transformação do corpo ao contrário (desfaz translate, rotate e scale).
function makeToLocal(ox, oy, rotDeg, sx, sy) {
    const ca = Math.cos((-rotDeg * Math.PI) / 180);
    const sa = Math.sin((-rotDeg * Math.PI) / 180);
    return (p) => {
        const x = p[0] - ox;
        const y = p[1] - oy - 60;            // 60 = pivô do corpo
        const rx = x * ca - y * sa;
        const ry = x * sa + y * ca;
        return [rx / sx, ry / sy + 60];
    };
}

let nextIdle = 1.5;
let stepCooldown = 0;

// ============================================================
// DESENHA UM QUADRO. O code.js chama isto a cada frame.
//   dt, t        : tempo desde o último quadro / relógio (segundos)
//   lx, ly       : para onde ela está virada (de -1 a 1)
//   blink        : piscada (0 a 1)
//   fl           : "tremida de luz" dos olhos secundários (um valor por olho)
//   btx, bty     : deslocamento do corpo      brot : inclinação (graus)
//   bsx, bsy     : escala do corpo (respiração, amassar)
// ============================================================
function desenharAranha({ dt, t, lx, ly, blink, fl, btx, bty, brot, bsx, bsy, cabX = 0, cabY = 0, cabR = 0, cabS = 1 }) {
    // 1. cor da emoção
    svg.style.setProperty('--g', `hsl(${cur.h} 100% ${cur.l}%)`);

    // 1b. sombra do corpo no chão: diminui quando o corpo sobe e alarga quando ele está baixo
    const lift = Math.max(0, -bty);
    shadow.setAttribute('transform', `scale(${Math.max(0.5, 1 - lift * 0.012) + Math.max(0, cur.dy) * 0.006} 1)`);
    shadow.setAttribute('opacity', Math.max(0.35, 1 - lift * 0.03));

    // 2. corpo (pivô em (0, 60): perto dos pés, assim ele gira e amassa "apoiado no chão")
    bodyG.setAttribute('transform',
        `translate(${btx} ${bty}) translate(0 60) rotate(${brot}) ` +
        `scale(${bsx} ${bsy}) translate(0 -60)`);

    // 3. efeitos: lágrima, suor, exclamação, "z Z"
    const p1 = (t * 0.5) % 1;
    const p2 = (t * 1.3) % 1;
    tear.setAttribute('transform', `translate(-13 ${10 + p1 * 28}) scale(0.55)`);
    tear.setAttribute('opacity', cur.tr * Math.sin(Math.PI * p1));
    sweat.setAttribute('transform', `translate(41 ${-22 + p2 * 24}) scale(0.5)`);
    sweat.setAttribute('opacity', cur.sw * Math.sin(Math.PI * p2));
    ex.setAttribute('opacity', cur.ex);
    zzz.setAttribute('opacity', cur.zz);

    // 4. PERNAS
    // 4a. decide quando um pé precisa dar um passo.
    //     Diferença pequena: o corpo se ajusta e a IK dobra os joelhos (sem passo).
    //     Dormindo/acordando (settleUntil): limite baixo, os pés se ajeitam por inteiro.
    const minDist = t < settleUntil ? 5 : STEP_MIN;
    stepCooldown -= dt;
    feet.forEach((ft, i) => {
        if (ft.t < 1 || stepCooldown > 0) return;
        const D = desired(i);
        if (Math.hypot(D[0] - ft.x, D[1] - ft.y) > minDist && canStep(i)) {
            startStep(i, D);
            stepCooldown = STEP_GAP;     // um passo de cada vez: parece intencional
        }
    });

    // 4b. micropasso aleatório de vez em quando (ela parece viva parada), menos dormindo
    nextIdle -= dt;
    if (nextIdle < 0) {
        nextIdle = 1.2 + Math.random() * 2.2;
        if (emo !== 'sono') {
            const i = Math.floor(Math.random() * feet.length);
            if (feet[i].t >= 1 && canStep(i)) {
                const D = desired(i);
                startStep(i, [D[0] + (Math.random() - 0.5) * 8, D[1] + (Math.random() - 0.5) * 5]);
            }
        }
    }

    // 4c. anda os passos em andamento, resolve a IK e redesenha cada perna
    const toLocal = makeToLocal(btx, bty, brot, bsx, bsy);

    legObjs.forEach((leg, i) => {
        const ft = feet[i];

        if (ft.t < 1) {
            ft.t = Math.min(1, ft.t + dt / STEP_TIME);
            const e = ft.t * ft.t * (3 - 2 * ft.t);           // começa e termina suave
            ft.x = ft.from[0] + (ft.to[0] - ft.from[0]) * e;
            ft.y = ft.from[1] + (ft.to[1] - ft.from[1]) * e;
            ft.lift = Math.sin(Math.PI * ft.t) * STEP_LIFT;   // sobe e desce no meio do passo
        } else {
            ft.lift = 0;
        }

        // pé no mundo (com um tremorzinho no medo)
        const F = [
            ft.x + (Math.random() - 0.5) * cur.sh * 0.5,
            ft.y - ft.lift + (Math.random() - 0.5) * cur.sh * 0.5
        ];
        const A = [F[0] - leg.tars[0], F[1] - leg.tars[1]];   // tornozelo = pé - tarso (fixo)

        // leva para o espaço do corpo e resolve a IK lá
        const Fl = toLocal(F);
        const Al = toLocal(A);
        const ik = solveIK(leg.root, Al, leg.l1, leg.l2, leg.s);

        // se a perna esticou ao máximo, a ponta acompanha o tornozelo (o pé "descola")
        const tipL = [Fl[0] + ik.ankle[0] - Al[0], Fl[1] + ik.ankle[1] - Al[1]];

        leg.update(leg.root, ik.knee, ik.ankle, tipL);

        // sombrinha de contato: some um pouco quando o pé sobe
        contacts[i].setAttribute('cx', F[0]);
        contacts[i].setAttribute('cy', ft.y + 1);
        contacts[i].setAttribute('opacity', Math.max(0.1, 0.55 - ft.lift * 0.06));
    });

    // 5. perspectiva: cada camada anda uma quantidade diferente
    head.setAttribute('transform', `translate(${lx * PARALAXE.head[0] + cabX} ${ly * PARALAXE.head[1] + cur.hd + cabY}) rotate(${cabR}) scale(${cabS})`);
    face.setAttribute('transform', `translate(${lx * PARALAXE.face[0]} ${ly * PARALAXE.face[1]})`);
    abd.setAttribute('transform', `translate(${-lx * PARALAXE.abd[0]} ${ABD_Y - ly * PARALAXE.abd[1]}) scale(${1 - ly * 0.05})`);
    abdMark.setAttribute('cx', -lx * 10);
    abdMark.setAttribute('cy', -ly * 8);
    abdMark.setAttribute('opacity', 0.3 + Math.max(0, -ly) * 0.5);   // aparece mais ao olhar para cima

    // 6. olhos e pálpebras
    const c = Math.max(cur.lt, blink);
    const closed = Math.min(1, Math.max(0, (c - 0.85) / 0.15));
    eyes.forEach((e, i) => {
        e.g.setAttribute('transform', `translate(${e.x} ${e.y}) scale(${cur.sz})`);
        e.g.setAttribute('opacity', 1 - fl[i] * 0.9);                 // olhos secundários piscando
        e.top.setAttribute('height', e.r * (1 + 2.6 * c));
        e.bot.setAttribute('y', e.r * (1 - 2 * cur.lb));
        e.bot.setAttribute('height', 2 * e.r * (1 + cur.lb));
        e.lids.setAttribute('transform', `rotate(${-e.side * cur.tk})`);
        e.line.setAttribute('opacity', closed);
    });

    // 7. presas
    fangs.forEach(({ side, g }, i) => {
        const tremor = Math.sin(t * 34 + i) * cur.fj;
        g.setAttribute('transform',
            `translate(${side * 5.4} 20) rotate(${-side * (cur.fa + tremor)}) scale(1 ${cur.fs})`);
    });
}