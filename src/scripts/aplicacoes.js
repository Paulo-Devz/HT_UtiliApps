function createStars() {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(star);
    }
}
createStars();

let programs = [];

fetch('/json_reneavue/apps.json')
    .then(res => res.json())
    .then(data => {
        programs = data;
        renderPrograms();
    });

function createProgramCard(program) {
    const card = document.createElement('div');
    card.className = 'program-card';
    card.dataset.name  = program.nomePrograma.toLowerCase();
    card.dataset.type  = program.tipoPrograma.toLowerCase();
    card.dataset.owner = program.dono.toLowerCase();

    card.innerHTML = `
        ${program.fixado ? '<div class="fixed-badge">📌</div>' : ''}
        <div class="owner-section">
            <img src="${program.foto}" alt="${program.dono}" class="owner-icon">
            <div class="owner-name">DONO | ${program.dono.toUpperCase()}</div>
        </div>
        <div class="program-name">${program.nomePrograma}</div>
        <div class="program-type">TIPO DO PROGRAMA: ${program.tipoPrograma}</div>
        <div class="program-description">DESCRIÇÃO<br>${program.descricao}</div>
        <div class="card-actions">
            <button class="btn btn-detalhes">Detalhes</button>
            <button class="btn btn-abrir">Abrir</button>
        </div>
    `;

    card.querySelector('.btn-detalhes').addEventListener('click', () => {
        const params = new URLSearchParams({
            dono:             program.dono,
            nomePrograma:     program.nomePrograma,
            tipoPrograma:     program.tipoPrograma,
            foto:             program.foto,
            descricao:        program.descricao,
            link:             program.link || '',
            src:              program.src || '',
            dataCriacao:      program.dataCriacao || '',
            videoIlustration: program.videoIlustration || ''
        });
        window.location.href = `detalhes.html?${params.toString()}`;
    });

    card.querySelector('.btn-abrir').addEventListener('click', () => {
        abrirPrograma(program.src, program.link);
    });

    return card;
}

function renderPrograms(searchTerm = '') {
    const grid = document.getElementById('programsGrid');
    grid.innerHTML = '';

    const fixedPrograms  = programs.filter(p => p.fixado);
    const normalPrograms = programs.filter(p => !p.fixado);
    const allPrograms    = [...fixedPrograms, ...normalPrograms];

    const filtered = searchTerm
        ? allPrograms.filter(p =>
            p.nomePrograma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tipoPrograma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.dono.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allPrograms;

    filtered.forEach(program => grid.appendChild(createProgramCard(program)));
}

const searchInput  = document.getElementById('searchInput');
const searchResult = document.getElementById('searchResult');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    searchResult.textContent = searchTerm
        ? `PESQUISA: ${searchTerm.toUpperCase()}`
        : 'PESQUISA: NULL';
    renderPrograms(searchTerm);
});

renderPrograms();