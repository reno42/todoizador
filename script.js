let tasks = [];
let view = 'todo';
let effectiveness = 0;
let timerEndTime;
let timerRunning = false;
let currentTaskId = null;
let classifierEnabled = false;
let madrugadaEnabled = true; // New state variable for the "madrugada" switch

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupEventListeners();
    loadTasks(); // Load tasks from localStorage
    loadMadrugadaEnabled(); // Load "madrugada" switch state
    renderTasks();
});

function setupEventListeners() {
    document.getElementById('addTask').addEventListener('click', addTask);
    document.getElementById('todoView').addEventListener('click', () => setView('todo'));
    document.getElementById('kanbanView').addEventListener('click', () => setView('kanban'));
    document.getElementById('tableView').addEventListener('click', () => setView('table'));
    document.getElementById('calendarView').addEventListener('click', () => setView('calendar'));
    document.getElementById('startTimer').addEventListener('click', startTimer);
    document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
    document.getElementById('resetTimer').addEventListener('click', resetTimer);
}

function addTask() {
    const title = document.getElementById('taskTitle').value;
    const estimatedTime = parseInt(document.getElementById('estimatedTime').value);
    const startTime = parseInt(document.getElementById('startTime').value);
    const startPeriod = document.getElementById('startPeriod').value;
    const priority = document.getElementById('priority').checked;
    const day = parseInt(document.getElementById('taskDay').value);

    if (!title || !estimatedTime || estimatedTime > 90) return;

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
        day,
        moveCount: 0
    });

    saveTasks(); // Save tasks to localStorage
    resetForm();
    renderTasks();
}

function resetForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('estimatedTime').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('startPeriod').value = 'AM';
    document.getElementById('priority').checked = false;
    document.getElementById('taskDay').value = '0';
}

function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(); // Save tasks to localStorage
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks(); // Save tasks to localStorage
    renderTasks();
}

function editTask(id, newTitle, newEstimatedTime, newStartTime, newPriority, newDay) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                title: newTitle,
                estimatedTime: newEstimatedTime,
                startTime: newStartTime,
                priority: newPriority,
                day: newDay
            };
        }
        return task;
    });
    saveTasks(); // Save tasks to localStorage
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
    saveTasks(); // Save tasks to localStorage
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
    saveView(); // Save current view to localStorage
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
    
    lucide.createIcons();
}

function createActionButton(task) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'action-btn';
    actionBtn.innerHTML = '<i data-lucide="more-vertical"></i>';
    
    const dropdown = document.createElement('div');
    dropdown.className = 'action-dropdown hidden';
    dropdown.innerHTML = `
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    `;
    
    actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });
    
    dropdown.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showEditModal(task);
    });
    
    dropdown.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    const wrapper = document.createElement('div');
    wrapper.className = 'action-wrapper';
    wrapper.appendChild(actionBtn);
    wrapper.appendChild(dropdown);
    
    return wrapper;
}

function showEditModal(task) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <h2>Edit Task</h2>
        <input type="text" id="editTitle" value="${task.title}">
        <input type="number" id="editEstimatedTime" value="${task.estimatedTime}">
        <input type="number" id="editStartTime" value="${task.startTime % 12 || 12}">
        <select id="editStartPeriod">
            <option value="AM" ${task.startTime < 12 ? 'selected' : ''}>AM</option>
            <option value="PM" ${task.startTime >= 12 ? 'selected' : ''}>PM</option>
        </select>
        <select id="editDay">
            ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => 
                `<option value="${index}" ${task.day === index ? 'selected' : ''}>${day}</option>`
            ).join('')}
        </select>
        <label>
            <input type="checkbox" id="editPriority" ${task.priority ? 'checked' : ''}>
            Priority
        </label>
        <button id="saveEdit">Save</button>
        <button id="cancelEdit">Cancel</button>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('saveEdit').addEventListener('click', () => {
        const newTitle = document.getElementById('editTitle').value;
        const newEstimatedTime = parseInt(document.getElementById('editEstimatedTime').value);
        const newStartTime = parseInt(document.getElementById('editStartTime').value);
        const newStartPeriod = document.getElementById('editStartPeriod').value;
        const newPriority = document.getElementById('editPriority').checked;
        const newDay = parseInt(document.getElementById('editDay').value);
        
        const newStartHour = newStartPeriod === 'PM' && newStartTime !== 12 
            ? newStartTime + 12 
            : newStartTime === 12 && newStartPeriod === 'AM' ? 0 : newStartTime;
        
        editTask(task.id, newTitle, newEstimatedTime, newStartHour, newPriority, newDay);
        document.body.removeChild(modal);
    });
    
    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function createStartTimerButton(task) {
    const startTimerBtn = document.createElement('button');
    startTimerBtn.className = 'start-timer-btn';
    startTimerBtn.textContent = 'Start Timer';
    startTimerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startTaskTimer(task);
    });
    return startTimerBtn;
}

