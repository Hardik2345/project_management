import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { apiClient } from "../lib/api";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  LayoutGrid,
  List,
  Clock,
  X,
  Tag,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { TaskModal } from "../components/tasks/TaskModal";
import { format } from "date-fns";

export function Tasks() {
  const { state, dispatch, loadData } = useApp();
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project_id: "",
    assignee_id: "",
    priority: "medium" as const,
    status: "backlog" as const,
    estimated_hours: 1,
    due_date: "",
    tags: [] as string[],
  });

  // Load tasks with filters
  const loadTasks = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (assigneeFilter !== 'all') filters.assignee = assigneeFilter;
      if (projectFilter !== 'all') filters.project = projectFilter;

      const tasks = await apiClient.getTasks(filters);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on component mount and when filters change
  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, assigneeFilter, projectFilter]);

  const filteredTasks = state.tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        ...newTask,
        due_date: newTask.due_date || null,
      };

      const createdTask = await apiClient.createTask(taskData);
      dispatch({ type: "ADD_TASK", payload: createdTask });
      
      setShowCreateModal(false);
      setNewTask({
        title: "",
        description: "",
        project_id: "",
        assignee_id: "",
        priority: "medium",
        status: "backlog",
        estimated_hours: 1,
        due_date: "",
        tags: [],
      });
      setNewTag("");
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updatedTask = await apiClient.updateTask(taskId, { status: newStatus });
      dispatch({ type: "UPDATE_TASK", payload: updatedTask });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleTaskClick = (taskId: string, event: React.MouseEvent) => {
    // Prevent opening modal if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (
      target.closest("select") ||
      target.closest("button") ||
      target.closest("a")
    ) {
      return;
    }

    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  // Tag management functions
  const handleAddTag = () => {
    if (newTag.trim() && !newTask.tags.includes(newTag.trim())) {
      setNewTask((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const statusColumns = [
    { id: "backlog", title: "Backlog", color: "bg-gray-100" },
    { id: "todo", title: "To Do", color: "bg-blue-100" },
    { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
    { id: "review", title: "Review", color: "bg-purple-100" },
    { id: "done", title: "Done", color: "bg-green-100" },
  ];

  const TaskCard = ({ task }: { task: any }) => {
    const assignee =
      task.assignee || state.profiles.find((u) => u.id === task.assignee_id);
    const project =
      task.project || state.projects.find((p) => p.id === task.project_id);
    const timeEntries = state.timeEntries.filter(
      (te) => te.task_id === task.id
    );
    const totalTimeSpent =
      timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    const isOverdue =
      task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== "done";

    return (
      <div
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-3 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
        onClick={(e) => handleTaskClick(task.id, e)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
              {task.title}
            </h4>
            <Badge
              variant={
                task.priority === "critical"
                  ? "danger"
                  : task.priority === "high"
                  ? "warning"
                  : task.priority === "medium"
                  ? "info"
                  : "secondary"
              }
              size="sm"
            >
              {task.priority}
            </Badge>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{project?.name}</span>
            {task.due_date && (
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {format(new Date(task.due_date), "MMM d")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {assignee?.avatar ? (
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
              )}
              <span className="ml-2 text-xs text-gray-600">
                {assignee?.name}
              </span>
            </div>

            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              <span>
                {Math.round(totalTimeSpent)}h / {task.estimated_hours}h
              </span>
            </div>
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{
                      width: `${
                        (task.subtasks.filter((st: any) => st.completed)
                          .length /
                          task.subtasks.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="ml-2">
                  {task.subtasks.filter((st: any) => st.completed).length}/
                  {task.subtasks.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === "kanban"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors ${
                viewMode === "table"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            {state.profiles
              .filter((u) => u.role !== "client")
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Projects</option>
            {state.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statusColumns.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column.id
            );

            return (
              <div key={column.id} className="flex flex-col">
                <div
                  className={`${column.color} rounded-lg p-3 mb-4 border border-gray-200`}
                >
                  <h3 className="font-medium text-gray-900 text-sm">
                    {column.title} ({columnTasks.length})
                  </h3>
                </div>

                <div className="flex-1 space-y-3 min-h-[400px]">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => {
                  const assignee =
                    task.assignee ||
                    state.profiles.find((u) => u.id === task.assignee_id);
                  const project =
                    task.project ||
                    state.projects.find((p) => p.id === task.project_id);
                  const timeEntries = state.timeEntries.filter(
                    (te) => te.task_id === task.id
                  );
                  const totalTimeSpent =
                    timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
                  const isOverdue =
                    task.due_date &&
                    new Date(task.due_date) < new Date() &&
                    task.status !== "done";

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleTaskClick(task.id, e)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {assignee?.avatar ? (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <span className="text-sm text-gray-900">
                            {assignee?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task.id, e.target.value);
                          }}
                          className="text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            task.priority === "critical"
                              ? "danger"
                              : task.priority === "high"
                              ? "warning"
                              : task.priority === "medium"
                              ? "info"
                              : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.due_date ? (
                          <span
                            className={
                              isOverdue ? "text-red-600 font-medium" : ""
                            }
                          >
                            {format(new Date(task.due_date), "MMM d, yyyy")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(totalTimeSpent)}h / {task.estimated_hours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        size="xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the task in detail..."
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Project & Assignee */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      required
                      value={newTask.project_id}
                      onChange={(e) =>
                        setNewTask({ ...newTask, project_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Project</option>
                      {state.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignee
                    </label>
                    <select
                      required
                      value={newTask.assignee_id}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assignee_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Assignee</option>
                      {state.profiles
                        .filter((u) => u.role !== "client")
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={newTask.estimated_hours}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        estimated_hours: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {newTask.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center space-x-1 px-3 py-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddTag())
                        }
                        placeholder="Add a tag"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                        size="sm"
                        icon={Plus}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={
                !newTask.title.trim() ||
                !newTask.project_id ||
                !newTask.assignee_id
              }
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
      />
    </div>
  );
}