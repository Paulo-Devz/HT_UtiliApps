
  let method='g', reqCount=0, lastResult='', photoBase64=null, photoType='image/jpeg', history=[];

  function setMethod(v,el) {
    method=v;
    document.querySelectorAll('.method-btn').forEach(b=>b.classList.remove('on'));
    el.classList.add('on');
  }

  function toast(m) {
    const t=document.getElementById('toast');
    t.textContent=m; t.classList.add('on');
    setTimeout(()=>t.classList.remove('on'),2400);
  }

  function handlePhoto(input) {
    const file=input.files[0];
    if (!file) return;
    photoType = file.type || 'image/jpeg';
    const reader=new FileReader();
    reader.onload=e=>{
      photoBase64=e.target.result.split(',')[1];
      document.getElementById('photo-drop').classList.add('has-img');
      document.getElementById('photo-label').textContent=`📸 ${file.name}`;
      const prev=document.getElementById('photo-preview');
      prev.src=e.target.result; prev.classList.add('on');
      document.getElementById('photo-clear').style.display='block';
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    photoBase64=null;
    document.getElementById('photo-input').value='';
    document.getElementById('photo-drop').classList.remove('has-img');
    document.getElementById('photo-label').innerHTML='Clique para enviar imagem<br><span style="color:var(--muted);font-size:10px">JPG, PNG, WEBP</span>';
    const prev=document.getElementById('photo-preview');
    prev.src=''; prev.classList.remove('on');
    document.getElementById('photo-clear').style.display='none';
  }

  function buildPrompt(pergunta) {
    const nivDesc={
      g:'Nível VERDE: resposta direta ao ponto, sem rodeios. Só o essencial.',
      y:'Nível AMARELO: explica com macetes e atalhos mentais espertos.',
      r:'Nível VERMELHO: passo a passo ultra detalhado para iniciante, cada etapa explicada do zero.'
    };

    return `Você é um professor especialista em resolver e explicar qualquer matéria.

PERGUNTA/QUESTÃO: "${pergunta}"
NÍVEL SELECIONADO: ${nivDesc[method]}

Se houver múltiplas questões numeradas, resolva cada uma separadamente.

Retorne APENAS JSON válido:
{
  "materia": "Matemática|Português|Inglês|Ciências|História|outro",
  "reviewdesc": "Descrição curta da questão em até 6 palavras",
  "questoes": [
    {
      "enunciado": "texto exato da questão",
      "resposta_direta": "A resposta final escrita de forma natural, como se um aluno tivesse escrito à mão. Sem markdown, sem negrito, sem listas. Ex: 'A raiz quadrada de 16 é 4.' ou 'O sujeito composto tem mais de um núcleo.'",
      "calculo": "Expressão ou fórmula matemática se houver, ex: √16 = 4 × 4 = 4. Null se não for cálculo.",
      "explicacao_verde": "Explicação direta e objetiva. 1-2 frases. Sem rodeios.",
      "explicacao_amarelo": "Explicação com raciocínio esperto e atalhos mentais.",
      "explicacao_vermelho": "Explicação ultra detalhada passo a passo para iniciante total.",
      "macetes": ["macete 1 se existir", "macete 2 se existir"]
    }
  ]
}

REGRAS:
1. resposta_direta: texto natural, como escrita à mão, sem formatação especial
2. calculo: só para questões matemáticas/cálculo, senão null
3. macetes: array com macetes reais e úteis. Array vazio [] se não houver
4. SEMPRE preencha reviewdesc (máx 6 palavras)
4. Questões numeradas: uma entrada no array por questão
5. Retorne APENAS o JSON`;
  }

  async function resolver() {
    const pergunta=document.getElementById('pergunta').value.trim();
    if (!pergunta && !photoBase64) { toast('Digite uma pergunta ou envie uma foto!'); return; }

    const btn=document.getElementById('run-btn');
    btn.disabled=true; btn.textContent='⏳ resolvendo...';
    document.getElementById('empty-state').style.display='none';
    document.getElementById('result-wrap').classList.remove('on');
    document.getElementById('loading-screen').classList.add('on');
    document.getElementById('btn-copy').disabled=true;
    document.getElementById('btn-clear').disabled=true;

    setTimeout(()=>{ document.getElementById('lm2').style.opacity='1'; },700);
    setTimeout(()=>{ document.getElementById('lm3').style.opacity='1'; },1400);

    try {
      let bodyPayload;

      if (photoBase64) {
        bodyPayload = {
          max_tokens: 3000,
          json_mode: true,
          image: { data: photoBase64, type: photoType },
          prompt: buildPrompt(pergunta || 'questão da imagem')
        };
      } else {
        bodyPayload = {
          prompt: buildPrompt(pergunta),
          max_tokens: 3000,
          json_mode: true
        };
      }

      const res=await fetch('/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(bodyPayload)
      });

      const data=await res.json();
      if (!res.ok||data.error) throw new Error(data.error||'Erro');

      let raw=data.result.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      const s=raw.indexOf('{'),e=raw.lastIndexOf('}');
      if (s!==-1&&e!==-1) raw=raw.slice(s,e+1);

      const obj=JSON.parse(raw);
      renderResult(obj, pergunta);
      reqCount++;
      document.getElementById('req-count').textContent=`${reqCount} resolução${reqCount>1?'ões':''}`;
      const reviewDesc = obj.reviewdesc || (pergunta||'questão');
      addHistory(reviewDesc);
      toast('✓ resolvido');

    } catch(err) {
      document.getElementById('loading-screen').classList.remove('on');
      document.getElementById('empty-state').style.display='flex';
      toast('erro: '+err.message);
    } finally {
      btn.disabled=false; btn.textContent='▶ RESOLVER AGORA';
    }
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function renderQuestao(q, idx, total) {
  const activeTab = method;
  const qid = `q${idx}`;

  let html = '';
  if (total > 1) {
    html += `<div class="questao-num">Questão ${idx+1} — ${esc(q.enunciado||'')}</div>`;
  }

  html += `<div class="sections-grid">`;

  // SEÇÃO RESPOSTA - SEM NULL
  html += `<div class="section-block sec-resposta">
    <div class="section-header">
      <span class="section-icon">✍️</span>
      <span class="section-title" style="color:var(--green)">RESPOSTA</span>
      <span class="section-sub">como escrever no dever</span>
    </div>
    <div class="section-body">`;

  // Só mostra cálculo SE existir e NÃO for null/vazio
  if (q.calculo && q.calculo !== 'null' && q.calculo.trim() !== '') {
    html += `<div class="calc-box">${esc(q.calculo)}</div>`;
  }

  // Só mostra resposta SE existir e NÃO for null/vazio
  if (q.resposta_direta && q.resposta_direta !== 'null' && q.resposta_direta.trim() !== '') {
    html += `<div class="answer-written">${esc(q.resposta_direta)}</div>`;
  } else {
    // Se não tem resposta, mostra placeholder elegante
    html += `<div class="answer-written" style="color:var(--muted);font-style:italic;font-size:16px;">
      Resposta não identificada nesta questão
    </div>`;
  }

  html += `</div></div>`;

  // Resto continua igual...
  const tabs=[
    {id:'g',label:'🟢 Verde',cls:'green'},
    {id:'y',label:'🟡 Amarelo',cls:'yellow'},
    {id:'r',label:'🔴 Vermelho',cls:'red'},
  ];

  html += `<div class="section-block sec-explicacao">
    <div class="section-header">
      <span class="section-icon">🧠</span>
      <span class="section-title" style="color:var(--yellow)">EXPLICAÇÃO</span>
      <span class="section-sub">escolha o nível</span>
    </div>
    <div class="section-body">
      <div class="method-tabs">`;

  tabs.forEach(t=>{
    html+=`<button class="mtab ${t.id}${t.id===activeTab?' on':''}" onclick="switchTab('${qid}','${t.id}',this)">${t.label}</button>`;
  });

  html += `</div>`;

  const expMap={g:q.explicacao_verde,y:q.explicacao_amarelo,r:q.explicacao_vermelho};
  tabs.forEach(t=>{
    // Também esconde explicações vazias/null
    const expText = expMap[t.id] || '';
    html+=`<div class="explain-panel ${t.cls}${t.id===activeTab?' on':''}" id="${qid}-exp-${t.id}">
      <div class="explain-text">${expText && expText !== 'null' && expText.trim() !== '' ? esc(expText) : 'Explicação não disponível neste nível.'}</div>
    </div>`;
  });

  html += `</div></div>`;

  // MACETES - já trata array vazio
  const macetes = q.macetes || [];
  html += `<div class="section-block sec-macetes">
    <div class="section-header">
      <span class="section-icon">⚡</span>
      <span class="section-title" style="color:var(--red)">MACETES</span>
      <span class="section-sub">atalhos mentais</span>
    </div>
    <div class="section-body">`;

  if (macetes.length && macetes[0] !== 'null') {
    html += `<div class="macetes-list">`;
    macetes.forEach(m=>{
      if (m && m !== 'null' && m.trim() !== '') {
        html += `<div class="macete-item"><span class="macete-bullet">⚡</span><div class="macete-text">${esc(m)}</div></div>`;
      }
    });
    html += `</div>`;
  } else {
    html += `<div class="no-macete">Nenhum macete específico para esta questão.</div>`;
  }

  html += `</div></div>`;
  html += `</div>`;
  return html;
}
 
  function switchQuestao(idx, el) {
  document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.questao-container').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(`questao-${idx}`).classList.add('active');
}

// Histórico com localStorage
function addHistory(q) {
  history = history.filter(h => h !== q); // Remove duplicata
  history.unshift(q.slice(0,55)); // Adiciona no topo
  if (history.length > 8) history.pop(); // Limita 8 itens
  updateHistoryList();
  localStorage.setItem('fastanswer-history', JSON.stringify(history));
}

function updateHistoryList() {
  const list=document.getElementById('history-list');
  if (history.length === 0) {
    list.innerHTML='<div class="hist-item" style="color:var(--muted);cursor:default">Nenhuma resolução ainda</div>';
  } else {
    list.innerHTML=history.map(h=>`<div class="hist-item" onclick="loadHistory(this)">${esc(h)}</div>`).join('');
  }
}

  function switchTab(qid, tab, el) {
    const block = el.closest('.section-block');
    block.querySelectorAll('.mtab').forEach(b=>b.classList.remove('on'));
    el.classList.add('on');
    block.querySelectorAll('.explain-panel').forEach(p=>p.classList.remove('on'));
    const target = document.getElementById(`${qid}-exp-${tab}`);
    if (target) target.classList.add('on');
  }

  function switchQuestao(idx, el) {
  document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.questao-container').forEach(c => c.classList.remove('active'));
  
  el.classList.add('active');
  document.getElementById(`questao-${idx}`).classList.add('active');
}

  function renderResult(obj, pergunta) {
  document.getElementById('loading-screen').classList.remove('on');
  const questoes=obj.questoes||[];
  const materia=obj.materia||'Geral';
  
  // reviewdesc no lugar de [foto]!
  const displayText = obj.reviewdesc || (pergunta||'questão').slice(0,100);

  let html=`<div class="result-meta">
    <div class="result-q">
      <small>RESUMO</small>
      ${esc(displayText)}${(displayText+'').length>100?'...':''}
    </div>
    <div class="subject-tag">${esc(materia)}</div>
  </div>`;

  if (questoes.length > 1) {
    html += `<div class="questoes-nav">`;
    questoes.forEach((q, i) => {
      html += `<button class="qnav-btn ${i===0?'active':''}" onclick="switchQuestao(${i}, this)">
        Questão ${i+1}
        <span class="qnav-badge">${i+1}</span>
      </button>`;
    });
    html += `</div><div class="questoes-separator"></div>`;
  }

  questoes.forEach((q, i) => {
    html += `<div class="questao-container ${i===0?'active':''}" id="questao-${i}">
      ${renderQuestao(q, i, questoes.length)}
    </div>`;
  });

  const wrap=document.getElementById('result-wrap');
  wrap.innerHTML=html; wrap.classList.add('on');
  lastResult=wrap.innerText;
  document.getElementById('btn-copy').disabled=false;
  document.getElementById('btn-clear').disabled=false;
  }
  
  function addHistory(q) {
    history.unshift(q.slice(0,55));
    if (history.length>8) history.pop();
    const list=document.getElementById('history-list');
    list.innerHTML=history.map(h=>`<div class="hist-item" onclick="loadHistory(this)">${esc(h)}</div>`).join('');
  }

  function loadHistory(el) {
    document.getElementById('pergunta').value=el.textContent;
    resolver();
  }

  function copyResult() {
    navigator.clipboard.writeText(lastResult).then(()=>toast('✓ copiado'));
  }

  function clearResult() {
    document.getElementById('result-wrap').classList.remove('on');
    document.getElementById('empty-state').style.display='flex';
    document.getElementById('btn-copy').disabled=true;
    document.getElementById('btn-clear').disabled=true;
    lastResult='';
  }

  document.getElementById('pergunta').addEventListener('keydown',e=>{
    if (e.key==='Enter'&&e.ctrlKey) resolver();
  });

  const savedHistory = localStorage.getItem('fastanswer-history');
  if (savedHistory) {
    history = JSON.parse(savedHistory);
    updateHistoryList();
  }