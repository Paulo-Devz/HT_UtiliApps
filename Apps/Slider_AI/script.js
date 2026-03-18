// ============================================================
//  SlideAI — script.js completo
//  Groq decide layout, posicionamento e conteúdo
//  Pexels fornece imagens reais por slide
//  Cole como <script src="script.js"> no main.html
// ============================================================

// ── CONFIG — substitua sua chave Pexels (pexels.com/api) ──
const PEXELS_KEY = 'SUA_CHAVE_PEXELS_AQUI';

// ── State ──
let slides     = [];
let current    = 0;
let animated   = true;
let slideCount = 6;
let themeColor = '#667eea';
let editMode   = false;
let textBoxes  = {};
let tbCounter  = 0;
let imgCache   = {}; // query → url

// ── Cor helpers ──
function darken(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n>>16, (n>>8)&0xff, n&0xff]
    .map(c => Math.max(0,c-pct).toString(16).padStart(2,'0')).join('');
}
function lighten(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n>>16, (n>>8)&0xff, n&0xff]
    .map(c => Math.min(255,c+pct).toString(16).padStart(2,'0')).join('');
}
function hexOnly(h) { return h.replace('#',''); }
function textOnColor(hex) {
  const n = parseInt(hex.slice(1),16);
  const r=(n>>16), g=(n>>8)&0xff, b=n&0xff;
  return (r*299+g*587+b*114)/1000 > 128 ? '#1a1814' : '#ffffff';
}

// ── Busca imagem no Pexels ──
async function fetchImage(query, orientation = 'landscape') {
  if (imgCache[query]) return imgCache[query];
  if (!PEXELS_KEY || PEXELS_KEY === 'SUA_CHAVE_PEXELS_AQUI') return null;
  try {
    const res  = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=${orientation}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    const photos = data.photos || [];
    if (!photos.length) return null;
    // Pega foto aleatória entre as 5 primeiras pra variar
    const url = photos[Math.floor(Math.random()*photos.length)].src.large;
    imgCache[query] = url;
    return url;
  } catch { return null; }
}

// Busca todas as imagens necessárias antes de renderizar
async function prefetchImages(slidesData) {
  const promises = slidesData
    .filter(s => s.imageQuery)
    .map(s => fetchImage(s.imageQuery, s.imageOrientation || 'landscape'));
  await Promise.all(promises);
}

// ── UI helpers ──
function setTema(t) { document.getElementById('tema').value = t; }

function setAnim(val) {
  animated = val;
  document.getElementById('btn-anim').classList.toggle('active', val);
  document.getElementById('btn-static').classList.toggle('active', !val);
  if (slides.length) applyAnimation();
}

function changeCount(d) {
  slideCount = Math.max(3, Math.min(12, slideCount + d));
  document.getElementById('count-val').textContent = slideCount;
}

function selectColor(el) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  themeColor = el.dataset.color;
  if (slides.length) renderSlides();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function toggleExport() {
  document.getElementById('export-wrap').classList.toggle('open');
}

document.addEventListener('click', e => {
  const w = document.getElementById('export-wrap');
  if (w && !w.contains(e.target)) w.classList.remove('open');
});

// ── Navigation ──
function navigate(dir) {
  current = Math.max(0, Math.min(slides.length-1, current+dir));
  renderCurrent();
  renderTextBoxes(current);
}

function goTo(i) {
  current = i;
  renderCurrent();
  renderTextBoxes(i);
}

function renderCurrent() {
  document.querySelectorAll('.slide').forEach((s,i) => {
    s.classList.toggle('active', i===current);
    if (i===current && animated) {
      s.classList.remove('animated');
      void s.offsetWidth;
      s.classList.add('animated');
    }
  });
  document.querySelectorAll('.thumb').forEach((t,i) => t.classList.toggle('active', i===current));
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

function applyAnimation() {
  document.querySelectorAll('.slide').forEach(s => s.classList.toggle('animated', animated));
}

function toggleEdit() {
  editMode = !editMode;
  document.querySelectorAll('[contenteditable]').forEach(el => {
    el.contentEditable = editMode ? 'true' : 'false';
  });
  showToast(editMode ? '✏️ Clique nos textos para editar' : '✅ Edição desativada');
}

// ── PROMPT — Groq decide TUDO ──
function buildPrompt(tema, count) {
  return `Você é um designer e educador especialista em criar apresentações visuais profissionais.

O usuário quer uma apresentação sobre: "${tema}"
Quantidade de slides: ${count}

SUA TAREFA: Analisar profundamente o tema e criar a melhor apresentação possível. Você decide tudo: layout, posicionamento, tamanho de texto, o que mostrar em cada slide.

TIPOS DE SLIDE disponíveis (escolha o melhor para cada momento):
- "cover": capa impactante
- "content": título + pontos objetivos (3-5 pontos curtos e informativos)
- "reading": explicação aprofundada com texto longo (use para conceitos complexos que precisam de detalhes)
- "image-focus": imagem grande com texto sobreposto (use para mostrar exemplos visuais)
- "image-grid": grade de 2-4 imagens com legendas (excelente para comparar exemplos)
- "stats": dados numéricos impactantes (3 stats)
- "highlight": frase de impacto grande no centro (use para conceitos-chave)
- "closing": encerramento

REGRAS IMPORTANTES:
1. NÃO use sempre o mesmo layout — varie bastante
2. Se o usuário pediu algo específico no tema, INCLUA aquilo primeiro, depois complemente
3. Para cada slide que precisa de imagem, forneça uma "imageQuery" específica em inglês (ex: "moss bryophyte forest", "fern leaves macro")
4. Textos curtos nos pontos (content): máx 15 palavras cada, diretos e informativos
5. Textos longos (reading): mínimo 3 parágrafos ricos de 3-4 frases cada
6. Seja educacional, claro, com exemplos reais
7. Para slides de imagem, a imageQuery deve ser bem específica para encontrar a foto certa

FORMATO JSON obrigatório — retorne APENAS o array, sem texto extra:
[
  {
    "type": "cover",
    "layout": {
      "titleSize": 48,
      "titlePosition": "bottom-left",
      "overlay": "dark-gradient"
    },
    "eyebrow": "REINO PLANTAE",
    "title": "Do Musgo às Flores",
    "subtitle": "Evolução e diversidade das plantas terrestres",
    "imageQuery": "green forest plants nature",
    "imageOrientation": "landscape",
    "accentColor": "#4ade80"
  },
  {
    "type": "content",
    "layout": {
      "columns": "left-title-right-points",
      "titleSize": 28,
      "pointSize": 14,
      "hasImage": false
    },
    "sectionLabel": "BRIÓFITAS",
    "title": "As Primeiras Conquistadoras da Terra",
    "body": "Organismos pioneiros na colonização do ambiente terrestre",
    "points": [
      "Não possuem vasos condutores — absorvem água por toda a superfície",
      "Vivem em locais úmidos: pedras, troncos e solo de florestas",
      "Reprodução por esporos liberados em cápsulas",
      "Exemplos: musgos, hepáticas e antóceros"
    ],
    "imageQuery": null,
    "accentColor": null
  },
  {
    "type": "reading",
    "layout": {
      "columns": "two-column",
      "titleSize": 24,
      "textSize": 13,
      "hasImage": true,
      "imagePosition": "right"
    },
    "sectionLabel": "APROFUNDAMENTO",
    "title": "Como as Briófitas Sobrevivem Sem Vasos?",
    "paragraphs": [
      "As briófitas representam um grupo de plantas avasculares que evoluíram há cerca de 470 milhões de anos. Diferente das plantas superiores, elas não possuem xilema nem floema — os tecidos responsáveis pelo transporte de água e nutrientes nas plantas vasculares.",
      "A água é absorvida diretamente por osmose em toda a superfície do organismo, o que explica sua necessidade de ambientes úmidos. Em períodos de seca, muitas espécies entram em dormência e conseguem se reidratar completamente ao contato com a água novamente.",
      "Este grupo inclui mais de 20.000 espécies distribuídas em três divisões: Bryophyta (musgos), Marchantiophyta (hepáticas) e Anthocerotophyta (antóceros). São fundamentais para a retenção de água no solo e servem de habitat para microorganismos."
    ],
    "imageQuery": "moss close up macro bryophyte",
    "imageOrientation": "portrait",
    "accentColor": null
  },
  {
    "type": "image-grid",
    "layout": {
      "gridCols": 3,
      "captionPosition": "below",
      "titleSize": 22
    },
    "sectionLabel": "EXEMPLOS",
    "title": "Briófitas na Natureza",
    "images": [
      { "query": "sphagnum moss peat bog", "caption": "Musgo Sphagnum — forma turfeiras", "detail": "Retém até 20x seu peso em água" },
      { "query": "liverwort hepatic plant", "caption": "Hepática — corpo achatado", "detail": "Cresce em solos úmidos e sombrios" },
      { "query": "hornwort anthocerotophyta plant", "caption": "Antócero — estrutura espigada", "detail": "Possui cloroplastos únicos com pirenoides" }
    ],
    "accentColor": null
  },
  {
    "type": "highlight",
    "layout": {
      "titleSize": 38,
      "alignment": "center",
      "style": "quote"
    },
    "eyebrow": "CURIOSIDADE",
    "title": "Musgos cobrem 3% da superfície terrestre e são cruciais para o ciclo da água",
    "subtitle": "Bioma de musgo: reguladores climáticos naturais",
    "imageQuery": "moss forest floor green carpet",
    "accentColor": "#4ade80"
  },
  {
    "type": "stats",
    "layout": {
      "cardStyle": "outlined",
      "numberSize": 52,
      "labelSize": 13
    },
    "sectionLabel": "DADOS",
    "title": "Briófitas em Números",
    "stats": [
      { "number": "20mil", "label": "espécies conhecidas no mundo" },
      { "number": "470M", "label": "anos de existência no planeta" },
      { "number": "3%", "label": "da superfície terrestre coberta" }
    ],
    "imageQuery": null,
    "accentColor": null
  },
  {
    "type": "closing",
    "layout": {
      "style": "centered-minimal",
      "titleSize": 40
    },
    "eyebrow": "CONCLUSÃO",
    "title": "Simples na forma, essenciais na função",
    "subtitle": "As briófitas provam que tamanho não define importância",
    "imageQuery": "green nature peaceful forest",
    "accentColor": null
  }
]

AGORA crie o JSON para o tema: "${tema}" com ${count} slides.
Seja rico em conteúdo, varie os layouts, inclua imageQuery específicas para cada slide visual.
Retorne APENAS o JSON array, sem nenhum texto antes ou depois.`;
}

// ── FALLBACK ──
function buildFallback(tema) {
  return [
    { type:'cover',      layout:{titleSize:44,titlePosition:'bottom-left',overlay:'dark-gradient'}, eyebrow:'APRESENTAÇÃO', title:tema, subtitle:'Uma visão completa e aprofundada', imageQuery: tema + ' nature', accentColor:null },
    { type:'content',    layout:{columns:'left-title-right-points',titleSize:26,pointSize:14,hasImage:false}, sectionLabel:'INTRODUÇÃO', title:'Conceitos Fundamentais', body:'Entendendo o contexto e a origem', points:['Definição e origem histórica do tema','Relevância no cenário atual','Principais características','Como se relaciona com o cotidiano'], imageQuery:null, accentColor:null },
    { type:'highlight',  layout:{titleSize:36,alignment:'center',style:'quote'}, eyebrow:'DESTAQUE', title:'O conhecimento transforma a forma como enxergamos o mundo', subtitle:'Compreender fundo é o primeiro passo', imageQuery: tema + ' concept', accentColor:null },
    { type:'reading',    layout:{columns:'two-column',titleSize:22,textSize:13,hasImage:true,imagePosition:'right'}, sectionLabel:'APROFUNDAMENTO', title:'Entendendo em Detalhes', paragraphs:['Este tema possui uma riqueza de aspectos que merecem atenção especial. Ao estudarmos com profundidade, percebemos conexões que não são imediatamente óbvias.','Os principais elementos que compõem esse assunto se inter-relacionam de forma complexa e fascinante, formando um sistema coeso de conhecimento.','Compreender esses aspectos nos permite não apenas entender o passado, mas também projetar o futuro com mais clareza e precisão.'], imageQuery: tema, accentColor:null },
    { type:'stats',      layout:{cardStyle:'outlined',numberSize:48,labelSize:12}, sectionLabel:'DADOS', title:'Em Números', stats:[{number:'100%',label:'de relevância no tema'},{number:'3x',label:'mais impacto quando aprendido bem'},{number:'∞',label:'possibilidades de aplicação'}], imageQuery:null, accentColor:null },
    { type:'closing',    layout:{style:'centered-minimal',titleSize:38}, eyebrow:'CONCLUSÃO', title:'Obrigado!', subtitle:'Dúvidas e discussão — vamos aprofundar juntos', imageQuery:'sunset nature peaceful', accentColor:null },
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
  textBoxes = {}; imgCache = {};
  slides = []; current = 0;

  const msgs = ['Analisando o tema...','Groq decidindo a estrutura...','Gerando conteúdo rico...','Buscando imagens...','Montando os slides...','Quase pronto...'];
  let mi = 0;
  const ltI = setInterval(() => {
    mi = (mi+1) % msgs.length;
    document.getElementById('loading-text').textContent = msgs[mi];
  }, 1500);

  // 1. Chama Groq
  try {
    const res  = await fetch('/api/ai', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt: buildPrompt(tema, slideCount), max_tokens: 3000 }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Erro');

    let raw = data.result;
    raw = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    const start = raw.indexOf('['), end = raw.lastIndexOf(']');
    if (start !== -1 && end !== -1) raw = raw.slice(start, end+1);
    slides = JSON.parse(raw);
    if (!Array.isArray(slides) || !slides.length) throw new Error('JSON inválido');
  } catch(e) {
    console.warn('Fallback:', e.message);
    slides = buildFallback(tema);
  }

  // 2. Busca imagens em paralelo
  document.getElementById('loading-text').textContent = 'Buscando imagens reais...';
  await prefetchImages(slides);
  // Para image-grid, busca cada imagem do grid
  for (const s of slides) {
    if (s.type === 'image-grid' && s.images) {
      await Promise.all(s.images.map(img => fetchImage(img.query, 'portrait')));
    }
  }

  clearInterval(ltI);
  document.getElementById('loading-overlay').classList.remove('visible');
  document.getElementById('gen-btn').disabled = false;
  document.getElementById('dl-btn').disabled  = false;

  renderSlides();
  showToast(`✅ ${slides.length} slides prontos!`);
}

// ── RENDER SLIDES ──
function renderSlides() {
  const container  = document.getElementById('slides-container');
  const thumbsWrap = document.getElementById('thumbs-wrap');
  container.innerHTML = '';
  thumbsWrap.innerHTML = '';

  slides.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = `slide ${animated?'animated':''} ${i===0?'active':''}`;
    el.innerHTML = buildSlideHTML(s, i);
    container.appendChild(el);

    const th = document.createElement('div');
    th.className = `thumb ${i===0?'active':''}`;
    th.onclick   = () => goTo(i);
    th.innerHTML = buildThumbHTML(s, i);
    thumbsWrap.appendChild(th);
  });

  document.getElementById('slide-indicator').textContent = `1 / ${slides.length}`;
  document.getElementById('prev-btn').disabled = true;
  document.getElementById('next-btn').disabled = slides.length <= 1;
  current = 0;
  renderTextBoxes(0);
}

// ── BUILD SLIDE HTML ──
function buildSlideHTML(s, i) {
  const c     = s.accentColor || themeColor;
  const d     = darken(c, 35);
  const d2    = darken(c, 60);
  const l     = lighten(c, 50);
  const total = slides.length;
  const img   = s.imageQuery ? (imgCache[s.imageQuery] || null) : null;
  const lo    = s.layout || {};

  const titleSz  = lo.titleSize  || 26;
  const pointSz  = lo.pointSize  || 14;
  const textSz   = lo.textSize   || 13;

  // Número de página
  const pageNum = `<div style="position:absolute;bottom:14px;right:20px;z-index:10;font-size:9px;font-weight:600;letter-spacing:1px;color:rgba(0,0,0,0.2);">${i+1} / ${total}</div>`;
  const pageNumW = `<div style="position:absolute;bottom:14px;right:20px;z-index:10;font-size:9px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">${i+1} / ${total}</div>`;

  // ── COVER ──
  if (s.type === 'cover') {
    const bgStyle = img
      ? `background:linear-gradient(to top,${d2}f0 0%,${d}aa 50%,transparent 100%),url(${img}) center/cover no-repeat;`
      : `background:linear-gradient(135deg,${d2} 0%,${d} 45%,${c} 100%);`;
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${bgStyle}"></div>
        ${img ? '' : `
          <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${l}20 0%,transparent 70%);top:-150px;right:-100px;pointer-events:none;"></div>
          <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,${l}15 0%,transparent 70%);bottom:-80px;left:60px;pointer-events:none;"></div>
        `}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:44px 52px;">
          <div style="width:44px;height:3px;background:rgba(255,255,255,0.7);border-radius:2px;margin-bottom:14px;"></div>
          ${s.eyebrow ? `<div contenteditable="false" style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:10px;">${s.eyebrow}</div>` : ''}
          <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;line-height:1.1;color:#fff;margin-bottom:16px;font-weight:400;max-width:70%;">${s.title}</div>
          ${s.subtitle ? `<div contenteditable="false" style="font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6;max-width:520px;">${s.subtitle}</div>` : ''}
        </div>
        ${pageNumW}
      </div>`;
  }

  // ── HIGHLIGHT ──
  if (s.type === 'highlight') {
    const bgStyle = img
      ? `background:linear-gradient(135deg,${d2}e8 0%,${c}cc 100%),url(${img}) center/cover no-repeat;`
      : `background:linear-gradient(135deg,${d2} 0%,${d} 50%,${c} 100%);`;
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${bgStyle}"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,${d2}99,transparent);pointer-events:none;"></div>
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 64px;text-align:center;">
          ${s.eyebrow ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:20px;border:1px solid rgba(255,255,255,0.25);padding:4px 14px;border-radius:20px;">${s.eyebrow}</div>` : ''}
          <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;line-height:1.25;color:#fff;margin-bottom:22px;font-style:italic;text-shadow:0 2px 20px rgba(0,0,0,0.3);">"${s.title}"</div>
          ${s.subtitle ? `<div contenteditable="false" style="font-size:13px;color:rgba(255,255,255,0.65);max-width:480px;line-height:1.65;">${s.subtitle}</div>` : ''}
        </div>
        ${pageNumW}
      </div>`;
  }

  // ── STATS ──
  if (s.type === 'stats') {
    const statsCards = (s.stats||[]).map(st => `
      <div style="flex:1;min-width:130px;text-align:center;padding:22px 16px;background:${c}0e;border-radius:12px;border:1.5px solid ${c}25;">
        <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${lo.numberSize||46}px;color:${c};font-weight:400;line-height:1;">${st.number}</div>
        <div contenteditable="false" style="font-size:${lo.labelSize||12}px;color:#6b6860;margin-top:8px;line-height:1.4;">${st.label}</div>
      </div>`).join('');
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;background:#fff;">
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>
        <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:${c}08;pointer-events:none;"></div>
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:36px 44px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:30px;">
            <div style="width:4px;height:32px;background:${c};border-radius:2px;"></div>
            <div>
              ${s.sectionLabel ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:3px;">${s.sectionLabel}</div>` : ''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;color:#1a1814;">${s.title}</div>
            </div>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;">${statsCards}</div>
        </div>
        ${pageNum}
      </div>`;
  }

  // ── IMAGE-GRID ──
  if (s.type === 'image-grid') {
    const cols = lo.gridCols || 3;
    const gridItems = (s.images||[]).map(img => {
      const iUrl = imgCache[img.query] || null;
      return `
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">
          <div style="aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:${c}15;">
            ${iUrl
              ? `<img src="${iUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;color:${c}60;">🌿</div>`
            }
          </div>
          <div contenteditable="false" style="font-size:11px;font-weight:600;color:#1a1814;line-height:1.3;">${img.caption||''}</div>
          ${img.detail ? `<div contenteditable="false" style="font-size:10px;color:#888;line-height:1.4;">${img.detail}</div>` : ''}
        </div>`;
    }).join('');
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;background:#fafaf9;">
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:32px 40px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
            <div style="width:4px;height:28px;background:${c};border-radius:2px;"></div>
            <div>
              ${s.sectionLabel ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:2px;">${s.sectionLabel}</div>` : ''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;color:#1a1814;">${s.title}</div>
            </div>
          </div>
          <div style="flex:1;display:flex;gap:14px;align-items:stretch;">${gridItems}</div>
        </div>
        ${pageNum}
      </div>`;
  }

  // ── IMAGE-FOCUS ──
  if (s.type === 'image-focus') {
    const bgStyle = img
      ? `background:linear-gradient(to right,${d2}f2 0%,${d2}cc 35%,transparent 65%),url(${img}) right center/cover no-repeat;`
      : `background:linear-gradient(135deg,${d2},${c});`;
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${bgStyle}"></div>
        <div style="position:relative;z-index:2;width:55%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:44px 48px;">
          <div style="width:36px;height:3px;background:${c};border-radius:2px;margin-bottom:14px;"></div>
          ${s.sectionLabel ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:8px;">${s.sectionLabel}</div>` : ''}
          <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;line-height:1.2;color:#fff;margin-bottom:14px;">${s.title}</div>
          ${s.body ? `<div contenteditable="false" style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:14px;">${s.body}</div>` : ''}
          ${(s.points||[]).map(p=>`<div contenteditable="false" style="font-size:${pointSz}px;color:rgba(255,255,255,0.85);line-height:1.55;margin-bottom:8px;display:flex;gap:8px;"><span style="color:${c};font-weight:700;flex-shrink:0;">›</span>${p}</div>`).join('')}
        </div>
        ${pageNumW}
      </div>`;
  }

  // ── READING ──
  if (s.type === 'reading') {
    const hasImg = lo.hasImage && img;
    const imgPos = lo.imagePosition || 'right';
    const textW  = hasImg ? '55%' : '100%';
    const paras  = (s.paragraphs||[]).map(p =>
      `<p contenteditable="false" style="font-size:${textSz}px;color:#3a3835;line-height:1.8;margin-bottom:12px;">${p}</p>`
    ).join('');

    const imgBlock = hasImg ? `
      <div style="flex:0 0 40%;border-radius:10px;overflow:hidden;align-self:stretch;min-height:200px;">
        <img src="${img}" style="width:100%;height:100%;object-fit:cover;" />
      </div>` : '';

    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;background:#fff;">
        <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${c},${d});"></div>
        <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:${c}08;pointer-events:none;"></div>
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:32px 40px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
            <div style="width:4px;height:28px;background:${c};border-radius:2px;"></div>
            <div>
              ${s.sectionLabel ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:2px;">${s.sectionLabel}</div>` : ''}
              <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;color:#1a1814;">${s.title}</div>
            </div>
          </div>
          <div style="flex:1;display:flex;gap:20px;overflow:hidden;align-items:flex-start;">
            ${imgPos==='left' ? imgBlock : ''}
            <div style="flex:1;overflow-y:auto;padding-right:4px;">${paras}</div>
            ${imgPos==='right' ? imgBlock : ''}
          </div>
        </div>
        ${pageNum}
      </div>`;
  }

  // ── CLOSING ──
  if (s.type === 'closing') {
    const bgStyle = img
      ? `background:linear-gradient(to top,${d2}ee 0%,${d}aa 50%,${c}55 100%),url(${img}) center/cover no-repeat;`
      : `background:#fafaf8;`;
    const textC = img ? '#fff' : '#1a1814';
    const subC  = img ? 'rgba(255,255,255,0.7)' : '#7a7570';
    return `
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;${bgStyle}"></div>
        ${!img ? `<div style="position:absolute;bottom:0;left:0;right:0;height:5px;background:linear-gradient(90deg,${c},${d});"></div>` : ''}
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px;text-align:center;">
          <div style="width:48px;height:3px;background:${img?'rgba(255,255,255,0.7)':c};border-radius:2px;margin-bottom:22px;"></div>
          ${s.eyebrow ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${img?'rgba(255,255,255,0.6)':c};margin-bottom:12px;">${s.eyebrow}</div>` : ''}
          <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;color:${textC};margin-bottom:14px;font-weight:400;">${s.title}</div>
          ${s.subtitle ? `<div contenteditable="false" style="font-size:14px;color:${subC};max-width:460px;line-height:1.6;">${s.subtitle}</div>` : ''}
        </div>
        ${img ? pageNumW : pageNum}
      </div>`;
  }

  // ── CONTENT (padrão) ──
  const pts = (s.points||[]).map(p => `
    <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:11px;">
      <div style="width:6px;height:6px;border-radius:50%;background:${c};flex-shrink:0;margin-top:5px;"></div>
      <div contenteditable="false" style="font-size:${pointSz}px;line-height:1.55;color:#3a3835;">${p}</div>
    </div>`).join('');

  // Padrão de fundo varia por índice
  const bgPatterns = [
    `background:#fff;`,
    `background:#fafaf9;`,
    `background:#fff;`,
    `background:#f9f9fb;`,
  ];
  const bgExtra = [
    `<div style="position:absolute;top:0;left:0;bottom:0;width:5px;background:linear-gradient(180deg,${c},${d});"></div>
     <div style="position:absolute;top:0;right:0;width:180px;height:180px;border-radius:0 0 0 100%;background:${c}07;pointer-events:none;"></div>`,
    `<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${c},${d});"></div>
     <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${c}20;"></div>`,
    `<div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:${c}10;pointer-events:none;"></div>
     <div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:${c}0c;pointer-events:none;"></div>`,
    `<div style="position:absolute;top:0;left:0;bottom:0;width:34%;background:linear-gradient(135deg,${c}10,${d}06);pointer-events:none;"></div>`,
  ];
  const bi = (i-1+4)%4;

  return `
    <div style="width:100%;height:100%;position:relative;overflow:hidden;${bgPatterns[bi]}">
      ${bgExtra[bi]}
      <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:row;padding:36px 44px;gap:28px;">
        <div style="flex:0 0 33%;display:flex;flex-direction:column;justify-content:center;">
          <div style="width:4px;height:36px;background:linear-gradient(180deg,${c},${d});border-radius:2px;margin-bottom:12px;"></div>
          ${s.sectionLabel ? `<div contenteditable="false" style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:7px;">${s.sectionLabel}</div>` : ''}
          <div contenteditable="false" style="font-family:'Instrument Serif',serif;font-size:${titleSz}px;line-height:1.25;color:#1a1814;">${s.title}</div>
          ${s.body ? `<div contenteditable="false" style="font-size:12px;color:#8a8680;margin-top:10px;line-height:1.55;font-style:italic;">${s.body}</div>` : ''}
        </div>
        <div style="width:1px;background:${c}18;flex-shrink:0;"></div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">${pts}</div>
      </div>
      ${pageNum}
    </div>`;
}

// ── THUMBNAIL ──
function buildThumbHTML(s, i) {
  const c   = s.accentColor || themeColor;
  const img = s.imageQuery ? (imgCache[s.imageQuery] || null) : null;
  const isCover = ['cover','highlight','image-focus','closing'].includes(s.type);
  let bg = isCover ? c : '#fff';
  let tc = isCover ? '#fff' : c;

  let bgStyle = `background:${bg};`;
  if (img && isCover) bgStyle = `background:linear-gradient(135deg,${darken(c,40)}cc,${c}99),url(${img}) center/cover;`;

  return `
    <div style="width:100%;height:100%;${bgStyle}display:flex;align-items:center;justify-content:center;padding:5px;position:relative;">
      <div style="font-size:5px;font-weight:600;color:${tc};text-align:center;line-height:1.3;overflow:hidden;max-height:100%;padding:2px;">${s.title||''}</div>
    </div>
    <div class="thumb-label">${i+1}</div>`;
}

// ── TEXT BOX ──
function addTextBox() {
  if (!slides.length) { showToast('Gere os slides primeiro!'); return; }
  if (!textBoxes[current]) textBoxes[current] = [];
  const id  = ++tbCounter;
  const box = { id, x:40, y:40, text:'Digite aqui...' };
  textBoxes[current].push(box);
  mountTextBox(box, current);
  showToast('📝 Caixa adicionada — arraste para posicionar');
}

function mountTextBox(box, slideIndex) {
  const stage = document.getElementById('slide-stage');
  const div   = document.createElement('div');
  div.className = 'tb-box';
  div.dataset.id    = box.id;
  div.dataset.slide = slideIndex;
  div.contentEditable = 'true';
  div.textContent     = box.text;
  div.style.cssText   = `
    position:absolute; left:${box.x}px; top:${box.y}px;
    min-width:160px; min-height:30px;
    background:rgba(255,255,255,0.94);
    border:2px dashed ${themeColor};
    border-radius:6px; padding:7px 30px 7px 10px;
    font-family:'DM Sans',sans-serif; font-size:14px; color:#1a1814;
    cursor:move; z-index:50; outline:none;
    box-shadow:0 3px 16px rgba(0,0,0,0.18);
    display:${slideIndex===current?'block':'none'};
  `;

  const close = document.createElement('span');
  close.innerHTML = '×';
  close.style.cssText = `
    position:absolute;top:-9px;right:-9px;
    width:20px;height:20px;border-radius:50%;
    background:${themeColor};color:white;
    font-size:13px;font-weight:700;line-height:1;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  `;
  close.onclick = e => {
    e.stopPropagation();
    textBoxes[slideIndex] = (textBoxes[slideIndex]||[]).filter(b => b.id !== box.id);
    div.remove();
  };
  div.appendChild(close);

  div.addEventListener('mousedown', e => {
    if (e.target === close) return;
    e.preventDefault();
    const r   = stage.getBoundingClientRect();
    const ox  = e.clientX - r.left - box.x;
    const oy  = e.clientY - r.top  - box.y;
    const mv  = me => {
      box.x = Math.max(0, me.clientX - r.left - ox);
      box.y = Math.max(0, me.clientY - r.top  - oy);
      div.style.left = box.x + 'px';
      div.style.top  = box.y + 'px';
    };
    const up = () => { document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup',   up);
  });

  div.addEventListener('input', () => { box.text = div.innerText; });
  stage.appendChild(div);
}

function renderTextBoxes(slideIndex) {
  document.querySelectorAll('.tb-box').forEach(el => {
    el.style.display = parseInt(el.dataset.slide) === slideIndex ? 'block' : 'none';
  });
}

// ── EXPORT PPTX ──
function exportPPTX() {
  if (!slides.length) { showToast('Gere os slides primeiro!'); return; }
  document.getElementById('export-wrap').classList.remove('open');
  showToast('Gerando PPTX...');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    const c  = hexOnly(s.accentColor || themeColor);
    const d  = hexOnly(darken(s.accentColor || themeColor, 40));
    const d2 = hexOnly(darken(s.accentColor || themeColor, 65));
    const total = slides.length;
    const lo = s.layout || {};

    if (s.type === 'cover' || s.type === 'highlight' || s.type === 'image-focus' || s.type === 'closing') {
      slide.addShape(pptx.ShapeType.rect, { x:0,y:0,w:'100%',h:'100%', fill:{color:d2} });
      slide.addShape(pptx.ShapeType.rect, { x:0,y:'55%',w:'100%',h:'45%', fill:{color:c,transparency:30} });
    } else {
      slide.addShape(pptx.ShapeType.rect, { x:0,y:0,w:'100%',h:'100%', fill:{color:'FFFFFF'} });
      slide.addShape(pptx.ShapeType.rect, { x:0,y:0,w:'100%',h:0.06, fill:{color:c} });
    }

    if (s.eyebrow) slide.addText(s.eyebrow.toUpperCase(), {x:0.5,y:3.0,w:9,h:0.35,fontSize:9,color:'FFFFFF',bold:true,charSpacing:3,transparency:35});

    const tSz = Math.min(lo.titleSize||28, 40);
    const isLight = ['cover','highlight','image-focus','closing'].includes(s.type);

    slide.addText(s.title||'', {x:0.5,y:3.4,w:9,h:1.4,fontSize:tSz,color:isLight?'FFFFFF':'1A1814',fontFace:'Georgia',valign:'top'});
    if (s.subtitle) slide.addText(s.subtitle, {x:0.5,y:5.0,w:8,h:0.6,fontSize:13,color:isLight?'FFFFFF':'7A7570',transparency:isLight?25:0});

    if (s.type==='content' || s.type==='reading' || s.type==='image-focus') {
      (s.points||s.paragraphs||[]).forEach((pt,pi) => {
        if (typeof pt !== 'string') return;
        const yp = s.type==='content' ? 1.2+pi*0.85 : 1.0+pi*1.1;
        slide.addText(pt, {x:3.8,y:yp,w:5.8,h:0.9,fontSize:lo.textSize||13,color:'3A3835',valign:'top',bullet:s.type==='content'?{color:c}:false});
      });
      if (s.sectionLabel) slide.addText(s.sectionLabel.toUpperCase(),{x:0.5,y:0.5,w:3,h:0.28,fontSize:8,color:c,bold:true,charSpacing:2});
      slide.addText(s.title||'',{x:0.5,y:0.85,w:2.8,h:1.8,fontSize:Math.min(lo.titleSize||26,30),color:'1A1814',fontFace:'Georgia',valign:'top'});
      if(s.body) slide.addText(s.body,{x:0.5,y:2.8,w:2.8,h:0.5,fontSize:11,color:'8A8680',italic:true});
      slide.addShape(pptx.ShapeType.rect,{x:3.5,y:0.3,w:0.02,h:6.8,fill:{color:'EEEEEE'}});
    }

    if (s.type==='stats') {
      (s.stats||[]).forEach((st,si) => {
        const xp = 0.5+si*3.1;
        slide.addShape(pptx.ShapeType.rect,{x:xp,y:2.2,w:2.8,h:2.4,fill:{color:c,transparency:92},line:{color:c,transparency:78,width:0.5}});
        slide.addText(st.number,{x:xp,y:2.5,w:2.8,h:1.1,fontSize:lo.numberSize||44,color:c,fontFace:'Georgia',align:'center'});
        slide.addText(st.label,{x:xp,y:3.7,w:2.8,h:0.6,fontSize:lo.labelSize||11,color:'6B6860',align:'center'});
      });
      if(s.sectionLabel) slide.addText(s.sectionLabel.toUpperCase(),{x:0.6,y:0.5,w:4,h:0.28,fontSize:8,color:c,bold:true,charSpacing:2});
      slide.addText(s.title||'',{x:0.6,y:0.85,w:8.5,h:0.6,fontSize:Math.min(lo.titleSize||24,28),color:'1A1814',fontFace:'Georgia'});
    }

    if (s.type==='image-grid') {
      if(s.sectionLabel) slide.addText(s.sectionLabel.toUpperCase(),{x:0.5,y:0.5,w:4,h:0.28,fontSize:8,color:c,bold:true,charSpacing:2});
      slide.addText(s.title||'',{x:0.5,y:0.85,w:9,h:0.6,fontSize:Math.min(lo.titleSize||22,26),color:'1A1814',fontFace:'Georgia'});
      (s.images||[]).forEach((img,ii) => {
        const xp = 0.3+ii*3.3;
        slide.addShape(pptx.ShapeType.rect,{x:xp,y:1.7,w:3.0,h:3.0,fill:{color:c,transparency:90}});
        if(img.caption) slide.addText(img.caption,{x:xp,y:4.8,w:3.0,h:0.4,fontSize:10,color:'1A1814',bold:true,align:'center'});
        if(img.detail)  slide.addText(img.detail, {x:xp,y:5.2,w:3.0,h:0.35,fontSize:9,color:'888888',align:'center'});
      });
    }

    slide.addText(`${i+1} / ${total}`,{x:8.6,y:6.85,w:0.9,h:0.2,fontSize:8,color:'AAAAAA',align:'right'});
  });

  const tema = document.getElementById('tema').value.trim().slice(0,30) || 'slides';
  pptx.writeFile({ fileName:`SlideAI-${tema}.pptx` })
    .then(()  => showToast('✅ PPTX baixado!'))
    .catch(()  => showToast('Erro ao gerar PPTX'));
}

// ── EXPORT PDF ──
function exportPDF() {
  document.getElementById('export-wrap').classList.remove('open');
  window.print();
  showToast('Use "Salvar como PDF" no diálogo de impressão');
}