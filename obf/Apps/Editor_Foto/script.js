let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let originalImage = null;
        let originalFileName = null;
        let currentFilter = 'none';
        let rotation = 0;
        let flipped = false;

        // Configurações
        let settings = {
            brightness: 0,
            contrast: 100,
            saturation: 100,
            sharpness: 0,
            blur: 0
        };

        // Upload de imagem
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    originalFileName = file.name;
                    img.onload = () => {
                        originalImage = img;
                        canvas.width = img.width;
                        canvas.height = img.height;
                        document.getElementById('emptyState').style.display = 'none';
                        document.getElementById('canvasContainer').style.display = 'block';
                        applyFilters();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Controles
        document.getElementById('brightness').addEventListener('input', (e) => {
            settings.brightness = parseInt(e.target.value);
            document.getElementById('brightnessValue').textContent = e.target.value;
            applyFilters();
        });

        document.getElementById('contrast').addEventListener('input', (e) => {
            settings.contrast = parseInt(e.target.value);
            document.getElementById('contrastValue').textContent = e.target.value;
            applyFilters();
        });

        document.getElementById('saturation').addEventListener('input', (e) => {
            settings.saturation = parseInt(e.target.value);
            document.getElementById('saturationValue').textContent = e.target.value;
            applyFilters();
        });

        document.getElementById('sharpness').addEventListener('input', (e) => {
            settings.sharpness = parseInt(e.target.value);
            document.getElementById('sharpnessValue').textContent = e.target.value;
            applyFilters();
        });

        document.getElementById('blur').addEventListener('input', (e) => {
            settings.blur = parseInt(e.target.value);
            document.getElementById('blurValue').textContent = e.target.value;
            applyFilters();
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                applyFilters();
            });
        });

        // Aplicar filtros
        function applyFilters() {
            if (!originalImage) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Aplicar transformações
            ctx.save();
            if (flipped) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            
            // Desenhar imagem
            ctx.filter = `
                brightness(${100 + settings.brightness}%)
                contrast(${settings.contrast}%)
                saturate(${settings.saturation}%)
                blur(${settings.blur}px)
            `;

            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Aplicar filtros adicionais
            applyCustomFilter();
        }

        function applyCustomFilter() {
            if (currentFilter === 'none') return;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                switch (currentFilter) {
                    case 'grayscale':
                        const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
                        data[i] = data[i + 1] = data[i + 2] = gray;
                        break;
                    case 'sepia':
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
                        break;
                    case 'invert':
                        data[i] = 255 - data[i];
                        data[i + 1] = 255 - data[i + 1];
                        data[i + 2] = 255 - data[i + 2];
                        break;
                    case 'vintage':
                        data[i] += 40;
                        data[i + 1] += 20;
                        data[i + 2] -= 20;
                        break;
                    case 'warm':
                        data[i] += 30;
                        data[i + 1] += 10;
                        break;
                    case 'cold':
                        data[i + 2] += 30;
                        data[i + 1] += 10;
                        break;
                    case 'vibrant':
                        data[i] = Math.min(255, data[i] * 1.2);
                        data[i + 1] = Math.min(255, data[i + 1] * 1.2);
                        data[i + 2] = Math.min(255, data[i + 2] * 1.2);
                        break;
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }

        // Rotacionar
        function rotateImage() {
            if (!originalImage) return;
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = canvas.height;
            tempCanvas.height = canvas.width;
            
            tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            tempCtx.rotate(90 * Math.PI / 180);
            tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
            
            canvas.width = tempCanvas.width;
            canvas.height = tempCanvas.height;
            ctx.drawImage(tempCanvas, 0, 0);
        }

        // Espelhar
        function flipHorizontal() {
            flipped = !flipped;
            applyFilters();
        }

        // Adicionar texto
        function addText() {
            const text = document.getElementById('textInput').value;
            const position = document.getElementById('textPosition').value;
            
            if (!text || !originalImage) return;

            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';

            let y;
            switch (position) {
                case 'top':
                    y = 60;
                    break;
                case 'center':
                    y = canvas.height / 2;
                    break;
                case 'bottom':
                    y = canvas.height - 40;
                    break;
            }

            ctx.strokeText(text, canvas.width / 2, y);
            ctx.fillText(text, canvas.width / 2, y);
        }

        // Resetar
        function resetImage() {
            if (!originalImage) return;
            
            settings = {
                brightness: 0,
                contrast: 100,
                saturation: 100,
                sharpness: 0,
                blur: 0
            };
            
            currentFilter = 'none';
            rotation = 0;
            flipped = false;
            
            document.getElementById('brightness').value = 0;
            document.getElementById('contrast').value = 100;
            document.getElementById('saturation').value = 100;
            document.getElementById('sharpness').value = 0;
            document.getElementById('blur').value = 0;
            
            document.getElementById('brightnessValue').textContent = '0';
            document.getElementById('contrastValue').textContent = '100';
            document.getElementById('saturationValue').textContent = '100';
            document.getElementById('sharpnessValue').textContent = '0';
            document.getElementById('blurValue').textContent = '0';
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
            
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            
            applyFilters();
        }

        // Download
        function downloadImage() {
            if (!originalImage) {
                alert('Carregue uma imagem primeiro!');
                return;
            }
            
            const link = document.createElement('a');
            let baseName = originalFileName.replace(/\.[^/.]+$/, "");
            link.download = baseName + '_edited';
            link.href = canvas.toDataURL();
            link.click();
        }