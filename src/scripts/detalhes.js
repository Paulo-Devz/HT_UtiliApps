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

function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : '';
}

const urlParams = new URLSearchParams(window.location.search);

if (!urlParams.has('nomePrograma')) {
    alert('Nenhum programa selecionado!');
    window.location.href = 'aplicacoes.html';
}

const programData = {
    dono:             urlParams.get('dono')             || 'Desconhecido',
    nomePrograma:     urlParams.get('nomePrograma')     || 'Sem nome',
    tipoPrograma:     urlParams.get('tipoPrograma')     || 'Sem tipo',
    foto:             urlParams.get('foto')             || 'https://i.pravatar.cc/150?img=1',
    descricao:        urlParams.get('descricao')        || 'Sem descrição',
    link:             urlParams.get('link')             || '',
    src:              urlParams.get('src')              || '',
    dataCriacao:      urlParams.get('dataCriacao')      || '00/00/00',
    videoIlustration: urlParams.get('videoIlustration') || ''
};

document.getElementById('ownerPhoto').src               = programData.foto;
document.getElementById('ownerName').textContent         = programData.dono;
document.getElementById('programName').textContent       = programData.nomePrograma;
document.getElementById('additionalInfo').textContent    = programData.tipoPrograma;
document.getElementById('creationDate').textContent      = programData.dataCriacao;
document.getElementById('description').textContent       = programData.descricao;

const videoUrl      = getYouTubeEmbedUrl(programData.videoIlustration);
const videoFrame    = document.getElementById('videoFrame');
const videoError    = document.getElementById('videoError');
const btnOpenYoutube = document.getElementById('btnOpenYoutube');

if (videoUrl) {
    const embedParams = new URLSearchParams({
        enablejsapi:      '1',
        origin:           window.location.origin,
        rel:              '0',
        modestbranding:   '1'
    });

    videoFrame.src = videoUrl + '?' + embedParams.toString();

    if (programData.videoIlustration) {
        btnOpenYoutube.href         = programData.videoIlustration;
        btnOpenYoutube.style.display = 'inline-block';
    }

    let errorChecked = false;
    videoFrame.addEventListener('load', () => {
        if (!errorChecked) {
            errorChecked = true;
            setTimeout(() => {
                try { videoFrame.contentWindow.document; }
                catch (e) { videoError.style.display = 'none'; }
            }, 2000);
        }
    });

    setTimeout(() => {
        if (!errorChecked) {
            videoError.innerHTML    = '⚠️ Este vídeo pode ter restrições de incorporação. Tente o botão "ABRIR NO YOUTUBE" abaixo.';
            videoError.style.display = 'block';
        }
    }, 3000);

} else {
    videoError.textContent       = '⚠️ Nenhum vídeo disponível para este programa.';
    videoError.style.display      = 'block';
    videoFrame.style.display      = 'none';
}

let isPlaying = false;
const btnPlayPause = document.getElementById('btnPlayPause');

btnPlayPause.addEventListener('click', () => {
    if (!videoFrame.src) { alert('Nenhum vídeo carregado!'); return; }
    if (isPlaying) {
        videoFrame.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        btnPlayPause.textContent = '▶';
        isPlaying = false;
    } else {
        videoFrame.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        btnPlayPause.textContent = '⏸';
        isPlaying = true;
    }
});

document.getElementById('btnAbrirPrograma').addEventListener('click', () => {
    abrirPrograma(programData.src, programData.link);
});