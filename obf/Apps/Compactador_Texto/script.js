        var darkModeToggle = document.getElementById('darkModeToggle');
        var body = document.body;
        var compactBtn = document.getElementById('compactBtn');
        var textInput = document.getElementById('textInput');
        var result = document.getElementById('result');
        var outputText = document.getElementById('outputText');
        var charBefore = document.getElementById('charBefore');
        var charAfter = document.getElementById('charAfter');
        var reduction = document.getElementById('reduction');
        var copyBtn = document.getElementById('copyBtn');
        var adModal = document.getElementById('adModal');
        var adTimer = document.getElementById('adTimer');
        var closeAdBtn = document.getElementById('closeAdBtn');

        body.classList.toggle('dark-mode');
        darkModeToggle.addEventListener('click', function() {
            darkModeToggle.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
        });

        // Compactar Texto
        compactBtn.addEventListener('click', function() {
            var originalText = textInput.value;
            if (!originalText.trim()) {
                alert('Por favor, insira um texto para compactar.');
                return;
            }

            var originalLength = originalText.length;

            // Verificar se é texto longo (>500 caracteres)
            if (originalLength > 500) {
                adModal.classList.add('show');
                closeAdBtn.classList.remove('show');
                
                var timeLeft = 5;
                adTimer.textContent = timeLeft;
                
                var countdown = setInterval(function() {
                    timeLeft--;
                    adTimer.textContent = timeLeft;
                    
                    if (timeLeft <= 0) {
                        clearInterval(countdown);
                        closeAdBtn.classList.add('show');
                    }
                }, 1000);

                closeAdBtn.onclick = function() {
                    adModal.classList.remove('show');
                    processText(originalText, originalLength);
                };
            } else {
                processText(originalText, originalLength);
            }
        });

        function processText(originalText, originalLength) {
            // Compactar: remover espaços extras, linhas vazias, quebras desnecessárias
            var compactedText = originalText
                .replace(/\s+/g, ' ')  // Substituir múltiplos espaços por um único
                .replace(/\n\s*\n/g, '\n')  // Remover linhas vazias consecutivas
                .trim();  // Remover espaços no início e fim

            var compactedLength = compactedText.length;
            var reductionPercent = originalLength > 0 ? Math.round(((originalLength - compactedLength) / originalLength) * 100) : 0;

            charBefore.textContent = 'Caracteres originais: ' + originalLength;
            charAfter.textContent = 'Caracteres compactados: ' + compactedLength;
            reduction.textContent = 'Redução: ' + reductionPercent + '%';
            outputText.textContent = compactedText;

            result.classList.add('show');
        }

        // Copiar Texto
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(outputText.textContent).then(function() {
                alert('Texto compactado copiado para a área de transferência!');
            }).catch(function(err) {
                console.error('Erro ao copiar: ', err);
            });
        });
