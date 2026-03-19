var nodes = [];
        var connections = [];
        var selectedNodeId = null;
        var connectMode = false;
        var firstNodeForConnection = null;
        var draggedNode = null;
        var offsetX = 0;
        var offsetY = 0;
        var nodeIdCounter = 0;

        var canvas = document.getElementById('canvas');
        var svgConnections = document.getElementById('svgConnections');
        var btnAddNode = document.getElementById('btnAddNode');
        var btnConnect = document.getElementById('btnConnect');
        var btnSave = document.getElementById('btnSave');
        var btnLoad = document.getElementById('btnLoad');
        var btnClear = document.getElementById('btnClear');
        var colorPicker = document.getElementById('colorPicker');

        function createNode(x, y, text, color) {
            var nodeId = 'node-' + nodeIdCounter++;
            
            var nodeDiv = document.createElement('div');
            nodeDiv.className = 'node';
            nodeDiv.id = nodeId;
            nodeDiv.style.left = x + 'px';
            nodeDiv.style.top = y + 'px';
            nodeDiv.style.background = color || '#667eea';

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'node-input';
            input.placeholder = 'Digite sua ideia...';
            input.value = text || '';

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteNode(nodeId);
            });

            nodeDiv.appendChild(input);
            nodeDiv.appendChild(deleteBtn);
            canvas.appendChild(nodeDiv);

            nodeDiv.addEventListener('mousedown', startDrag);
            nodeDiv.addEventListener('click', function(e) {
                if (connectMode) {
                    handleNodeClickForConnection(nodeId);
                    e.stopPropagation();
                }
            });

            nodes.push({
                id: nodeId,
                x: x,
                y: y,
                text: text || '',
                color: color || '#667eea',
                element: nodeDiv
            });

            return nodeId;
        }

        function startDrag(e) {
            if (connectMode) return;
            
            draggedNode = e.currentTarget;
            var rect = draggedNode.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            draggedNode.style.zIndex = 100;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        }

        function drag(e) {
            if (!draggedNode) return;
            
            var x = e.clientX - offsetX;
            var y = e.clientY - offsetY - 70;
            
            x = Math.max(0, Math.min(x, window.innerWidth - draggedNode.offsetWidth));
            y = Math.max(0, Math.min(y, window.innerHeight - 70 - draggedNode.offsetHeight));
            
            draggedNode.style.left = x + 'px';
            draggedNode.style.top = y + 'px';
            
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].element === draggedNode) {
                    nodes[i].x = x;
                    nodes[i].y = y;
                    break;
                }
            }
            
            updateConnections();
        }

        function stopDrag() {
            if (draggedNode) {
                draggedNode.style.zIndex = 10;
                draggedNode = null;
            }
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }

        function deleteNode(nodeId) {
            var nodeElement = document.getElementById(nodeId);
            if (nodeElement) {
                nodeElement.remove();
            }
            
            nodes = nodes.filter(function(node) {
                return node.id !== nodeId;
            });
            
            connections = connections.filter(function(conn) {
                return conn.from !== nodeId && conn.to !== nodeId;
            });
            
            updateConnections();
        }

        function handleNodeClickForConnection(nodeId) {
            if (!firstNodeForConnection) {
                firstNodeForConnection = nodeId;
                document.getElementById(nodeId).classList.add('selected');
            } else {
                if (firstNodeForConnection !== nodeId) {
                    createConnection(firstNodeForConnection, nodeId);
                }
                document.getElementById(firstNodeForConnection).classList.remove('selected');
                firstNodeForConnection = null;
                connectMode = false;
                btnConnect.textContent = '🔗 Conectar Ideias';
            }
        }

        function createConnection(fromId, toId) {
            var exists = false;
            for (var i = 0; i < connections.length; i++) {
                if ((connections[i].from === fromId && connections[i].to === toId) ||
                    (connections[i].from === toId && connections[i].to === fromId)) {
                    exists = true;
                    break;
                }
            }
            
            if (!exists) {
                connections.push({ from: fromId, to: toId });
                updateConnections();
            }
        }

        function updateConnections() {
            svgConnections.innerHTML = '';
            
            for (var i = 0; i < connections.length; i++) {
                var conn = connections[i];
                var fromNode = null;
                var toNode = null;
                
                for (var j = 0; j < nodes.length; j++) {
                    if (nodes[j].id === conn.from) fromNode = nodes[j];
                    if (nodes[j].id === conn.to) toNode = nodes[j];
                }
                
                if (fromNode && toNode) {
                    var fromEl = fromNode.element;
                    var toEl = toNode.element;
                    
                    var x1 = fromNode.x + fromEl.offsetWidth / 2;
                    var y1 = fromNode.y + fromEl.offsetHeight / 2;
                    var x2 = toNode.x + toEl.offsetWidth / 2;
                    var y2 = toNode.y + toEl.offsetHeight / 2;
                    
                    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', '#999');
                    line.setAttribute('stroke-width', '2');
                    
                    svgConnections.appendChild(line);
                }
            }
        }

        btnAddNode.addEventListener('click', function() {
            var x = Math.random() * (window.innerWidth - 200) + 50;
            var y = Math.random() * (window.innerHeight - 200) + 50;
            var color = colorPicker.value;
            createNode(x, y, '', color);
        });

        btnConnect.addEventListener('click', function() {
            connectMode = !connectMode;
            if (connectMode) {
                btnConnect.textContent = '🔗 Modo Conexão (Ativo)';
                btnConnect.style.background = '#4CAF50';
            } else {
                btnConnect.textContent = '🔗 Conectar Ideias';
                btnConnect.style.background = '';
                if (firstNodeForConnection) {
                    document.getElementById(firstNodeForConnection).classList.remove('selected');
                    firstNodeForConnection = null;
                }
            }
        });

        btnSave.addEventListener('click', function() {
            var data = {
                nodes: [],
                connections: connections
            };
            
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var input = node.element.querySelector('.node-input');
                data.nodes.push({
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    text: input.value,
                    color: node.color
                });
            }
            
            localStorage.setItem('mentalMap', JSON.stringify(data));
            alert('Mapa salvo com sucesso!');
        });

        btnLoad.addEventListener('click', function() {
            var saved = localStorage.getItem('mentalMap');
            if (saved) {
                var data = JSON.parse(saved);
                
                canvas.innerHTML = '';
                nodes = [];
                connections = data.connections || [];
                nodeIdCounter = 0;
                
                for (var i = 0; i < data.nodes.length; i++) {
                    var node = data.nodes[i];
                    createNode(node.x, node.y, node.text, node.color);
                }
                
                updateConnections();
                alert('Mapa carregado com sucesso!');
            } else {
                alert('Nenhum mapa salvo encontrado!');
            }
        });

        btnClear.addEventListener('click', function() {
            if (confirm('Tem certeza que deseja limpar todo o mapa?')) {
                canvas.innerHTML = '';
                nodes = [];
                connections = [];
                nodeIdCounter = 0;
                updateConnections();
            }
        });

        window.addEventListener('resize', updateConnections);

        var btnExport = document.getElementById('btnExport');

        btnExport.addEventListener('click', function() {
                const exportDiv = document.createElement('div');
                exportDiv.style.position = 'absolute';
                exportDiv.style.left = '0';
                exportDiv.style.top = '0';
                exportDiv.style.width = window.innerWidth + 'px';
                exportDiv.style.height = (window.innerHeight - 70) + 'px';
                exportDiv.style.background = '#ffffff';
                exportDiv.style.paddingTop = '70px';
                
                // Cria um container relativo pra alinhar tudo
                const container = document.createElement('div');
                container.style.position = 'relative';
                container.style.width = '100%';
                container.style.height = '100%';
                
                // Clona os nós e transforma inputs em divs
                nodes.forEach(node => {
                    const nodeClone = node.element.cloneNode(true);
                    nodeClone.style.position = 'absolute';
                    nodeClone.style.zIndex = '10';

                    const input = nodeClone.querySelector('.node-input');
                    if (input) {
                        const textDiv = document.createElement('div');
                        textDiv.textContent = input.value || '';
                        textDiv.style.color = 'white';
                        textDiv.style.fontSize = '14px';
                        textDiv.style.fontWeight = '600';
                        textDiv.style.textAlign = 'center';
                        textDiv.style.wordWrap = 'break-word';
                        textDiv.style.padding = '5px';
                        input.replaceWith(textDiv);
                    }

                    const delBtn = nodeClone.querySelector('.delete-btn');
                    if (delBtn) delBtn.remove();

                    container.appendChild(nodeClone);
                });

                // Desenha as conexões em SVG dentro do container
                const svgClone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgClone.setAttribute('width', '100%');
                svgClone.setAttribute('height', '100%');
                svgClone.style.position = 'absolute';
                svgClone.style.top = '0';
                svgClone.style.left = '0';
                
                connections.forEach(conn => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    if (fromNode && toNode) {
                        const x1 = fromNode.x + fromNode.element.offsetWidth / 2;
                        const y1 = fromNode.y + fromNode.element.offsetHeight / 2;
                        const x2 = toNode.x + toNode.element.offsetWidth / 2;
                        const y2 = toNode.y + toNode.element.offsetHeight / 2;

                        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
                        line.setAttribute('x1', x1);
                        line.setAttribute('y1', y1);
                        line.setAttribute('x2', x2);
                        line.setAttribute('y2', y2);
                        line.setAttribute('stroke', '#999');
                        line.setAttribute('stroke-width', '2');

                        svgClone.appendChild(line);
                    }
                });

                container.appendChild(svgClone);
                exportDiv.appendChild(container);
                document.body.appendChild(exportDiv);

                html2canvas(exportDiv, {backgroundColor: '#ffffff', scale: 2, useCORS: true}).then(canvas => {
                    const link = document.createElement('a');
                    link.download = 'mapa_mental.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    exportDiv.remove();
                });
        });
