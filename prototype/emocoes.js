// ============================================================
// emocoes.js — a TABELA de emoções. Só dados, sem lógica.
//
// ROSTO   lt: pálpebra de cima (0 a 1)   lb: pálpebra de baixo (0 a 1)
//         tk: inclinação da pálpebra (+ bravo, - triste)   sz: tamanho dos olhos
//         fa: abertura das presas (+ para fora, - juntas)  fs: comprimento das presas
//         fj: tremor das presas          h, l: matiz e luminosidade da cor
// CORPO   sh: tremor do corpo   dy: desce (+) ou sobe (-)   sc: tamanho
//         hop: quicadinhos      rot: inclinação (graus)
//         bs: velocidade da respiração   ba: intensidade da respiração
//         hd: cabeça cai para a frente
// PERNAS  lgx: largura da postura   lgy: profundidade da postura
//         (os pés só dão PASSO se a diferença for grande; senão o corpo se ajusta pela IK)
// OLHAR   lk: quanto ela segue o mouse (0 = ignora)   gb: viés para baixo
// EFEITOS tr: lágrima   sw: suor   ex: exclamação   zz: "z Z"  (0 = escondido, 1 = aparece)
//
// TREMOR: só o MEDO treme o corpo (sh). No bravo, só as presas vibram de leve.
// ============================================================

const BASE = {
    // rosto
    lt: 0.05, lb: 0, tk: 0, sz: 1, fa: 6, fs: 1, fj: 0, h: 24, l: 50,
    // corpo
    sh: 0, dy: 0, sc: 1, hop: 0, rot: 0, bs: 1, ba: 0.015, hd: 0,
    // pernas
    lgx: 1, lgy: 1,
    // olhar
    lk: 1, gb: 0,
    // efeitos
    tr: 0, sw: 0, ex: 0, zz: 0
};

// Cada emoção diz só o que muda em relação ao BASE (que é o "normal")
const EMO_DIF = {
    normal:   {},
    curioso:  { lt: 0, tk: -6, sz: 1.12, fa: 14, h: 270, l: 62, rot: 6, bs: 1.3, ba: 0.02, lgx: 1.02, lk: 1.3 },
    feliz:    { lt: 0, lb: 0.42, sz: 1.05, fa: 3, h: 150, l: 52, hop: 8, bs: 2.4, ba: 0.03, lgx: 1.02, lk: 0.7 },
    triste:   { lt: 0.15, tk: -22, sz: 1.05, fa: -6, fs: 0.85, h: 225, l: 50, dy: 8, sc: 0.98, rot: -3,
                bs: 0.5, ba: 0.01, hd: 3, lgx: 0.96, lgy: 0.97, lk: 0.35, gb: 0.6, tr: 1 },
    medo:     { lt: 0, lb: 0.1, tk: -10, sz: 1.15, fa: 8, fj: 3, h: 75, l: 58, sh: 1.2, dy: 6, sc: 0.93,
                bs: 6, ba: 0.02, lgx: 0.95, lgy: 0.95, lk: 0.15, sw: 1 },
    surpreso: { lt: 0, sz: 1.3, fa: 0, fs: 1.25, h: 190, l: 80, dy: -6, sc: 1.06, ba: 0.008,
                lgx: 1.05, lgy: 1.02, lk: 0.5, ex: 1 },
    bravo:    { lt: 0.2, lb: 0.08, tk: 24, fa: 24, fs: 1.1, fj: 0.8, h: 0, l: 55, sc: 1.02, bs: 3, ba: 0.025,
                lgx: 1.07, lgy: 1.02 },
    // SONO: pose de CARANGUEJEIRA (corpo no chão, patas relaxadas, cabeça caída, presas juntas,
    // respiração lenta, ignora o mouse e olhos fechados).
    // Prefere "enroladinha" (aranha-lobo)? Baixe lgx para ~0.8.
    sono:     { lt: 1, sz: 0.95, fa: -10, fs: 0.8, l: 28, dy: 27, sc: 0.94, rot: 2, bs: 0.45, ba: 0.03,
                hd: 5, lgx: 1.08, lgy: 0.97, lk: 0, zz: 1 }
};

// Junta BASE + diferenças => tabela completa (todas as chaves em todas as emoções)
const EMO = {};
for (const k in EMO_DIF) EMO[k] = { ...BASE, ...EMO_DIF[k] };

const NOME = { normal: 'Normal', curioso: 'Curioso', feliz: 'Feliz', triste: 'Triste', medo: 'Medo', surpreso: 'Surpreso', bravo: 'Bravo', sono: 'Sono' };