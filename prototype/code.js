const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const s=$('#s'),root=$('#root'),zg=$('#z'),gb=$('#gb'),tear=$('#tear'),sweat=$('#sweat'),ex=$('#ex');

const R=[9,16,28,28,16,9],GAP=12;let x0=200-(R.reduce((a,r)=>a+2*r,0)+GAP*5)/2;
const EY=R.map(r=>{const x=x0+r;x0+=2*r+GAP;return[x,170,r]});

$('#eyes').innerHTML=EY.map(([x,y,r],i)=>`<g class="eye"> <g clip-path="url(#c${r})"><circle class="ey" r="${r}"/>${r>20?`<ellipse class="pu" rx="${r*.3}" ry="${r*.5}" fill="#02060a"/>`:''}<circle cx="${-r*.3}" cy="${-r*.38}" r="${r*.2}" fill="#fff" opacity=".9"/><g class="lg"><rect class="lt" x="${-r*2}" y="${-r*2}" width="${r*4}" fill="#0e0f13"/><rect class="lb" x="${-r*2}" width="${r*4}" fill="#0e0f13"/></g></g><path class="cl" opacity="0" d="M${-r*.8} 0Q0 ${r*.45} ${r*.8} 0"/>${i>0&&i<5?'<g class="bg"><path class="br" opacity="0"/></g>':''}</g>`).join('');
const EL=$$('.eye'),LT=$$('.lt'),LB=$$('.lb'),LG=$$('.lg'),PU=$$('.pu'),CL=$$('.cl'),BG=$$('.bg'),BR=$$('.br'),FA=$$('.fa');

const E={
    normal:  {lt:.05,lb:0,  tk:0,  ps:1,  sz:1,   asy:0,  bo:0, bh:8, bk:0,  bc:0,fa:18, fj:0,rot:0, dy:0, sc:1,   amp:1,  spd:1,  hop:0, sh:0,  jit:0,  look:1,  gb:0,  h:185,l:52,gs:6, z:0,tr:0,sw:0,ex:0},
    curioso: {lt:0,  lb:0,  tk:-6, ps:1.1,sz:1.08,asy:.12,bo:.6,bh:14,bk:-6, bc:3,fa:30, fj:0,rot:7, dy:0, sc:1,   amp:1.2,spd:1.3,hop:0, sh:0,  jit:0,  look:1.4,gb:0,  h:270,l:62,gs:8, z:0,tr:0,sw:0,ex:0},
    feliz:   {lt:0,  lb:.42,tk:0,  ps:1.1,sz:1.05,asy:0,  bo:.6,bh:14,bk:0,  bc:8,fa:8,  fj:1.5,rot:0,dy:0,sc:1,   amp:2,  spd:2.4,hop:10,sh:0,  jit:0,  look:.6, gb:0,  h:150,l:55,gs:10,z:0,tr:0,sw:0,ex:0},
    triste:  {lt:.12,lb:0,  tk:-8, ps:.95,sz:1.08,asy:0,  bo:.9,bh:5, bk:-24,bc:0,fa:0,  fj:0,rot:-3,dy:10,sc:.98, amp:.5, spd:.5, hop:0, sh:0,  jit:0,  look:.25,gb:.7, h:225,l:50,gs:4, z:0,tr:1,sw:0,ex:0},
    medo:    {lt:0,  lb:.1, tk:-10,ps:.4, sz:1.12,asy:0,  bo:.9,bh:24,bk:-16,bc:0,fa:26, fj:3,rot:0, dy:8, sc:.92, amp:1.6,spd:6,  hop:0, sh:2.2,jit:.5, look:.1, gb:0,  h:75, l:58,gs:8, z:0,tr:0,sw:1,ex:0},
    surpreso:{lt:0,  lb:0,  tk:0,  ps:.35,sz:1.3, asy:0,  bo:.9,bh:30,bk:0,  bc:6,fa:-14,fj:0,rot:0, dy:-4,sc:1.06, amp:.6, spd:1,  hop:0, sh:0,  jit:0,  look:.4, gb:0,  h:190,l:90,gs:12,z:0,tr:0,sw:0,ex:1},
    bravo:   {lt:.3, lb:.08,tk:22, ps:.9, sz:1,   asy:0,  bo:.9,bh:2, bk:26, bc:0,fa:-35,fj:1,rot:0, dy:0, sc:1,   amp:1.4,spd:3,  hop:4, sh:1,  jit:0,  look:1,  gb:0,  h:0,  l:55,gs:10,z:0,tr:0,sw:0,ex:0},
    sono:    {lt:1,  lb:0,  tk:0,  ps:.9, sz:.95, asy:0,  bo:0, bh:8, bk:0,  bc:0,fa:2,  fj:0,rot:4, dy:8, sc:.98, amp:.8, spd:.35,hop:0, sh:0,  jit:0,  look:0,  gb:0,  h:185,l:32,gs:3, z:1,tr:0,sw:0,ex:0},
    vergonha:{},
    confuso: {},
    nojo:    {},
};

const NOME={normal:'Normal',curioso:'Curioso',feliz:'Feliz',triste:'Triste',medo:'Medo',surpreso:'Surpreso',bravo:'Bravo',sono:'Sono'};
const cur={...E.normal},tgt={...E.normal};
let emo='normal',base='normal',tm,mx=innerWidth/2,my=innerHeight/2,pt=performance.now(),last=pt,lastAct=pt;
let ux=0,uy=0,wx=0,wy=0,gt=0,blink=0,nb=2000,y=0,vy=0,qs=0,qv=0,pet=0,clk=[];const fl=[0,0,0,0,0,0];

function set(n,ms){if(n==='surpreso'&&emo!=='surpreso')vy=-380; // pulinho de susto
    emo=n;Object.assign(tgt,E[n]);clearTimeout(tm);if(ms)tm=setTimeout(()=>set(base),ms);
    $$('.emotion-btn').forEach(b=>b.classList.toggle('active',b.dataset.k===n))
}

function act(wake){
    lastAct=performance.now();
    if(wake&&base==='sono') {
        base='normal';set('curioso',1500)
    }
}

Object.keys(E).forEach(k=>{
    const b=document.createElement('button');

    b.className='emotion-btn';
    b.dataset.k=k;
    b.textContent=NOME[k];

    b.onclick=()=>{
        base=k==='sono'?'sono':'normal';
        lastAct=performance.now();
        set(k,k==='sono'?0:4000)
    };

    $('#btns').append(b)
});

addEventListener('pointermove',e=>{
    const n=performance.now(),v=Math.hypot(e.clientX-mx,e.clientY-my)/Math.max(1,n-pt);
    
    pt=n;
    mx=e.clientX;
    my=e.clientY;
    
    if(base!=='sono'){
        lastAct=n;if(v>4)set('surpreso',900)
    }
});

s.addEventListener('pointerenter',()=>act(true));

s.addEventListener('pointermove',e=>{
    if(base==='sono')return;

    pet+=Math.abs(e.movementX)+Math.abs(e.movementY);
    
    if(pet>400){
        pet=0;set('feliz',2500)
    }
});

s.addEventListener('pointerdown',()=>{
    const n=performance.now();
    act(true);

    clk=clk.filter(t=>n-t<2500);
    clk.push(n);
    vy=-500;
    qs=-.12;

    set(clk.length>=5?'bravo':'feliz',2500)
});

addEventListener('keydown',()=>act(true));

// Olhos secundários piscando aleatoriamente (do seu teste)
(function flick(){
    if(emo!=='sono')fl[[0,1,4,5][Math.random()*4|0]]=1;
    setTimeout(flick,1000+Math.random()*2500)
})();

