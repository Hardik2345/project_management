import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../lib/api';
import { CheckCircle, Clock, Calendar, Target, ExternalLink, Users, Video } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { format, isToday, isThisWeek, isBefore, addDays } from 'date-fns';

export function PersonalSnapshot() {
  const { state, currentUser } = useApp();
  const [todayCompletedTasks, setTodayCompletedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load today's completed tasks from backend
  useEffect(() => {
    const loadTodayTasks = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const todayTasks = await apiClient.getTodayTasks();
        setTodayCompletedTasks(todayTasks.filter(task => task.status === 'done'));
      } catch (error) {
        console.error('Error loading today tasks:', error);
        // Fallback to local state
        const todayCompleted = state.tasks.filter(task => 
          task.assignee_id === currentUser?.id && 
          task.status === 'done' && 
          task.updated_at && 
          isToday(new Date(task.updated_at))
        );
        setTodayCompletedTasks(todayCompleted);
      } finally {
        setLoading(false);
      }
    };

    loadTodayTasks();
  }, [currentUser, state.tasks]);

  // Get this week's completed tasks
  const weekCompletedTasks = state.tasks.filter(task => 
    task.assignee_id === currentUser?.id && 
    task.status === 'done' && 
    task.updated_at && 
    isThisWeek(new Date(task.updated_at))
  );

  // Get upcoming deadlines (next 3 tasks with due dates)
  const upcomingTasks = state.tasks
    .filter(task => 
      task.assignee_id === currentUser?.id && 
      task.due_date && 
      task.status !== 'done' &&
      !isBefore(new Date(task.due_date), new Date())
    )
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3);

  // Mock meetings data (in real app, this would come from calendar integration)
  const todayMeetings = [
    {
      id: '1',
      title: 'Sprint Planning',
      time: '10:00 AM',
      link: 'https://meet.google.com/abc-def-ghi',
      attendees: 4
    },
    {
      id: '2',
      title: 'Client Review',
      time: '2:30 PM',
      link: 'https://zoom.us/j/123456789',
      attendees: 3
    }
  ];

  // Current sprint overview (mock data)
  const currentSprint = {
    goal: 'Complete website redesign MVP',
    progress: 65,
    endDate: addDays(new Date(), 5),
    totalTasks: 12,
    completedTasks: 8
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Today</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM do')}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Completed, Upcoming, Meetings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Completed Tasks */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Completed</h3>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="text-2xl font-bold text-green-700">{todayCompletedTasks.length}</div>
                <div className="text-sm text-green-600">Today</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-700">{weekCompletedTasks.length}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Upcoming</h3>
            </div>
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const project = state.projects.find(p => p.id === task.project_id);
                const daysUntilDue = Math.ceil((new Date(task.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={task.id} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">{task.title}</span>
                      <Badge variant={
                        daysUntilDue <= 1 ? 'danger' :
                        daysUntilDue <= 3 ? 'warning' : 'info'
                      } size="sm">
                        {daysUntilDue === 0 ? 'Today' : 
                         daysUntilDue === 1 ? 'Tomorrow' : 
                         `${daysUntilDue}d`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{project?.name}</span>
                      <Badge variant={
                        task.priority === 'critical' ? 'danger' :
                        task.priority === 'high' ? 'warning' :
                        task.priority === 'medium' ? 'info' : 'secondary'
                      } size="sm">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {upcomingTasks.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
                  <p className="text-sm text-gray-500">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          {/* Scheduled Meetings */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Meetings</h3>
            </div>
            <div className="space-y-2">
              {todayMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{meeting.title}</span>
                    <span className="text-sm font-semibold text-blue-700">{meeting.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-600">
                      <Users className="w-3 h-3 mr-1" />
                      <span>{meeting.attendees} attendees</span>
                    </div>
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <Video className="w-3 h-3 mr-1" />
                      Join
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Current Sprint */}
        <div className="lg:col-span-1">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Current Sprint</h3>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">{currentSprint.goal}</p>
                <div className="w-full bg-purple-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${currentSprint.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-purple-700 font-medium">{currentSprint.progress}% complete</span>
                  <span className="text-xs text-purple-600">
                    {currentSprint.completedTasks}/{currentSprint.totalTasks} tasks
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Sprint ends</span>
                  <span className="text-sm font-medium text-purple-900">
                    {format(currentSprint.endDate, 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}