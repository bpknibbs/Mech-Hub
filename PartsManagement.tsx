import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Wrench as WrenchIcon,
  Package as PackageIcon,
  Truck as TruckIcon,
  Archive as ArchiveIcon
} from 'lucide-react';

interface PartsRequest {
  id: string;
  parts_request_id: string;
  task_id?: string;
  asset_id?: string;
  requested_by?: string;
  part_name: string;
  part_number?: string;
  manufacturer?: string;
  quantity: number;
  supplier?: string;
  estimated_cost?: number;
  urgency: string;
  status: string;
  order_date?: string;
  expected_delivery?: string;
  received_date?: string;
  installed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  tasks?: {
    task_id: string;
    type_of_task: string;
  };
  assets?: {
    "Asset Name": string;
    "Asset ID": string;
  };
  team?: {
    "Name": string;
  };
}

const PartsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.Role === 'Admin' || userProfile?.Role === 'Access All';

  useEffect(() => {
    fetchPartsRequests();
  }, []);

  const fetchPartsRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_requests')
        .select(`
          *,
          tasks(task_id, type_of_task),
          assets("Asset Name", "Asset ID"),
          team("Name")
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartsRequests(data || []);
    } catch (error) {
      console.error('Error fetching parts requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePartsStatus = async (requestId: string, status: string, dateField?: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (dateField) {
        updateData[dateField] = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('parts_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
      fetchPartsRequests();
    } catch (error) {
      console.error('Error updating parts request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ordered':
        return 'bg-blue-100 text-blue-800';
      case 'Received':
        return 'bg-green-100 text-green-800';
      case 'Installed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative text-white">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                <PackageIcon className="h-8 w-8 text-white" />
              </div>
              Parts Management
            </h1>
            <p className="mt-2 text-white text-opacity-90 text-lg">
              Track parts requests and inventory
            </p>
            <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                {partsRequests.filter(p => p.status === 'Requested').length} Requested
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {partsRequests.filter(p => p.status === 'Received').length} Received
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Parts Requests */}
      <div className="space-y-6">
        {partsRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-2xl border border-secondary-200 shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <WrenchIcon className="w-6 h-6 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-bold text-secondary-900">
                    {request.part_name}
                  </h3>
                  <p className="text-secondary-600">
                    Qty: {request.quantity} • {request.assets?.["Asset Name"] || 'General'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getUrgencyColor(request.urgency)}`}>
                  {request.urgency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium text-secondary-700">Part Number:</span>
                <p className="text-secondary-900">{request.part_number || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-secondary-700">Manufacturer:</span>
                <p className="text-secondary-900">{request.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-secondary-700">Requested By:</span>
                <p className="text-secondary-900">{request.team?.["Name"] || 'Unknown'}</p>
              </div>
            </div>

            {isAdmin && request.status !== 'Installed' && request.status !== 'Cancelled' && (
              <div className="flex space-x-2">
                {request.status === 'Requested' && (
                  <button
                    onClick={() => updatePartsStatus(request.id, 'Ordered', 'order_date')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <TruckIcon className="w-4 h-4 inline mr-1" />
                    Mark Ordered
                  </button>
                )}
                {request.status === 'Ordered' && (
                  <button
                    onClick={() => updatePartsStatus(request.id, 'Received', 'received_date')}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <PackageIcon className="w-4 h-4 inline mr-1" />
                    Mark Received
                  </button>
                )}
                {request.status === 'Received' && (
                  <button
                    onClick={() => updatePartsStatus(request.id, 'Installed', 'installed_date')}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArchiveIcon className="w-4 h-4 inline mr-1" />
                    Mark Installed
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {partsRequests.length === 0 && (
          <div className="text-center py-24">
            <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-2xl border border-primary-200">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 inline-block mb-8 shadow-xl">
                <PackageIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">No parts requests</h3>
              <p className="text-secondary-600 leading-relaxed text-lg">
                Parts requests will appear here when needed for maintenance tasks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartsManagement;