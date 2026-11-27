const VEL = 22;                  // velocidade de andar (px/s)
const ANDAR_SOZINHA = true;      // andar pela tela fica DESLIGADO até a etapa de andar
const GRAV = 1800;               // gravidade da janela (px/s²)

// ---------- Barra de tarefas que se esconde ----------
const ALTURA_BARRA = 40;         // Windows 10: 40. Windows 11: 48. Ajuste olhando a sua barra.
const BARRA_ESPERA = 150;        // ms com o mouse colado na borda de baixo até a barra aparecer
const BARRA_SOME = 370;          // ms com o mouse longe da barra até ela sumir
const FOLGA_PES = 8 / 220;       // o desenho termina 8 unidades (de 220) abaixo dos pés: o chão é a base dos PÉS  

let px = 0, py = 0, wvy = 0, area = null, bounds = null, dimJ = { l: 0, a: 0 }, pronto = false, vx = 0, uX = NaN, uY = NaN;
let noAr = false;                // está pulando ou caindo?
const modo = { dir: 0, ate: 0 }; // dir: -1 esquerda, 0 parada, 1 direita
let hover = false, interativo = false, estavaArrastando = false;

let barraVisivel = false;        // a barra de tarefas está aparecendo? (estimado pela posição do mouse)
let barraAnim = 0, chaoPrev = NaN;   // 0 = barra escondida, 1 = visível (deslizando de um para o outro)
let subir = false;               // a barra acabou de aparecer: é hora de pular
let encostouEm = 0, afastouEm = 0, mouseSy = NaN;

// Pergunta ao main.js onde a janela está e qual é a área útil da tela
function sincronizar(e) {
    px = e.x; py = e.y; area = e.area; bounds = e.bounds;
    dimJ = { l: e.largura, a: e.altura };
    wvy = 0; noAr = false; uX = NaN; uY = NaN; pronto = true;
}
if (window.arachne) window.arachne.estado().then(sincronizar);

function chaoAtual() {
    const folga = dimJ.a * FOLGA_PES;
    return area.y + area.height - dimJ.a + folga - ALTURA_BARRA * barraAnim;
}

// Adivinha se a barra de tarefas está aparecendo.
function atualizarBarra(n) {
    if (!bounds || Number.isNaN(mouseSy)) return;    // sem bounds (main.js sem a troca) ou mouse ainda desconhecido

    // Barra FIXA: a área útil já é menor que a tela, então o chão já é o topo dela. Nada a fazer.
    const escondeSozinha = bounds.height - area.height < 8;
    if (!escondeSozinha) { barraVisivel = false; return; }

    const fundo = bounds.y + bounds.height;
    const naBorda = mouseSy >= fundo - 2;                    // mouse encostado na borda de baixo
    const sobreBarra = mouseSy >= fundo - ALTURA_BARRA - 6;  // mouse na região da barra

    if (!barraVisivel) {
        if (!naBorda) encostouEm = 0;
        else {
            if (!encostouEm) encostouEm = n;
            if (n - encostouEm > BARRA_ESPERA) { barraVisivel = true; subir = true; afastouEm = 0; qs = 0.06; equiV = (Math.random() < 0.5 ? -1 : 1) * 85; }
        }
    } else {
        if (sobreBarra) afastouEm = 0;
        else {
            if (!afastouEm) afastouEm = n;
            if (n - afastouEm > BARRA_SOME) { barraVisivel = false; encostouEm = 0; qs = -0.05; equiV = (Math.random() < 0.5 ? -1 : 1) * 55; }
        }
    }
}

// ---------- Laço do corpo: cair, (andar) e mover a janela ----------
let ult = performance.now();
function loopCorpo(n) {
    const dt = Math.min(0.05, (n - ult) / 1000);
    ult = n;

    if (pronto) atualizarBarra(n);

    barraAnim += ((barraVisivel ? 1 : 0) - barraAnim) * Math.min(1, dt * 18);   // desliza em ~0,2 s, como a barra

    if (pronto && (arrastando || press)) {          // o mouse está segurando: a janela é dele
        vx = 0; modo.ate = n + 1500;
        if (arrastando) estavaArrastando = true;
    } else if (estavaArrastando) {                  // acabou de ser solta: descobre onde ficou
        estavaArrastando = false; pronto = false;
        window.arachne.estado().then(sincronizar);
    } else if (pronto) {
        const chao = chaoAtual(), minX = area.x, maxX = area.x + area.width - dimJ.l;
        // o chão (a barra) está deslizando: se ela estava em pé nele, vai junto, sem pulo nem queda
        if (!noAr && Math.abs(py - chaoPrev) < 1.5) py = chao;
        chaoPrev = chao;

        // A barra acabou de aparecer e ela estava no chão antigo: pula para cima dela.
        // Energia: para subir uma altura h, a velocidade inicial é v = raiz(2·g·h). Somamos 10 px de folga.
        if (subir) {
            subir = false;
            if (!noAr && py >= chao + ALTURA_BARRA - 2) {
                wvy = -Math.sqrt(2 * GRAV * (py - chao + 10));
                noAr = true;
                if (by >= -1) bv = -300;            // as pernas se esticam no pulo
                qs = -0.1;                          // o corpo se alonga na decolagem
            }
        }

        if (noAr || py < chao - 1) {                // no ar: sobe (se foi impulsionada) e cai
            noAr = true;
            wvy += GRAV * dt;
            py += wvy * dt;
            if (wvy > 0 && py >= chao) {            // descendo e tocou o chão: pousou
                if (wvy > 300) qs = 0.15;           // amassadinha
                if (wvy > 1000) set('medo', 2500);   // caiu de bem alto (~280 px): fica com medo
                py = chao; wvy = 0; noAr = false;
            }
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

        const pxAntes = px;
        px = Math.max(minX, Math.min(maxX, px + vx * dt));
        andouPx += px - pxAntes;
        const X = Math.round(px), Y = Math.round(py);
        if (X !== uX || Y !== uY) { uX = X; uY = Y; window.arachne.moverJanela(X, Y); }
    }

    requestAnimationFrame(loopCorpo);
}
if (window.arachne) requestAnimationFrame(loopCorpo);   // no navegador não há janela para mover

// A janela começa "fantasma" (ignora o mouse). Só fica sólida quando o cursor está sobre o corpo.
if (window.arachne) {
    window.arachne.aoMoverMouse((x, y, sx, sy) => {
        mouseSy = sy;                                    // para detectar a barra de tarefas
        const e = document.elementFromPoint(x, y);
        hover = !!(e && e.closest('#bodyG'));            // o cursor está sobre algum pedaço da aranha?
        const quer = hover || press;                     // durante o arraste continua sólida
        if (quer !== interativo) { interativo = quer; window.arachne.interativo(quer); if (quer) act(true); }
    });
    // Clique direito: menu com "Sair"
    svg.addEventListener('contextmenu', e => { e.preventDefault(); window.arachne.menu(); });
}