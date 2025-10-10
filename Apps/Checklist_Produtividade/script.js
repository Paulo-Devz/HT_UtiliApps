// Estado da aplicação
        let tasks = [];
        let currentFilter = 'all';

        // Elementos DOM
        const taskInput = document.getElementById('taskInput');
        const addTaskForm = document.getElementById('addTaskForm');
        const tasksList = document.getElementById('tasksList');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const totalTasksEl = document.getElementById('totalTasks');
        const completedTasksEl = document.getElementById('completedTasks');
        const pendingTasksEl = document.getElementById('pendingTasks');
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');

        // Carregar tarefas do localStorage
        function loadTasks() {
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                tasks = JSON.parse(savedTasks);
            }
            renderTasks();
            updateStats();
        }

        // Salvar tarefas no localStorage
        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        // Adicionar nova tarefa
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const taskText = taskInput.value.trim();
            
            if (taskText) {
                const newTask = {
                    id: Date.now(),
                    text: taskText,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                
                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                updateStats();
                taskInput.value = '';
                taskInput.focus();
            }
        });

        // Alternar status da tarefa
        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveTasks();
                renderTasks();
                updateStats();
            }
        }

        // Deletar tarefa
        function deleteTask(id) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
        }

        // Renderizar tarefas
        function renderTasks() {
            const filteredTasks = tasks.filter(task => {
                if (currentFilter === 'completed') return task.completed;
                if (currentFilter === 'pending') return !task.completed;
                return true;
            });

            if (filteredTasks.length === 0) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                        </svg>
                        <h3>Nenhuma tarefa encontrada</h3>
                        <p>Adicione uma nova tarefa para começar!</p>
                    </div>
                `;
                return;
            }

            tasksList.innerHTML = filteredTasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="toggleTask(${task.id})"
                    >
                    <div class="task-text">${task.text}</div>
                    <div class="task-actions">
                        <button class="btn-delete" onclick="deleteTask(${task.id})">🗑️ Excluir</button>
                    </div>
                </div>
            `).join('');
        }

        // Atualizar estatísticas
        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            totalTasksEl.textContent = total;
            completedTasksEl.textContent = completed;
            pendingTasksEl.textContent = pending;
            progressFill.style.width = `${percentage}%`;
            progressPercent.textContent = `${percentage}%`;
        }

        // Filtros
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });

        // Inicializar
        loadTasks();