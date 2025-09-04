import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './src/lib/supabase';
import { useAuth } from './src/contexts/AuthContext';
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface TaskDetail {
  id: string;
  task_id: string;
  plant_room_id: string;
  asset_id?: string;
  assigned_to?: string;
  due_date: string;
  type_of_task: string;
  status: string;
  date_completed?: string;
  notes?: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assets?: {
    "Asset ID": string;
    "Asset Name": string;
    "Asset Type": string;
    "Manufacturer"?: string;
    "Model"?: string;
  };
  plant_rooms?: {
    "Block": string;
    "Address": string;
    "Plant Room Type": string;
  };
  team?: {
    "Name": string;
    "Email": string;
    "Phone Number"?: string;
  };
}

interface FormSubmission {
  id: string;
  form_submission_id: string;
  submission_date: string;
  status: string;
  responses: any;
  team?: {
    "Name": string;
  };
}

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');

  const isAdmin = userProfile?.Role === 'Admin';
  const isAssignedUser = task?.assigned_to === userProfile?.id;

  useEffect(() => {
    if (id && id !== undefined) {
      fetchTaskDetails();
      fetchTeamMembers();
    }
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);

      // Fetch task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assets("Asset ID", "Asset Name", "Asset Type", "Manufacturer", "Model"),
          plant_rooms("Block", "Address", "Plant Room Type"),
          team("Name", "Email", "Phone Number")
        `)
        .eq('id', id)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      // Fetch form submissions for this task
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select(`
          *,
          team("Name")
        `)
        .eq('task_id', id)
        .order('submission_date', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team')
        .select('id, "Name", "Email", "Role"')
        .order('"Name"');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const updateTaskStatus = async (status: string) => {
    if (!task) return;

    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (status === 'Completed') {
        updateData.date_completed = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;
      
      setTask({ ...task, status, date_completed: updateData.date_completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAssignTask = async () => {
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: selectedTeamMember || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      setShowAssignModal(false);
      setSelectedTeamMember('');
      fetchTaskDetails();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="w-6 h-6 text-success-600" />;
      case 'In Progress':
        return <ClockIcon className="w-6 h-6 text-warning-600" />;
      default:
        return <ClipboardDocumentListIcon className="w-6 h-6 text-primary-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900">Task not found</h3>
        <button
          onClick={() => navigate('/tasks')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Tasks
        </button>
      </div>
    );
  }

  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'Completed';

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-6 transition-all duration-200 hover:translate-x-1"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Tasks
        </button>
        
        {/* Hero Section */}
        <div className="gradient-bg rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                {getStatusIcon(task.status)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {task.assets?.["Asset Name"] || 'General Task'}
                </h1>
                <p className="text-white text-opacity-80 text-lg">
                  {task.plant_rooms?.["Block"]} • {task.type_of_task}
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white backdrop-blur-sm">
                    ID: {task.task_id}
                  </span>
                  <span className="text-white text-opacity-70 text-sm">
                    Due {format(new Date(task.due_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 bg-white bg-opacity-20 text-white backdrop-blur-sm shadow-lg border-white border-opacity-30`}>
                {task.priority} Priority
              </span>
              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 bg-white bg-opacity-20 text-white backdrop-blur-sm shadow-lg border-white border-opacity-30`}>
                {isOverdue && task.status !== 'Completed' ? 'Overdue' : task.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Information */}
      <div className="bg-white shadow-xl rounded-3xl border border-secondary-200 p-8 mb-8">
        <h3 className="text-2xl font-bold text-secondary-900 mb-8">Task Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-secondary-700">Basic Details</h4>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-secondary-500">Task ID</span>
                <p className="text-secondary-900 font-mono">{task.task_id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-500">Type</span>
                <p className="text-secondary-900">{task.type_of_task}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-500">Location</span>
                <p className="text-secondary-900">{task.plant_rooms?.["Block"]}</p>
                <p className="text-xs text-secondary-600">{task.plant_rooms?.["Plant Room Type"]} Plant Room</p>
              </div>
            </div>
          </div>

          {/* Asset Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-secondary-700">Asset Information</h4>
            <div className="space-y-3">
              {task.assets ? (
                <>
                  <div>
                    <span className="text-sm font-medium text-secondary-500">Asset Name</span>
                    <p className="text-secondary-900">{task.assets["Asset Name"]}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-secondary-500">Asset Type</span>
                    <p className="text-secondary-900">{task.assets["Asset Type"]}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-secondary-500">Asset ID</span>
                    <p className="text-secondary-900 font-mono">{task.assets["Asset ID"]}</p>
                  </div>
                  {task.assets["Manufacturer"] && (
                    <div>
                      <span className="text-sm font-medium text-secondary-500">Manufacturer</span>
                      <p className="text-secondary-900">{task.assets["Manufacturer"]} {task.assets["Model"]}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-secondary-600 text-sm">No asset assigned</p>
              )}
            </div>
          </div>

          {/* Schedule & Assignment */}
          <div className="space-y-4">
            <h4 className="font-medium text-secondary-700">Schedule & Assignment</h4>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-secondary-500">Due Date</span>
                <p className={`${isOverdue ? 'text-error-600 font-medium' : 'text-secondary-900'}`}>
                  {format(new Date(task.due_date), 'MMM dd, yyyy')}
                  {isOverdue && (
                    <span className="ml-2 text-xs bg-error-100 text-error-800 px-2 py-1 rounded">
                      {Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                    </span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-500">Assigned To</span>
                <div className="flex items-center justify-between">
                  <p className="text-secondary-900">{task.team?.["Name"] || 'Unassigned'}</p>
                  {(isAdmin || !task.assigned_to) && (
                    <button
                      onClick={() => {
                        setSelectedTeamMember(task.assigned_to || '');
                        setShowAssignModal(true);
                      }}
                      className="ml-2 text-xs text-primary-600 hover:text-primary-500 flex items-center"
                    >
                      <UserPlusIcon className="w-3 h-3 mr-1" />
                      {task.assigned_to ? 'Reassign' : 'Assign'}
                    </button>
                  )}
                </div>
                {task.team?.["Email"] && (
                  <p className="text-xs text-secondary-600">{task.team["Email"]}</p>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-500">Created</span>
                <p className="text-secondary-900">{format(new Date(task.created_at), 'MMM dd, yyyy')}</p>
              </div>
              {task.date_completed && (
                <div>
                  <span className="text-sm font-medium text-secondary-500">Completed</span>
                  <p className="text-secondary-900">{format(new Date(task.date_completed), 'MMM dd, yyyy')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {task.notes && (
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <h4 className="font-medium text-secondary-700 mb-2">Notes</h4>
            <p className="text-secondary-900 text-sm bg-secondary-50 p-4 rounded-lg">
              {task.notes}
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {task.assigned_to ? 'Reassign Task' : 'Assign Task'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Select Team Member
              </label>
              <select
                value={selectedTeamMember}
                onChange={(e) => setSelectedTeamMember(e.target.value)}
                className="w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.Name} ({member.Email}) - {member.Role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignTask}
                className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {task.assigned_to ? 'Reassign' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(isAdmin || isAssignedUser) && task.status !== 'Completed' && (
          <>
            {task.status === 'Open' && (
              <button
                onClick={() => updateTaskStatus('In Progress')}
                className="flex items-center justify-center px-4 py-3 border border-warning-300 rounded-xl text-sm font-medium text-warning-700 bg-warning-50 hover:bg-warning-100 transition-colors"
              >
                <ClockIcon className="w-5 h-5 mr-2" />
                Start Task
              </button>
            )}
            <button
              onClick={() => navigate(`/tasks/${task.id}/form`)}
              className="flex items-center justify-center px-4 py-3 border border-primary-300 rounded-xl text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Fill Form
            </button>
            <button
              onClick={() => updateTaskStatus('Completed')}
              className="flex items-center justify-center px-4 py-3 border border-success-300 rounded-xl text-sm font-medium text-success-700 bg-success-50 hover:bg-success-100 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Mark Complete
            </button>
          </>
        )}
      </div>

      {/* Form Submissions */}
      <div className="bg-white shadow-sm rounded-xl border border-secondary-200">
        <div className="px-6 py-4 border-b border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900">Form Submissions</h3>
        </div>
        <div className="divide-y divide-secondary-200">
          {submissions.length === 0 ? (
            <div className="p-6 text-center text-secondary-500">
              No form submissions for this task
            </div>
          ) : (
            submissions.map((submission) => (
              <div key={submission.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-secondary-900">
                      Form Submission
                    </h4>
                    <p className="text-xs text-secondary-600 mt-1">
                      {submission.team?.["Name"]} • {format(new Date(submission.submission_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-secondary-500">
                      ID: {submission.form_submission_id}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    submission.status === 'Submitted' 
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-success-100 text-success-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;