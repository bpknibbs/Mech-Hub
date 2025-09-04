import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { runTaskAutomation } from '../utils/taskAutomation';
import { notifyTaskAssigned } from '../utils/notifications';
import { 
  ClipboardList as ClipboardDocumentListIcon,
  CheckCircle as CheckCircleIcon,
  Search as MagnifyingGlassIcon,
  User as UserIcon,
  Zap as BoltIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface Task {
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
    "Asset Name": string;
    "Asset Type": string;
    "Asset ID": string;
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

interface TeamMember {
  id: string;
  "Name": string;
  "Email": string;
  "Role": string;
}

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [automationResult, setAutomationResult] = useState<string>('');

  const isAdmin = userProfile?.Role === 'Admin' || userProfile?.Role === 'Access All';
  const isEngineer = userProfile?.Role === 'Engineer';

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, [userProfile]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assets("Asset Name", "Asset Type", "Asset ID"),
          plant_rooms("Block", "Address", "Plant Room Type"),
          team("Name", "Email", "Phone Number")
        `);

      if (isEngineer && userProfile?.id) {
        query = query.eq('assigned_to', userProfile.id);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  const handleRunAutomation = async () => {
    if (!isAdmin) return;
    
    try {
      setRunningAutomation(true);
      setAutomationResult('Running task automation...');

      const result = await runTaskAutomation();
      
      if (result.errors.length > 0) {
        setAutomationResult(`Automation completed with ${result.errors.length} errors. PPM tasks created: ${result.ppmTasks}`);
      } else {
        setAutomationResult(`Automation successful! Created ${result.ppmTasks} PPM tasks, found ${result.overdueCount} overdue tasks.`);
      }

      // Refresh tasks after automation
      await fetchTasks();

    } catch (error) {
      console.error('Error running automation:', error);
      setAutomationResult(`Automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRunningAutomation(false);
      setTimeout(() => setAutomationResult(''), 8000);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
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
        .eq('id', taskId);

      if (error) throw error;
      
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAssignTask = async () => {
    if (!taskToAssign) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: selectedTeamMember || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskToAssign.id);

      if (error) throw error;

      if (selectedTeamMember) {
        const teamMember = teamMembers.find(m => m.id === selectedTeamMember);
        if (teamMember) {
          await notifyTaskAssigned(taskToAssign.id, selectedTeamMember, teamMember["Email"]);
        }
      }

      setShowAssignModal(false);
      setTaskToAssign(null);
      setSelectedTeamMember('');
      fetchTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const getStatusColor = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'Completed';
    if (isOverdue) return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assets?.["Asset Name"] && task.assets["Asset Name"].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.plant_rooms?.["Block"] && task.plant_rooms["Block"].toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.type_of_task.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type_of_task === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const overdueTasks = tasks.filter(t => 
    new Date(t.due_date) < new Date() && t.status !== 'Completed'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
                </div>
                {isEngineer ? 'My Tasks' : 'Tasks'}
              </h1>
              <p className="mt-2 text-white text-opacity-90 text-lg">
                {isEngineer ? 'Your assigned maintenance tasks' : 'Manage and track maintenance tasks'}
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                  {tasks.filter(t => t.status === 'Open').length} Open
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-error-400 rounded-full mr-2"></div>
                  {overdueTasks} Overdue
                </span>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleRunAutomation}
                disabled={runningAutomation}
                className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50"
              >
                {runningAutomation ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <BoltIcon className="-ml-1 mr-3 h-6 w-6" />
                    Run Automation
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Automation Result */}
      {automationResult && (
        <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
            <p className="text-sm text-success-700">{automationResult}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">Search Tasks</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="Search by task ID, asset name, or location..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="PPM">PPM</option>
              <option value="LGSR">LGSR</option>
              <option value="Corrective Maintenance">Corrective</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Assignment Modal */}
      {showAssignModal && taskToAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Assign Task</h3>
            <p className="text-sm text-secondary-600 mb-4">
              Assign task "{taskToAssign.task_id}" to a team member
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Select Team Member
              </label>
              <select
                value={selectedTeamMember}
                onChange={(e) => setSelectedTeamMember(e.target.value)}
                className="w-full rounded-lg border-secondary-300 focus:border-primary-500 focus:ring-primary-500"
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
                onClick={() => {
                  setShowAssignModal(false);
                  setTaskToAssign(null);
                }}
                className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTask}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'Completed';
          const daysOverdue = isOverdue ? Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

          return (
            <div
              key={task.id}
              className="group bg-white rounded-2xl border border-secondary-200 shadow-xl p-8 hover:shadow-2xl hover:-translate-y-2 hover:border-primary-300 transition-all duration-500 relative overflow-hidden cursor-pointer"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-3 mr-4 shadow-lg border border-primary-300">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900">
                        {task.assets?.["Asset Name"] || 'General Task'}
                      </h3>
                      <p className="text-base text-secondary-600 font-medium">
                        {task.plant_rooms?.["Block"]} • {task.type_of_task}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(task.status, task.due_date)}`}>
                      {isOverdue ? `Overdue (${daysOverdue}d)` : task.status}
                    </span>
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-secondary-600">
                  <div>
                    <span className="font-medium text-secondary-700">Task ID:</span>
                    <p className="text-secondary-900 font-mono">{task.task_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-secondary-700">Due Date:</span>
                    <p className={`text-secondary-900 ${isOverdue ? 'text-error-600 font-bold' : ''}`}>
                      {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-secondary-700">Assigned to:</span>
                    <p className="text-secondary-900">{task.team?.["Name"] || 'Unassigned'}</p>
                  </div>
                </div>

                {task.notes && (
                  <div className="mt-4 bg-secondary-50 p-4 rounded-lg">
                    <p className="text-sm text-secondary-700">{task.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-3">
                    {task.status !== 'Completed' && (isAdmin || task.assigned_to === userProfile?.id) && (
                      <>
                        {task.status === 'Open' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'In Progress')}
                            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                          >
                            Start Task
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/tasks/${task.id}/form`)}
                          className="px-4 py-2 bg-primary-100 text-primary-800 rounded-lg hover:bg-primary-200 transition-colors"
                        >
                          Fill Form
                        </button>
                        <button
                          onClick={() => updateTaskStatus(task.id, 'Completed')}
                          className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                  
                  {isAdmin && !task.assigned_to && (
                    <button
                      onClick={() => {
                        setTaskToAssign(task);
                        setSelectedTeamMember('');
                        setShowAssignModal(true);
                      }}
                      className="px-4 py-2 bg-accent-100 text-accent-800 rounded-lg hover:bg-accent-200 transition-colors flex items-center"
                    >
                      <UserIcon className="w-4 h-4 mr-1" />
                      Assign
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-24">
          <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-2xl border border-primary-200">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 inline-block mb-8 shadow-xl">
              <ClipboardDocumentListIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              {tasks.length === 0 ? 'No tasks found' : 'No matching tasks'}
            </h3>
            <p className="text-secondary-600 mb-10 leading-relaxed text-lg">
              {tasks.length === 0 
                ? 'Tasks will appear here once they are created.' 
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;