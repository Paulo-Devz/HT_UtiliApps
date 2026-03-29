// ============================================================
//  SlideAI — script.js
//  Groq decide TUDO: layout, posição, tamanho, imagens
//  Pexels fornece fotos reais em todos os slides
// ============================================================

let slides     = [];
let current    = 0;
let animated   = true;
let slideCount = 6;
let themeColor = '#667eea';
let editMode   = false;
let slideBg    = 'color'; // 'color' | 'transparent'
let textBoxes  = {};
let tbCounter  = 0;
let imgCache   = {};

// ── Cor helpers ──
function darken(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n>>16,(n>>8)&0xff,n&0xff].map(c=>Math.max(0,c-pct).toString(16).padStart(2,'0')).join('');
}
function lighten(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n>>16,(n>>8)&0xff,n&0xff].map(c=>Math.min(255,c+pct).toString(16).padStart(2,'0')).join('');
}
function hexOnly(h) { return h.replace('#',''); }

// ── Pexels proxy ──
async function fetchImage(query, orientation='landscape') {
  if (!query) return null;
  const key = query+'__'+orientation;
  if (imgCache[key]) return imgCache[key];
  try {
    const res  = await fetch('/api/pexels?query='+encodeURIComponent(query)+'&orientation='+orientation+'&per_page=5');
    const data = await res.json();
    const photos = data.photos||[];
    if (!photos.length) return null;
    const url = photos[Math.floor(Math.random()*photos.length)].url;
    imgCache[key] = url;
    return url;
  } catch { return null; }
}

async function prefetchAll(slidesData) {
  const tasks = [];
  for (const s of slidesData) {
    if (s.imageQuery) tasks.push(fetchImage(s.imageQuery, s.imageOrientation||'landscape'));
    if (s.type==='image-grid' && s.images) {
      for (const gi of s.images) tasks.push(fetchImage(gi.query,'portrait'));
    }
  }
  await Promise.all(tasks);
}

// ── UI ──
function setTema(t) { document.getElementById('tema').value = t; }

function setAnim(val) {
  animated = val;
  document.getElementById('btn-anim').classList.toggle('active', val);
  document.getElementById('btn-static').classList.toggle('active', !val);
  if (slides.length) applyAnimation();
}

function changeCount(d) {
  slideCount = Math.max(3, Math.min(12, slideCount+d));
  document.getElementById('count-val').textContent = slideCount;
}

function selectColor(el) {
  document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  themeColor = el.dataset.color;
  if (slides.length) renderSlides();
}

function setSlideBg(val, el) {
  slideBg = val;
  document.querySelectorAll('.bg-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  if (slides.length) renderSlides();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

function toggleExport() { document.getElementById('export-wrap').classList.toggle('open'); }

document.addEventListener('click', e => {
  const w = document.getElementById('export-wrap');
  if (w && !w.contains(e.target)) w.classList.remove('open');
});

function navigate(dir) {
  current = Math.max(0, Math.min(slides.length-1, current+dir));
  renderCurrent();
  renderTextBoxes(current);
}

function goTo(i) { current=i; renderCurrent(); renderTextBoxes(i); }

function renderCurrent() {
  document.querySelectorAll('.slide').forEach((s,i)=>{
    s.classList.toggle('active', i===current);
    if (i===current && animated) { s.classList.remove('animated'); void s.offsetWidth; s.classList.add('animated'); }
  });
  document.querySelectorAll('.thumb').forEach((t,i)=>t.classList.toggle('active',i===current));
  document.getElementById('slide-indicator').textContent = `${current+1} / ${slides.length}`;
  document.getElementById('prev-btn').disabled = current===0;
  document.getElementById('next-btn').disabled = current===slides.length-1;
}

document.addEventListener('keydown', e => {
  if (!slides.length) return;
  if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (document.activeElement.contentEditable==='true') return;
  if (e.key==='ArrowRight') navigate(1);
  if (e.key==='ArrowLeft')  navigate(-1);
});

function applyAnimation() { document.querySelectorAll('.slide').forEach(s=>s.classList.toggle('animated',animated)); }

function toggleEdit() {
  editMode = !editMode;
  document.querySelectorAll('[contenteditable]').forEach(el=>{ el.contentEditable = editMode?'true':'false'; });
  showToast(editMode?'✏️ Clique nos textos para editar':'✅ Edição desativada');
}

// ── PROMPT ──
function buildPrompt(tema, count) {
  const bgDesc = slideBg==='transparent'
    ? 'FUNDO TRANSPARENTE com efeito vidro — slides com fundo semitransparente, textos nítidos'
    : 'FUNDO COM COR — gradiente da cor do tema nos slides escuros, branco nos slides claros';

  return `Você é um designer e educador especialista em apresentações visuais de alto nível.

O USUÁRIO ESCREVEU ISSO: "${tema}"

Sua primeira tarefa é INTERPRETAR o que o usuário quer:
- Identifique o TEMA PRINCIPAL (ex: "Cooperação", "Sistema Solar", "Briófitas")
- Identifique INSTRUÇÕES ESPECÍFICAS que o usuário deu (ex: "10 exemplos", "5 benefícios", "2 frases de reflexão", "explique cada um")
- Se o usuário pediu quantidades específicas (ex: "10 exemplos"), RESPEITE essas quantidades distribuindo pelos slides
- Se o usuário pediu elementos específicos (benefícios, exemplos, frases, conceitos), INCLUA TODOS eles
- Se o usuário só deu um tema sem instruções, você decide a melhor estrutura

Slides a criar: ${count}
Modo de fundo: ${bgDesc}

━━━ SUA MISSÃO ━━━
Criar a apresentação mais bonita, rica e didática possível.
Você decide ABSOLUTAMENTE TUDO — layout, posições, tamanhos, onde as imagens ficam, que texto vai onde.
Seja criativo. Cada slide deve ser ÚNICO e visualmente diferente dos outros.
IMPORTANTE: cumpra TODAS as instruções específicas do usuário antes de complementar com conteúdo extra.

━━━ IMAGENS — OBRIGATÓRIO ━━━
• TODOS os slides devem ter imageQuery (sem exceção)
• As fotos devem ser exemplos REAIS e ESPECÍFICOS do conteúdo daquele slide
• A CAPA deve ter uma foto impactante de introdução ao tema
• imageQuery sempre em inglês, bem específica
• Você decide a posição da imagem: "background", "right", "left", "bottom", "overlay"
• Para grids: cada item com query específica de espécie/exemplo real

━━━ CAPA — ATENÇÃO ESPECIAL ━━━
A capa deve ser visualmente impactante e ÚNICA a cada geração.
Você escolhe livremente: onde fica o título (canto, centro, topo, base), onde fica a imagem, o tamanho do texto.
Use titlePosition para indicar onde o texto principal fica:
  "bottom-left", "bottom-center", "bottom-right",
  "center", "center-left", "center-right",
  "top-left", "top-center", "top-right"

━━━ TIPOS DE SLIDE ━━━
- "cover": capa impactante (foto obrigatória)
- "content": título + pontos (decide se tem foto lateral ou não com hasImage)
- "reading": texto longo + foto ao lado
- "image-focus": foto grande com texto sobreposto em qualquer posição
- "image-grid": grade de 2-4 fotos com legendas de espécies/exemplos
- "stats": dados numéricos (pode ter foto sutil)
- "highlight": frase de impacto grande com foto de fundo
- "closing": encerramento (foto obrigatória)

━━━ FORMATO JSON ━━━
Retorne APENAS o array JSON. Sem texto antes ou depois.

[
  {
    "type": "cover",
    "layout": {
      "titleSize": 48,
      "titlePosition": "bottom-left",
      "subtitleSize": 16,
      "imagePosition": "background"
    },
    "eyebrow": "REINO PLANTAE",
    "title": "Do Musgo às Flores",
    "subtitle": "Briófitas, pteridófitas e angiospermas",
    "imageQuery": "green tropical forest plants nature",
    "imageOrientation": "landscape",
    "accentColor": "#4ade80"
  },
  {
    "type": "image-focus",
    "layout": {
      "titleSize": 28,
      "pointSize": 13,
      "imagePosition": "right",
      "textAlign": "left"
    },
    "sectionLabel": "BRIÓFITAS",
    "title": "Pioneiras da Terra",
    "body": "As primeiras plantas a colonizar o ambiente terrestre",
    "points": [
      "Avasculares: sem xilema nem floema",
      "Absorvem água por toda a superfície",
      "Dependem de água para reprodução",
      "Esporos como unidade de dispersão"
    ],
    "imageQuery": "moss bryophyte green rocks forest",
    "imageOrientation": "portrait",
    "accentColor": null
  },
  {
    "type": "image-grid",
    "layout": { "gridCols": 3, "titleSize": 20 },
    "sectionLabel": "EXEMPLOS — BRIÓFITAS",
    "title": "Espécies e suas Características",
    "images": [
      { "query": "sphagnum moss wetland", "caption": "Sphagnum — musgo de turfeira", "detail": "Retém 20x o peso em água" },
      { "query": "marchantia liverwort green", "caption": "Marchantia — hepática", "detail": "Corpo laminar achatado" },
      { "query": "hornwort green plant soil", "caption": "Anthoceros — antócero", "detail": "Esporofito ereto e linear" }
    ],
    "imageQuery": "diverse moss plants collection",
    "accentColor": null
  },
  {
    "type": "reading",
    "layout": {
      "titleSize": 22,
      "textSize": 13,
      "imagePosition": "left"
    },
    "sectionLabel": "APROFUNDAMENTO",
    "title": "Ciclo de Vida das Briófitas",
    "paragraphs": [
      "O ciclo de vida das briófitas é haplodiplonte com alternância de gerações, onde a geração gametofitica (haploide) é dominante e independente, ao contrário das plantas vasculares.",
      "O gametófito produz gametas que necessitam de água livre para a fecundação. Após a união dos gametas, desenvolve-se o esporófito, que cresce sobre o gametófito e dele depende nutricionalmente.",
      "Os esporos produzidos pelo esporófito são lançados ao ambiente, germinam formando o protonema e dão origem a novos gametófitos, reiniciando o ciclo. Esse processo é fortemente dependente de ambientes úmidos."
    ],
    "imageQuery": "moss spore capsule close up macro",
    "imageOrientation": "portrait",
    "accentColor": null
  },
  {
    "type": "stats",
    "layout": { "numberSize": 48, "labelSize": 12, "titleSize": 22 },
    "sectionLabel": "DADOS",
    "title": "Briófitas em Números",
    "stats": [
      { "number": "20.000", "label": "espécies descritas no mundo" },
      { "number": "470Ma", "label": "anos de história evolutiva" },
      { "number": "3%", "label": "da superfície terrestre coberta" }
    ],
    "imageQuery": "moss forest ecosystem green",
    "accentColor": null
  },
  {
    "type": "closing",
    "layout": {
      "titleSize": 38,
      "titlePosition": "center",
      "imagePosition": "background"
    },
    "eyebrow": "CONCLUSÃO",
    "title": "Pequenas, mas Essenciais",
    "subtitle": "As briófitas moldam ecossistemas inteiros",
    "imageQuery": "green nature peaceful forest light",
    "imageOrientation": "landscape",
    "accentColor": null
  }
]

AGORA gere o JSON para: "${tema}" com ${count} slides.
- Varie os layouts e as posições do título na capa a cada geração
- Cubra TODO o conteúdo pedido no tema
- imageQuery específica em TODOS os slides
- Conteúdo rico, educacional, com exemplos reais
- Retorne APENAS o JSON array`;
}

// ── FALLBACK ──
function buildFallback(tema) {
  return [
    { type:'cover', layout:{titleSize:44,titlePosition:'bottom-left',imagePosition:'background'}, eyebrow:'APRESENTAÇÃO', title:tema, subtitle:'Uma visão completa e aprofundada', imageQuery:tema+' nature landscape', imageOrientation:'landscape', accentColor:null },
    { type:'image-focus', layout:{titleSize:26,pointSize:13,imagePosition:'right'}, sectionLabel:'INTRODUÇÃO', title:'Conceitos Fundamentais', body:'Entendendo o contexto', points:['Definição e origem','Contexto histórico','Principais características','Relevância atual'], imageQuery:tema+' example', imageOrientation:'landscape', accentColor:null },
    { type:'highlight', layout:{titleSize:34,titlePosition:'center',imagePosition:'background'}, eyebrow:'DESTAQUE', title:'O conhecimento transforma perspectivas', subtitle:'Compreender fundo é o primeiro passo', imageQuery:tema+' detail', imageOrientation:'landscape', accentColor:null },
    { type:'reading', layout:{titleSize:22,textSize:13,imagePosition:'right'}, sectionLabel:'APROFUNDAMENTO', title:'Entendendo em Detalhes', paragraphs:['Este tema possui uma riqueza de aspectos que merecem atenção especial. Conexões importantes emergem quando estudamos com profundidade.','Os elementos principais se inter-relacionam de forma fascinante, formando um sistema coeso de conhecimento que impacta nossa compreensão do mundo.','Compreender esses aspectos nos permite projetar o futuro com clareza e tomar decisões mais informadas sobre o tema.'], imageQuery:tema+' close up macro', imageOrientation:'portrait', accentColor:null },
    { type:'image-grid', layout:{gridCols:3,titleSize:20}, sectionLabel:'EXEMPLOS', title:'Casos e Exemplos Reais', images:[{query:tema+' example 1',caption:'Exemplo 1',detail:'Descrição breve'},{query:tema+' example 2',caption:'Exemplo 2',detail:'Descrição breve'},{query:tema+' example 3',caption:'Exemplo 3',detail:'Descrição breve'}], imageQuery:tema+' collection', accentColor:null },
    { type:'closing', layout:{titleSize:38,titlePosition:'center',imagePosition:'background'}, eyebrow:'CONCLUSÃO', title:'Obrigado!', subtitle:'Dúvidas e discussão', imageQuery:tema+' peaceful nature', imageOrientation:'landscape', accentColor:null },
  ];
}

// ── GENERATE ──
async function generateSlides() {
  const tema = document.getElementById('tema').value.trim();
  if (!tema) { showToast('Digite um tema primeiro!'); return; }

  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('loading-overlay').classList.add('visible');
  document.getElementById('gen-btn').disabled = true;
  document.getElementById('slides-container').innerHTML = '';
  document.getElementById('thumbs-wrap').innerHTML = '';
  textBoxes={}; imgCache={};
  slides=[]; current=0;

  const msgs = ['Analisando o tema...','Groq decidindo layout e conteúdo...','Gerando textos ricos...','Buscando fotos reais...','Montando os slides...','Finalizando...'];
  let mi=0;
  const ltI = setInterval(()=>{ mi=(mi+1)%msgs.length; document.getElementById('loading-text').textContent=msgs[mi]; }, 1500);

  try {
    const res  = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:buildPrompt(tema,slideCount),max_tokens:3500}) });
    const data = await res.json();
    if (!res.ok||data.error) throw new Error(data.error||'Erro');
    let raw = data.result.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    const s=raw.indexOf('['), e=raw.lastIndexOf(']');
    if (s!==-1&&e!==-1) raw=raw.slice(s,e+1);
    slides = JSON.parse(raw);
    if (!Array.isArray(slides)||!slides.length) throw new Error('JSON inválido');
  } catch(e) {
    console.warn('Fallback:', e.message);
    slides = buildFallback(tema);
  }

  document.getElementById('loading-text').textContent = 'Buscando fotos...';
  await prefetchAll(slides);

  clearInterval(ltI);
  document.getElementById('loading-overlay').classList.remove('visible');
  document.getElementById('gen-btn').disabled = false;
  document.getElementById('dl-btn').disabled  = false;
  renderSlides();
  showToast(`✅ ${slides.length} slides prontos!`);
}

