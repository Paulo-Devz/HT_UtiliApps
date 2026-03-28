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

async function loadCounters() {
    try {
        // Apps
        const appsResponse = await fetch('json_reneavue/apps.json');
        const appsData = await appsResponse.json();
        document.getElementById('stat-apps').textContent = appsData.length;

        // Feedbacks
        const feedbacksResponse = await fetch('json_reneavue/feedbacks.json');
        const feedbacksData = await feedbacksResponse.json();
        document.getElementById('stat-feedbacks').textContent = feedbacksData.length;
    } catch (error) {
        console.error('Erro ao carregar contadores:', error);
        document.getElementById('stat-apps').textContent = '—';
        document.getElementById('stat-feedbacks').textContent = '—';
    }
}

document.addEventListener('DOMContentLoaded', loadCounters);

const cylinder = document.querySelector('.cylinder');
const texts = ['PROGRAMAS', 'JOGOS', 'UTENSÍLIOS'];
let idx = 0;
setInterval(() => cylinder.setAttribute('data-text', texts[++idx % texts.length]), 1000);

fetch('/json_reneavue/feedbacks.json')
    .then(r => r.json())
    .then(data => {
        const track = document.getElementById('carouselTrack');
        const frag = document.createDocumentFragment();
        [...data, ...data].forEach(fb => {
            const card = document.createElement('div');
            card.className = 'feedback-card';
            card.innerHTML = `<div class="user-info"><img src="${fb.photo}" alt="${fb.name}" class="user-photo"><div class="user-details"><h3>${fb.name}</h3><p>${fb.role}</p></div></div><p class="feedback-text">${fb.feedback}</p>`;
            frag.appendChild(card);
        });
        track.appendChild(frag);
    });

document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
});