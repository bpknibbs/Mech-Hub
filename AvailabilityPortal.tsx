import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface AvailabilityRequest {
  id: string;
  engineer_id: string;
  start_date: string;
  end_date: string;
  type: 'annual_leave' | 'sick_leave' | 'training' | 'unavailable';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  team?: {
    "Name": string;
  };
  approver?: {
    "Name": string;
  };
}

interface TeamMember {
  id: string;
  "Name": string;
  "Email": string;
  "Role": string;
}

const AvailabilityPortal: React.FC = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<AvailabilityRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    engineer_id: '',
    start_date: '',
    end_date: '',
    type: 'annual_leave' as 'annual_leave' | 'sick_leave' | 'training' | 'unavailable',
    reason: ''
  });

  const isManager = userProfile?.Role === 'Admin' || userProfile?.Role === 'Access All' || userProfile?.Role === 'Manager';
  const isEngineer = userProfile?.Role === 'Engineer';

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch availability requests
      let requestsQuery = supabase
        .from('availability')
        .select(`
          *,
          team!availability_engineer_id_fkey("Name"),
          approver:team!availability_approved_by_fkey("Name")
        `)
        .order('created_at', { ascending: false });

      // Engineers only see their own requests
      if (isEngineer && userProfile?.id) {
        requestsQuery = requestsQuery.eq('engineer_id', userProfile.id);
      }

      const { data: requestsData, error: requestsError } = await requestsQuery;
      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch team members (for managers to create requests for others)
      if (isManager) {
        const { data: teamData, error: teamError } = await supabase
          .from('team')
          .select('id, "Name", "Email", "Role"')
          .neq('"Role"', 'Viewer')
          .order('"Name"');

        if (teamError) throw teamError;
        setTeamMembers(teamData || []);
      }

    } catch (error) {
      console.error('Error fetching availability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const requestData = {
        ...newRequest,
        engineer_id: newRequest.engineer_id || userProfile?.id
      };

      const { error } = await supabase
        .from('availability')
        .insert([requestData]);

      if (error) throw error;

      setNewRequest({
        engineer_id: '',
        start_date: '',
        end_date: '',
        type: 'annual_leave',
        reason: ''
      });
      setShowRequestForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating availability request:', error);
    }
  };

  const handleEditRequest = (request: AvailabilityRequest) => {
    setEditingRequest(request);
    setNewRequest({
      engineer_id: request.engineer_id,
      start_date: request.start_date,
      end_date: request.end_date,
      type: request.type,
      reason: request.reason || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRequest) return;

    try {
      const requestData = {
        ...newRequest,
        engineer_id: newRequest.engineer_id || userProfile?.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('availability')
        .update(requestData)
        .eq('id', editingRequest.id);

      if (error) throw error;

      setNewRequest({
        engineer_id: '',
        start_date: '',
        end_date: '',
        type: 'annual_leave',
        reason: ''
      });
      setShowEditForm(false);
      setEditingRequest(null);
      fetchData();
    } catch (error) {
      console.error('Error updating availability request:', error);
    }
  };

  const handleApproveRequest = async (requestId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('availability')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: userProfile?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating availability request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'rejected':
        return 'bg-error-100 text-error-800 border-error-300';
      default:
        return 'bg-warning-100 text-warning-800 border-warning-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'annual_leave':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      case 'sick_leave':
        return 'bg-error-100 text-error-800 border-error-300';
      case 'training':
        return 'bg-accent-100 text-accent-800 border-accent-300';
      default:
        return 'bg-secondary-100 text-secondary-800 border-secondary-300';
    }
  };

  const getCurrentAvailability = () => {
    const today = new Date();
    return requests.filter(req => 
      req.status === 'approved' &&
      isWithinInterval(today, {
        start: parseISO(req.start_date),
        end: parseISO(req.end_date)
      })
    );
  };

  const currentlyOnLeave = getCurrentAvailability();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Modern Header */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
                {isEngineer ? 'My Availability' : 'Team Availability'}
              </h1>
              <p className="mt-2 text-white text-opacity-90 text-lg">
                {isEngineer ? 'Manage your leave requests and availability' : 'Review and approve team leave requests'}
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-warning-400 rounded-full mr-2"></div>
                  {requests.filter(r => r.status === 'pending').length} Pending
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                  {currentlyOnLeave.length} Currently On Leave
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowRequestForm(true)}
              className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
            >
              <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
              Request Leave
            </button>
          </div>
        </div>
      </div>

      {/* Currently On Leave Alert */}
      {currentlyOnLeave.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-warning-50 to-accent-50 rounded-2xl p-6 shadow-lg border border-warning-200">
          <h3 className="text-lg font-semibold text-warning-800 flex items-center mb-4">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Currently On Leave ({currentlyOnLeave.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyOnLeave.map((req) => (
              <div key={req.id} className="bg-white rounded-xl p-4 border border-warning-300">
                <h4 className="font-bold text-secondary-900">{req.team?.["Name"]}</h4>
                <p className="text-sm text-secondary-600">
                  {format(parseISO(req.start_date), 'MMM dd')} - {format(parseISO(req.end_date), 'MMM dd')}
                </p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getTypeColor(req.type)}`}>
                  {req.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Requests */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6">
        <h3 className="text-xl font-bold text-secondary-900 mb-6">
          {isEngineer ? 'My Leave Requests' : 'Team Leave Requests'}
        </h3>

        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="group bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 border border-secondary-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-secondary-900 flex items-center">
                    {request.team?.["Name"] || 'Unknown Engineer'}
                    {request.status === 'pending' && (
                      <ClockIcon className="w-4 h-4 ml-2 text-warning-600" />
                    )}
                  </h4>
                  <p className="text-sm text-secondary-600">
                    {format(parseISO(request.start_date), 'EEE, MMM dd')} - {format(parseISO(request.end_date), 'EEE, MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(request.type)}`}>
                    {request.type.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>

              {request.reason && (
                <div className="mb-4 bg-white rounded-lg p-4 border border-secondary-200">
                  <p className="text-sm text-secondary-700">{request.reason}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-secondary-500">
                  Requested: {format(parseISO(request.created_at), 'MMM dd, yyyy HH:mm')}
                  {request.approved_at && (
                    <span className="ml-4">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}: {format(parseISO(request.approved_at), 'MMM dd, yyyy')}
                      {request.approver && ` by ${request.approver["Name"]}`}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {/* Edit button for managers (any request) or engineers (own pending requests) */}
                  {((isManager) || (isEngineer && request.engineer_id === userProfile?.id && request.status === 'pending')) && (
                    <button
                      onClick={() => handleEditRequest(request)}
                      className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-accent-600 to-accent-700 text-white rounded-lg text-xs font-medium hover:from-accent-700 hover:to-accent-800 transition-all duration-200 transform hover:scale-105"
                    >
                      <PencilIcon className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                  )}
                  
                  {/* Approve/Reject buttons for pending requests (managers only) */}
                  {request.status === 'pending' && isManager && (
                    <>
                      <button
                        onClick={() => handleApproveRequest(request.id, true)}
                        className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-lg text-xs font-medium hover:from-success-700 hover:to-success-800 transition-all duration-200 transform hover:scale-105"
                      >
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id, false)}
                        className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-error-600 to-error-700 text-white rounded-lg text-xs font-medium hover:from-error-700 hover:to-error-800 transition-all duration-200 transform hover:scale-105"
                      >
                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-2xl border border-primary-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-accent-100/30"></div>
                <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 inline-block mb-8 shadow-xl">
                  <CalendarDaysIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="relative text-2xl font-bold text-secondary-900 mb-4">No leave requests</h3>
                <p className="relative text-secondary-600 mb-10 leading-relaxed text-lg">
                  {isEngineer ? 'Submit your first leave request to get started.' : 'Team leave requests will appear here.'}
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="inline-flex items-center px-8 py-4 border border-transparent shadow-2xl text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-110 hover:shadow-3xl"
                  >
                    <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                    Request Leave
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-3xl border border-secondary-200">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl p-4 mb-6 text-white text-center">
              <h3 className="text-xl font-bold">Request Leave</h3>
              <p className="text-white text-opacity-90 text-sm mt-1">Submit a new availability request</p>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {isManager && (
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Engineer
                  </label>
                  <select
                    required
                    value={newRequest.engineer_id}
                    onChange={(e) => setNewRequest({...newRequest, engineer_id: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-3"
                  >
                    <option value="">Select Engineer</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member["Name"]} ({member["Role"]})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-secondary-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({...newRequest, type: e.target.value as any})}
                  className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-3"
                >
                  <option value="annual_leave">Annual Leave</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="training">Training</option>
                  <option value="unavailable">Other Unavailability</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({...newRequest, start_date: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({...newRequest, end_date: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-3"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-secondary-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  rows={3}
                  placeholder="Provide additional details about your leave request..."
                  className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-3"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 px-4 py-3 border border-secondary-300 rounded-xl text-secondary-700 font-medium hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Request Form Modal */}
      {showEditForm && editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-3xl border border-secondary-200">
            <div className="bg-gradient-to-r from-accent-600 to-accent-700 rounded-xl p-4 mb-6 text-white text-center">
              <h3 className="text-xl font-bold">Edit Leave Request</h3>
              <p className="text-white text-opacity-90 text-sm mt-1">Modify existing availability request</p>
              <p className="text-xs text-white text-opacity-70 mt-2">
                Editing request for: {editingRequest.team?.["Name"]}
              </p>
            </div>
            
            <form onSubmit={handleUpdateRequest} className="space-y-6">
              {isManager && (
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Engineer
                  </label>
                  <select
                    required
                    value={newRequest.engineer_id}
                    onChange={(e) => setNewRequest({...newRequest, engineer_id: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-accent-500 focus:ring-accent-500 p-3"
                  >
                    <option value="">Select Engineer</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member["Name"]} ({member["Role"]})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-secondary-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({...newRequest, type: e.target.value as any})}
                  className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-accent-500 focus:ring-accent-500 p-3"
                >
                  <option value="annual_leave">Annual Leave</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="training">Training</option>
                  <option value="unavailable">Other Unavailability</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({...newRequest, start_date: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-accent-500 focus:ring-accent-500 p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({...newRequest, end_date: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-accent-500 focus:ring-accent-500 p-3"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-secondary-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  rows={3}
                  placeholder="Provide additional details about your leave request..."
                  className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-accent-500 focus:ring-accent-500 p-3"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingRequest(null);
                  }}
                  className="flex-1 px-4 py-3 border border-secondary-300 rounded-xl text-secondary-700 font-medium hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-accent-600 to-accent-700 text-white rounded-xl font-medium hover:from-accent-700 hover:to-accent-800 transition-all duration-200"
                >
                  Update Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPortal;