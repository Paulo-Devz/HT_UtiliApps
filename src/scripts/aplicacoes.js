function createStars() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 100; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*3}s`;
        frag.appendChild(s);
    }
    document.body.appendChild(frag);
}
createStars();

let programs = [];
let activeChip = 'todos';
const NOVO_DIAS = 14;

function parseDataBrasileira(dataStr) {
    if (!dataStr) return new Date(0);
    
    const partes = dataStr.split('/');
    if (partes.length !== 3) return new Date(0);
    
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Meses começam em 0
    const ano = parseInt(partes[2]);
    
    const data = new Date(ano, mes, dia);
    return isNaN(data.getTime()) ? new Date(0) : data;
}
function isNovo(dataCriacao) {
    if (!dataCriacao) return false;
    const d = parseDataBrasileira(dataCriacao);
    return !isNaN(d) && (Date.now() - d.getTime()) / 86400000 < NOVO_DIAS;
}

function primeirasPalavra(tipo) {
    if (!tipo) return 'OUTRO';
    return tipo.trim().split(/\s+/)[0].toUpperCase();
}

function populateTipoFilter() {
    const grupos = {};
    programs.forEach(p => {
        if (!p.tipoPrograma) return;
        const chave = primeirasPalavra(p.tipoPrograma);
        if (!grupos[chave]) grupos[chave] = [];
        grupos[chave].push(p.tipoPrograma);
    });

    const sel = document.getElementById('filterTipo');
    Object.keys(grupos).sort().forEach(grupo => {
        const tipos = [...new Set(grupos[grupo])].sort();
        if (tipos.length === 1) {
            const opt = document.createElement('option');
            opt.value = tipos[0].toLowerCase();
            opt.textContent = tipos[0];
            sel.appendChild(opt);
        } else {
            const grp = document.createElement('optgroup');
            grp.label = grupo;
            tipos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.toLowerCase();
                opt.textContent = t;
                grp.appendChild(opt);
            });
            sel.appendChild(grp);
        }
    });
}

function setChip(el, val) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    activeChip = val;
    render();
}

function resetFiltros() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTipo').value = '';
    document.getElementById('filterOrdem').value = 'padrao';
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.filter-chip[data-filter="todos"]').classList.add('active');
    activeChip = 'todos';
    render();
}

function createCard(program) {
    const novo = isNovo(program.dataCriacao);
    const card = document.createElement('div');
    card.className = 'program-card' + (program.fixado ? ' fixado-card' : '') + (novo ? ' novo-card' : '');

    function diasPassados(dataStr) {
        if (!dataStr) return 0;
        const dias = Math.floor((Date.now() - parseDataBrasileira(dataStr).getTime()) / 86400000);
        return Math.max(1, dias);
    }

    const badgeFixado = program.fixado ? `<span class="badge badge-fixado">📌 Fixado</span>` : '';
    const badgeNovo   = novo ? `<span class="badge badge-novo">✦ Novo (criado há ${diasPassados(program.dataCriacao)} dias)</span>` : '';
    const badgeTipo   = program.tipoPrograma ? `<span class="badge badge-type">${program.tipoPrograma}</span>` : '';

    card.innerHTML = `
        <div class="card-accent"></div>
        <div class="card-body">
            <div class="card-header">
                <img src="${program.foto}" alt="${program.dono}" class="owner-avatar" onerror="this.style.display='none'">
                <div class="card-header-info">
                    <div class="owner-label">${program.dono || 'HT'}</div>
                    <div class="program-name">${program.nomePrograma}</div>
                </div>
            </div>
            <div class="card-badges">${badgeTipo}${badgeFixado}${badgeNovo}</div>
            <div class="program-description">${program.descricao || ''}</div>
        </div>
        <div class="card-footer">
            <button class="btn btn-detalhes">Detalhes</button>
            <button class="btn btn-abrir">Abrir</button>
        </div>
    `;

    card.querySelector('.btn-detalhes').addEventListener('click', () => {
        const params = new URLSearchParams({
            dono: program.dono || '', nomePrograma: program.nomePrograma,
            tipoPrograma: program.tipoPrograma || '', foto: program.foto || '',
            descricao: program.descricao || '', link: program.link || '',
            src: program.src || '', dataCriacao: program.dataCriacao || '',
            videoIlustration: program.videoIlustration || ''
        });
        window.location.href = `detalhes.html?${params.toString()}`;
    });

    card.querySelector('.btn-abrir').addEventListener('click', () => {
        abrirPrograma(program.src, program.link);
    });

    return card;
}

function render() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const tipoVal    = document.getElementById('filterTipo').value;
    const ordemVal   = document.getElementById('filterOrdem').value;

    let list = [...programs];

    if (searchTerm) {
        list = list.filter(p =>
            p.nomePrograma.toLowerCase().includes(searchTerm) ||
            (p.tipoPrograma||'').toLowerCase().includes(searchTerm) ||
            (p.dono||'').toLowerCase().includes(searchTerm) ||
            (p.descricao||'').toLowerCase().includes(searchTerm)
        );
    }

    if (tipoVal) {
        list = list.filter(p => (p.tipoPrograma||'').toLowerCase() === tipoVal);
    }

    if (activeChip === 'recente') list = list.filter(p => isNovo(p.dataCriacao));
    else if (activeChip === 'antigo') list = list.filter(p => !isNovo(p.dataCriacao));
    else if (activeChip === 'fixado') list = list.filter(p => p.fixado);

    if (ordemVal === 'az') list.sort((a,b) => a.nomePrograma.localeCompare(b.nomePrograma));
    else if (ordemVal === 'za') list.sort((a,b) => b.nomePrograma.localeCompare(a.nomePrograma));
    else if (ordemVal === 'recente') {
        list.sort((a,b) => parseDataBrasileira(b.dataCriacao||'01/01/1970') - parseDataBrasileira(a.dataCriacao||'01/01/1970'));
    }
    else if (ordemVal === 'antigo') {
        list.sort((a,b) => parseDataBrasileira(a.dataCriacao||'01/01/1970') - parseDataBrasileira(b.dataCriacao||'01/01/1970'));
    }
    else {
        const fixed = list.filter(p => p.fixado);
        const rest  = list.filter(p => !p.fixado);
        list = [...fixed, ...rest];
    }

    const grid = document.getElementById('programsGrid');
    const frag = document.createDocumentFragment();

    if (!list.length) {
        const msg = document.createElement('div');
        msg.className = 'no-results';
        msg.textContent = 'Nenhum programa encontrado.';
        frag.appendChild(msg);
    } else {
        list.forEach(p => frag.appendChild(createCard(p)));
    }

    grid.innerHTML = '';
    grid.appendChild(frag);

    document.getElementById('searchResult').textContent = searchTerm
        ? `PESQUISA: ${searchTerm.toUpperCase()}`
        : 'PESQUISA: NULL';
}

fetch('/json_reneavue/apps.json')
    .then(r => r.json())
    .then(data => {
        programs = data;
        populateTipoFilter();
        render();
    });

document.getElementById('searchInput').addEventListener('input', render);
document.getElementById('filterTipo').addEventListener('change', render);
document.getElementById('filterOrdem').addEventListener('change', render);