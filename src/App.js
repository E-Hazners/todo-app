import React, { useState, useEffect } from 'react';
import './App.css';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faSave,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';

function App() {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    const [newTask, setNewTask] = useState('');
    const [showAll, setShowAll] = useState(true);
    const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [theme, setTheme] = useState('light');
    const [taskPriority, setTaskPriority] = useState('Medium'); // Default priority
    const [taskDueDate, setTaskDueDate] = useState(''); // Due date state
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTaskPriority, setEditTaskPriority] = useState('Medium');
    const [editTaskDueDate, setEditTaskDueDate] = useState('');
    // Load from localStorage
    useEffect(() => {
        const storedCategories = JSON.parse(localStorage.getItem('categories'));
        const storedTheme = localStorage.getItem('theme') || 'light';
        if (storedCategories) {
            setCategories(storedCategories);
        } else {
            setCategories([
                { name: 'Home Tasks', tasks: [] },
                { name: 'School Tasks', tasks: [] },
                { name: 'Projects', tasks: [] },
            ]);
        }
        setTheme(storedTheme);
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('theme', theme);
    }, [categories, theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const addCategory = () => {
        if (newCategory.trim() !== '') {
            setCategories([...categories, { name: newCategory, tasks: [] }]);
            setNewCategory('');
        }
    };

    const startRenameCategory = (index) => {
        setEditingCategoryIndex(index);
        setEditCategoryName(categories[index].name);
    };

    const saveRenameCategory = (index) => {
        const updatedCategories = [...categories];
        updatedCategories[index].name = editCategoryName;
        setCategories(updatedCategories);
        setEditingCategoryIndex(null);
    };

    const removeCategory = (index) => {
        const updatedCategories = categories.filter((_, i) => i !== index);
        setCategories(updatedCategories);
        if (selectedCategoryIndex >= updatedCategories.length) {
            setSelectedCategoryIndex(0);
        }
    };

    const addTask = () => {
        if (newTask.trim() === '') return; // prevent empty tasks

        let updatedCategories = [...categories];

        if (updatedCategories.length === 0) {
            updatedCategories = [{ name: 'General Tasks', tasks: [] }];
            setSelectedCategoryIndex(0);
        }

        //Ensure we always have a valid index
        const validIndex = selectedCategoryIndex ?? 0;

        // Add new task
        const newTaskObj = {
            id: Date.now(),
            text: newTask,
            completed: false,
            priority: taskPriority,
            dueDate: taskDueDate || null,
        };

        updatedCategories[validIndex].tasks.push(newTaskObj);

        setCategories(updatedCategories);
        setNewTask('');
        setTaskPriority('Medium'); // Reset to default
        setTaskDueDate('');
    };


    const deleteTask = (taskId) => {
        const updatedCategories = [...categories];
        updatedCategories[selectedCategoryIndex].tasks = updatedCategories[selectedCategoryIndex].tasks.filter(
            (task) => task.id !== taskId
        );
        setCategories(updatedCategories);
    };

    const toggleComplete = (taskId) => {
        const updatedCategories = [...categories];
        const task = updatedCategories[selectedCategoryIndex].tasks.find((t) => t.id === taskId);
        if (task) {
            task.completed = !task.completed; // Toggle completion state
            setCategories(updatedCategories); // Update state
        }
    };
    const startEditTask = (task) => {
        setEditingTaskId(task.id);
        setEditTaskPriority(task.priority);
        setEditTaskDueDate(task.dueDate || '');
    };

    const saveEditTask = (taskId) => {
        const updatedCategories = [...categories];
        const tasks = updatedCategories[selectedCategoryIndex].tasks.map((t) => {
            if (t.id === taskId) {
                return {
                    ...t,
                    priority: editTaskPriority,
                    dueDate: editTaskDueDate,
                };
            }
            return t;
        });
        updatedCategories[selectedCategoryIndex].tasks = tasks;
        setCategories(updatedCategories);
        setEditingTaskId(null);
    };
    
    const onDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const updatedCategories = [...categories];
            const tasks = updatedCategories[selectedCategoryIndex].tasks;
            const oldIndex = tasks.findIndex((t) => t.id === parseInt(active.id));
            const newIndex = tasks.findIndex((t) => t.id === parseInt(over.id));
            updatedCategories[selectedCategoryIndex].tasks = arrayMove(tasks, oldIndex, newIndex);
            setCategories(updatedCategories);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const SortableItem = ({ id, task, onToggleComplete, onDelete, onEdit, onSave, isEditing, editPriority, setEditPriority, editDueDate, setEditDueDate }) => {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
            id: id.toString(),
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        const getPriorityColor = (priority) => {
            switch (priority) {
                case 'High': return 'red';
                case 'Medium': return 'orange';
                case 'Low': return 'green';
                default: return 'gray';
            }
        };

        const dueDateDisplay = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';

        return (
            <li ref={setNodeRef} style={style} className={`task-item ${task.completed ? 'completed' : ''}`} {...attributes}>
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleComplete(task.id)}
                    />
                    <span className="checkmark"></span>
                </label>

                <span className="task-text" {...listeners}>
                    {task.text}
                </span>

                {isEditing ? (
                    <>
                        <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                        />

                        <button onClick={() => onSave(task.id)}>
                            <FontAwesomeIcon icon={faSave} />
                        </button>

                        <button onClick={() => setEditingTaskId(null)}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </>
                ) : (
                    <>
                        <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                            {task.priority}
                        </span>
                        <span className="task-due-date">{dueDateDisplay}</span>

                        {!task.completed && (
                            <button onClick={() => onEdit(task)}>
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                        )}

                        <button onClick={() => onDelete(task.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </>
                )}
            </li>
        );
    };


    const currentCategory = categories[selectedCategoryIndex] || { tasks: [] };
    const currentTasks = [...currentCategory.tasks].sort((a, b) => a.completed - b.completed);
    const activeTasks = currentTasks.filter((task) => !task.completed);
    const completedTasks = currentTasks.filter((task) => task.completed);
    const completionPercentage = currentTasks.length > 0 ? Math.round((completedTasks.length / currentTasks.length) * 100) : 0;

    const displayedTasks = showAll ? currentTasks : activeTasks;

    return (
        <div className={`app ${theme}`}>
            <h1>To-Do List App</h1>
            <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>

            <div className="category-management">
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category..."
                />
                <button onClick={addCategory}>
                    <FontAwesomeIcon icon={faPlus} /> Add
                </button>
            </div>

            <div className="category-tabs">
                {categories.map((category, index) => (
                    <div
                        key={index}
                        className={`tab ${selectedCategoryIndex === index ? 'active' : ''}`}
                        onClick={() => setSelectedCategoryIndex(index)}
                    >
                        {editingCategoryIndex === index ? (
                            <>
                                <input
                                    type="text"
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                />
                                <button onClick={() => saveRenameCategory(index)}>
                                    <FontAwesomeIcon icon={faSave} />
                                </button>
                                <button onClick={() => setEditingCategoryIndex(null)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </>
                        ) : (
                            <>
                                {category.name}
                                <button className="edit-btn" onClick={(e) => { e.stopPropagation(); startRenameCategory(index); }}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeCategory(index); }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {selectedCategoryIndex !== null && currentCategory && (
                <div className="task-section">
                    <h2>{currentCategory.name}</h2>
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                    <p>{completionPercentage}% Completed ({completedTasks.length}/{currentTasks.length})</p>
                    <div className="input-container">
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                        />
                        <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                        />
                        <button onClick={addTask}>
                            <FontAwesomeIcon icon={faPlus} /> Add
                        </button>
                    </div>

                    <button className="toggle-btn" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Only Active' : 'Show All Tasks'}
                    </button>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                        <SortableContext items={displayedTasks.map((task) => task.id.toString())}>
                            <ul className="task-list">
                                {displayedTasks.map((task) => (
                                    <SortableItem
                                        key={task.id}
                                        id={task.id}
                                        task={task}
                                        onToggleComplete={toggleComplete}
                                        onDelete={deleteTask}
                                        onEdit={startEditTask}
                                        onSave={saveEditTask}
                                        isEditing={editingTaskId === task.id}
                                        editPriority={editTaskPriority}
                                        setEditPriority={setEditTaskPriority}
                                        editDueDate={editTaskDueDate}
                                        setEditDueDate={setEditTaskDueDate}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
}

export default App;