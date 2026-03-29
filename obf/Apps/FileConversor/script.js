var currentFile = null;
        var selectedFormat = null;
        var convertedBlob = null;

        var conversionFormats = {
            'image/jpeg': ['png', 'webp', 'base64'],
            'image/png': ['jpeg', 'webp', 'base64'],
            'image/webp': ['jpeg', 'png', 'base64'],
            'text/plain': ['json']
        };

        var uploadArea = document.getElementById('uploadArea');
        var fileInput = document.getElementById('fileInput');
        var fileInfo = document.getElementById('fileInfo');
        var fileName = document.getElementById('fileName');
        var fileSize = document.getElementById('fileSize');
        var conversionOptions = document.getElementById('conversionOptions');
        var formatGrid = document.getElementById('formatGrid');
        var progressSection = document.getElementById('progressSection');
        var progressText = document.getElementById('progressText');
        var progressFill = document.getElementById('progressFill');
        var btnConvert = document.getElementById('btnConvert');
        var btnReset = document.getElementById('btnReset');
        var btnDownload = document.getElementById('btnDownload');

        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            var files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        function handleFile(file) {
            currentFile = file;
            selectedFormat = null;
            convertedBlob = null;

            fileName.textContent = '📄 ' + file.name;
            fileSize.textContent = 'Tamanho: ' + (file.size / 1024).toFixed(2) + ' KB';
            fileInfo.classList.add('show');

            var formats = conversionFormats[file.type] || [];
            
            if (formats.length > 0) {
                var buttonsHTML = '';
                for (var i = 0; i < formats.length; i++) {
                    buttonsHTML += '<button class="format-btn" data-format="' + formats[i] + '">' + formats[i].toUpperCase() + '</button>';
                }
                formatGrid.innerHTML = buttonsHTML;
                
                var formatButtons = formatGrid.querySelectorAll('.format-btn');
                for (var j = 0; j < formatButtons.length; j++) {
                    formatButtons[j].addEventListener('click', selectFormat);
                }
                
                conversionOptions.classList.add('show');
            } else {
                formatGrid.innerHTML = '<p style="color: #999; grid-column: 1/-1;">Formato não suportado</p>';
                conversionOptions.classList.add('show');
                btnConvert.disabled = true;
            }

            btnDownload.classList.remove('show');
            progressSection.classList.remove('show');
        }

        function selectFormat(e) {
            selectedFormat = e.target.getAttribute('data-format');
            
            var allButtons = formatGrid.querySelectorAll('.format-btn');
            for (var i = 0; i < allButtons.length; i++) {
                allButtons[i].classList.remove('active');
            }
            
            e.target.classList.add('active');
            btnConvert.disabled = false;
        }

        btnConvert.addEventListener('click', function() {
            if (!currentFile || !selectedFormat) {
                alert('Selecione um arquivo e formato de destino!');
                return;
            }

            progressSection.classList.add('show');
            progressText.textContent = 'Convertendo...';
            progressFill.style.width = '0%';

            var progress = 0;
            var progressInterval = setInterval(function() {
                progress += 10;
                progressFill.style.width = progress + '%';
                if (progress >= 90) {
                    clearInterval(progressInterval);
                }
            }, 100);

            setTimeout(function() {
                if (currentFile.type.indexOf('image/') === 0) {
                    convertImage(currentFile, selectedFormat, function() {
                        clearInterval(progressInterval);
                        progressFill.style.width = '100%';
                        progressText.textContent = '✅ Conversão concluída!';
                        btnDownload.classList.add('show');
                    });
                } else if (currentFile.type === 'text/plain') {
                    convertText(currentFile, selectedFormat, function() {
                        clearInterval(progressInterval);
                        progressFill.style.width = '100%';
                        progressText.textContent = '✅ Conversão concluída!';
                        btnDownload.classList.add('show');
                    });
                }
            }, 1000);
        });

        function convertImage(file, targetFormat, callback) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    if (targetFormat === 'base64') {
                        var base64 = canvas.toDataURL();
                        var blob = new Blob([base64], { type: 'text/plain' });
                        convertedBlob = blob;
                        callback();
                    } else {
                        var mimeType = targetFormat === 'jpeg' ? 'image/jpeg' : 
                                       targetFormat === 'png' ? 'image/png' : 'image/webp';
                        
                        canvas.toBlob(function(blob) {
                            convertedBlob = blob;
                            callback();
                        }, mimeType, 0.95);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function convertText(file, targetFormat, callback) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var text = e.target.result;
                var converted = text;

                if (targetFormat === 'json') {
                    var lines = text.split(/\r?\n/);
                    var jsonData = { lines: lines, length: lines.length };
                    converted = JSON.stringify(jsonData, null, 2);
                }

                convertedBlob = new Blob([converted], { type: 'text/plain' });
                callback();
            };
            reader.readAsText(file);
        }

        btnDownload.addEventListener('click', function() {
            if (!convertedBlob) {
                alert('Nenhum arquivo convertido disponível!');
                return;
            }

            var url = URL.createObjectURL(convertedBlob);
            var a = document.createElement('a');
            var fileNameWithoutExt = currentFile.name.split('.')[0];
            var extension = selectedFormat === 'base64' ? 'txt' : selectedFormat;
            a.href = url;
            a.download = fileNameWithoutExt + '_convertido.' + extension;
            a.click();
            URL.revokeObjectURL(url);
        });

        btnReset.addEventListener('click', function() {
            currentFile = null;
            selectedFormat = null;
            convertedBlob = null;
            
            fileInput.value = '';
            fileInfo.classList.remove('show');
            conversionOptions.classList.remove('show');
            progressSection.classList.remove('show');
            btnDownload.classList.remove('show');
            btnConvert.disabled = true;
            progressFill.style.width = '0%';
        });