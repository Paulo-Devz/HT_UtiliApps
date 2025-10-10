// Create stars
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

        // Lista de programas
        const programs = [
            {
                dono: "TIO PAULO",
                nomePrograma: "Checklist de Produtividade",
                tipoPrograma: "CHECKLIST",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Uma checklist Avançada com Salvamento de Dados!",
                fixado: false,
                link: "",
                src: "Apps/Checklist_Produtividade/main.html",
                dataCriacao: "10/10/2025",
                videoIlustration: "https://youtu.be/itue2_7etkA"
            },
            {
                dono: "TIO PAULO",
                nomePrograma: "Gestor de Clientes e Produtos",
                tipoPrograma: "ARMAZENAMENTO",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Uma checklist Avançada com Salvamento de Dados!",
                fixado: true,
                link: "",
                src: "Apps/Mini_BancoDados/main.html",
                dataCriacao: "10/10/2025",
                videoIlustration: "https://youtu.be/hjlIUGE22e4"
            },
        ];

        // Função para criar card de programa
        function createProgramCard(program) {
            const card = document.createElement('div');
            card.className = 'program-card';
            card.dataset.name = program.nomePrograma.toLowerCase();
            card.dataset.type = program.tipoPrograma.toLowerCase();
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
            
            // Botão de detalhes (redireciona para página de detalhes)
            card.querySelector('.btn-detalhes').addEventListener('click', () => {
                // Criar URL com os dados do programa
                const params = new URLSearchParams({
                    dono: program.dono,
                    nomePrograma: program.nomePrograma,
                    tipoPrograma: program.tipoPrograma,
                    foto: program.foto,
                    descricao: program.descricao,
                    link: program.link || '',
                    src: program.src || '',
                    dataCriacao: program.dataCriacao || '',
                    videoIlustration: program.videoIlustration || ''
                });
                
                // Redirecionar para página de detalhes
                window.location.href = `detalhes.html?${params.toString()}`;
            });

            // Botão abrir (link ou src)
            card.querySelector('.btn-abrir').addEventListener('click', () => {
                if (program.link) {
                    window.open(program.link, '_blank');
                } else if (program.src) {
                    window.open(program.src, '_blank');
                } else {
                    alert('Este programa não possui link nem src definido.');
                }
            });

            return card;
        }

        // Renderizar programas (fixados primeiro, depois não fixados)
        function renderPrograms(searchTerm = '') {
            const grid = document.getElementById('programsGrid');
            grid.innerHTML = '';
            
            // Separar e filtrar programas
            const fixedPrograms = programs.filter(p => p.fixado);
            const normalPrograms = programs.filter(p => !p.fixado);
            const allPrograms = [...fixedPrograms, ...normalPrograms];
            
            // Filtrar por termo de pesquisa
            const filtered = searchTerm 
                ? allPrograms.filter(p => 
                    p.nomePrograma.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.tipoPrograma.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.dono.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : allPrograms;
            
            filtered.forEach(program => {
                grid.appendChild(createProgramCard(program));
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchResult = document.getElementById('searchResult');

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            searchResult.textContent = searchTerm 
                ? `PESQUISA: ${searchTerm.toUpperCase()}` 
                : 'PESQUISA: NULL';
            renderPrograms(searchTerm);
        });

        // Renderizar programas inicialmente
        renderPrograms();