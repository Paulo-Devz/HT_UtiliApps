
  let tipo='explicacao', estilo='neutro', dif='facil';
  let editMode=false, questCount=6;

  function setTipo(val,el) {
    tipo=val;
    document.querySelectorAll('#btn-explicacao,#btn-dever').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('personalizar-wrap').style.display = val==='dever'?'block':'none';

  }

  function setEstilo(val,el) {
    estilo=val;
    document.querySelectorAll('#btn-neutro,#btn-bonito').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
  }
  function setDif(val,el) {
    dif=val;
    document.querySelectorAll('#btn-facil,#btn-medio,#btn-dificil').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
  }
  function changeCount(d) {
    questCount = Math.max(1, Math.min(12, questCount+d));
    document.getElementById('count-val').textContent = questCount;
  }
  function addChip(text) {
    const inp = document.getElementById('personalizar');
    inp.value = inp.value ? inp.value+', '+text : text;
  }
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2800);
  }

  function detectaIngles(tema) {
    return ['verb','english','present','past','tense','simple','continuous','grammar','pronoun','adjective','noun','modal','auxiliary','vocabulary'].some(p=>tema.toLowerCase().includes(p));
  }

  function buildPrompt() {
    const tema  = document.getElementById('tema').value.trim();
    const extra = document.getElementById('personalizar').value.trim();
    const isEng = detectaIngles(tema);
    const difMap = {facil:'fácil',medio:'intermediário',dificil:'difícil'};
    const langNote = isEng ? 'Matéria de inglês: frases, palavras e itens das atividades DEVEM estar em inglês.' : '';

    const tipoDesc = tipo==='explicacao'
      ? `Criar uma EXPLICAÇÃO didática e rica sobre "${tema}". NÃO crie nenhuma questão, nenhum exercício. Apenas conteúdo explicativo com 4 a 6 seções usando: "texto" (parágrafo), "lista" (itens), "destaque" (macete/regra), "tabela" (colunas+linhas). O array "questoes" DEVE ser [].`
      : `Criar um DEVER sobre "${tema}" com EXATAMENTE ${questCount} questões. ${extra ? `⚠️ FORMATO OBRIGATÓRIO: "${extra}" — siga à risca.` : 'Varie os formatos.'} SEM explicação, direto nas questões.`;

    const estiloDesc = estilo==='bonito'
      ? `Estilo BONITO: invente um tema visual criativo e ÚNICO (ex: Oceano, Espaço, Floresta). 2 cores harmônicas. Defina marcador_tipo: "circle"|"square"|"diamond"|"star"|"tag".`
      : `Estilo NEUTRO: preto e branco. marcador_tipo="circle". cor1="#333". cor2="#555". cores_questoes todos "#444".`;

    return `Você é um professor criativo especializado em materiais educativos.

TEMA: "${tema}"
TIPO: ${tipoDesc}
ESTILO: ${estiloDesc}
DIFICULDADE: ${difMap[dif]}
${langNote}

ESTRUTURA OBRIGATÓRIA DO JSON — siga exatamente estes campos:

Para questões do tipo "completar":
{ "tipo": "completar", "guia": "Complete as frases", "frases": ["I ___ happy.", "She ___ a teacher."] }

Para questões do tipo "colunas":
{ "tipo": "colunas", "guia": "Match the columns", "coluna_a": ["am","are","is"], "coluna_b": ["I","You","He"] }

Para questões do tipo "emojis":
{ "tipo": "emojis", "guia": "Write the word", "items": [{"emoji":"😊","palavra":"happy"},{"emoji":"😢","palavra":"sad"}] }

Para questões do tipo "escolha":
{ "tipo": "escolha", "guia": "Choose the correct answer", "pergunta": "Which is correct?", "alternativas": ["a) I am","b) I is","c) I are"] }

Para questões do tipo "verdadeiro_falso":
{ "tipo": "verdadeiro_falso", "guia": "True or False", "afirmacoes": ["'Am' is used with I.","'Is' is used with You."] }

Para questões do tipo "aberta":
{ "tipo": "aberta", "guia": "Answer the question", "pergunta": "What is the verb to be?", "linhas": 2 }

JSON COMPLETO:
{
  "titulo": "Nome da matéria",
  "disciplina": "Disciplina",
  "tema_visual": "Tema visual criativo",
  "cor1": "#667eea",
  "cor2": "#764ba2",
  "cores_questoes": ["#e63946","#f4a261","#2a9d8f","#457b9d","#6d4c41","#7b2d8b","#1b7a34","#c0392b","#2471a3","#8e44ad","#117864","#d35400"],
  "marcador_tipo": "circle",
  "secoes_explicacao": [],
  "questoes": [
    { "tipo": "completar", "guia": "Complete as frases", "frases": ["I ___ happy."] },
    { "tipo": "escolha", "guia": "Choose the correct", "pergunta": "Which is correct?", "alternativas": ["a) am","b) is"] }
  ]
}

REGRAS CRÍTICAS:
1. titulo: só o nome da matéria, sem prefixo
2. CADA questão DEVE ter o campo "tipo" com um destes valores: completar | colunas | emojis | escolha | verdadeiro_falso | aberta
3. NUNCA use campos como "enunciado", "opcoes" ou "resposta" — use APENAS os campos mostrados acima
4. EXPLICAÇÃO: questoes=[], secoes_explicacao com 4-6 seções ricas
5. DEVER: secoes_explicacao=[] (ou 1 bloco), questoes com EXATAMENTE ${questCount} itens
6. ${extra ? `Formato obrigatório: "${extra}"` : 'Varie os tipos de questão'}
7. marcador_tipo: você decide o mais bonito pro tema
8. Retorne APENAS o JSON`;
  }

  async function gerar() {
    const tema = document.getElementById('tema').value.trim();
    if (!tema) { showToast('Digite a matéria ou tema!'); return; }

    const btn = document.getElementById('gen-btn');
    btn.disabled=true; btn.textContent='Gerando...';
    document.getElementById('empty-state').style.display='none';
    document.getElementById('sheet-content').classList.remove('visible');
    document.getElementById('sheet-content').innerHTML='';
    document.getElementById('loading-state').classList.add('visible');
    ['btn-editar','btn-regenerar','btn-imprimir'].forEach(id=>document.getElementById(id).style.display='none');

    const msgs=['Pensando como um professor...','Organizando as questões...','Criando os exercícios...','Formatando a folha...'];
    let mi=0;
    const ltI=setInterval(()=>{ mi=(mi+1)%msgs.length; document.getElementById('loading-text').textContent=msgs[mi]; },1800);

    try {
      const res = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildPrompt(),max_tokens:4000,json_mode:true})});
      const data = await res.json();
      if (!res.ok||data.error) throw new Error(data.error||'Erro');

      let raw = data.result.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      const s=raw.indexOf('{'), e=raw.lastIndexOf('}');
      if (s!==-1&&e!==-1) raw=raw.slice(s,e+1);

      const obj = JSON.parse(raw);
      console.log('PARSED OBJ:', JSON.stringify(obj, null, 2));
      await renderSheet(obj);
      showToast('✅ Atividade gerada!');
    } catch(err) {
      console.error('ERRO TIPO:', err.constructor.name);
      console.error('ERRO MSG:', err.message);
      console.error('ERRO STACK:', err.stack);
      document.getElementById('loading-state').classList.remove('visible');
      document.getElementById('empty-state').style.display='flex';
      showToast('Erro: '+err.message);
    } finally {
      clearInterval(ltI);
      btn.disabled=false; btn.textContent='✦ Gerar Atividade';
    }
  }

  async function renderSheet(obj) {
    document.getElementById('loading-state').classList.remove('visible');
    if (!obj||typeof obj!=='object') { showToast('Erro: resposta inválida'); return; }

    const bonito = estilo==='bonito';
    const c1 = obj.cor1||'#667eea';
    const c2 = obj.cor2||'#764ba2';
    const coresQ = obj.cores_questoes||Array(12).fill('#667eea');
    const marcador = obj.marcador_tipo||'circle';
    let html='', imgUrl='';

    if (bonito) {
      try {
        const imgRes = await fetch('/api/imggen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `${obj.titulo}, ${obj.tema_visual||'educational'}, educational cartoon illustration, flat design, white background, simple, cute` })
        });
        const imgData = await imgRes.json();
        imgUrl = imgData.url || '';
      } catch(e) {}
    }

    html += `<div class="sheet-header">`;
    html += `<div class="sheet-header-title" contenteditable="false">${obj.titulo||'Exercises'}</div>`;
    html += `<div class="sheet-header-info">`;
    html += `<div class="info-cell" contenteditable="false">NAME: </div>`;
    html += `<div class="info-cell" contenteditable="false">DATE: _____ / _____ / _____</div>`;
    html += `</div></div>`;

    if (bonito && imgUrl) {
      html += `<div style="display:flex;justify-content:center;margin-bottom:12px;"><img src="${imgUrl}" style="width:130px;height:100px;object-fit:cover;border-radius:8px;box-shadow:0 3px 10px rgba(0,0,0,.12);" /></div>`;
    }

    if (bonito && obj.tema_visual) {
      html += `<div style="text-align:center;font-family:'DM Sans',sans-serif;font-size:9px;font-weight:600;color:${c1};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${obj.tema_visual}</div>`;
    }

    const borderC = bonito ? c1 : '#555';

    function renderSecao(sec) {
      let out='';

      const tipo = sec.tipo || (sec.texto ? 'texto' : sec.destaque ? 'destaque' : sec.lista ? 'lista' : sec.tabela ? 'tabela' : null);
      const titulo = sec.titulo || sec.descricao || '';
      const conteudo = sec.conteudo || sec.texto || sec.destaque || '';
      const items = sec.items || sec.lista || [];
      const tabela = sec.tabela || { colunas: sec.colunas||[], linhas: sec.linhas||[] };

      if (tipo==='texto' || (sec.texto && !sec.tipo)) {
        if (titulo) out += `<div class="sec-title" style="color:${borderC};border-color:${borderC};" contenteditable="false">${titulo}</div>`;
        out += `<p class="sec-text" contenteditable="false">${conteudo}</p>`;
      } else if (tipo==='destaque' || (sec.destaque && !sec.tipo)) {
        out += `<div class="highlight-box" style="border-color:${borderC};background:${bonito?c1+'12':'#f8f8f8'};"><p contenteditable="false">${conteudo}</p></div>`;
      } else if (tipo==='lista' || (sec.lista && !sec.tipo)) {
        if (titulo) out += `<div class="sec-title" style="color:${borderC};border-color:${borderC};" contenteditable="false">${titulo}</div>`;
        out += `<ul class="sec-list">${items.map(i=>`<li contenteditable="false"><span style="width:6px;height:6px;border-radius:50%;background:${borderC};flex-shrink:0;margin-top:5px;display:inline-block;"></span>${i}</li>`).join('')}</ul>`;
      } else if (tipo==='tabela' || (sec.tabela && !sec.tipo)) {
        if (titulo) out += `<div class="sec-title" style="color:${borderC};border-color:${borderC};" contenteditable="false">${titulo}</div>`;
        const cols = tabela.colunas || sec.colunas || [];
        const rows = tabela.linhas || sec.linhas || [];
        out += `<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:'DM Sans',sans-serif;margin-bottom:10px;">`;
        out += `<thead><tr>${cols.map(c=>`<th style="border:1px solid #ddd;padding:5px 8px;background:${bonito?c1+'20':'#f0f0f0'};font-weight:700;text-align:left;">${c}</th>`).join('')}</tr></thead>`;
        out += `<tbody>${rows.map(l=>`<tr>${(Array.isArray(l)?l:[l]).map(cell=>`<td style="border:1px solid #ddd;padding:5px 8px;">${cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
        out += `</table>`;
      }
      return out;
    }

    const secoes = obj.secoes_explicacao || obj.secoes || [];
    secoes.forEach(sec=>{ html+=renderSecao(sec); });

    if (secoes.length>0 && (obj.questoes||[]).length>0) {
      html += `<div style="border-top:1.5px solid ${bonito?c1:'#aaa'};margin:14px 0 16px;"></div>`;
    }

    function buildMarcador(num, cor) {
      if (!bonito) return `<div class="quest-num" style="background:#444;">${num}</div>`;
      switch(marcador) {
        case 'square':
          return `<div class="quest-num" style="background:${cor};border-radius:4px;">${num}</div>`;
        case 'diamond':
          return `<div style="width:22px;height:22px;flex-shrink:0;position:relative;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:18px;height:18px;background:${cor};transform:rotate(45deg);border-radius:2px;"></div><span style="position:relative;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:800;color:white;z-index:1;">${num}</span></div>`;
        case 'star':
          return `<div style="flex-shrink:0;width:22px;height:22px;position:relative;display:flex;align-items:center;justify-content:center;"><span style="position:absolute;color:${cor};font-size:22px;line-height:1;">★</span><span style="position:relative;font-family:'DM Sans',sans-serif;font-size:9px;font-weight:900;color:white;z-index:1;">${num}</span></div>`;
        case 'tag':
          return `<div style="flex-shrink:0;background:${cor};color:white;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:800;padding:3px 8px;border-radius:10px;white-space:nowrap;align-self:flex-start;">${num}</div>`;
        default:
          return `<div class="quest-num" style="background:${cor};">${num}</div>`;
      }
    }

    (obj.questoes||[]).forEach((q,idx) => {
      const cor = bonito ? (coresQ[idx%coresQ.length]||c1) : '#444';
      html += `<div class="quest-block">`;
      html += buildMarcador(idx+1, cor);
      html += `<div class="quest-body">`;
      if (q.guia) html += `<div class="quest-label" style="color:${cor};" contenteditable="false">${q.guia}</div>`;

      if (q.tipo==='completar') {
        (q.frases||[]).forEach(f=>{ html+=`<p class="quest-text" contenteditable="false">${f}</p><span class="answer-line"></span>`; });
      } else if (q.tipo==='colunas') {
        html += `<div class="columns-exercise"><ul class="col-list">`;
        (q.coluna_a||[]).forEach((item,i)=>{ html+=`<li contenteditable="false">${i+1}. ${item}</li>`; });
        html += `</ul><ul class="col-list">`;
        (q.coluna_b||[]).forEach(item=>{ html+=`<li contenteditable="false">(  ) ${item}</li>`; });
        html += `</ul></div>`;
      } else if (q.tipo==='emojis') {
        html += `<div class="emoji-exercise">`;
        (q.items||[]).forEach(item=>{ html+=`<div class="emoji-card"><span class="ec-emoji">${item.emoji}</span><span class="ec-word" contenteditable="false">${bonito?item.palavra:'___________'}</span><div class="ec-line"></div></div>`; });
        html += `</div>`;
      } else if (q.tipo==='escolha') {
        html += `<p class="quest-text" style="font-weight:600;" contenteditable="false">${q.pergunta||''}</p>`;
        (q.alternativas||[]).forEach(alt=>{ html+=`<div class="choice-item"><div class="choice-box"></div><span contenteditable="false">${alt}</span></div>`; });
      } else if (q.tipo==='verdadeiro_falso') {
        (q.afirmacoes||[]).forEach(af=>{ html+=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;"><span contenteditable="false" style="font-size:11px;font-family:Georgia,serif;flex:1;">${af}</span><span style="font-size:10px;font-family:'DM Sans',sans-serif;color:#888;white-space:nowrap;">( T )  ( F )</span></div>`; });
      } else if (q.tipo==='aberta') {
        html += `<p class="quest-text" contenteditable="false">${q.pergunta||''}</p>`;
        for(let i=0;i<(q.linhas||2);i++) html+=`<span class="answer-line"></span>`;
      }

      html += `</div></div>`;
    });

    html += `<div class="sheet-footer"><span>EduGen — Gerador de Atividades com IA</span><span>📄 Página 1</span></div>`;

    const content = document.getElementById('sheet-content');
    content.innerHTML = html;
    content.classList.add('visible');
    ['btn-editar','btn-regenerar','btn-imprimir'].forEach(id=>document.getElementById(id).style.display='flex');
  }

  function toggleEdit() {
    editMode=!editMode;
    document.querySelectorAll('#sheet-content [contenteditable]').forEach(el=>{ el.contentEditable=editMode?'true':'false'; });
    document.getElementById('btn-editar').textContent = editMode?'✅ Salvar':'✏️ Editar';
    showToast(editMode?'✏️ Clique nos textos para editar':'✅ Edição salva');
  }