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

        // Função para converter URL do YouTube para embed
        function getYouTubeEmbedUrl(url) {
            if (!url) return '';
            
            // Extrair o ID do vídeo
            let videoId = '';
            
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1]?.split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0];
            }
            
            // Usar youtube-nocookie.com para melhor privacidade e compatibilidade
            return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : '';
        }

        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        
        // Preencher os dados na página
        const programData = {
            dono: urlParams.get('dono') || 'Desconhecido',
            nomePrograma: urlParams.get('nomePrograma') || 'Sem nome',
            tipoPrograma: urlParams.get('tipoPrograma') || 'Sem tipo',
            foto: urlParams.get('foto') || 'https://i.pravatar.cc/150?img=1',
            descricao: urlParams.get('descricao') || 'Sem descrição',
            link: urlParams.get('link') || '',
            src: urlParams.get('src') || '',
            dataCriacao: urlParams.get('dataCriacao') || '00/00/00',
            videoIlustration: urlParams.get('videoIlustration') || ''
        };

        // Preencher elementos
        document.getElementById('ownerPhoto').src = programData.foto;
        document.getElementById('ownerName').textContent = programData.dono;
        document.getElementById('programName').textContent = programData.nomePrograma;
        document.getElementById('additionalInfo').textContent = programData.tipoPrograma;
        document.getElementById('creationDate').textContent = programData.dataCriacao;
        document.getElementById('description').textContent = programData.descricao;

        // Configurar vídeo
        const videoUrl = getYouTubeEmbedUrl(programData.videoIlustration);
        const videoFrame = document.getElementById('videoFrame');
        const videoError = document.getElementById('videoError');
        const btnOpenYoutube = document.getElementById('btnOpenYoutube');
        
        if (videoUrl) {
            // Usar youtube-nocookie.com + parâmetros otimizados
            const embedParams = new URLSearchParams({
                enablejsapi: '1',      // Habilita controle via JS
                origin: window.location.origin,  // Define origem para segurança
                rel: '0',               // Não mostra vídeos relacionados
                modestbranding: '1'     // Remove logo do YouTube
            });
            
            videoFrame.src = videoUrl + '?' + embedParams.toString();
            
            // Configurar botão para abrir no YouTube
            if (programData.videoIlustration) {
                btnOpenYoutube.href = programData.videoIlustration;
                btnOpenYoutube.style.display = 'inline-block';
            }
            
            // Detectar se o vídeo carregou com erro
            let errorChecked = false;
            videoFrame.addEventListener('load', () => {
                if (!errorChecked) {
                    errorChecked = true;
                    setTimeout(() => {
                        // Mostrar aviso caso o vídeo não carregue
                        const iframeWindow = videoFrame.contentWindow;
                        try {
                            // Tentar acessar - se houver erro CORS, vídeo provavelmente está OK
                            iframeWindow.document;
                        } catch (e) {
                            // CORS error é esperado para vídeos funcionando
                            videoError.style.display = 'none';
                        }
                    }, 2000);
                }
            });
            
            // Mostrar aviso se demorar muito para carregar
            setTimeout(() => {
                if (!errorChecked) {
                    videoError.innerHTML = '⚠️ Este vídeo pode ter restrições de incorporação. Tente o botão "ABRIR NO YOUTUBE" abaixo.';
                    videoError.style.display = 'block';
                }
            }, 3000);
            
        } else {
            videoError.textContent = '⚠️ Nenhum vídeo disponível para este programa.';
            videoError.style.display = 'block';
            videoFrame.style.display = 'none';
        }

        // Controle de Play/Pause do vídeo
        let isPlaying = false;
        const btnPlayPause = document.getElementById('btnPlayPause');

        btnPlayPause.addEventListener('click', () => {
            if (!videoFrame.src) {
                alert('Nenhum vídeo carregado!');
                return;
            }

            // Alternar entre play e pause
            if (isPlaying) {
                // Pausar - envia comando para o iframe do YouTube
                videoFrame.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                btnPlayPause.textContent = '▶';
                isPlaying = false;
            } else {
                // Play - envia comando para o iframe do YouTube
                videoFrame.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                btnPlayPause.textContent = '⏸';
                isPlaying = true;
            }
        });
        document.getElementById('btnAbrirPrograma').addEventListener('click', () => {
            if (programData.link) {
                window.open(programData.link, '_blank');
            } else if (programData.src) {
                window.open(programData.src, '_blank');
            } else {
                alert('Este programa não possui link nem src definido.');
            }
        });

        // Verificar se há dados na URL
        if (!urlParams.has('nomePrograma')) {
            alert('Nenhum programa selecionado!');
            window.location.href = 'aplicacoes.html';
        }