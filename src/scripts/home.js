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

        // Feedbacks data
        const feedbacks = [
            // {
            //     name: "Tio Paulo",
            //     role: "DONO",
            //     photo: "src/imgs/imgs++/tioPaulo.png",
            //     feedback: "Pensa num Site Bom, Bunito!"
            // },
            // {
            //     name: "Tio Paulo 2",
            //     role: "DONO",
            //     photo: "src/imgs/imgs++/tioPaulo.png",
            //     feedback: "Very good Esse Site!"
            // }
            {
                name: "Paulo",
                role: "DONO",
                photo: "src/imgs/imgs++/tioPaulo.png",
                feedback: "Seu feedback é importante. Mande um email falando como está sendo utilizar o site!"
            },
            {
                name: "Ana Souza",
                role: "VISITANTE",
                photo: "src/imgs/imgs++/feedback_persons/feed1.jpg",
                feedback: "Gostei muito da plataforma, usei várias vezes e sempre funcionou rápido. Bem simples de usar"
            },
            {
                name: "Lucas Martins",
                role: "VISITANTE",
                photo: "src/imgs/imgs++/feedback_persons/feed2.jpg",
                feedback: "Muito bom, resolveu exatamente o que eu precisava. Interface limpa e fácil de entender.”"
            },
            {
                name: "Rafael Oliveira",
                role: "VISITANTE",
                photo: "src/imgs/imgs++/feedback_persons/feed3.jpg",
                feedback: "Usei em um projeto e me ajudou bastante. Recomendo pra quem quer algo rápido e eficiente."
            },
            {
                name: "João Pedro Silva",
                role: "VISITANTE",
                photo: "src/imgs/imgs++/feedback_persons/feed4.jpg",
                feedback: "Curti bastante, simples mas funciona muito bem. Já salvei aqui pra usar sempre."
            },
            {
                name: "Matheus Fernandes",
                role: "VISITANTE",
                photo: "src/imgs/imgs++/feedback_persons/feed5.jpg",
                feedback: "Achei muito útil, principalmente pela praticidade. Vale a pena usar."
            },
            {
                name: "Felipe Andrade",
                role: "VISITANTE",
                photo: "src/imgs/imgs++/feedback_persons/feed6.jpg",
                feedback: "Usei aqui e funcionou certinho, bem direto ao ponto. Curti porque não tem complicação."
            },
            {
                name: "Paulo",
                role: "DONO",
                photo: "src/imgs/imgs++/tioPaulo.png",
                feedback: "Seu feedback é importante. Mande um email falando como está sendo utilizar o site!"
            },
        ];

        // Populate carousel
        const track = document.getElementById('carouselTrack');
        
        // Duplicate feedbacks to create infinite scroll effect
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