function frame(n){
    const dt=Math.min(.05,(n-last)/1000);
    last=n;
    const t=n/1000;

    for(const k in cur)cur[k]+=(tgt[k]-cur[k])*Math.min(1,dt*6);

    if(base!=='sono'&&n-lastAct>20000){
        base='sono';
        set('sono')
    }

    pet=Math.max(0,pet-300*dt);
    nb-=dt*1000;

    if(nb<0){
        blink=1;
        nb=2000+Math.random()*3500
    }

    blink=Math.max(0,blink-dt*8);

    for(let i=0;i<6;i++)fl[i]=Math.max(0,fl[i]-dt*6);

    // olhar: segue o cursor; parado, olha ao redor sozinha
    const r=s.getBoundingClientRect();
    let ax=mx-(r.left+r.width/2),ay=my-(r.top+r.height*.45);

    if(base!=='sono'&&n-lastAct>4000){
        if(n>gt){
            gt=n+1500+Math.random()*2000;
            wx=Math.random()*400-200;
            wy=Math.random()*240-120
        } ax=wx;ay=wy
    }

    const d=Math.hypot(ax,ay)||1,m=Math.min(1,d/200)*cur.look,f=Math.min(1,dt*10);

    ux+=(ax/d*m-ux)*f;
    uy+=(ay/d*m-uy)*f;
    const gx=ux+Math.sin(t*19)*cur.jit,gy=uy+cur.gb+Math.sin(t*23+1)*cur.jit*.5;

    // física: pulo + mola de amassar/esticar
    vy+=2600*dt;y+=vy*dt;if(y>0){if(vy>150)qs=.15;y=0;vy=0}
    qv+=(-220*qs-14*qv)*dt;qs+=qv*dt;

    const br=Math.sin(t*2*cur.spd)*.015*cur.amp,hop=Math.abs(Math.sin(t*cur.spd*3))*cur.hop,shx=(Math.random()-.5)*cur.sh*2;

    root.setAttribute('transform',`translate(${shx} ${y-hop+cur.dy}) rotate(${cur.rot} 200 190) translate(200 190) scale(${cur.sc*(1+qs+br)} ${cur.sc*(1-qs-br)}) translate(-200 -190)`);
    s.style.setProperty('--g',`hsl(${cur.h} 100% ${cur.l}%)`);gb.setAttribute('stdDeviation',cur.gs*.6);

    // olhos
    const c=Math.max(cur.lt,blink),closed=Math.min(1,Math.max(0,(c-.85)/.15));
    EY.forEach(([x,yy,rr],i)=>{const dd=x<0?-1:1,fc=rr>20?1:rr>10?.6:.3;
        EL[i].setAttribute('transform',`translate(${x+gx*7*fc} ${yy+gy*5*fc}) scale(${cur.sz*(1+dd*cur.asy)})`);
        EL[i].setAttribute('opacity',1-fl[i]*.9);
        LT[i].setAttribute('height',rr*(1+2*c));
        LB[i].setAttribute('y',rr*(1-2*cur.lb));LB[i].setAttribute('height',2*rr*(1+cur.lb));
        LG[i].setAttribute('transform',`rotate(${-dd*cur.tk})`);
        CL[i].setAttribute('opacity',closed)}); // olho fechado vira um traço luminoso
    PU.forEach(p=>p.setAttribute('transform',`translate(${gx*8} ${gy*8}) scale(${cur.ps})`));

    // sobrancelhas (inclinação separa triste, medo, surpresa e bravo)
    for(let k=0;k<4;k++){const i=k+1,rr=EY[i][2],dd=EY[i][0]<0?-1:1;
        BG[k].setAttribute('transform',`translate(0 ${-rr-6-cur.bh}) rotate(${-dd*cur.bk})`);
        BR[k].setAttribute('d',`M${-rr*.9} 0Q0 ${-cur.bc*2} ${rr*.9} 0`);BR[k].setAttribute('opacity',cur.bo)
    }

    // presas
    FA.forEach((g,i)=>{
        const dd=i?1:-1;
        g.setAttribute('transform',`translate(${200+dd*22} 238) rotate(${dd*(cur.fa+Math.sin(t*34+i)*cur.fj)})`)
    });

    // lágrima (triste), suor (medo), exclamação (surpresa), zzz (sono)
    
    const p1=(t*.5)%1,p2=(t*1.3)%1;
    tear.setAttribute('transform',`translate(158 ${204+p1*70})`);
    tear.setAttribute('opacity',cur.tr*Math.sin(Math.PI*p1));
    sweat.setAttribute('transform',`translate(332 ${120+p2*40})`);
    sweat.setAttribute('opacity',cur.sw*Math.sin(Math.PI*p2));
    ex.setAttribute('opacity',cur.ex);zg.setAttribute('opacity',cur.z);
    requestAnimationFrame(frame);
}
set('normal');requestAnimationFrame(frame);