// ── RENDER ──
function renderSlides() {
  const container  = document.getElementById('slides-container');
  const thumbsWrap = document.getElementById('thumbs-wrap');
  container.innerHTML=''; thumbsWrap.innerHTML='';

  slides.forEach((s,i)=>{
    const el = document.createElement('div');
    el.className = `slide ${animated?'animated':''} ${i===0?'active':''}`;
    el.innerHTML = buildSlideHTML(s,i);
    container.appendChild(el);

    const th = document.createElement('div');
    th.className = `thumb ${i===0?'active':''}`;
    th.onclick = ()=>goTo(i);
    th.innerHTML = buildThumbHTML(s,i);
    thumbsWrap.appendChild(th);
  });

  document.getElementById('slide-indicator').textContent = `1 / ${slides.length}`;
  document.getElementById('prev-btn').disabled = true;
  document.getElementById('next-btn').disabled = slides.length<=1;
  current=0; renderTextBoxes(0);
}

// ── BUILD SLIDE ──
function buildSlideHTML(s, i) {
  const c     = s.accentColor || themeColor;
  const d     = darken(c,35);
  const d2    = darken(c,60);
  const l     = lighten(c,50);
  const total = slides.length;
  const lo    = s.layout || {};
  const img   = s.imageQuery ? (imgCache[s.imageQuery+'__'+(s.imageOrientation||'landscape')] || imgCache[s.imageQuery+'__landscape'] || imgCache[s.imageQuery+'__portrait'] || null) : null;

  const tsz  = lo.titleSize  || 26;
  const psz  = lo.pointSize  || 13;
  const txsz = lo.textSize   || 13;
  const ssz  = lo.subtitleSize || 15;
  const tpos = lo.titlePosition || 'bottom-left';
  const ipos = lo.imagePosition || 'background';

  const pn  = `<div style="position:absolute;bottom:12px;right:18px;z-index:10;font-size:9px;font-weight:600;color:rgba(0,0,0,0.18);">${i+1}/${total}</div>`;
  const pnw = `<div style="position:absolute;bottom:12px;right:18px;z-index:10;font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);">${i+1}/${total}</div>`;

  // ── GLASSMORPHISM helper (transparent mode) ──
  const glass = `background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);`;
  const glassDark = `background:rgba(0,0,0,0.25);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);`;

  // ── titlePosition → CSS flex alignment ──
  function titleAlign(pos) {
    const map = {
      'bottom-left':   {jc:'flex-end',  ai:'flex-start'},
      'bottom-center': {jc:'flex-end',  ai:'center'},
      'bottom-right':  {jc:'flex-end',  ai:'flex-end'},
      'center':        {jc:'center',    ai:'center'},
      'center-left':   {jc:'center',    ai:'flex-start'},
      'center-right':  {jc:'center',    ai:'flex-end'},
      'top-left':      {jc:'flex-start',ai:'flex-start'},
      'top-center':    {jc:'flex-start',ai:'center'},
      'top-right':     {jc:'flex-start',ai:'flex-end'},
    };
    return map[pos] || map['bottom-left'];
  }

  // ── Cover ──
  if (s.type==='cover') {
    const {jc,ai} = titleAlign(tpos);
    const textAlign = ai==='center' ? 'center' : ai==='flex-end' ? 'right' : 'left';

    // Fundo baseado no modo
    let coverBg = '';
    if (img) {
      if (slideBg==='transparent') {
        coverBg = `background:url(${img}) center/cover no-repeat;`;
      } else {
        coverBg = `background:linear-gradient(to top,${d2}f2 0%,${d}bb 45%,${c}55 100%),url(${img}) center/cover no-repeat;`;
      }
    } else {
      coverBg = slideBg==='transparent'
        ? `background:linear-gradient(135deg,${d2}dd,${c}99);`
        : `background:linear-gradient(135deg,${d2} 0%,${d} 45%,${c} 100%);`;
    }

    const overlayStyle = slideBg==='transparent' && img
      ? `position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0.55),rgba(0,0,0,0.2));`
      : `display:none;`;

    const contentBox = slideBg==='transparent'
      ? `padding:20px 28px;border-radius:12px;${glassDark}display:inline-block;`
      : ``;

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${coverBg}"></div>
        <div style="position:absolute;inset:0;${overlayStyle}pointer-events:none;"></div>
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:${jc};align-items:${ai};padding:44px 52px;text-align:${textAlign};">
          <div style="${contentBox}">
            <div style="width:40px;height:3px;background:rgba(255,255,255,0.7);border-radius:2px;margin-bottom:12px;${textAlign==='center'?'margin-left:auto;margin-right:auto;':''}"></div>
            ${s.eyebrow?`<div contenteditable="false" style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:8px;">${s.eyebrow}</div>`:''}
            <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;line-height:1.1;color:#fff;margin-bottom:14px;font-weight:400;max-width:600px;">${s.title}</div>
            ${s.subtitle?`<div contenteditable="false" style="font-size:${ssz}px;color:rgba(255,255,255,0.75);line-height:1.6;max-width:520px;">${s.subtitle}</div>`:''}
          </div>
        </div>
        ${pnw}
      </div>`;
  }

  // ── Highlight ──
  if (s.type==='highlight') {
    const {jc,ai} = titleAlign(tpos||'center');
    const textAlign = ai==='center'?'center':ai==='flex-end'?'right':'left';
    let hlBg = '';
    if (img) {
      hlBg = slideBg==='transparent'
        ? `background:url(${img}) center/cover no-repeat;`
        : `background:linear-gradient(135deg,${d2}e8,${c}cc),url(${img}) center/cover no-repeat;`;
    } else {
      hlBg = `background:linear-gradient(135deg,${d2},${d} 50%,${c});`;
    }
    const hlOverlay = slideBg==='transparent'&&img ? `position:absolute;inset:0;background:rgba(0,0,0,0.5);` : `display:none;`;
    const hlBox = slideBg==='transparent' ? `padding:24px 36px;border-radius:14px;${glassDark}` : '';

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${hlBg}"></div>
        <div style="position:absolute;inset:0;${hlOverlay}pointer-events:none;"></div>
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:40px 64px;text-align:center;">
          <div style="${hlBox}">
            ${s.eyebrow?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:18px;border:1px solid rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;display:inline-block;">${s.eyebrow}</div>`:''}
            <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;line-height:1.25;color:#fff;margin-bottom:18px;font-style:italic;">"${s.title}"</div>
            ${s.subtitle?`<div contenteditable="false" style="font-size:13px;color:rgba(255,255,255,0.65);max-width:480px;line-height:1.65;margin:0 auto;">${s.subtitle}</div>`:''}
          </div>
        </div>
        ${pnw}
      </div>`;
  }

  // ── Closing ──
  if (s.type==='closing') {
    const {jc,ai} = titleAlign(tpos||'center');
    let clBg = '';
    if (img) {
      clBg = slideBg==='transparent'
        ? `background:url(${img}) center/cover no-repeat;`
        : `background:linear-gradient(to top,${d2}ee,${d}aa 50%,${c}55),url(${img}) center/cover no-repeat;`;
    } else {
      clBg = slideBg==='transparent' ? `background:linear-gradient(135deg,${c}20,${d}15);` : `background:#fafaf8;`;
    }
    const clOverlay = slideBg==='transparent'&&img ? `position:absolute;inset:0;background:rgba(0,0,0,0.45);` : `display:none;`;
    const hasPhoto  = !!img;
    const tc  = hasPhoto ? '#fff' : '#1a1814';
    const sc  = hasPhoto ? 'rgba(255,255,255,0.7)' : '#7a7570';
    const clBox = slideBg==='transparent' ? `padding:24px 36px;border-radius:14px;${glassDark}` : '';

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${clBg}"></div>
        <div style="position:absolute;inset:0;${clOverlay}pointer-events:none;"></div>
        ${!img?`<div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>`:''}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px;text-align:center;">
          <div style="${clBox}">
            <div style="width:44px;height:3px;background:${hasPhoto?'rgba(255,255,255,0.7)':c};border-radius:2px;margin:0 auto 18px;"></div>
            ${s.eyebrow?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${hasPhoto?'rgba(255,255,255,0.55)':c};margin-bottom:10px;">${s.eyebrow}</div>`:''}
            <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;color:${tc};margin-bottom:12px;">${s.title}</div>
            ${s.subtitle?`<div contenteditable="false" style="font-size:14px;color:${sc};max-width:440px;line-height:1.6;">${s.subtitle}</div>`:''}
          </div>
        </div>
        ${hasPhoto?pnw:pn}
      </div>`;
  }

  // ── Stats ──
  if (s.type==='stats') {
    const statsCards = (s.stats||[]).map(st=>`
      <div style="flex:1;min-width:110px;text-align:center;padding:20px 14px;${slideBg==='transparent'?glass:`background:${c}0e;border-radius:10px;border:1.5px solid ${c}25;`}border-radius:10px;">
        <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${lo.numberSize||44}px;color:${slideBg==='transparent'?'#fff':c};font-weight:400;line-height:1;">${st.number}</div>
        <div contenteditable="false" style="font-size:${lo.labelSize||12}px;color:${slideBg==='transparent'?'rgba(255,255,255,0.7)':'#6b6860'};margin-top:6px;line-height:1.4;">${st.label}</div>
      </div>`).join('');

    let stBg = '';
    if (slideBg==='transparent') {
      stBg = img ? `background:url(${img}) center/cover no-repeat;` : `background:linear-gradient(135deg,${d2},${c});`;
    } else {
      stBg = img ? `background:linear-gradient(to bottom,#fff 55%,${c}12 100%);` : `background:#fff;`;
    }
    const stOverlay = slideBg==='transparent' ? `position:absolute;inset:0;background:rgba(0,0,0,0.5);` : (img?`position:absolute;bottom:0;left:0;right:0;height:35%;overflow:hidden;`:`display:none;`);

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;${stBg}">
        <div style="${stOverlay}pointer-events:none;">${slideBg!=='transparent'&&img?`<img src="${img}" style="width:100%;height:100%;object-fit:cover;opacity:0.1;filter:blur(2px);" /><div style="position:absolute;inset:0;background:linear-gradient(to bottom,#fff,transparent);"></div>`:''}</div>
        ${slideBg!=='transparent'?`<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>`:''}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:34px 42px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:26px;">
            <div style="width:4px;height:28px;background:${c};border-radius:2px;flex-shrink:0;"></div>
            <div>
              ${s.sectionLabel?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${slideBg==='transparent'?'rgba(255,255,255,0.7)':c};margin-bottom:2px;">${s.sectionLabel}</div>`:''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;color:${slideBg==='transparent'?'#fff':'#1a1814'};">${s.title}</div>
            </div>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;">${statsCards}</div>
        </div>
        ${slideBg==='transparent'?pnw:pn}
      </div>`;
  }

  // ── Image-Grid ──
  if (s.type==='image-grid') {
    const gridItems = (s.images||[]).map(gi=>{
      const gkey = gi.query+'__portrait';
      const gUrl = imgCache[gkey] || imgCache[gi.query+'__landscape'] || null;
      return `
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;">
          <div style="aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:${c}15;position:relative;">
            ${gUrl?`<img src="${gUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${c}15;color:${c};font-size:24px;">🌿</div>`}
          </div>
          <div contenteditable="false" style="font-size:10px;font-weight:600;color:${slideBg==='transparent'?'#ddd':'#1a1814'};line-height:1.3;">${gi.caption||''}</div>
          ${gi.detail?`<div contenteditable="false" style="font-size:9px;color:${slideBg==='transparent'?'rgba(255,255,255,0.6)':'#888'};line-height:1.3;">${gi.detail}</div>`:''}
        </div>`;
    }).join('');

    let gdBg = '';
    if (slideBg==='transparent') {
      gdBg = img ? `background:url(${img}) center/cover no-repeat;` : `background:linear-gradient(135deg,${d2},${c}88);`;
    } else {
      gdBg = `background:#fafaf9;`;
    }
    const gdOverlay = slideBg==='transparent' ? `position:absolute;inset:0;background:rgba(0,0,0,0.6);pointer-events:none;` : `display:none;`;

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;${gdBg}">
        <div style="${gdOverlay}"></div>
        ${slideBg!=='transparent'?`<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>`:''}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 36px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <div style="width:4px;height:24px;background:${c};border-radius:2px;flex-shrink:0;"></div>
            <div>
              ${s.sectionLabel?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${slideBg==='transparent'?'rgba(255,255,255,0.7)':c};margin-bottom:2px;">${s.sectionLabel}</div>`:''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;color:${slideBg==='transparent'?'#fff':'#1a1814'};">${s.title}</div>
            </div>
          </div>
          <div style="flex:1;display:flex;gap:12px;align-items:stretch;">${gridItems}</div>
        </div>
        ${slideBg==='transparent'?pnw:pn}
      </div>`;
  }

  // ── Image-Focus ──
  if (s.type==='image-focus') {
    const imgSide = ipos==='left' ? 'row-reverse' : 'row';
    let ifBg = '';
    if (slideBg==='transparent') {
      ifBg = img ? `background:url(${img}) center/cover no-repeat;` : `background:linear-gradient(135deg,${d2},${c});`;
    } else {
      ifBg = img
        ? `background:linear-gradient(to ${ipos==='left'?'left':'right'},${d2}f2 0%,${d2}cc 35%,transparent 65%),url(${img}) ${ipos==='left'?'left':'right'} center/cover no-repeat;`
        : `background:linear-gradient(135deg,${d2},${c});`;
    }
    const ifOverlay = slideBg==='transparent'&&img ? `position:absolute;inset:0;background:rgba(0,0,0,0.5);pointer-events:none;` : `display:none;`;
    const textBox = slideBg==='transparent' ? `padding:20px 24px;border-radius:12px;${glassDark}` : '';

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${ifBg}"></div>
        <div style="${ifOverlay}"></div>
        <div style="position:relative;z-index:2;width:${slideBg==='transparent'?'60%':'55%'};height:100%;display:flex;flex-direction:column;justify-content:center;padding:40px 44px;">
          <div style="${textBox}">
            <div style="width:32px;height:3px;background:${c};border-radius:2px;margin-bottom:12px;"></div>
            ${s.sectionLabel?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:7px;">${s.sectionLabel}</div>`:''}
            <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;line-height:1.2;color:#fff;margin-bottom:12px;">${s.title}</div>
            ${s.body?`<div contenteditable="false" style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:12px;line-height:1.55;">${s.body}</div>`:''}
            ${(s.points||[]).map(p=>`<div contenteditable="false" style="font-size:${psz}px;color:rgba(255,255,255,0.85);line-height:1.55;margin-bottom:7px;display:flex;gap:7px;align-items:flex-start;"><span style="color:${c};font-weight:700;flex-shrink:0;margin-top:1px;">›</span>${p}</div>`).join('')}
          </div>
        </div>
        ${pnw}
      </div>`;
  }

  // ── Reading ──
  if (s.type==='reading') {
    const hasImg = !!img;
    const imgLeft = ipos==='left';
    const paras = (s.paragraphs||[]).map(p=>`<p contenteditable="false" style="font-size:${txsz}px;color:${slideBg==='transparent'?'rgba(255,255,255,0.85)':'#3a3835'};line-height:1.8;margin-bottom:11px;">${p}</p>`).join('');

    let rdBg = '';
    if (slideBg==='transparent') {
      rdBg = `background:linear-gradient(135deg,${d2}cc,${c}88);`;
    } else {
      rdBg = `background:#fff;`;
    }

    const imgBlock = hasImg ? `
      <div style="flex:0 0 38%;border-radius:10px;overflow:hidden;align-self:stretch;min-height:160px;">
        <img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>` : '';

    const textWrap = slideBg==='transparent' ? `padding:16px 20px;border-radius:10px;${glass}` : '';

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;${rdBg}">
        ${slideBg!=='transparent'?`<div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${c},${d});"></div>`:''}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 36px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <div style="width:4px;height:24px;background:${c};border-radius:2px;flex-shrink:0;"></div>
            <div>
              ${s.sectionLabel?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:2px;">${s.sectionLabel}</div>`:''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;color:${slideBg==='transparent'?'#fff':'#1a1814'};">${s.title}</div>
            </div>
          </div>
          <div style="flex:1;display:flex;gap:18px;overflow:hidden;align-items:flex-start;">
            ${imgLeft ? imgBlock : ''}
            <div style="flex:1;overflow-y:auto;${textWrap}">${paras}</div>
            ${!imgLeft ? imgBlock : ''}
          </div>
        </div>
        ${slideBg==='transparent'?pnw:pn}
      </div>`;
  }

  // ── Content (padrão) ──
  const pts = (s.points||[]).map(p=>`
    <div style="display:flex;gap:9px;align-items:flex-start;margin-bottom:10px;">
      <div style="width:6px;height:6px;border-radius:50%;background:${c};flex-shrink:0;margin-top:5px;"></div>
      <div contenteditable="false" style="font-size:${psz}px;line-height:1.55;color:${slideBg==='transparent'?'rgba(255,255,255,0.88)':'#3a3835'};">${p}</div>
    </div>`).join('');

  const hasContentImg = !!img;
  let ctBg = '';
  if (slideBg==='transparent') {
    ctBg = `background:linear-gradient(135deg,${d2}cc,${c}88);`;
  } else {
    const bgPats = [`background:#fff;`,`background:#fafaf9;`,`background:#fff;`,`background:#f9f9fb;`];
    ctBg = bgPats[(i-1+4)%4];
  }

  const bgDeco = slideBg!=='transparent' ? [
    `<div style="position:absolute;top:0;left:0;bottom:0;width:5px;background:linear-gradient(180deg,${c},${d});"></div><div style="position:absolute;top:0;right:0;width:160px;height:160px;border-radius:0 0 0 100%;background:${c}07;pointer-events:none;"></div>`,
    `<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>`,
    `<div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:${c}10;pointer-events:none;"></div>`,
    `<div style="position:absolute;top:0;left:0;bottom:0;width:32%;background:linear-gradient(135deg,${c}10,${d}06);pointer-events:none;"></div>`,
  ][(i-1+4)%4] : '';

  const titleBox = slideBg==='transparent' ? `padding:14px 18px;border-radius:10px;${glass}margin-bottom:8px;` : '';
  const ptsBox   = slideBg==='transparent' ? `padding:14px 18px;border-radius:10px;${glass}` : '';

  if (hasContentImg) {
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;${ctBg}">
        ${bgDeco}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:row;">
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:32px 28px 32px 40px;">
            <div style="${titleBox}">
              <div style="width:4px;height:32px;background:linear-gradient(180deg,${c},${d});border-radius:2px;margin-bottom:10px;"></div>
              ${s.sectionLabel?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:6px;">${s.sectionLabel}</div>`:''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;line-height:1.25;color:${slideBg==='transparent'?'#fff':'#1a1814'};margin-bottom:8px;">${s.title}</div>
              ${s.body?`<div contenteditable="false" style="font-size:12px;color:${slideBg==='transparent'?'rgba(255,255,255,0.65)':'#8a8680'};line-height:1.5;font-style:italic;">${s.body}</div>`:''}
            </div>
            <div style="${ptsBox}">${pts}</div>
          </div>
          <div style="flex:0 0 36%;position:relative;overflow:hidden;">
            <img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block;" />
            <div style="position:absolute;inset:0;background:linear-gradient(to right,${slideBg==='transparent'?'rgba(0,0,0,0.3)':c+'18'},transparent 40%);pointer-events:none;"></div>
          </div>
        </div>
        ${pn}
      </div>`;
  }

  return `
    <div style="width:100%;height:100%;position:relative;overflow:hidden;${ctBg}">
      ${bgDeco}
      <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:row;padding:32px 40px;gap:24px;">
        <div style="flex:0 0 32%;display:flex;flex-direction:column;justify-content:center;">
          <div style="${titleBox}">
            <div style="width:4px;height:32px;background:linear-gradient(180deg,${c},${d});border-radius:2px;margin-bottom:10px;"></div>
            ${s.sectionLabel?`<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:6px;">${s.sectionLabel}</div>`:''}
            <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${tsz}px;line-height:1.25;color:${slideBg==='transparent'?'#fff':'#1a1814'};">${s.title}</div>
            ${s.body?`<div contenteditable="false" style="font-size:12px;color:${slideBg==='transparent'?'rgba(255,255,255,0.65)':'#8a8680'};margin-top:8px;line-height:1.5;font-style:italic;">${s.body}</div>`:''}
          </div>
        </div>
        <div style="width:1px;background:${c}20;flex-shrink:0;"></div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;${ptsBox}">${pts}</div>
      </div>
      ${slideBg==='transparent'?pnw:pn}
    </div>`;
}

// ── THUMBNAIL ──
function buildThumbHTML(s, i) {
  const c   = s.accentColor || themeColor;
  const img = s.imageQuery ? (imgCache[s.imageQuery+'__landscape'] || imgCache[s.imageQuery+'__portrait'] || null) : null;
  const isDark = ['cover','highlight','image-focus','closing'].includes(s.type) || slideBg==='transparent';
  const bg  = isDark ? c : '#fff';
  const tc  = isDark ? '#fff' : c;
  const bgStyle = img ? `background:linear-gradient(${darken(c,40)}cc,${c}88),url(${img}) center/cover;` : `background:${bg};`;
  return `
    <div style="width:100%;height:100%;${bgStyle}display:flex;align-items:center;justify-content:center;padding:4px;position:relative;">
      <div style="font-size:5px;font-weight:600;color:${tc};text-align:center;line-height:1.3;overflow:hidden;max-height:100%;">${s.title||''}</div>
    </div>
    <div class="thumb-label">${i+1}</div>`;
}

// ── TEXT BOX ──
function addTextBox() {
  if (!slides.length) { showToast('Gere os slides primeiro!'); return; }
  if (!textBoxes[current]) textBoxes[current]=[];
  const id=++tbCounter, box={id,x:40,y:40,text:'Digite aqui...'};
  textBoxes[current].push(box);
  mountTextBox(box,current);
  showToast('📝 Arraste para posicionar');
}

function mountTextBox(box, si) {
  const stage = document.getElementById('slide-stage');
  const div   = document.createElement('div');
  div.className='tb-box'; div.dataset.id=box.id; div.dataset.slide=si;
  div.contentEditable='true'; div.textContent=box.text;
  div.style.cssText=`position:absolute;left:${box.x}px;top:${box.y}px;min-width:160px;min-height:28px;background:rgba(255,255,255,0.94);border:2px dashed ${themeColor};border-radius:6px;padding:7px 28px 7px 10px;font-family:'DM Sans',sans-serif;font-size:14px;color:#1a1814;cursor:move;z-index:50;outline:none;box-shadow:0 3px 16px rgba(0,0,0,0.18);display:${si===current?'block':'none'};`;
  const close=document.createElement('span');
  close.innerHTML='×';
  close.style.cssText=`position:absolute;top:-9px;right:-9px;width:20px;height:20px;border-radius:50%;background:${themeColor};color:white;font-size:13px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;`;
  close.onclick=e=>{e.stopPropagation();textBoxes[si]=(textBoxes[si]||[]).filter(b=>b.id!==box.id);div.remove();};
  div.appendChild(close);
  div.addEventListener('mousedown',e=>{
    if(e.target===close)return; e.preventDefault();
    const r=stage.getBoundingClientRect(), ox=e.clientX-r.left-box.x, oy=e.clientY-r.top-box.y;
    const mv=me=>{box.x=Math.max(0,me.clientX-r.left-ox);box.y=Math.max(0,me.clientY-r.top-oy);div.style.left=box.x+'px';div.style.top=box.y+'px';};
    const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  });
  div.addEventListener('input',()=>{box.text=div.innerText;});
  stage.appendChild(div);
}

function renderTextBoxes(si) {
  document.querySelectorAll('.tb-box').forEach(el=>{el.style.display=parseInt(el.dataset.slide)===si?'block':'none';});
}

// ── EXPORT PPTX ──
// ── CAPTURA SLIDE COMO IMAGEM (html2canvas) ──
async function captureSlide(index) {
  const container = document.getElementById('slides-container');
  const allSlides = container.querySelectorAll('.slide');

  // Mostra só o slide desejado temporariamente
  allSlides.forEach((s,i) => {
    s.style.display = i === index ? 'flex' : 'none';
    s.classList.toggle('active', i === index);
  });

  const stage = document.getElementById('slide-stage');
  const canvas = await html2canvas(stage, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });

  // Restaura exibição
  allSlides.forEach((s,i) => {
    s.style.display = i === current ? 'flex' : 'none';
    s.classList.toggle('active', i === current);
  });

  return canvas.toDataURL('image/png');
}

// ── EXPORT PPTX — captura cada slide como imagem ──
async function exportPPTX() {
  if (!slides.length) { showToast('Gere os slides primeiro!'); return; }
  document.getElementById('export-wrap').classList.remove('open');

  showToast('Capturando slides... aguarde');
  document.getElementById('gen-btn').disabled = true;

  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    for (let i = 0; i < slides.length; i++) {
      document.getElementById('loading-text') && (document.getElementById('loading-text').textContent = `Capturando slide ${i+1}/${slides.length}...`);
      showToast(`📸 Capturando slide ${i+1}/${slides.length}...`);

      const imgData = await captureSlide(i);
      const slide   = pptx.addSlide();

      slide.addImage({
        data: imgData,
        x: 0, y: 0,
        w: '100%', h: '100%',
      });
    }

    const tema = document.getElementById('tema').value.trim().slice(0,30) || 'slides';
    await pptx.writeFile({ fileName: `SlideAI-${tema}.pptx` });
    showToast('✅ PPTX baixado com fotos!');
  } catch(e) {
    console.error(e);
    showToast('Erro ao gerar PPTX: ' + e.message);
  } finally {
    document.getElementById('gen-btn').disabled = false;
  }
}

// ── EXPORT PDF — captura cada slide e gera PDF ──
async function exportPDF() {
  if (!slides.length) { showToast('Gere os slides primeiro!'); return; }
  document.getElementById('export-wrap').classList.remove('open');

  showToast('Gerando PDF... aguarde');
  document.getElementById('gen-btn').disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });

    for (let i = 0; i < slides.length; i++) {
      showToast(`📄 Capturando slide ${i+1}/${slides.length}...`);
      const imgData = await captureSlide(i);

      if (i > 0) pdf.addPage([1280, 720], 'landscape');
      pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
    }

    const tema = document.getElementById('tema').value.trim().slice(0,30) || 'slides';
    pdf.save(`SlideAI-${tema}.pdf`);
    showToast('✅ PDF baixado!');
  } catch(e) {
    console.error(e);
    showToast('Erro ao gerar PDF: ' + e.message);
  } finally {
    document.getElementById('gen-btn').disabled = false;
  }
}