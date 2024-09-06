let tasks = [];
let view = 'todo';
let effectiveness = 0;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupEventListeners();
    renderTasks();
});

function setupEventListeners() {
    document.getElementById('addTask').addEventListener('click', addTask);
    document.getElementById('todoView').addEventListener('click', () => setView('todo'));
    document.getElementById('kanbanView').addEventListener('click', () => setView('kanban'));
    document.getElementById('tableView').addEventListener('click', () => setView('table'));
    document.getElementById('calendarView').addEventListener('click', () => setView('calendar'));
}

function addTask() {
    const title = document.getElementById('taskTitle').value;
    const estimatedTime = parseInt(document.getElementById('estimatedTime').value);
    const startTime = parseInt(document.getElementById('startTime').value);
    const startPeriod = document.getElementById('startPeriod').value;
    const priority = document.getElementById('priority').checked;

    if (!title) return;

    const startHour = startPeriod === 'PM' && startTime !== 12 
        ? startTime + 12 
        : startTime === 12 && startPeriod === 'AM' ? 0 : startTime;

    tasks.push({
        id: Date.now(),
        title,
        estimatedTime,
        startTime: startHour,
        priority,
        completed: false,
        day: 0,
        moveCount: 0
    });

    resetForm();
    renderTasks();
}

function resetForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('estimatedTime').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('startPeriod').value = 'AM';
    document.getElementById('priority').checked = false;
}

function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
}

function updateTaskTime(id, day, startTime) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const newMoveCount = task.moveCount + 1;
            if (newMoveCount > 30) {
                showAlert();
                return task;
            }
            return { ...task, day, startTime, moveCount: newMoveCount };
        }
        return task;
    });
    renderTasks();
}

function showAlert() {
    const alert = document.getElementById('alert');
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 3000);
}

function calculateEffectiveness() {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    effectiveness = total > 0 ? (completed / total) * 100 : 0;
    document.getElementById('effectiveness').textContent = `Effectiveness: ${effectiveness.toFixed(2)}%`;
}

function setView(newView) {
    view = newView;
    document.querySelectorAll('.btn-view').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${newView}View`).classList.add('active');
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('taskContainer');
    container.innerHTML = '';

    calculateEffectiveness();

    switch (view) {
        case 'todo':
            container.appendChild(renderTodoView());
            break;
        case 'kanban':
            container.appendChild(renderKanbanView());
            break;
        case 'table':
            container.appendChild(renderTableView());
            break;
        case 'calendar':
            container.appendChild(renderCalendarView());
            break;
    }
    
    // Recreate Lucide icons after rendering
    lucide.createIcons();
}

function createDeleteButton(taskId) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i data-lucide="x"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(taskId);
    });
    return deleteBtn;
}

function renderTodoView() {
    const div = document.createElement('div');
    div.className = 'todo-container';

    tasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.priority ? 'priority' : ''}`;
        taskDiv.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-title ${task.completed ? 'line-through' : ''}">${task.title}</span>
            <span class="task-time">
                (${task.estimatedTime}h, starts at ${task.startTime % 12 || 12}:00 ${task.startTime < 12 ? 'AM' : 'PM'})
            </span>
        `;

        taskDiv.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
        taskDiv.appendChild(createDeleteButton(task.id));

        div.appendChild(taskDiv);
    });

    return div;
}

function renderKanbanView() {
    const div = document.createElement('div');
    div.className = 'kanban-container';

    ['To Do', 'Done'].forEach(status => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.innerHTML = `<h3>${status}</h3>`;

        const filteredTasks = tasks.filter(task => task.completed === (status === 'Done'));

        filteredTasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = `kanban-task ${task.priority ? 'priority' : ''}`;
            taskDiv.draggable = true;
            taskDiv.innerHTML = `
                <span>${task.title} (Starts at ${task.startTime % 12 || 12}:00 ${task.startTime < 12 ? 'AM' : 'PM'})</span>
            `;

            taskDiv.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', task.id));
            taskDiv.appendChild(createDeleteButton(task.id));

            column.appendChild(taskDiv);
        });

        column.addEventListener('dragover', (e) => e.preventDefault());
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = parseInt(e.dataTransfer.getData('text'));
            toggleTask(id);
        });

        div.appendChild(column);
    });

    return div;
}

function renderTableView() {
    const table = document.createElement('table');
    table.className = 'task-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Est. Time</th>
                <th>Start Time</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Task">${task.title}</td>
            <td data-label="Priority">${task.priority ? 'High' : 'Normal'}</td>
            <td data-label="Est. Time">${task.estimatedTime}h</td>
            <td data-label="Start Time">${task.startTime % 12 || 12}:00 ${task.startTime < 12 ? 'AM' : 'PM'}</td>
            <td data-label="Status">${task.completed ? 'Done' : 'Pending'}</td>
            <td data-label="Actions"></td>
        `;

        tr.querySelector('td[data-label="Actions"]').appendChild(createDeleteButton(task.id));

        tbody.appendChild(tr);
    });

    return table;
}

function renderCalendarView() {
    const div = document.createElement('div');
    div.className = 'calendar-container';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    div.innerHTML = '<div class="calendar-header"></div>' + days.map(day => `<div class="calendar-header">${day}</div>`).join('');

    for (let hour = 0; hour < 24; hour++) {
        const hourDiv = document.createElement('div');
        hourDiv.className = 'calendar-time';
        hourDiv.textContent = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
        div.appendChild(hourDiv);

        for (let day = 0; day < 7; day++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'calendar-cell';

            cellDiv.addEventListener('dragover', (e) => e.preventDefault());
            cellDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                const id = parseInt(e.dataTransfer.getData('text'));
                updateTaskTime(id, day, hour);
            });

            const cellTasks = tasks.filter(task => task.startTime === hour && task.day === day);

            cellTasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = `calendar-task ${task.priority ? 'priority' : ''}`;
                taskDiv.draggable = true;
                taskDiv.textContent = task.title;

                taskDiv.appendChild(createDeleteButton(task.id));

                taskDiv.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', task.id));

                cellDiv.appendChild(taskDiv);
            });

            div.appendChild(cellDiv);
        }
    }

    return div;
}

// Initialize the view
setView('todo');