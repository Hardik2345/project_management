import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { MessageCircle, Calendar, Send, User, Clock, Milestone } from 'lucide-react';
import { Button } from '../ui/Button';
import { format, subDays, addDays } from 'date-fns';

export function CollaborationTimeline() {
  const { state } = useApp();
  const { profile: currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');

  // Mock recent comments/notes (in real app, this would come from comments table)
  const recentComments = [
    {
      id: '1',
      user: state.profiles.find(p => p.id !== currentUser?.id),
      content: 'Updated the homepage design based on client feedback. Ready for review.',
      timestamp: new Date(),
      taskTitle: 'Design new homepage layout',
      type: 'comment'
    },
    {
      id: '2',
      user: currentUser,
      content: 'Sprint planning meeting scheduled for tomorrow at 10 AM.',
      timestamp: subDays(new Date(), 1),
      type: 'note'
    },
    {
      id: '3',
      user: state.profiles.find(p => p.role === 'project_manager'),
      content: 'Great progress on the mobile app! Authentication flow is working perfectly.',
      timestamp: subDays(new Date(), 2),
      taskTitle: 'User authentication system',
      type: 'comment'
    }
  ];

  // Mock timeline data for Gantt-style view
  const timelineData = [
    {
      id: '1',
      title: 'Website Redesign',
      type: 'project',
      startDate: subDays(new Date(), 14),
      endDate: addDays(new Date(), 21),
      progress: 65,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      title: 'Sprint 3',
      type: 'sprint',
      startDate: subDays(new Date(), 7),
      endDate: addDays(new Date(), 7),
      progress: 80,
      color: 'bg-purple-500'
    },
    {
      id: '3',
      title: 'Client Review',
      type: 'milestone',
      startDate: addDays(new Date(), 3),
      endDate: addDays(new Date(), 3),
      progress: 0,
      color: 'bg-orange-500'
    },
    {
      id: '4',
      title: 'Mobile App MVP',
      type: 'project',
      startDate: new Date(),
      endDate: addDays(new Date(), 35),
      progress: 25,
      color: 'bg-green-500'
    }
  ];

  const handleSendComment = () => {
    if (newComment.trim()) {
      // In real app, this would save to database
      console.log('Sending comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Comments/Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
          {recentComments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {comment.user?.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(comment.timestamp, 'MMM d, h:mm a')}
                  </span>
                  {comment.type === 'note' && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Note
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
                {comment.taskTitle && (
                  <p className="text-xs text-gray-500 mt-1">on {comment.taskTitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Reply */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or note..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSendComment}
              disabled={!newComment.trim()}
              icon={Send}
              className="self-end"
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Mini Gantt Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          </div>
        </div>

        <div className="space-y-4">
          {timelineData.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.type === 'milestone' ? (
                    <Milestone className="w-4 h-4 text-orange-600" />
                  ) : item.type === 'sprint' ? (
                    <Clock className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Calendar className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(item.startDate, 'MMM d')} - {format(item.endDate, 'MMM d')}
                </span>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                  <span className="text-xs text-gray-600">{item.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Projects</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Sprints</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Milestones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}