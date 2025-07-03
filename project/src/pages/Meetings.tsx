import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MapPin, 
  Edit, 
  Trash2, 
  MoreVertical,
  ExternalLink,
  Copy,
  Tag,
  X,
  AlertTriangle,
  CheckCircle,
  Play,
  FileText,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { format, isToday, isTomorrow, isThisWeek, addMinutes, isBefore, isAfter } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  joinLink?: string;
  location?: string;
  tags: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function Meetings() {
  const { state } = useApp();
  const { profile: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 'm1',
      title: 'Sprint Planning',
      description: 'Plan the upcoming sprint goals and assign tasks to team members',
      date: '2024-11-25',
      time: '10:00',
      duration: 60,
      participants: ['1', '2', '3'],
      joinLink: 'https://meet.google.com/abc-def-ghi',
      location: '',
      tags: ['Sprint', 'Planning'],
      status: 'scheduled',
      created_by: '1',
      created_at: '2024-11-20T00:00:00Z',
      updated_at: '2024-11-20T00:00:00Z',
    },
    {
      id: 'm2',
      title: 'Client Review - Website Redesign',
      description: 'Present the latest design mockups and gather feedback from the client',
      date: '2024-11-26',
      time: '14:30',
      duration: 90,
      participants: ['2', '4'],
      joinLink: 'https://zoom.us/j/123456789',
      location: '',
      tags: ['Client', 'Review', 'Design'],
      status: 'scheduled',
      created_by: '2',
      created_at: '2024-11-21T00:00:00Z',
      updated_at: '2024-11-21T00:00:00Z',
    },
    {
      id: 'm3',
      title: 'Team Standup',
      description: 'Daily standup to discuss progress and blockers',
      date: '2024-11-22',
      time: '09:00',
      duration: 15,
      participants: ['1', '2', '3', '4'],
      joinLink: 'https://meet.google.com/xyz-abc-def',
      location: '',
      tags: ['Standup', 'Daily'],
      status: 'completed',
      created_by: '1',
      created_at: '2024-11-21T00:00:00Z',
      updated_at: '2024-11-22T09:15:00Z',
    },
  ]);

  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 30,
    participants: [] as string[],
    joinLink: '',
    location: '',
    tags: [] as string[],
  });

  const isAdmin = currentUser?.role === 'admin';
  const canManageMeetings = isAdmin || currentUser?.role === 'project_manager';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const resetForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 30,
      participants: [],
      joinLink: '',
      location: '',
      tags: [],
    });
    setNewTag('');
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMeetings || !currentUser) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const newMeeting: Meeting = {
        id: `m${Date.now()}`,
        ...meetingForm,
        status: 'scheduled',
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMeetings(prev => [...prev, newMeeting]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMeetings || !selectedMeeting) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedMeeting: Meeting = {
        ...selectedMeeting,
        ...meetingForm,
        updated_at: new Date().toISOString(),
      };

      setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
      setShowEditModal(false);
      setSelectedMeeting(null);
      resetForm();
    } catch (error) {
      console.error('Error updating meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!canManageMeetings || !selectedMeeting) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setMeetings(prev => prev.filter(m => m.id !== selectedMeeting.id));
      setShowDeleteModal(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownAction = (action: string, meeting: Meeting) => {
    setActiveDropdown(null);
    
    switch (action) {
      case 'view':
        setSelectedMeeting(meeting);
        setShowDetailModal(true);
        break;
      case 'edit':
        setSelectedMeeting(meeting);
        setMeetingForm({
          title: meeting.title,
          description: meeting.description,
          date: meeting.date,
          time: meeting.time,
          duration: meeting.duration,
          participants: meeting.participants,
          joinLink: meeting.joinLink || '',
          location: meeting.location || '',
          tags: meeting.tags,
        });
        setShowEditModal(true);
        break;
      case 'duplicate':
        const duplicatedMeeting: Meeting = {
          ...meeting,
          id: `m${Date.now()}`,
          title: `${meeting.title} (Copy)`,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMeetings(prev => [...prev, duplicatedMeeting]);
        break;
      case 'delete':
        setSelectedMeeting(meeting);
        setShowDeleteModal(true);
        break;
      case 'copy-link':
        if (meeting.joinLink) {
          navigator.clipboard.writeText(meeting.joinLink);
        }
        break;
    }
  };

  // Tag management
  const handleAddTag = () => {
    if (newTag.trim() && !meetingForm.tags.includes(newTag.trim())) {
      setMeetingForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMeetingForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    
    const now = new Date();
    const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
    
    let matchesTime = true;
    switch (timeFilter) {
      case 'today':
        matchesTime = isToday(meetingDateTime);
        break;
      case 'tomorrow':
        matchesTime = isTomorrow(meetingDateTime);
        break;
      case 'this-week':
        matchesTime = isThisWeek(meetingDateTime);
        break;
      case 'upcoming':
        matchesTime = isAfter(meetingDateTime, now);
        break;
      case 'past':
        matchesTime = isBefore(meetingDateTime, now);
        break;
    }

    // Check if user is participant or can manage meetings
    const canView = canManageMeetings || meeting.participants.includes(currentUser?.id || '');
    
    return matchesSearch && matchesStatus && matchesTime && canView;
  });

  // Get meeting status info
  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const meetingStart = new Date(`${meeting.date}T${meeting.time}`);
    const meetingEnd = addMinutes(meetingStart, meeting.duration);
    
    if (meeting.status === 'cancelled') {
      return { status: 'cancelled', color: 'text-red-600', bg: 'bg-red-100' };
    }
    
    if (meeting.status === 'completed') {
      return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100' };
    }
    
    if (now >= meetingStart && now <= meetingEnd) {
      return { status: 'live', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    
    if (now < meetingStart) {
      const minutesUntil = Math.floor((meetingStart.getTime() - now.getTime()) / (1000 * 60));
      if (minutesUntil <= 15) {
        return { status: 'starting-soon', color: 'text-orange-600', bg: 'bg-orange-100' };
      }
      return { status: 'scheduled', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
    
    return { status: 'ended', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getTimeDisplay = (meeting: Meeting) => {
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    
    if (isToday(meetingDate)) {
      return `Today at ${format(meetingDate, 'h:mm a')}`;
    }
    
    if (isTomorrow(meetingDate)) {
      return `Tomorrow at ${format(meetingDate, 'h:mm a')}`;
    }
    
    return format(meetingDate, 'MMM d, yyyy at h:mm a');
  };

  const ActionDropdown = ({ meeting }: { meeting: Meeting }) => {
    const isOpen = activeDropdown === meeting.id;
    const canEdit = canManageMeetings;
    const canDelete = canManageMeetings;
    
    return (
      <div 
        className="relative" 
        ref={el => dropdownRefs.current[meeting.id] = el}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : meeting.id);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Meeting actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
            <button
              onClick={() => handleDropdownAction('view', meeting)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4 mr-3 text-gray-400" />
              View Details
            </button>
            
            {meeting.joinLink && (
              <button
                onClick={() => handleDropdownAction('copy-link', meeting)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 mr-3 text-gray-400" />
                Copy Join Link
              </button>
            )}
            
            {canEdit && (
              <>
                <button
                  onClick={() => handleDropdownAction('edit', meeting)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-3 text-gray-400" />
                  Edit Meeting
                </button>
                
                <button
                  onClick={() => handleDropdownAction('duplicate', meeting)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4 mr-3 text-gray-400" />
                  Duplicate
                </button>
              </>
            )}
            
            {canDelete && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => handleDropdownAction('delete', meeting)}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3 text-red-400" />
                  Delete Meeting
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const statusInfo = getMeetingStatus(meeting);
    const participants = meeting.participants.map(id => state.profiles.find(p => p.id === id)).filter(Boolean);
    
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
        onClick={() => {
          setSelectedMeeting(meeting);
          setShowDetailModal(true);
        }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {meeting.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{meeting.description}</p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <ActionDropdown meeting={meeting} />
            </div>
          </div>

          {/* Status and Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge 
                variant={
                  statusInfo.status === 'live' ? 'info' :
                  statusInfo.status === 'starting-soon' ? 'warning' :
                  statusInfo.status === 'completed' ? 'success' :
                  statusInfo.status === 'cancelled' ? 'danger' : 'secondary'
                }
                className="flex items-center space-x-1"
              >
                {statusInfo.status === 'live' && <Play className="w-3 h-3" />}
                {statusInfo.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                {statusInfo.status === 'cancelled' && <AlertTriangle className="w-3 h-3" />}
                <span className="capitalize">{statusInfo.status.replace('-', ' ')}</span>
              </Badge>
              
              {statusInfo.status === 'live' && meeting.joinLink && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(meeting.joinLink, '_blank');
                  }}
                  icon={Video}
                  className="animate-pulse"
                >
                  Join Now
                </Button>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>{meeting.duration}min</span>
            </div>
          </div>

          {/* Time and Location */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{getTimeDisplay(meeting)}</span>
            </div>
            
            {meeting.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{meeting.location}</span>
              </div>
            )}
            
            {meeting.joinLink && (
              <div className="flex items-center text-sm text-gray-600">
                <Video className="w-4 h-4 mr-2" />
                <span className="truncate">Video call</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(meeting.joinLink, '_blank');
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participant) => (
                  <div
                    key={participant?.id}
                    className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                    title={participant?.name}
                  >
                    {participant?.name?.charAt(0).toUpperCase()}
                  </div>
                ))}
                {participants.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Tags */}
          {meeting.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meeting.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">Manage and join your team meetings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          {canManageMeetings && (
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Schedule Meeting
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This Week</option>
            <option value="past">Past</option>
            <option value="all">All Time</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>

      {filteredMeetings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No meetings found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || timeFilter !== 'upcoming'
              ? 'Try adjusting your filters to see more meetings.'
              : 'Schedule your first meeting to get started.'
            }
          </p>
          {canManageMeetings && (
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Schedule Meeting
            </Button>
          )}
        </div>
      )}

      {/* Create Meeting Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Schedule New Meeting"
        size="xl"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-6">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                required
                value={meetingForm.title}
                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                className="w-full text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter meeting title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agenda / Description
              </label>
              <textarea
                required
                value={meetingForm.description}
                onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the meeting agenda and objectives..."
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={meetingForm.date}
                      onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={meetingForm.time}
                      onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={meetingForm.duration}
                    onChange={(e) => setMeetingForm({ ...meetingForm, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                {/* Join Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join Link (optional)
                  </label>
                  <input
                    type="url"
                    value={meetingForm.joinLink}
                    onChange={(e) => setMeetingForm({ ...meetingForm, joinLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={meetingForm.location}
                    onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Conference Room A, Office, etc."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {state.profiles.filter(u => u.role !== 'client').map((user) => (
                      <label key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={meetingForm.participants.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMeetingForm({
                                ...meetingForm,
                                participants: [...meetingForm.participants, user.id]
                              });
                            } else {
                              setMeetingForm({
                                ...meetingForm,
                                participants: meetingForm.participants.filter(id => id !== user.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">{user.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {meetingForm.tags.map((tag, index) => (
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
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!meetingForm.title.trim() || !meetingForm.date || !meetingForm.time}
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Meeting Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMeeting(null);
          resetForm();
        }}
        title="Edit Meeting"
        size="xl"
      >
        {selectedMeeting && (
          <form onSubmit={handleUpdateMeeting} className="space-y-6">
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agenda / Description
                </label>
                <textarea
                  required
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={meetingForm.date}
                        onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        required
                        value={meetingForm.time}
                        onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      value={meetingForm.duration}
                      onChange={(e) => setMeetingForm({ ...meetingForm, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  {/* Join Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Join Link (optional)
                    </label>
                    <input
                      type="url"
                      value={meetingForm.joinLink}
                      onChange={(e) => setMeetingForm({ ...meetingForm, joinLink: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      value={meetingForm.location}
                      onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Participants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participants
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {state.profiles.filter(u => u.role !== 'client').map((user) => (
                        <label key={user.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={meetingForm.participants.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMeetingForm({
                                  ...meetingForm,
                                  participants: [...meetingForm.participants, user.id]
                                });
                              } else {
                                setMeetingForm({
                                  ...meetingForm,
                                  participants: meetingForm.participants.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {meetingForm.tags.map((tag, index) => (
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
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setShowEditModal(false);
                  setShowDeleteModal(true);
                }}
                icon={Trash2}
              >
                Delete Meeting
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMeeting(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!meetingForm.title.trim() || !meetingForm.date || !meetingForm.time}
                >
                  Update Meeting
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Meeting Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMeeting(null);
        }}
        title="Meeting Details"
        size="lg"
      >
        {selectedMeeting && (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedMeeting.title}</h2>
                <div className="flex items-center space-x-2 mb-4">
                  {(() => {
                    const statusInfo = getMeetingStatus(selectedMeeting);
                    return (
                      <Badge 
                        variant={
                          statusInfo.status === 'live' ? 'info' :
                          statusInfo.status === 'starting-soon' ? 'warning' :
                          statusInfo.status === 'completed' ? 'success' :
                          statusInfo.status === 'cancelled' ? 'danger' : 'secondary'
                        }
                        className="flex items-center space-x-1"
                      >
                        {statusInfo.status === 'live' && <Play className="w-3 h-3" />}
                        {statusInfo.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {statusInfo.status === 'cancelled' && <AlertTriangle className="w-3 h-3" />}
                        <span className="capitalize">{statusInfo.status.replace('-', ' ')}</span>
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              
              {selectedMeeting.joinLink && (
                <Button
                  onClick={() => window.open(selectedMeeting.joinLink, '_blank')}
                  icon={Video}
                  className={getMeetingStatus(selectedMeeting).status === 'live' ? 'animate-pulse' : ''}
                >
                  {getMeetingStatus(selectedMeeting).status === 'live' ? 'Join Now' : 'Join Meeting'}
                </Button>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Agenda</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{selectedMeeting.description}</p>
            </div>

            {/* Meeting Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Date & Time</h3>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{getTimeDisplay(selectedMeeting)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Duration</h3>
                  <div className="flex items-center text-gray-900">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{selectedMeeting.duration} minutes</span>
                  </div>
                </div>

                {selectedMeeting.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
                    <div className="flex items-center text-gray-900">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{selectedMeeting.location}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Participants</h3>
                  <div className="space-y-2">
                    {selectedMeeting.participants.map(participantId => {
                      const participant = state.profiles.find(p => p.id === participantId);
                      return participant ? (
                        <div key={participant.id} className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900">{participant.name}</span>
                          <Badge variant="secondary" size="sm">
                            {participant.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {selectedMeeting.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedMeeting.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Created {format(new Date(selectedMeeting.created_at), 'MMM d, yyyy at h:mm a')}
              </div>
              
              {canManageMeetings && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMeetingForm({
                        title: selectedMeeting.title,
                        description: selectedMeeting.description,
                        date: selectedMeeting.date,
                        time: selectedMeeting.time,
                        duration: selectedMeeting.duration,
                        participants: selectedMeeting.participants,
                        joinLink: selectedMeeting.joinLink || '',
                        location: selectedMeeting.location || '',
                        tags: selectedMeeting.tags,
                      });
                      setShowDetailModal(false);
                      setShowEditModal(true);
                    }}
                    icon={Edit}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Meeting Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMeeting(null);
        }}
        title="Delete Meeting"
        size="md"
      >
        {selectedMeeting && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Delete "{selectedMeeting.title}"?
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      This will permanently delete the meeting. Participants will no longer be able to access the meeting details or join link. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMeeting(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteMeeting}
                loading={loading}
                icon={Trash2}
              >
                Delete Meeting
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}