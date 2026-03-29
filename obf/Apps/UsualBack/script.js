 // Estado da aplicação
        let clients = [];
        let products = [];
        let clientFields = [];
        let editingClientId = null;
        let editingProductId = null;

        // Carregar dados do localStorage
        function loadData() {
            const savedClients = localStorage.getItem('clients');
            const savedProducts = localStorage.getItem('products');
            const savedClientFields = localStorage.getItem('clientFields');
            
            if (savedClients) clients = JSON.parse(savedClients);
            if (savedProducts) products = JSON.parse(savedProducts);
            if (savedClientFields) {
                clientFields = JSON.parse(savedClientFields);
            } else {
                // Sem campos padrão - usuário cria do zero
                clientFields = [];
            }
            
            renderClientFields();
            renderClients();
            renderProducts();
            updateStats();
        }

        // Salvar dados no localStorage
        function saveClients() {
            localStorage.setItem('clients', JSON.stringify(clients));
        }

        function saveProducts() {
            localStorage.setItem('products', JSON.stringify(products));
        }

        function saveClientFields() {
            localStorage.setItem('clientFields', JSON.stringify(clientFields));
        }

        // Adicionar campo personalizado
        function addClientField() {
            const fieldName = document.getElementById('newFieldName').value.trim();
            const fieldType = document.getElementById('newFieldType').value;

            if (!fieldName) {
                alert('Digite o nome do campo!');
                return;
            }

            const fieldId = Date.now().toString(); // ID único baseado em timestamp
            
            clientFields.push({
                id: fieldId,
                label: fieldName,
                type: fieldType,
                required: false
            });

            saveClientFields();
            renderClientFields();
            
            document.getElementById('newFieldName').value = '';
            document.getElementById('newFieldType').value = 'text';
        }

        // Remover campo personalizado
        function removeClientField(fieldId) {
            if (confirm('Deseja realmente remover este campo? Os dados deste campo serão perdidos em todos os clientes.')) {
                // Remover campo da lista
                clientFields = clientFields.filter(f => f.id !== fieldId);
                
                // Remover dados deste campo de todos os clientes
                clients = clients.map(client => {
                    const newClient = { ...client };
                    delete newClient[fieldId];
                    return newClient;
                });
                
                saveClientFields();
                saveClients();
                renderClientFields();
            }
        }

        // Renderizar campos dinâmicos
        function renderClientFields() {
            const container = document.getElementById('clientFieldsContainer');
            
            if (clientFields.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum campo criado ainda. Adicione campos acima para começar!</p>';
                return;
            }

            container.innerHTML = clientFields.map(field => {
                const isTextarea = field.type === 'textarea';
                const inputHtml = isTextarea 
                    ? `<textarea id="client_${field.id}" ${field.required ? 'required' : ''}></textarea>`
                    : `<input type="${field.type}" id="client_${field.id}" ${field.required ? 'required' : ''}>`;

                return `
                    <div class="form-group">
                        <div class="field-header">
                            <label>${field.label} ${field.required ? '*' : ''}</label>
                            <button type="button" class="btn-remove-field" onclick="removeClientField('${field.id}')">✕</button>
                        </div>
                        ${inputHtml}
                    </div>
                `;
            }).join('');

            // Atualizar também a tabela
            renderClients();
        }

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

        // Clients Form
        document.getElementById('clientForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Verificar se há campos criados
            if (clientFields.length === 0) {
                alert('Adicione pelo menos um campo antes de salvar um cliente!');
                return;
            }

            const clientData = {
                id: editingClientId || Date.now()
            };

            // Coletar dados de todos os campos dinâmicos
            clientFields.forEach(field => {
                const element = document.getElementById(`client_${field.id}`);
                clientData[field.id] = element ? element.value : '';
            });

            if (editingClientId) {
                const index = clients.findIndex(c => c.id === editingClientId);
                clients[index] = clientData;
                editingClientId = null;
            } else {
                clients.push(clientData);
            }

            saveClients();
            renderClients();
            updateStats();
            e.target.reset();
            
            alert('Cliente salvo com sucesso!');
        });

        // Products Form
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const productData = {
                id: editingProductId || Date.now(),
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                description: document.getElementById('productDescription').value
            };

            if (editingProductId) {
                const index = products.findIndex(p => p.id === editingProductId);
                products[index] = productData;
                editingProductId = null;
            } else {
                products.push(productData);
            }

            saveProducts();
            renderProducts();
            updateStats();
            e.target.reset();
        });

        // Render Clients
        function renderClients(filter = '') {
            const tbody = document.getElementById('clientsTable');
            const thead = document.getElementById('clientsTableHeader');
            
            // Filtrar clientes
            const filtered = clients.filter(c => {
                return clientFields.some(field => {
                    const value = c[field.id] || '';
                    return value.toString().toLowerCase().includes(filter.toLowerCase());
                });
            });

            // Criar cabeçalhos da tabela dinamicamente (TODOS os campos)
            thead.innerHTML = clientFields.map(field => 
                `<th>${field.label}</th>`
            ).join('') + '<th>Ações</th>';

            // Se não houver clientes
            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${clientFields.length + 1}"><div class="empty-state"><h3>Nenhum cliente cadastrado</h3></div></td></tr>`;
                return;
            }

            // Renderizar linhas da tabela com TODOS os campos
            tbody.innerHTML = filtered.map(client => `
                <tr>
                    ${clientFields.map((field, index) => {
                        const value = client[field.id] || '-';
                        // Primeiro campo em negrito
                        return index === 0 
                            ? `<td><strong>${value}</strong></td>`
                            : `<td>${value}</td>`;
                    }).join('')}
                    <td>
                        <button class="btn-action btn-edit" onclick="editClient(${client.id})">✏️ Editar</button>
                        <button class="btn-action btn-delete" onclick="deleteClient(${client.id})">🗑️ Excluir</button>
                    </td>
                </tr>
            `).join('');
        }

        // Render Products
        function renderProducts(filter = '') {
            const tbody = document.getElementById('productsTable');
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(filter.toLowerCase()) ||
                (p.category && p.category.toLowerCase().includes(filter.toLowerCase()))
            );

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><h3>Nenhum produto cadastrado</h3></div></td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(product => `
                <tr>
                    <td><strong>${product.name}</strong></td>
                    <td>${product.category || '-'}</td>
                    <td>R$ ${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editProduct(${product.id})">✏️ Editar</button>
                        <button class="btn-action btn-delete" onclick="deleteProduct(${product.id})">🗑️ Excluir</button>
                    </td>
                </tr>
            `).join('');
        }

        // Edit/Delete Functions
        function editClient(id) {
            const client = clients.find(c => c.id === id);
            if (client) {
                clientFields.forEach(field => {
                    const element = document.getElementById(`client_${field.id}`);
                    if (element) {
                        element.value = client[field.id] || '';
                    }
                });
                editingClientId = id;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function deleteClient(id) {
            if (confirm('Deseja realmente excluir este cliente?')) {
                clients = clients.filter(c => c.id !== id);
                saveClients();
                renderClients();
                updateStats();
            }
        }

        function editProduct(id) {
            const product = products.find(p => p.id === id);
            if (product) {
                document.getElementById('productName').value = product.name;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productDescription').value = product.description;
                editingProductId = id;
            }
        }

        function deleteProduct(id) {
            if (confirm('Deseja realmente excluir este produto?')) {
                products = products.filter(p => p.id !== id);
                saveProducts();
                renderProducts();
                updateStats();
            }
        }

        // Update Stats
        function updateStats() {
            document.getElementById('totalClients').textContent = clients.length;
            document.getElementById('totalProducts').textContent = products.length;
            document.getElementById('totalStock').textContent = products.reduce((sum, p) => sum + p.stock, 0);
        }

        // Search
        document.getElementById('searchClients').addEventListener('input', (e) => {
            renderClients(e.target.value);
        });

        document.getElementById('searchProducts').addEventListener('input', (e) => {
            renderProducts(e.target.value);
        });

        // Initialize
        loadData();