function renderTodoView() {
    const div = document.createElement('div');
    div.className = 'todo-container';

    const classifierSwitch = document.createElement('label');
    classifierSwitch.className = 'switch';
    classifierSwitch.innerHTML = `
        <input type="checkbox" id="classifierToggle" ${classifierEnabled ? 'checked' : ''}>
        <span class="slider round"></span>
        <span class="switch-label">Clasificador</span>
    `;
    classifierSwitch.querySelector('input').addEventListener('change', (e) => {
        classifierEnabled = e.target.checked;
        saveClassifierEnabled(); // Save classifier state to localStorage
        renderTasks();
    });
    div.appendChild(classifierSwitch);

    if (classifierEnabled) {
        const importantTasks = document.createElement('div');
        importantTasks.className = 'task-section';
        importantTasks.innerHTML = '<h2>Lo más importante del día</h2>';

        const optionalTasks = document.createElement('div');
        optionalTasks.className = 'task-section';
        optionalTasks.innerHTML = '<h2>Todo bien si no lo hago, si logro mis metas, puedo hacer esto</h2>';

        tasks.forEach(task => {
            const taskDiv = createTaskElement(task);
            if (task.estimatedTime >= 45) {
                importantTasks.appendChild(taskDiv);
            } else {
                optionalTasks.appendChild(taskDiv);
            }
        });

        div.appendChild(importantTasks);
        div.appendChild(optionalTasks);
    } else {
        const taskList = document.createElement('div');
        taskList.className = 'task-list';
        tasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
        div.appendChild(taskList);
    }

    return div;
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.priority ? 'priority' : ''}`;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    taskDiv.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-title ${task.completed ? 'line-through' : ''}">${task.title}</span>
        <span class="task-time">
            (${task.estimatedTime}m, starts at ${task.startTime % 12 || 12}:00 ${task.startTime < 12 ? 'AM' : 'PM'}, ${days[task.day]})
        </span>
    `;

    taskDiv.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
    taskDiv.appendChild(createStartTimerButton(task));
    taskDiv.appendChild(createActionButton(task));

    return taskDiv;
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
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            taskDiv.innerHTML = `
                <span>${task.title} (${task.estimatedTime}m, Starts at ${task.startTime % 12 || 12}:00 ${task.startTime < 12 ? 'AM' : 'PM'}, ${days[task.day]})</span>
            `;

            taskDiv.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', task.id));
            taskDiv.appendChild(createStartTimerButton(task));
            taskDiv.appendChild(createActionButton(task));

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
                <th>Day</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Task">${task.title}</td>
            <td data-label="Priority">${task.priority ? 'High' : 'Normal'}</td>
            <td data-label="Est. Time">${task.estimatedTime}m</td>
            <td data-label="Start Time">${task.startTime % 12 || 12}:00 ${task.startTime < 12 ? 'AM' : 'PM'}</td>
            <td data-label="Day">${days[task.day]}</td>
            <td data-label="Status">${task.completed ? 'Done' : 'Pending'}</td>
            <td data-label="Actions"></td>
        `;

        const actionsCell = tr.querySelector('td[data-label="Actions"]');
        actionsCell.appendChild(createStartTimerButton(task));
        actionsCell.appendChild(createActionButton(task));

        tbody.appendChild(tr);
    });

    return table;
}

function renderCalendarView() {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'calendar-view-container';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'calendar-buttons';

    const downloadPDFButton = document.createElement('button');
    downloadPDFButton.className = 'calendar-action-btn';
    downloadPDFButton.innerHTML = '<i data-lucide="file-down"></i>';
    downloadPDFButton.title = 'Download as PDF';
    downloadPDFButton.addEventListener('click', downloadAsPDF);

    const printButton = document.createElement('button');
    printButton.className = 'calendar-action-btn';
    printButton.innerHTML = '<i data-lucide="printer"></i>';
    printButton.title = 'Print';
    printButton.addEventListener('click', printCalendar);

    // Add "madrugada" switch
    const madrugadaSwitch = document.createElement('label');
    madrugadaSwitch.className = 'switch';
    madrugadaSwitch.innerHTML = `
        <input type="checkbox" id="madrugadaToggle" ${madrugadaEnabled ? 'checked' : ''}>
        <span class="slider round"></span>
        <span class="switch-label">Madrugada</span>
    `;
    madrugadaSwitch.querySelector('input').addEventListener('change', (e) => {
        madrugadaEnabled = e.target.checked;
        saveMadrugadaEnabled(); // Save "madrugada" switch state
        renderTasks();
    });

    buttonsDiv.appendChild(downloadPDFButton);
    buttonsDiv.appendChild(printButton);
    buttonsDiv.appendChild(madrugadaSwitch);

    containerDiv.appendChild(buttonsDiv);

    const calendarDiv = document.createElement('div');
    calendarDiv.className = 'calendar-container';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    calendarDiv.innerHTML = '<div class="calendar-header"></div>' + days.map(day => `<div class="calendar-header">${day}</div>`).join('');

    for (let hour = 0; hour < 24; hour++) {
        // Skip early morning hours if madrugadaEnabled is false
        if (!madrugadaEnabled && hour >= 0 && hour < 6) {
            continue;
        }

        const hourDiv = document.createElement('div');
        hourDiv.className = 'calendar-time';
        hourDiv.textContent = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
        calendarDiv.appendChild(hourDiv);

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
                taskDiv.textContent = `${task.title} (${task.estimatedTime}m)`;

                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'calendar-task-controls';
                controlsDiv.appendChild(createStartTimerButton(task));
                controlsDiv.appendChild(createActionButton(task));
                taskDiv.appendChild(controlsDiv);

                taskDiv.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', task.id));

                cellDiv.appendChild(taskDiv);
            });

            calendarDiv.appendChild(cellDiv);
        }
    }

    containerDiv.appendChild(calendarDiv);
    return containerDiv;
}

function downloadAsPDF() {
    const calendarContainer = document.querySelector('.calendar-view-container');
    
    // Temporarily hide the buttons
    const buttons = calendarContainer.querySelector('.calendar-buttons');
    buttons.style.display = 'none';

    html2canvas(calendarContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('calendar.pdf');

        // Show the buttons again
        buttons.style.display = 'flex';
    });
}

function printCalendar() {
    window.print();
}

function startTaskTimer(task) {
    document.getElementById('timerContainer').classList.remove('hidden');
    document.getElementById('currentTask').textContent = `Current Task: ${task.title}`;
    timerEndTime = new Date(Date.now() + task.estimatedTime * 60 * 1000);
    currentTaskId = task.id;
    updateTimerDisplay();
    startTimer();
}

function startTimer() {
    if (!timerRunning) {
        timerRunning = true;
        updateTimer();
    }
}

function updateTimer() {
    if (timerRunning) {
        const now = new Date();
        const remainingTime = timerEndTime - now;

        if (remainingTime <= 0) {
            timerRunning = false;
            playTimerSound();
            completeTask();
            updateTimerDisplay(0);
        } else {
            updateTimerDisplay(remainingTime);
            requestAnimationFrame(updateTimer);
        }
    }
}

function pauseTimer() {
    timerRunning = false;
}

function resetTimer() {
    timerRunning = false;
    timerEndTime = null;
    currentTaskId = null;
    updateTimerDisplay(0);
    document.getElementById('timerContainer').classList.add('hidden');
    document.getElementById('currentTask').textContent = '';
}

function updateTimerDisplay(remainingTime) {
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    document.getElementById('timerDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function playTimerSound() {
    const sound = document.getElementById('timerSound');
    sound.play();
}

function completeTask() {
    if (currentTaskId) {
        toggleTask(currentTaskId);
        currentTaskId = null;
    }
}

// New functions for data persistence
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

function saveView() {
    localStorage.setItem('view', view);
}

function loadView() {
    const savedView = localStorage.getItem('view');
    if (savedView) {
        view = savedView;
    }
}

function saveClassifierEnabled() {
    localStorage.setItem('classifierEnabled', JSON.stringify(classifierEnabled));
}

function loadClassifierEnabled() {
    const savedClassifierEnabled = localStorage.getItem('classifierEnabled');
    if (savedClassifierEnabled !== null) {
        classifierEnabled = JSON.parse(savedClassifierEnabled);
    }
}

// New functions for "madrugada" switch persistence
function saveMadrugadaEnabled() {
    localStorage.setItem('madrugadaEnabled', JSON.stringify(madrugadaEnabled));
}

function loadMadrugadaEnabled() {
    const savedMadrugadaEnabled = localStorage.setItem('madrugadaEnabled');
    if (savedMadrugadaEnabled !== null) {
        madrugadaEnabled = JSON.parse(savedMadrugadaEnabled);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadView();
    loadClassifierEnabled();
    loadMadrugadaEnabled();
    setView(view);
});