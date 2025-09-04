import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CogIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  PhotoIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface PlantRoomDetail {
  id: string;
  "Plant Room ID": string;
  "Block": string;
  "Address": string;
  "Postcode": string;
  "Plant Room Type": string;
  photo?: string;
  created_at: string;
  last_lgsr_date?: string;
  domestic_classification?: string;
}

interface Asset {
  id: string;
  "Asset ID": string;
  "Asset Name": string;
  "Asset Type": string;
  "Operational": boolean;
  "Frequency": string;
  "Last Service Date": string;
}

interface Task {
  id: string;
  task_id: string;
  type_of_task: string;
  status: string;
  due_date: string;
  priority: string;
  assets?: {
    "Asset Name": string;
  };
}

const PlantRoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [plantRoom, setPlantRoom] = useState<PlantRoomDetail | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editPlantRoom, setEditPlantRoom] = useState({
    "Block": '',
    "Address": '',
    "Postcode": '',
    "Plant Room Type": '',
    last_lgsr_date: '',
    domestic_classification: 'Non-Domestic'
  });

  const isAdmin = userProfile?.Role === 'Admin';

  useEffect(() => {
    if (id && id !== undefined) {
      fetchPlantRoomDetails();
    }
  }, [id]);

  const fetchPlantRoomDetails = async () => {
    try {
      setLoading(true);

      // Fetch plant room details
      const { data: plantRoomData, error: plantRoomError } = await supabase
        .from('plant_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (plantRoomError) throw plantRoomError;
      setPlantRoom(plantRoomData);

      // Fetch assets in this plant room
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('"Plant Room ID"', plantRoomData["Plant Room ID"])
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;
      setAssets(assetsData || []);

      // Fetch tasks related to this plant room
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assets("Asset Name")
        `)
        .eq('plant_room_id', id)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (error) {
      console.error('Error fetching plant room details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!plantRoom) return;
    
    setEditPlantRoom({
      "Block": plantRoom["Block"],
      "Address": plantRoom["Address"],
      "Postcode": plantRoom["Postcode"],
      "Plant Room Type": plantRoom["Plant Room Type"],
      last_lgsr_date: plantRoom.last_lgsr_date || '',
      domestic_classification: plantRoom.domestic_classification || 'Non-Domestic'
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantRoom) return;

    try {
      const { error } = await supabase
        .from('plant_rooms')
        .update({
          "Block": editPlantRoom["Block"],
          "Address": editPlantRoom["Address"],
          "Postcode": editPlantRoom["Postcode"],
          "Plant Room Type": editPlantRoom["Plant Room Type"],
          last_lgsr_date: editPlantRoom.last_lgsr_date || null,
          domestic_classification: editPlantRoom.domestic_classification,
          updated_at: new Date().toISOString()
        })
        .eq('id', plantRoom.id);

      if (error) throw error;

      setShowEditForm(false);
      fetchPlantRoomDetails(); // Refresh the data
    } catch (error) {
      console.error('Error updating plant room:', error);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !plantRoom) return;

    // Check file size (limit to 5MB for base64 storage)
    if (selectedPhoto.size > 5 * 1024 * 1024) {
      alert('Photo file is too large. Please select a file smaller than 5MB.');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Convert file to base64 for storage
      const reader = new FileReader();
      
      // Use Promise to handle FileReader properly
      const base64String = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(selectedPhoto);
      });
      
      
      const { error } = await supabase
        .from('plant_rooms')
        .update({
          photo: base64String,
          updated_at: new Date().toISOString()
        })
        .eq('id', plantRoom.id);

      if (error) {
        throw new Error(`Failed to save photo: ${error.message}`);
      }

      
      // Update local state immediately
      setPlantRoom(prev => prev ? { ...prev, photo: base64String } : prev);
      
      setSelectedPhoto(null);
      
      // Don't auto-refresh - let the local state persist
      // User can manually refresh the page if needed
      
      alert('Photo uploaded successfully!');
      
    } catch (error) {
      alert(`Photo upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusColor = (operational: boolean) => {
    return operational
      ? 'bg-success-100 text-success-800'
      : 'bg-error-100 text-error-800';
  };

  const getTaskStatusColor = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'Completed';
    if (isOverdue) return 'bg-error-100 text-error-800';
    
    switch (status) {
      case 'Completed':
        return 'bg-success-100 text-success-800';
      case 'In Progress':
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

  if (!plantRoom) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900">Plant room not found</h3>
        <button
          onClick={() => navigate('/plant-rooms')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Plant Rooms
        </button>
      </div>
    );
  }

  const operationalAssets = assets.filter(a => a["Operational"]).length;
  const overdueTasks = tasks.filter(t => 
    new Date(t.due_date) < new Date() && t.status !== 'Completed'
  ).length;

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/plant-rooms')}
          className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-6 transition-all duration-200 hover:translate-x-1"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Plant Rooms
        </button>
        
        {/* Hero Section */}
        <div className="gradient-bg rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BuildingOfficeIcon className="mr-3 h-8 w-8 text-primary-600" />
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-white">
                  {plantRoom["Block"]}
                </h1>
                <p className="text-white text-opacity-80 text-lg">
                  {plantRoom["Plant Room Type"]} Plant Room
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white backdrop-blur-sm">
                    ID: {plantRoom["Plant Room ID"]}
                  </span>
                  <span className="text-white text-opacity-70 text-sm">
                    Created {format(new Date(plantRoom.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-3 rounded-xl border border-white border-opacity-30 text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200 backdrop-blur-sm"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Details
            </button>
          </div>
        </div>
      </div>

      {/* Edit Plant Room Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Plant Room</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Block
                </label>
                <input
                  type="text"
                  required
                  value={editPlantRoom["Block"]}
                  onChange={(e) => setEditPlantRoom({...editPlantRoom, "Block": e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  required
                  value={editPlantRoom["Address"]}
                  onChange={(e) => setEditPlantRoom({...editPlantRoom, "Address": e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  required
                  value={editPlantRoom["Postcode"]}
                  onChange={(e) => setEditPlantRoom({...editPlantRoom, "Postcode": e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Plant Room Type
                </label>
                <select
                  value={editPlantRoom["Plant Room Type"]}
                  onChange={(e) => setEditPlantRoom({...editPlantRoom, "Plant Room Type": e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Water Treatment">Water Treatment</option>
                  <option value="General">General</option>
                  <option value="Fresh Water Booster Pumps">Fresh Water Booster Pumps</option>
                  <option value="Community Hall">Community Hall</option>
                  <option value="Gas Heat Generating">Gas Heat Generating</option>
                  <option value="Concierge">Concierge</option>
                </select>
              </div>
              {(editPlantRoom["Plant Room Type"].includes("Gas Heat Generating") || 
                editPlantRoom["Plant Room Type"].includes("Community Hall") || 
                editPlantRoom["Plant Room Type"].includes("Concierge")) && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Last LGSR Date
                  </label>
                  <input
                    type="date"
                    value={editPlantRoom.last_lgsr_date}
                    onChange={(e) => setEditPlantRoom({...editPlantRoom, last_lgsr_date: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}
              {(editPlantRoom["Plant Room Type"].includes("Gas Heat Generating") || 
                editPlantRoom["Plant Room Type"].includes("Community Hall") || 
                editPlantRoom["Plant Room Type"].includes("Concierge")) && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Classification
                  </label>
                  <select
                    value={editPlantRoom.domestic_classification}
                    onChange={(e) => setEditPlantRoom({...editPlantRoom, domestic_classification: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Non-Domestic">Non-Domestic</option>
                    <option value="Domestic">Domestic</option>
                  </select>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Update Plant Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plant Room Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Location Details */}
        <div className="bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Location Details
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="group">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                <span className="text-sm font-semibold text-secondary-700 uppercase tracking-wide">Address</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-secondary-900">{plantRoom["Address"]}</p>
                  <p className="text-secondary-600 font-medium">{plantRoom["Postcode"]}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plantRoom["Address"] + ", " + plantRoom["Postcode"])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-sm font-semibold text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg transform hover:scale-105"
                >
                  View on Map
                </a>
              </div>
            </div>
            
            <div className="group">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-accent-500 rounded-full mr-3"></div>
                <span className="text-sm font-semibold text-secondary-700 uppercase tracking-wide">Plant Room Type</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center px-4 py-2 bg-accent-100 text-accent-800 rounded-lg font-medium border border-accent-300">
                  <CogIcon className="w-4 h-4 mr-2" />
                  {plantRoom["Plant Room Type"]}
                </div>
                {(plantRoom["Plant Room Type"].includes("Gas Heat Generating") || 
                  plantRoom["Plant Room Type"].includes("Community Hall") || 
                  plantRoom["Plant Room Type"].includes("Concierge")) && (
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium border ${
                    (plantRoom.domestic_classification || 'Non-Domestic') === 'Domestic'
                      ? 'bg-success-100 text-success-800 border-success-300'
                      : 'bg-warning-100 text-warning-800 border-warning-300'
                  }`}>
                    <HomeIcon className="w-4 h-4 mr-2" />
                    {plantRoom.domestic_classification || 'Non-Domestic'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="group">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></div>
                <span className="text-sm font-semibold text-secondary-700 uppercase tracking-wide">Established</span>
              </div>
              <p className="text-lg font-medium text-secondary-900">{format(new Date(plantRoom.created_at), 'MMM dd, yyyy')}</p>
            </div>
            
            {plantRoom["Plant Room Type"] === "Gas Heat Generating" && (
              <div className="group">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-warning-500 rounded-full mr-3"></div>
                  <span className="text-sm font-semibold text-secondary-700 uppercase tracking-wide">Last LGSR</span>
                </div>
                <p className="text-lg font-medium text-secondary-900">
                  {plantRoom.last_lgsr_date ? format(new Date(plantRoom.last_lgsr_date), 'MMM dd, yyyy') : 'Not recorded'}
                </p>
                {plantRoom.last_lgsr_date && (
                  <p className="text-sm text-warning-600 mt-1">
                    Next LGSR due: {format(new Date(new Date(plantRoom.last_lgsr_date).getTime() + (6 * 30 * 24 * 60 * 60 * 1000)), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Plant Room Photo */}
        <div className="bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <PhotoIcon className="h-5 w-5 mr-2" />
              Plant Room Photo
            </h3>
          </div>
          
          <div className="p-6">
          {plantRoom.photo ? (
            <div className="space-y-4">
              <div className="w-full h-64 bg-secondary-100 rounded-xl overflow-hidden border border-secondary-200 shadow-inner">
                <img
                  src={plantRoom.photo}
                  alt={`${plantRoom["Block"]} Plant Room`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="flex space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-secondary-300 rounded-lg text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:border-secondary-400 transition-all duration-200"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  Change Photo
                </label>
                {selectedPhoto && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                )}
              </div>
              {selectedPhoto && (
                <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded-md">
                  <p className="text-sm text-primary-700">
                    📎 {selectedPhoto.name} ({(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full h-64 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl flex items-center justify-center border-2 border-dashed border-secondary-300 hover:border-primary-400 transition-colors duration-200">
                <div className="text-center p-6">
                  <div className="bg-secondary-200 rounded-full p-4 inline-block mb-4">
                    <PhotoIcon className="h-8 w-8 text-secondary-500" />
                  </div>
                  <p className="text-secondary-600 font-medium">No photo uploaded</p>
                  <p className="text-sm text-secondary-500 mt-1">Upload a photo to showcase this plant room</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-3 border border-dashed border-primary-300 rounded-lg text-sm font-semibold text-primary-700 hover:bg-primary-50 hover:border-primary-400 transition-all duration-200"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  Select Photo
                </label>
                {selectedPhoto && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="px-4 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                )}
              </div>
              {selectedPhoto && (
                <div className="mt-2 p-3 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg">
                  <p className="text-sm text-primary-700">
                    📎 {selectedPhoto.name} ({(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 card-hover">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-xl p-3">
                <CogIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">Total Assets</p>
                <p className="text-3xl font-bold text-secondary-900">{assets.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 card-hover">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-success-100 rounded-xl p-3">
                <CogIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">Operational</p>
                <p className="text-3xl font-bold text-success-600">{operationalAssets}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 card-hover">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-accent-100 rounded-xl p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">Total Tasks</p>
                <p className="text-3xl font-bold text-secondary-900">{tasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 card-hover">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-error-100 rounded-xl p-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-error-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">Overdue Tasks</p>
                <p className="text-3xl font-bold text-error-600">{overdueTasks}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets */}
        <div className="bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Equipment & Assets
            </h3>
            {isAdmin && (
              <button
                onClick={() => navigate('/assets')}
                className="text-sm text-white hover:text-primary-200 transition-colors font-medium"
              >
                View All →
              </button>
            )}
          </div>
          <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
            {assets.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-secondary-100 rounded-full p-4 inline-block mb-3">
                  <CogIcon className="h-8 w-8 text-secondary-400" />
                </div>
                <p className="text-secondary-600 font-medium">No assets in this plant room</p>
                <p className="text-sm text-secondary-500 mt-1">Add equipment to start tracking maintenance</p>
              </div>
            ) : (
              assets.map((asset) => (
                <div key={asset.id} className="p-4 hover:bg-secondary-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-secondary-900 flex items-center">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                        {asset["Asset Name"]}
                      </h4>
                      <p className="text-xs text-secondary-600 ml-4">
                        {asset["Asset Type"]} • {asset["Frequency"]} Maintenance
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(asset["Operational"])}`}>
                      {asset["Operational"] ? 'Operational' : 'Out of Service'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Maintenance Tasks
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-white hover:text-accent-200 transition-colors font-medium"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-secondary-100 rounded-full p-4 inline-block mb-3">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-secondary-400" />
                </div>
                <p className="text-secondary-600 font-medium">No tasks scheduled</p>
                <p className="text-sm text-secondary-500 mt-1">All maintenance is up to date</p>
              </div>
            ) : (
              tasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'Completed';
                return (
                  <div key={task.id} className="p-4 hover:bg-secondary-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-secondary-900 flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${isOverdue ? 'bg-error-500' : task.status === 'Completed' ? 'bg-success-500' : 'bg-warning-500'}`}></div>
                          {task.assets?.["Asset Name"] || 'General Task'}
                        </h4>
                        <p className="text-xs text-secondary-600 ml-4">
                          {task.type_of_task} • Due {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTaskStatusColor(task.status, task.due_date)}`}>
                        {isOverdue ? 'Overdue' : task.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantRoomDetails;