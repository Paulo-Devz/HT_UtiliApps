
  let comp='pequeno', curStyle='minimal', tCount=6, data=null;

  function setComp(v,el) {
    comp=v;
    document.querySelectorAll('#btn-p,#btn-c').forEach(b=>b.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('count-wrap').style.display=v==='complexo'?'block':'none';
  }
  function setStyle(v,el) {
    curStyle=v;
    document.querySelectorAll('#s-min,#s-col,#s-hand').forEach(b=>b.classList.remove('on'));
    el.classList.add('on');
    if (data) draw(data);
  }
  function chg(d) {
    tCount=Math.max(4,Math.min(12,tCount+d));
    document.getElementById('count-val').textContent=tCount;
  }
  function toast(m) {
    const t=document.getElementById('toast');
    t.textContent=m; t.classList.add('on');
    setTimeout(()=>t.classList.remove('on'),2600);
  }

  function buildPrompt() {
    const tema=document.getElementById('tema').value.trim();
    const n=comp==='pequeno'?4:tCount;
    return `Você é especialista em mapas mentais educativos.
TEMA: "${tema}"
TÓPICOS: ${n}

Crie um mapa mental. Cada tópico: nome curto (máx 4 palavras), explicação direta (1-2 frases, sem marcadores), exemplo se fizer sentido.

JSON:
{
  "centro": "Nome central (máx 3 palavras)",
  "cor_tema": "#hex harmônica pro tema",
  "topicos": [
    { "nome": "Nome", "explicacao": "Explicação direta.", "exemplo": "Exemplo: ..." }
  ]
}

cor_tema: ciências=#2ecc71, história=#e67e22, inglês=#3498db, matemática=#e74c3c. ${n} tópicos exatos. Sem * ou -. Apenas JSON.`;
  }

  async function go() {
    const tema=document.getElementById('tema').value.trim();
    if (!tema) { toast('Digite o tema primeiro!'); return; }
    const btn=document.getElementById('gen-btn');
    btn.disabled=true; btn.textContent='Gerando...';
    document.getElementById('empty').style.display='none';
    document.getElementById('map-wrap').classList.remove('on');
    document.getElementById('loader').classList.add('on');
    document.getElementById('e-png').disabled=true;
    document.getElementById('e-pdf').disabled=true;

    const msgs=['Organizando as ideias...','Conectando os conceitos...','Desenhando o mapa...','Quase pronto...'];
    let mi=0;
    const iv=setInterval(()=>{ mi=(mi+1)%msgs.length; document.getElementById('load-msg').textContent=msgs[mi]; },1500);

    try {
      const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildPrompt(),max_tokens:3000,json_mode:true})});
      const d=await res.json();
      if (!res.ok||d.error) throw new Error(d.error||'Erro');
      let raw=d.result.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      const s=raw.indexOf('{'),e=raw.lastIndexOf('}');
      if (s!==-1&&e!==-1) raw=raw.slice(s,e+1);
      data=JSON.parse(raw);
      draw(data);
      toast('✅ Mapa gerado!');
      document.getElementById('e-png').disabled=false;
      document.getElementById('e-pdf').disabled=false;
    } catch(err) {
      document.getElementById('loader').classList.remove('on');
      document.getElementById('empty').style.display='flex';
      toast('Erro: '+err.message);
    } finally {
      clearInterval(iv);
      btn.disabled=false; btn.textContent='✦ Gerar Mapa Mental';
    }
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function wrap(txt,max) {
    const words=txt.split(' '); const lines=[]; let cur='';
    for (const w of words) {
      if ((cur+' '+w).trim().length>max) { if(cur) lines.push(cur.trim()); cur=w; }
      else cur=(cur+' '+w).trim();
    }
    if (cur) lines.push(cur.trim()); return lines;
  }
  function shade(hex,p) {
    const n=parseInt(hex.replace('#',''),16);
    const r=Math.min(255,Math.max(0,(n>>16)+p));
    const g=Math.min(255,Math.max(0,((n>>8)&0xff)+p));
    const b=Math.min(255,Math.max(0,(n&0xff)+p));
    return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
  }
  function jit(n=3) { return (Math.random()-.5)*n; }

  const COLORS=['#e74c3c','#e67e22','#27ae60','#2980b9','#8e44ad','#f39c12','#16a085','#c0392b','#6c3483','#1a5276','#784212','#1b4f72'];

  function draw(obj) {
    document.getElementById('loader').classList.remove('on');
    if (curStyle==='minimal')  drawMinimal(obj);
    else if (curStyle==='color') drawColor(obj);
    else drawHand(obj);
    document.getElementById('map-wrap').classList.add('on');
  }

  function drawMinimal(obj) {
    const topicos=obj.topicos||[];
    const n=topicos.length;
    const theme=obj.cor_tema||'#667eea';
    const W=720, cw=660, cx=360;
    const ch=60, cpad=16, nw=640, nh=64;
    const gap=14, connW=3, lineH=24;

    let rows=[];
    for (const t of topicos) {
      const tl=wrap(t.nome,36);
      const el=wrap(t.explicacao,60);
      const xl=t.exemplo?wrap(t.exemplo,60):[];
      const lines=tl.length+el.length+xl.length;
      const h=Math.max(nh, lines*15+cpad*2);
      rows.push({t,tl,el,xl,h});
    }

    let totalH=ch+gap+20;
    for (const r of rows) totalH+=r.h+gap;
    totalH+=20;

    const svg=document.getElementById('map-svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${totalH}`);
    svg.setAttribute('width',W); svg.setAttribute('height',totalH);

    let html=`<defs><filter id="ms"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.08)"/></filter></defs>`;
    html+=`<rect width="${W}" height="${totalH}" fill="#fafafa"/>`;

    html+=`<rect x="${(W-cw)/2}" y="14" width="${cw}" height="${ch}" rx="10" fill="${theme}" filter="url(#ms)"/>`;
    const cl=wrap(obj.centro||'Tema',30);
    let cty=14+ch/2-(cl.length-1)*9;
    for (const ln of cl) {
      html+=`<text x="${cx}" y="${cty}" text-anchor="middle" dominant-baseline="middle" font-family="'Outfit',sans-serif" font-size="16" font-weight="700" fill="#fff">${esc(ln)}</text>`;
      cty+=18;
    }

    let y=14+ch+gap;
    const lx=(W-nw)/2+22;

    for (let i=0;i<rows.length;i++) {
      const {t,tl,el,xl,h}=rows[i];
      const c=COLORS[i%COLORS.length];

      html+=`<line x1="${cx}" y1="${14+ch}" x2="${cx}" y2="${y+h/2}" stroke="${theme}" stroke-width="1.5" opacity="0.2"/>`;
      html+=`<rect x="${(W-nw)/2}" y="${y}" width="${nw}" height="${h}" rx="8" fill="#fff" stroke="${c}" stroke-width="1.5" filter="url(#ms)"/>`;
      html+=`<rect x="${(W-nw)/2}" y="${y}" width="6" height="${h}" rx="3" fill="${c}"/>`;

      let ty=y+cpad+13;
      for (const ln of tl) {
        html+=`<text x="${lx}" y="${ty}" font-family="'Outfit',sans-serif" font-size="13" font-weight="700" fill="${c}">${esc(ln)}</text>`;
        ty+=16;
      }
      ty+=3;
      for (const ln of el) {
        html+=`<text x="${lx}" y="${ty}" font-family="'Outfit',sans-serif" font-size="11" fill="#444" opacity="0.8">${esc(ln)}</text>`;
        ty+=14;
      }
      if (xl.length) {
        ty+=2;
        for (const ln of xl) {
          html+=`<text x="${lx}" y="${ty}" font-family="'Outfit',sans-serif" font-size="10.5" fill="${c}" opacity="0.7" font-style="italic">${esc(ln)}</text>`;
          ty+=13;
        }
      }
      y+=h+gap;
    }

    svg.innerHTML=html;
  }

  function drawColor(obj) {
    const topicos=obj.topicos||[];
    const n=topicos.length;
    const theme=obj.cor_tema||'#667eea';

    const cols=2;
    const rows=Math.ceil(n/cols);
    const nw=340, cpad=16, gap=18;
    const W=nw*cols+gap*(cols+1)+80;
    const cx=W/2;

    let nodeHeights=[];
    for (const t of topicos) {
      const tl=wrap(t.nome,22).length;
      const el=wrap(t.explicacao,30).length;
      const xl=t.exemplo?wrap(t.exemplo,30).length:0;
      nodeHeights.push(Math.max(90,(tl+el+xl)*15+cpad*2+8));
    }

    const ch=70;
    let rowHeights=[];
    for (let r=0;r<rows;r++) {
      let maxH=0;
      for (let c=0;c<cols;c++) {
        const idx=r*cols+c;
        if (idx<n) maxH=Math.max(maxH,nodeHeights[idx]);
      }
      rowHeights.push(maxH);
    }

    const headerH=ch+40;
    let totalH=headerH;
    for (const h of rowHeights) totalH+=h+gap;
    totalH+=gap;

    const svg=document.getElementById('map-svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${totalH}`);
    svg.setAttribute('width',W); svg.setAttribute('height',totalH);

    let html=`<defs>`;
    html+=`<radialGradient id="cg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="${shade(theme,30)}"/><stop offset="100%" stop-color="${theme}"/></radialGradient>`;
    html+=`<filter id="cs"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.12)"/></filter>`;
    html+=`</defs>`;
    html+=`<rect width="${W}" height="${totalH}" fill="#f8f9ff"/>`;

    const cr=ch/2+4;
    html+=`<circle cx="${cx}" cy="${cr+8}" r="${cr}" fill="url(#cg)" filter="url(#cs)"/>`;
    const cl=wrap(obj.centro||'Tema',16);
    let cty=cr+8-(cl.length-1)*9;
    for (const ln of cl) {
      html+=`<text x="${cx}" y="${cty}" text-anchor="middle" dominant-baseline="middle" font-family="'Outfit',sans-serif" font-size="16" font-weight="700" fill="#fff">${esc(ln)}</text>`;
      cty+=18;
    }

    let rowY=headerH;
    for (let r=0;r<rows;r++) {
      const rh=rowHeights[r];
      for (let c=0;c<cols;c++) {
        const idx=r*cols+c;
        if (idx>=n) break;
        const t=topicos[idx];
        const col=COLORS[idx%COLORS.length];
        const fill=['#fff0f0','#fff8ee','#efffef','#eef5ff','#f8eeff','#fffbee','#eefff8','#fff0f8','#f3eeff','#eef8ff','#fff5ee','#eef2ff'][idx%12];

        const nx=gap+(nw+gap)*c+40;
        const ny=rowY;

        const connX=cx, connY=cr*2+8;
        html+=`<path d="M ${cx} ${connY} Q ${cx} ${ny+rh/2}, ${nx+nw/2} ${ny+rh/2}" stroke="${col}" stroke-width="2" fill="none" opacity="0.35"/>`;

        html+=`<rect x="${nx}" y="${ny}" width="${nw}" height="${rh}" rx="18" fill="${fill}" stroke="${col}" stroke-width="2" filter="url(#cs)"/>`;

        const tl=wrap(t.nome,20);
        const el=wrap(t.explicacao,28);
        const xl=t.exemplo?wrap(t.exemplo,28):[];

        let ty=ny+cpad+13;
        for (const ln of tl) {
          html+=`<text x="${nx+nw/2}" y="${ty}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="13" font-weight="700" fill="${col}">${esc(ln)}</text>`;
          ty+=16;
        }
        ty+=4;
        for (const ln of el) {
          html+=`<text x="${nx+nw/2}" y="${ty}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="11" fill="#333" opacity="0.8">${esc(ln)}</text>`;
          ty+=14;
        }
        if (xl.length) {
          ty+=3;
          for (const ln of xl) {
            html+=`<text x="${nx+nw/2}" y="${ty}" text-anchor="middle" font-family="'Outfit',sans-serif" font-size="10.5" fill="${col}" opacity="0.7" font-style="italic">${esc(ln)}</text>`;
            ty+=13;
          }
        }
      }
      rowY+=rh+gap;
    }
    svg.innerHTML=html;
  }

  function drawHand(obj) {
    const topicos=obj.topicos||[];
    const n=topicos.length;

    const W=900, CX=450, CY=120;
    const cpad=14;

    const half=Math.ceil(n/2);
    const leftTopics=topicos.slice(0,half);
    const rightTopics=topicos.slice(half);

    const nw=220;
    const gap=22;

    function nodeH(t) {
      const tl=wrap(t.nome,18).length;
      const el=wrap(t.explicacao,26).length;
      const xl=t.exemplo?wrap(t.exemplo,26).length:0;
      return Math.max(70,(tl+el+xl)*16+cpad*2);
    }

    const leftHeights=leftTopics.map(t=>nodeH(t));
    const rightHeights=rightTopics.map(t=>nodeH(t));

    const leftTotal=leftHeights.reduce((a,b)=>a+b+gap,0);
    const rightTotal=rightHeights.reduce((a,b)=>a+b+gap,0);
    const maxSide=Math.max(leftTotal,rightTotal);

    const totalH=CY*2+maxSide+80;

    const svg=document.getElementById('map-svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${totalH}`);
    svg.setAttribute('width',W); svg.setAttribute('height',totalH);

    let html=`<defs><filter id="hf"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
    html+=`<rect width="${W}" height="${totalH}" fill="#fffef5"/>`;

    const cl=wrap(obj.centro||'Tema',14);
    const centerW=180, centerH=cl.length*22+28;
    const cx0=CX-centerW/2, cy0=CY-centerH/2;
    html+=`<path d="M ${cx0+10+jit()} ${cy0+jit()} L ${cx0+centerW-10+jit()} ${cy0+jit()} Q ${cx0+centerW+jit()} ${cy0+jit()} ${cx0+centerW+jit()} ${cy0+12+jit()} L ${cx0+centerW+jit()} ${cy0+centerH-12+jit()} Q ${cx0+centerW+jit()} ${cy0+centerH+jit()} ${cx0+centerW-10+jit()} ${cy0+centerH+jit()} L ${cx0+10+jit()} ${cy0+centerH+jit()} Q ${cx0+jit()} ${cy0+centerH+jit()} ${cx0+jit()} ${cy0+centerH-12+jit()} L ${cx0+jit()} ${cy0+12+jit()} Q ${cx0+jit()} ${cy0+jit()} ${cx0+10+jit()} ${cy0+jit()} Z" fill="#222" filter="url(#hf)"/>`;
    let cty=CY-(cl.length-1)*11;
    for (const ln of cl) {
      html+=`<text x="${CX}" y="${cty}" text-anchor="middle" dominant-baseline="middle" font-family="'Caveat',cursive" font-size="20" font-weight="700" fill="#fffef5">${esc(ln)}</text>`;
      cty+=22;
    }

    const startY=CY+centerH/2+gap;
    const laneX=CX-nw-60;
    const raneX=CX+60;

    function drawNode(t,x,y,color,idx) {
      const h=nodeH(t);
      const tl=wrap(t.nome,18);
      const el=wrap(t.explicacao,26);
      const xl=t.exemplo?wrap(t.exemplo,26):[];

      html+=`<path d="M ${x+10+jit()} ${y+jit()} L ${x+nw-10+jit()} ${y+jit()} Q ${x+nw+jit()} ${y+jit()} ${x+nw+jit()} ${y+10+jit()} L ${x+nw+jit()} ${y+h-10+jit()} Q ${x+nw+jit()} ${y+h+jit()} ${x+nw-10+jit()} ${y+h+jit()} L ${x+10+jit()} ${y+h+jit()} Q ${x+jit()} ${y+h+jit()} ${x+jit()} ${y+h-10+jit()} L ${x+jit()} ${y+10+jit()} Q ${x+jit()} ${y+jit()} ${x+10+jit()} ${y+jit()} Z" fill="#fffef5" stroke="${color}" stroke-width="2.5" filter="url(#hf)"/>`;

      let ty=y+cpad+15;
      for (const ln of tl) {
        html+=`<text x="${x+nw/2}" y="${ty}" text-anchor="middle" font-family="'Caveat',cursive" font-size="16" font-weight="700" fill="${color}" filter="url(#hf)">${esc(ln)}</text>`;
        ty+=18;
      }
      ty+=4;
      for (const ln of el) {
        html+=`<text x="${x+nw/2}" y="${ty}" text-anchor="middle" font-family="'Caveat',cursive" font-size="14" fill="#333" filter="url(#hf)">${esc(ln)}</text>`;
        ty+=16;
      }
      if (xl.length) {
        ty+=2;
        for (const ln of xl) {
          html+=`<text x="${x+nw/2}" y="${ty}" text-anchor="middle" font-family="'Caveat',cursive" font-size="13" fill="${color}" opacity="0.7" font-style="italic" filter="url(#hf)">${esc(ln)}</text>`;
          ty+=15;
        }
      }
      return h;
    }

    let ly=startY;
    for (let i=0;i<leftTopics.length;i++) {
      const t=leftTopics[i];
      const h=leftHeights[i];
      const color=COLORS[i%COLORS.length];
      const ny=ly, nx=laneX;
      const connX1=cx0, connY1=CY;
      const connX2=nx+nw, connY2=ny+h/2;
      html+=`<path d="M ${connX1+jit()} ${connY1+jit()} C ${(connX1+connX2)/2+jit(4)} ${connY1+jit(4)}, ${(connX1+connX2)/2+jit(4)} ${connY2+jit(4)}, ${connX2+jit()} ${connY2+jit()}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" filter="url(#hf)"/>`;
      drawNode(t,nx,ny,color,i);
      ly+=h+gap;
    }

    let ry=startY;
    for (let i=0;i<rightTopics.length;i++) {
      const t=rightTopics[i];
      const h=rightHeights[i];
      const color=COLORS[(i+half)%COLORS.length];
      const ny=ry, nx=raneX;
      const connX1=cx0+centerW, connY1=CY;
      const connX2=nx, connY2=ny+h/2;
      html+=`<path d="M ${connX1+jit()} ${connY1+jit()} C ${(connX1+connX2)/2+jit(4)} ${connY1+jit(4)}, ${(connX1+connX2)/2+jit(4)} ${connY2+jit(4)}, ${connX2+jit()} ${connY2+jit()}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" filter="url(#hf)"/>`;
      drawNode(t,nx,ny,color,i+half);
      ry+=h+gap;
    }

    svg.innerHTML=html;
  }

  async function xPNG() {
    toast('Gerando PNG...');
    try {
      const c=await html2canvas(document.getElementById('map-wrap'),{backgroundColor:null,scale:2});
      const a=document.createElement('a'); a.download='mindmap.png'; a.href=c.toDataURL('image/png'); a.click();
      toast('✅ PNG salvo!');
    } catch(e) { toast('Erro PNG'); }
  }

  async function xPDF() {
    toast('Gerando PDF...');
    try {
      const c=await html2canvas(document.getElementById('map-wrap'),{backgroundColor:'#ffffff',scale:2});
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[c.width/2,c.height/2]});
      pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,c.width/2,c.height/2);
      pdf.save('mindmap.pdf');
      toast('✅ PDF salvo!');
    } catch(e) { toast('Erro PDF'); }
  }
