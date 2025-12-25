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
                dono: "PAULO",
                nomePrograma: "Gerador de QR-CODE",
                tipoPrograma: "GERADOR",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Um avançado gerador de QR-CODE!",
                fixado: true,
                link: "",
                src: "Apps/Gerador_QRCODE/main.html",
                dataCriacao: "25/12/2025",
                videoIlustration: ""
            },
            {
                dono: "PAULO",
                nomePrograma: "Compactador de Texto",
                tipoPrograma: "EDITOR",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Compactador de Texto Simples para o Dia Dia!",
                fixado: false,
                link: "",
                src: "Apps/Compactador_Texto/main.html",
                dataCriacao: "25/12/2025",
                videoIlustration: ""
            },
            {
                dono: "FREEGAMES",
                nomePrograma: "FREEGAMES",
                tipoPrograma: "JOGOS",
                foto: "src/imgs/imgs++/FREEGAMES.jpg",
                descricao: "Jogos online da FREE GAMES!",
                fixado: false,
                link: "https://freegames.com",
                src: "",
                dataCriacao: "25/12/2025",
                videoIlustration: ""
            },
            // https://www.freegames.com
            {
                dono: "PAULO",
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
                dono: "PAULO",
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
            {
                dono: "PAULO",
                nomePrograma: "Calculadora Financeira",
                tipoPrograma: "ADMINISTRAÇÃO",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Uma Calculadora Que Possui Juros, Parcelamento e Investimento!",
                fixado: false,
                link: "",
                src: "Apps/Calculadora_Financeira/main.html",
                dataCriacao: "12/10/2025",
                videoIlustration: "https://youtu.be/7qwDRgJGda0"
            },
            {
                dono: "PAULO",
                nomePrograma: "Editor de Foto Rápido",
                tipoPrograma: "EDITOR",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Editor de Foto Com Multifuncionalidades!",
                fixado: true,
                link: "",
                src: "Apps/Editor_Foto/main.html",
                dataCriacao: "12/10/2025",
                videoIlustration: "https://youtu.be/GqPvdUhTfGQ"
            },
            {
                dono: "PAULO",
                nomePrograma: "Mapa Mental Online",
                tipoPrograma: "MAPA MENTAL",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Mapa Mental Online para Você Usar!",
                fixado: false,
                link: "",
                src: "Apps/MapaMental_Online/main.html",
                dataCriacao: "13/10/2025",
                videoIlustration: "https://youtu.be/ps25wMb4dRQ"
            },
            {
                dono: "PAULO",
                nomePrograma: "Conversor de Arquivos",
                tipoPrograma: "CONVERSOR",
                foto: "src/imgs/imgs++/tioPaulo.png",
                descricao: "Conversor de Arquivos Gratuito!",
                fixado: false,
                link: "",
                src: "Apps/Conversor_Arquivos/main.html",
                dataCriacao: "13/10/2025",
                videoIlustration: "https://youtu.be/w0L5oRzNQJk"
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