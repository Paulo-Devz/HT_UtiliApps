// Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });

        // Formatação de moeda
        function formatarMoeda(valor) {
            return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        // Juros Simples
        function calcularJurosSimples() {
            const capital = parseFloat(document.getElementById('js-capital').value);
            const taxa = parseFloat(document.getElementById('js-taxa').value) / 100;
            const tempo = parseInt(document.getElementById('js-tempo').value);

            if (!capital || !taxa || !tempo) {
                alert('Preencha todos os campos!');
                return;
            }

            const juros = capital * taxa * tempo;
            const montante = capital + juros;

            const resultsDiv = document.getElementById('js-results');
            resultsDiv.innerHTML = `
                <h3>📊 Resultados - Juros Simples</h3>
                <div class="result-item">
                    <div class="result-label">Montante Final</div>
                    <div class="result-value">${formatarMoeda(montante)}</div>
                    <div class="result-description">Valor total após ${tempo} meses</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Juros Acumulados</div>
                    <div class="result-value">${formatarMoeda(juros)}</div>
                    <div class="result-description">Total de juros pagos</div>
                </div>
                <div class="summary-box">
                    <h4>📝 Resumo</h4>
                    <p>
                        Com um capital inicial de <strong>${formatarMoeda(capital)}</strong>, 
                        aplicando uma taxa de <strong>${(taxa * 100).toFixed(2)}%</strong> ao mês 
                        durante <strong>${tempo} meses</strong>, você terá um montante final de 
                        <strong>${formatarMoeda(montante)}</strong>, com juros de 
                        <strong>${formatarMoeda(juros)}</strong>.
                    </p>
                </div>
            `;
            resultsDiv.classList.add('show');
        }

        function resetarJurosSimples() {
            document.getElementById('js-capital').value = '';
            document.getElementById('js-taxa').value = '';
            document.getElementById('js-tempo').value = '';
            document.getElementById('js-results').classList.remove('show');
        }

        // Juros Compostos
        function calcularJurosCompostos() {
            const capital = parseFloat(document.getElementById('jc-capital').value);
            const taxa = parseFloat(document.getElementById('jc-taxa').value) / 100;
            const tempo = parseInt(document.getElementById('jc-tempo').value);

            if (!capital || !taxa || !tempo) {
                alert('Preencha todos os campos!');
                return;
            }

            const montante = capital * Math.pow(1 + taxa, tempo);
            const juros = montante - capital;

            const resultsDiv = document.getElementById('jc-results');
            resultsDiv.innerHTML = `
                <h3>📊 Resultados - Juros Compostos</h3>
                <div class="result-item">
                    <div class="result-label">Montante Final</div>
                    <div class="result-value">${formatarMoeda(montante)}</div>
                    <div class="result-description">Valor total após ${tempo} meses</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Juros Acumulados</div>
                    <div class="result-value">${formatarMoeda(juros)}</div>
                    <div class="result-description">Rendimento total obtido</div>
                </div>
                <div class="summary-box">
                    <h4>📝 Resumo</h4>
                    <p>
                        Investindo <strong>${formatarMoeda(capital)}</strong> a uma taxa de 
                        <strong>${(taxa * 100).toFixed(2)}%</strong> ao mês durante 
                        <strong>${tempo} meses</strong>, seu investimento crescerá para 
                        <strong>${formatarMoeda(montante)}</strong>, rendendo 
                        <strong>${formatarMoeda(juros)}</strong> em juros compostos.
                    </p>
                </div>
            `;
            resultsDiv.classList.add('show');
        }

        function resetarJurosCompostos() {
            document.getElementById('jc-capital').value = '';
            document.getElementById('jc-taxa').value = '';
            document.getElementById('jc-tempo').value = '';
            document.getElementById('jc-results').classList.remove('show');
        }

        // Parcelamento
        function calcularParcelamento() {
            const valor = parseFloat(document.getElementById('parc-valor').value);
            const taxa = parseFloat(document.getElementById('parc-taxa').value) / 100;
            const parcelas = parseInt(document.getElementById('parc-parcelas').value);

            if (!valor || !taxa || !parcelas) {
                alert('Preencha todos os campos!');
                return;
            }

            const valorParcela = (valor * taxa * Math.pow(1 + taxa, parcelas)) / (Math.pow(1 + taxa, parcelas) - 1);
            const totalPagar = valorParcela * parcelas;
            const jurosTotal = totalPagar - valor;

            let parcelasList = '';
            for (let i = 1; i <= parcelas; i++) {
                parcelasList += `
                    <div class="parcela-item">
                        <span class="parcela-numero">Parcela ${i}</span>
                        <span class="parcela-valor">${formatarMoeda(valorParcela)}</span>
                    </div>
                `;
            }

            const resultsDiv = document.getElementById('parc-results');
            resultsDiv.innerHTML = `
                <h3>📊 Resultados - Parcelamento</h3>
                <div class="result-item">
                    <div class="result-label">Valor de Cada Parcela</div>
                    <div class="result-value">${formatarMoeda(valorParcela)}</div>
                    <div class="result-description">${parcelas}x de ${formatarMoeda(valorParcela)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total a Pagar</div>
                    <div class="result-value">${formatarMoeda(totalPagar)}</div>
                    <div class="result-description">Juros de ${formatarMoeda(jurosTotal)}</div>
                </div>
                <div class="summary-box">
                    <h4>📝 Resumo</h4>
                    <p>
                        Um valor de <strong>${formatarMoeda(valor)}</strong> parcelado em 
                        <strong>${parcelas}x</strong> com juros de <strong>${(taxa * 100).toFixed(2)}%</strong> 
                        ao mês resulta em parcelas de <strong>${formatarMoeda(valorParcela)}</strong>, 
                        totalizando <strong>${formatarMoeda(totalPagar)}</strong>.
                    </p>
                </div>
                <div class="parcelas-list">
                    ${parcelasList}
                </div>
            `;
            resultsDiv.classList.add('show');
        }

        function resetarParcelamento() {
            document.getElementById('parc-valor').value = '';
            document.getElementById('parc-taxa').value = '';
            document.getElementById('parc-parcelas').value = '';
            document.getElementById('parc-results').classList.remove('show');
        }

        // Investimento
        function calcularInvestimento() {
            const capital = parseFloat(document.getElementById('inv-capital').value);
            const aporte = parseFloat(document.getElementById('inv-aporte').value);
            const taxa = parseFloat(document.getElementById('inv-taxa').value) / 100;
            const tempo = parseInt(document.getElementById('inv-tempo').value);

            if (capital === undefined || aporte === undefined || !taxa || !tempo) {
                alert('Preencha todos os campos!');
                return;
            }

            let montante = capital;
            let totalAportado = capital;

            for (let i = 1; i <= tempo; i++) {
                montante = montante * (1 + taxa) + aporte;
                totalAportado += aporte;
            }

            const rendimento = montante - totalAportado;

            const resultsDiv = document.getElementById('inv-results');
            resultsDiv.innerHTML = `
                <h3>📊 Resultados - Investimento</h3>
                <div class="result-item">
                    <div class="result-label">Montante Final</div>
                    <div class="result-value">${formatarMoeda(montante)}</div>
                    <div class="result-description">Valor total acumulado</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total Investido</div>
                    <div class="result-value">${formatarMoeda(totalAportado)}</div>
                    <div class="result-description">Capital + Aportes mensais</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Rendimento Obtido</div>
                    <div class="result-value">${formatarMoeda(rendimento)}</div>
                    <div class="result-description">Lucro com juros compostos</div>
                </div>
                <div class="summary-box">
                    <h4>📝 Resumo</h4>
                    <p>
                        Começando com <strong>${formatarMoeda(capital)}</strong> e fazendo aportes 
                        mensais de <strong>${formatarMoeda(aporte)}</strong> durante 
                        <strong>${tempo} meses</strong> a uma taxa de <strong>${(taxa * 100).toFixed(2)}%</strong> 
                        ao mês, você investirá <strong>${formatarMoeda(totalAportado)}</strong> e 
                        terá <strong>${formatarMoeda(montante)}</strong>, com rendimento de 
                        <strong>${formatarMoeda(rendimento)}</strong>.
                    </p>
                </div>
            `;
            resultsDiv.classList.add('show');
        }

        function resetarInvestimento() {
            document.getElementById('inv-capital').value = '';
            document.getElementById('inv-aporte').value = '';
            document.getElementById('inv-taxa').value = '';
            document.getElementById('inv-tempo').value = '';
            document.getElementById('inv-results').classList.remove('show');
        }