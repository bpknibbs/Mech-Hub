import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import { useAuth } from './src/contexts/AuthContext';
import { createFollowUpTask } from './src/utils/taskAutomation';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Log {
  id: string;
  log_id: string;
  plant_room_id: string;
  date: string;
  time: string;
  user_email: string;
  log_entry: string;
  photo?: string;
  gps_location?: string;
  status: string;
  comments?: string;
  created_at: string;
  plant_rooms?: {
    Block: string;
    Address: string;
    "Plant Room Type": string;
  };
}

const Logs: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [plantRooms, setPlantRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [followUpTaskId, setFollowUpTaskId] = useState<string | null>(null);
  const [newLog, setNewLog] = useState({
    plant_room_id: '',
    log_entry: '',
    comments: '',
    status: 'Active',
    photo: '',
    gps_location: ''
  });

  const canCreateLogs = userProfile?.Role !== 'Viewer';

  useEffect(() => {
    fetchLogs();
    fetchPlantRooms();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select(`
          *,
          plant_rooms(Block, Address, "Plant Room Type")
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('plant_rooms')
        .select('id, Block, "Plant Room ID"')
        .order('Block');

      if (error) throw error;
      setPlantRooms(data || []);
    } catch (error) {
      console.error('Error fetching plant rooms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      // Generate unique log ID
      const logId = `LOG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
      
      const logData = {
        ...newLog,
        log_id: logId,
        user_email: user.email,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      };

      const { error } = await supabase
        .from('logs')
        .insert([logData]);

      if (error) throw error;

      setNewLog({
        plant_room_id: '',
        log_entry: '',
        comments: '',
        status: 'Active',
        photo: '',
        gps_location: ''
      });
      setShowAddForm(false);
      fetchLogs();
    } catch (error) {
      console.error('Error creating log:', error);
    }
  };

  const handleCreateFollowUpTask = async (log: Log, priority: 'Low' | 'Medium' | 'High' = 'Medium') => {
    try {
      const result = await createFollowUpTask(
        'log',
        log.id,
        log.log_entry,
        log.plant_room_id,
        undefined,
        priority
      );

      if (result.success) {
        setFollowUpTaskId(result.taskId || null);
        setTimeout(() => setFollowUpTaskId(null), 5000); // Hide after 5 seconds
      } else {
        console.error('Failed to create follow-up task:', result.error);
      }
    } catch (error) {
      console.error('Error creating follow-up task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success-100 text-success-800';
      case 'Resolved':
        return 'bg-primary-100 text-primary-800';
      case 'Investigating':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Modern Header with Gradient Background */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
                Logs
              </h1>
              <p className="mt-2 text-white text-opacity-90 text-lg">
                Record observations, incidents, and maintenance activities
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                  {logs.filter(l => l.status === 'Active').length} Active
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-primary-400 rounded-full mr-2"></div>
                  {logs.filter(l => l.status === 'Resolved').length} Resolved
                </span>
              </div>
            </div>
            {canCreateLogs && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
              >
                <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                Add Log Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success message for follow-up task creation */}
      {followUpTaskId && (
        <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <ClipboardDocumentListIcon className="h-5 w-5 text-success-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-success-800">Follow-up Task Created</h3>
              <p className="text-sm text-success-700 mt-1">
                Task ID: {followUpTaskId} has been created and assigned for follow-up.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Log Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add Log Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Plant Room
                  </label>
                  <select
                    required
                    value={newLog.plant_room_id}
                    onChange={(e) => setNewLog({...newLog, plant_room_id: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select Plant Room</option>
                    {plantRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.Block} ({room["Plant Room ID"]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Log Entry
                </label>
                <textarea
                  required
                  value={newLog.log_entry}
                  onChange={(e) => setNewLog({...newLog, log_entry: e.target.value})}
                  rows={4}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Comments
                </label>
                <textarea
                  value={newLog.comments}
                  onChange={(e) => setNewLog({...newLog, comments: e.target.value})}
                  rows={2}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={newLog.status}
                  onChange={(e) => setNewLog({...newLog, status: e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="Active">Active</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Add Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group bg-white rounded-2xl border border-secondary-200 shadow-xl p-8 hover:shadow-2xl hover:-translate-y-2 hover:border-primary-300 transition-all duration-500 relative overflow-hidden"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-3 mr-4 shadow-lg border border-primary-300">
                    <DocumentTextIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900">
                      {log.plant_rooms?.Block}
                    </h3>
                    <p className="text-base text-secondary-600 font-medium">
                      {log.plant_rooms?.["Plant Room Type"]} Plant Room
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                  <span className="text-sm text-secondary-500 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-lg px-3 py-2 font-mono font-bold border border-secondary-300">
                    {log.log_id}
                  </span>
                </div>
              </div>

              <div className="mb-6 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-5 border border-secondary-200">
                <p className="text-secondary-900 font-medium text-lg leading-relaxed">{log.log_entry}</p>
                {log.comments && (
                  <p className="text-base text-secondary-700 mt-4 font-medium">
                    <strong className="text-accent-700">Comments:</strong> {log.comments}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-base text-secondary-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg px-3 py-2 border border-primary-200">
                    <UserIcon className="w-4 h-4 text-primary-600 mr-2" />
                    <span className="font-medium">{log.user_email}</span>
                  </div>
                  <div className="flex items-center bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg px-3 py-2 border border-accent-200">
                    <ClockIcon className="w-4 h-4 text-accent-600 mr-2" />
                    <span className="font-medium">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {log.gps_location && (
                    <div className="flex items-center bg-gradient-to-r from-success-50 to-success-100 rounded-lg px-3 py-2 border border-success-200">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span className="font-medium text-success-700">Location</span>
                    </div>
                  )}
                  {log.photo && (
                    <div className="flex items-center bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg px-3 py-2 border border-warning-200">
                      <PhotoIcon className="w-4 h-4 mr-1" />
                      <span className="font-medium text-warning-700">Photo</span>
                    </div>
                  )}
                </div>

                {/* Follow-up task creation buttons */}
                {log.status === 'Active' && userProfile?.Role !== 'Viewer' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCreateFollowUpTask(log, 'Medium')}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-warning-100 to-warning-200 border-2 border-warning-300 text-warning-800 rounded-xl text-sm font-bold hover:from-warning-200 hover:to-warning-300 transition-all duration-200 shadow-lg transform hover:scale-105"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Create Task
                    </button>
                    <button
                      onClick={() => handleCreateFollowUpTask(log, 'High')}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-error-100 to-error-200 border-2 border-error-300 text-error-800 rounded-xl text-sm font-bold hover:from-error-200 hover:to-error-300 transition-all duration-200 shadow-lg transform hover:scale-105"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Urgent Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-24">
          <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-2xl border border-primary-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-accent-100/30"></div>
            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 inline-block mb-8 shadow-xl">
              <DocumentTextIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="relative text-2xl font-bold text-secondary-900 mb-4">No log entries</h3>
            <p className="relative text-secondary-600 mb-10 leading-relaxed text-lg">
              Get started by adding a log entry.
            </p>
            {canCreateLogs && (
              <div className="relative">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-8 py-4 border border-transparent shadow-2xl text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-110 hover:shadow-3xl"
                >
                  <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                  Add Log Entry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;