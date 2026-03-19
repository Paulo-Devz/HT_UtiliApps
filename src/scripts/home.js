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

        // Rotate cylinder text
        const cylinder = document.querySelector('.cylinder');
        const texts = ['PROGRAMAS', 'JOGOS', 'UTENSÍLIOS'];
        let currentIndex = 0;

        setInterval(() => {
            currentIndex = (currentIndex + 1) % texts.length;
            cylinder.setAttribute('data-text', texts[currentIndex]);
        }, 2000);

        let feedbacks = [];
        // Feedbacks data
        fetch('/json_reneavue/feedbacks.json')
            .then(res => res.json())
            .then(data => {
                const track = document.getElementById('carouselTrack');
                const allFeedbacks = [...data, ...data];
                
                allFeedbacks.forEach(fb => {
                    const card = document.createElement('div');
                    card.className = 'feedback-card';
                    card.innerHTML = `
                        <div class="user-info">
                            <img src="${fb.photo}" alt="${fb.name}" class="user-photo">
                            <div class="user-details">
                                <h3>${fb.name}</h3>
                                <p>${fb.role}</p>
                            </div>
                        </div>
                        <p class="feedback-text">${fb.feedback}</p>
                    `;
                    track.appendChild(card);
                });
            });
        
        const track = document.getElementById('carouselTrack');
        
        const allFeedbacks = [...feedbacks, ...feedbacks];
        
        allFeedbacks.forEach(fb => {
            const card = document.createElement('div');
            card.className = 'feedback-card';
            card.innerHTML = `
                <div class="user-info">
                    <img src="${fb.photo}" alt="${fb.name}" class="user-photo">
                    <div class="user-details">
                        <h3>${fb.name}</h3>
                        <p>${fb.role}</p>
                    </div>
                </div>
                <p class="feedback-text">${fb.feedback}</p>
            `;
            track.appendChild(card);
        });

        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });