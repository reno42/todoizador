import React, { useState, useEffect } from 'react';
import { Calendar, Clock, List, Columns, Table, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ToDoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    priority: false, 
    estimatedTime: 1, 
    day: 0, 
    startTime: 9, 
    startPeriod: 'AM',
    moveCount: 0 
  });
  const [view, setView] = useState('todo');
  const [effectiveness, setEffectiveness] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    calculateEffectiveness();
  }, [tasks]);

  const addTask = () => {
    const startHour = newTask.startPeriod === 'PM' && newTask.startTime !== 12 
      ? newTask.startTime + 12 
      : newTask.startTime === 12 && newTask.startPeriod === 'AM' ? 0 : newTask.startTime;
    
    setTasks([...tasks, { ...newTask, id: Date.now(), completed: false, startTime: startHour }]);
    setNewTask({ 
      title: '', 
      priority: false, 
      estimatedTime: 1, 
      day: 0, 
      startTime: 9, 
      startPeriod: 'AM',
      moveCount: 0 
    });
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTaskTime = (id, day, startTime) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newMoveCount = task.moveCount + 1;
        if (newMoveCount > 30) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
          return task;
        }
        return { ...task, day, startTime, moveCount: newMoveCount };
      }
      return task;
    }));
  };

  const calculateEffectiveness = () => {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    setEffectiveness(total > 0 ? (completed / total) * 100 : 0);
  };

  const renderTodoView = () => (
    <div className="space-y-2">
      {tasks.map(task => (
        <div key={task.id} className={`flex items-center space-x-2 p-2 rounded ${task.priority ? 'bg-red-100' : 'bg-gray-100'}`}>
          <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
          <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
          <span className="text-sm text-gray-500">
            ({task.estimatedTime}h, starts at {task.startTime % 12 || 12}:00 {task.startTime < 12 ? 'AM' : 'PM'})
          </span>
          <button onClick={() => deleteTask(task.id)} className="ml-auto"><X size={16} /></button>
        </div>
      ))}
    </div>
  );

  const renderKanbanView = () => (
    <div className="flex space-x-4">
      {['To Do', 'Done'].map(status => (
        <div key={status} className="w-1/2 bg-gray-100 p-2 rounded">
          <h3 className="font-bold mb-2">{status}</h3>
          {tasks.filter(task => task.completed === (status === 'Done')).map(task => (
            <div 
              key={task.id} 
              className="bg-white p-2 mb-2 rounded shadow flex items-center cursor-move"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = parseInt(e.dataTransfer.getData('text'));
                toggleTask(id);
              }}
            >
              <span>{task.title} (Starts at {task.startTime % 12 || 12}:00 {task.startTime < 12 ? 'AM' : 'PM'})</span>
              <button onClick={() => deleteTask(task.id)} className="ml-auto"><X size={16} /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2">Task</th>
          <th className="p-2">Priority</th>
          <th className="p-2">Est. Time</th>
          <th className="p-2">Start Time</th>
          <th className="p-2">Status</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => (
          <tr key={task.id} className="border-b">
            <td className="p-2">{task.title}</td>
            <td className="p-2">{task.priority ? 'High' : 'Normal'}</td>
            <td className="p-2">{task.estimatedTime}h</td>
            <td className="p-2">{task.startTime % 12 || 12}:00 {task.startTime < 12 ? 'AM' : 'PM'}</td>
            <td className="p-2">{task.completed ? 'Done' : 'Pending'}</td>
            <td className="p-2">
              <button onClick={() => deleteTask(task.id)}><X size={16} /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCalendarView = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <div className="grid grid-cols-8 gap-1">
        <div className="col-span-1"></div>
        {days.map(day => (
          <div key={day} className="text-center font-bold">{day}</div>
        ))}
        {[...Array(24)].map((_, hour) => (
          <React.Fragment key={hour}>
            <div className="text-right pr-2 text-sm">{hour % 12 || 12}:00 {hour < 12 ? 'AM' : 'PM'}</div>
            {[...Array(7)].map((_, day) => (
              <div 
                key={day} 
                className="border h-12 relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = parseInt(e.dataTransfer.getData('text'));
                  updateTaskTime(id, day, hour);
                }}
              >
                {tasks.filter(task => task.startTime === hour && task.day === day).map(task => (
                  <div 
                    key={task.id} 
                    className={`absolute top-0 left-0 right-0 text-xs p-1 ${task.priority ? 'bg-red-200' : 'bg-blue-200'} cursor-move ${task.completed ? 'line-through' : ''}`}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                  >
                    {task.title}
                    <button onClick={() => deleteTask(task.id)} className="ml-1"><X size={12} /></button>
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Multi-view To-Do List</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
          placeholder="New task"
          className="border p-2 mr-2"
        />
        <input
          type="number"
          value={newTask.estimatedTime}
          onChange={(e) => setNewTask({...newTask, estimatedTime: Math.max(1, parseInt(e.target.value))})}
          min="1"
          placeholder="Est. time (hours)"
          className="border p-2 mr-2 w-32"
        />
        <div className="inline-block mr-2">
          <input
            type="number"
            value={newTask.startTime}
            onChange={(e) => setNewTask({...newTask, startTime: Math.min(12, Math.max(1, parseInt(e.target.value)))})}
            min="1"
            max="12"
            placeholder="Start time"
            className="border p-2 w-20"
          />
          <select
            value={newTask.startPeriod}
            onChange={(e) => setNewTask({...newTask, startPeriod: e.target.value})}
            className="border p-2"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        <label className="mr-2">
          <input
            type="checkbox"
            checked={newTask.priority}
            onChange={(e) => setNewTask({...newTask, priority: e.target.checked})}
            className="mr-1"
          />
          Priority
        </label>
        <button onClick={addTask} className="bg-blue-500 text-white px-4 py-2 rounded">Add Task</button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button onClick={() => setView('todo')} className={`p-2 ${view === 'todo' ? 'bg-gray-200' : ''}`}><List size={20} /></button>
        <button onClick={() => setView('kanban')} className={`p-2 ${view === 'kanban' ? 'bg-gray-200' : ''}`}><Columns size={20} /></button>
        <button onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'bg-gray-200' : ''}`}><Table size={20} /></button>
        <button onClick={() => setView('calendar')} className={`p-2 ${view === 'calendar' ? 'bg-gray-200' : ''}`}><Calendar size={20} /></button>
      </div>

      <div className="mb-4">
        Effectiveness: {effectiveness.toFixed(2)}%
      </div>

      {showAlert && (
        <Alert className="mb-4">
          <AlertTitle>¡Atención!</AlertTitle>
          <AlertDescription>
            Estás muy indeciso con esta tarea. Espero que puedas darle solución.
          </AlertDescription>
        </Alert>
      )}

      {view === 'todo' && renderTodoView()}
      {view === 'kanban' && renderKanbanView()}
      {view === 'table' && renderTableView()}
      {view === 'calendar' && renderCalendarView()}
    </div>
  );
};

export default ToDoApp;
