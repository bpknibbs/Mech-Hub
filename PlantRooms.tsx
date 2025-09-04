import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './src/lib/supabase';
import {
  PlusIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface PlantRoom {
  id: string;
  "Plant Room ID": string;
  "Block": string;
  "Address": string;
  "Postcode": string;
  "Plant Room Type": string;
  photo?: string;
  created_at: string;
  updated_at: string;
  last_lgsr_date?: string;
  domestic_classification?: string;
}

interface Asset {
  id: string;
  "Asset ID": string;
  "Asset Name": string;
  "Asset Type": string;
  "Operational": boolean;
  "Plant Room ID": string;
}

const PlantRooms: React.FC = () => {
  const navigate = useNavigate();
  const [plantRooms, setPlantRooms] = useState<PlantRoom[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<PlantRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newRoom, setNewRoom] = useState({
    plantRoomId: '',
    block: '',
    address: '',
    postcode: '',
    plantRoomType: 'Fresh Water Booster Pumps',
    lastLgsrDate: '',
    domesticClassification: 'Non-Domestic'
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchPlantRooms();
    fetchAssets();
  }, []);

  const fetchPlantRooms = async () => {
    try {
      console.log('Attempting to fetch plant rooms...');
      const { data, error } = await supabase
        .from('plant_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      console.log('Supabase response:', { data, error });
      
      if (error) throw error;
      
      // Sort numerically by Plant Room ID
      const sortedData = (data || []).sort((a, b) => {
        const idA = parseInt(a["Plant Room ID"]) || 0;
        const idB = parseInt(b["Plant Room ID"]) || 0;
        return idA - idB;
      });
      
      setPlantRooms(sortedData);
    } catch (error) {
      console.error('Error fetching plant rooms:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      setError(`Failed to load plant rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, "Asset ID", "Asset Name", "Asset Type", "Operational", "Plant Room ID"');

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const getAssetStats = (plantRoomId: string) => {
    const roomAssets = assets.filter(asset => asset["Plant Room ID"] === plantRoomId);
    const operational = roomAssets.filter(asset => asset["Operational"]).length;
    return { total: roomAssets.length, operational };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase
        .from('plant_rooms')
        .insert([{
          "Plant Room ID": newRoom.plantRoomId,
          "Block": newRoom.block,
          "Address": newRoom.address,
          "Postcode": newRoom.postcode,
          "Plant Room Type": newRoom.plantRoomType,
          last_lgsr_date: newRoom.lastLgsrDate || null,
          domestic_classification: newRoom.domesticClassification
        }]);

      if (error) throw error;

      setSuccess('Plant room added successfully!');
      setNewRoom({
        plantRoomId: '',
        block: '',
        address: '',
        postcode: '',
        plantRoomType: 'Fresh Water Booster Pumps',
        lastLgsrDate: '',
        domesticClassification: 'Non-Domestic'
      });
      setShowAddForm(false);
      fetchPlantRooms();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error creating plant room:', error);
      setError(`Error adding plant room: ${error.message || error}`);
    }
  };

  const handleEdit = (room: PlantRoom) => {
    setEditingRoom(room);
    setNewRoom({
      plantRoomId: room["Plant Room ID"],
      block: room["Block"],
      address: room["Address"],
      postcode: room["Postcode"],
      plantRoomType: room["Plant Room Type"],
      lastLgsrDate: room.last_lgsr_date || '',
      domesticClassification: room.domestic_classification || 'Non-Domestic'
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!editingRoom) return;

    try {
      const { error } = await supabase
        .from('plant_rooms')
        .update({
          "Block": newRoom.block,
          "Address": newRoom.address,
          "Postcode": newRoom.postcode,
          "Plant Room Type": newRoom.plantRoomType,
          last_lgsr_date: newRoom.lastLgsrDate || null,
          domestic_classification: newRoom.domesticClassification,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRoom.id);

      if (error) throw error;

      setSuccess('Plant room updated successfully!');
      setNewRoom({
        plantRoomId: '',
        block: '',
        address: '',
        postcode: '',
        plantRoomType: 'Fresh Water Booster Pumps',
        lastLgsrDate: '',
        domesticClassification: 'Non-Domestic'
      });
      setShowEditForm(false);
      setEditingRoom(null);
      fetchPlantRooms();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating plant room:', error);
      setError(`Error updating plant room: ${error.message || error}`);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this plant room?')) return;

    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('plant_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      setSuccess('Plant room deleted successfully!');
      fetchPlantRooms();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting plant room:', error);
      setError(`Error deleting plant room: ${error.message || error}`);
    }
  };

  const getPlantRoomTypeColor = (type: string) => {
    switch (type) {
      case 'Fresh Water Booster Pumps':
        return 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800 border-primary-300';
      case 'Community Hall':
        return 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800 border-accent-300';
      case 'Gas Heat Generating':
        return 'bg-gradient-to-br from-warning-100 to-warning-200 text-warning-800 border-warning-300';
      case 'Concierge':
        return 'bg-gradient-to-br from-secondary-100 to-secondary-200 text-secondary-800 border-secondary-300';
      default:
        return 'bg-gradient-to-br from-secondary-100 to-secondary-200 text-secondary-800 border-secondary-300';
    }
  };

  const getDomesticClassificationColor = (classification: string) => {
    return classification === 'Domestic'
      ? 'bg-gradient-to-br from-success-100 to-success-200 text-success-800 border-success-300'
      : 'bg-gradient-to-br from-warning-100 to-warning-200 text-warning-800 border-warning-300';
  };

  const plantRoomTypes = [
    'Fresh Water Booster Pumps',
    'Community Hall',
    'Gas Heat Generating',
    'Concierge'
  ];

  // Filter and search plant rooms
  const filteredPlantRooms = plantRooms.filter(room => {
    const matchesSearch = 
      room["Plant Room ID"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      room["Block"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      room["Address"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      room["Postcode"].toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || room["Plant Room Type"].includes(filterType);
    
    return matchesSearch && matchesFilter;
  });

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
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative sm:flex sm:items-center sm:justify-between">
          <div className="text-white">
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl mr-4 backdrop-blur-sm shadow-lg">
                <BuildingOfficeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Plant Rooms</h1>
                <p className="text-xl text-white text-opacity-90">
                  Manage plant room locations and facilities
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl shadow-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
            >
              <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
              Add Plant Room
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-gradient-to-r from-success-50 to-success-100 border border-success-300 rounded-2xl p-6 shadow-lg">
          <div className="flex">
            <CheckCircleIcon className="h-6 w-6 text-success-500 mr-4" />
            <p className="text-lg font-semibold text-success-800">{success}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-gradient-to-r from-error-50 to-error-100 border border-error-300 rounded-2xl p-6 shadow-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-error-500 mr-4" />
            <p className="text-lg font-semibold text-error-800">{error}</p>
          </div>
        </div>
      )}

      {/* Add Plant Room Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl border border-secondary-200">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-6 mb-6 text-white">
              <h3 className="text-2xl font-bold">Add New Plant Room</h3>
              <p className="text-white text-opacity-90 mt-2">Create a new plant room location</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-error-50 to-error-100 border border-error-300 rounded-xl p-4">
                  <p className="text-sm font-semibold text-error-700">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Plant Room ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.plantRoomId}
                    onChange={(e) => setNewRoom({...newRoom, plantRoomId: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Block/Building
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.block}
                    onChange={(e) => setNewRoom({...newRoom, block: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.address}
                    onChange={(e) => setNewRoom({...newRoom, address: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.postcode}
                    onChange={(e) => setNewRoom({...newRoom, postcode: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Plant Room Type
                  </label>
                  <select
                    value={newRoom.plantRoomType}
                    onChange={(e) => setNewRoom({...newRoom, plantRoomType: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    {plantRoomTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(newRoom.plantRoomType.includes("Gas Heat Generating") || 
                newRoom.plantRoomType.includes("Community Hall") || 
                newRoom.plantRoomType.includes("Concierge")) && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-secondary-700 mb-2">
                  Last LGSR Date (Optional)
                </label>
                <input
                  type="date"
                  value={newRoom.lastLgsrDate}
                  onChange={(e) => setNewRoom({...newRoom, lastLgsrDate: e.target.value})}
                  className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                />
                <p className="text-sm text-secondary-600 mt-2">
                  Gas-related plant rooms require LGSR every 6 months
                </p>
              </div>
              )}
              {(newRoom.plantRoomType.includes("Gas Heat Generating") || 
                newRoom.plantRoomType.includes("Community Hall") || 
                newRoom.plantRoomType.includes("Concierge")) && (
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Classification
                  </label>
                  <select
                    value={newRoom.domesticClassification}
                    onChange={(e) => setNewRoom({...newRoom, domesticClassification: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    <option value="Non-Domestic">Non-Domestic</option>
                    <option value="Domestic">Domestic</option>
                  </select>
                </div>
              )}
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-6 py-4 border-2 border-secondary-300 rounded-xl text-lg font-bold text-secondary-700 hover:bg-secondary-50 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 border border-transparent rounded-xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 hover:from-primary-700 hover:via-primary-800 hover:to-accent-800 transition-all duration-300 transform hover:scale-105"
                >
                  Add Plant Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plant Room Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl border border-secondary-200">
            <div className="bg-gradient-to-r from-accent-600 to-primary-600 rounded-2xl p-6 mb-6 text-white">
              <h3 className="text-2xl font-bold">Edit Plant Room</h3>
              <p className="text-white text-opacity-90 mt-2">Update plant room information</p>
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-error-50 to-error-100 border border-error-300 rounded-xl p-4">
                  <p className="text-sm font-semibold text-error-700">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Plant Room ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={newRoom.plantRoomId}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg bg-secondary-50 text-secondary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Block/Building
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.block}
                    onChange={(e) => setNewRoom({...newRoom, block: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.address}
                    onChange={(e) => setNewRoom({...newRoom, address: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.postcode}
                    onChange={(e) => setNewRoom({...newRoom, postcode: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Plant Room Type
                  </label>
                  <select
                    value={newRoom.plantRoomType}
                    onChange={(e) => setNewRoom({...newRoom, plantRoomType: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    {plantRoomTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(newRoom.plantRoomType.includes("Gas Heat Generating") || 
                newRoom.plantRoomType.includes("Community Hall") || 
                newRoom.plantRoomType.includes("Concierge")) && (
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Classification
                  </label>
                  <select
                    value={newRoom.domesticClassification}
                    onChange={(e) => setNewRoom({...newRoom, domesticClassification: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    <option value="Non-Domestic">Non-Domestic</option>
                    <option value="Domestic">Domestic</option>
                  </select>
                </div>
              )}
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingRoom(null);
                  }}
                  className="flex-1 px-6 py-4 border-2 border-secondary-300 rounded-xl text-lg font-bold text-secondary-700 hover:bg-secondary-50 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 border border-transparent rounded-xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-accent-600 via-accent-700 to-primary-700 hover:from-accent-700 hover:via-accent-800 hover:to-primary-800 transition-all duration-300 transform hover:scale-105"
                >
                  Update Plant Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-secondary-700 mb-2">
              Search Plant Rooms
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="Search by ID, block, address, or postcode..."
              />
            </div>
          </div>
          
          <div className="md:ml-6">
            <label htmlFor="filter" className="block text-sm font-medium text-secondary-700 mb-2">
              Filter by Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <select
                id="filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-8 py-3 border border-secondary-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 appearance-none bg-white"
              >
                <option value="all">All Types</option>
                {plantRoomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Search Results Info */}
        {(searchTerm || filterType !== 'all') && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <p className="text-sm text-secondary-600">
              Showing {filteredPlantRooms.length} of {plantRooms.length} plant rooms
              {searchTerm && ` matching "${searchTerm}"`}
              {filterType !== 'all' && ` filtered by ${filterType}`}
            </p>
            {filteredPlantRooms.length === 0 && (
              <p className="text-sm text-secondary-500 mt-2">
                No plant rooms match your search criteria. Try adjusting your search terms or filters.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Plant Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlantRooms.map((room) => {
          const assetStats = getAssetStats(room["Plant Room ID"]);
          return (
            <div
              key={room.id}
              className="group bg-white overflow-hidden shadow-2xl rounded-3xl border border-secondary-200 hover:shadow-3xl hover:-translate-y-4 hover:border-primary-300 transition-all duration-500 relative cursor-pointer"
              onClick={() => navigate(`/plant-rooms/${room.id}`)}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-accent-50/30 pointer-events-none"></div>
              
              {/* Header with Plant Room Type */}
              <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center text-white">
                    <div className="bg-white bg-opacity-25 p-3 rounded-xl mr-4 backdrop-blur-sm shadow-lg border border-white border-opacity-30 overflow-hidden">
                      {room.photo ? (
                        <img 
                          src={room.photo} 
                          alt={`${room["Block"]} Plant Room`}
                          className="h-6 w-6 object-cover rounded"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <BuildingOfficeIcon className={`h-6 w-6 text-white ${room.photo ? 'hidden' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {room["Block"]}
                      </h3>
                      <p className="text-white text-opacity-80 text-sm font-medium">ID: {room["Plant Room ID"]}</p>
                    </div>
                  </div>
                </div>
                
                {/* Plant Room Type Badge */}
                <div className="relative mt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getPlantRoomTypeColor(room["Plant Room Type"])} shadow-lg backdrop-blur-sm`}>
                      <CogIcon className="w-4 h-4 mr-2" />
                      {room["Plant Room Type"]}
                    </span>
                    {(room["Plant Room Type"].includes("Gas Heat Generating") || 
                      room["Plant Room Type"].includes("Community Hall") || 
                      room["Plant Room Type"].includes("Concierge")) && (
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getDomesticClassificationColor(room.domestic_classification || 'Non-Domestic')} shadow-lg backdrop-blur-sm`}>
                        <HomeIcon className="w-4 h-4 mr-2" />
                        {room.domestic_classification || 'Non-Domestic'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="relative p-6">
                
                {/* Location Section */}
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-5 mb-6 border border-secondary-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-primary-500 p-2 rounded-lg mr-3 shadow-md">
                        <MapPinIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-secondary-900 font-bold text-lg">{room["Address"]}</p>
                        <p className="text-secondary-600 font-medium">{room["Postcode"]}</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room["Address"] + ", " + room["Postcode"])}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-primary-300 text-primary-800 rounded-xl text-sm font-bold hover:from-primary-200 hover:to-primary-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                      View Map
                    </a>
                  </div>
                </div>

                {/* Assets Stats */}
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full mr-3 shadow-lg"></div>
                    <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Asset Overview</h4>
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-5 border border-accent-200 shadow-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary-900 mb-1">{assetStats.total}</div>
                      <div className="text-sm font-semibold text-secondary-600">Total Assets</div>
                    </div>
                    <div className="w-1 h-12 bg-gradient-to-b from-accent-300 to-accent-400 rounded-full"></div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-1 ${assetStats.operational === assetStats.total ? 'text-success-600' : 'text-warning-600'}`}>
                        {assetStats.operational}
                      </div>
                      <div className="text-sm font-semibold text-secondary-600">Operational</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-secondary-500 mb-6 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-200 shadow-lg">
                  <span className="font-semibold">Created:</span> {new Date(room.created_at).toLocaleDateString()}
                </div>
                
                <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/plant-rooms/${room.id}`)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-primary-300 text-primary-800 rounded-xl text-sm font-bold hover:from-primary-200 hover:to-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEdit(room)}
                    className="px-4 py-3 bg-gradient-to-r from-accent-100 to-accent-200 border-2 border-accent-300 rounded-xl text-sm font-bold text-accent-800 hover:from-accent-200 hover:to-accent-300 focus:outline-none focus:ring-4 focus:ring-accent-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="px-4 py-3 bg-gradient-to-r from-error-100 to-error-200 border-2 border-error-300 rounded-xl text-sm font-bold text-error-800 hover:from-error-200 hover:to-error-300 focus:outline-none focus:ring-4 focus:ring-error-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {plantRooms.length === 0 && !loading && (
        <div className="text-center py-24">
          <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-3xl border border-primary-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-accent-100/30"></div>
            <div className="relative bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl p-8 inline-block mb-8 shadow-2xl">
              <HomeIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="relative text-2xl font-bold text-secondary-900 mb-4">No plant rooms</h3>
            <p className="relative text-secondary-600 mb-10 leading-relaxed text-lg">
              Get started by adding your first plant room location.
            </p>
            <div className="relative">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-8 py-4 border border-transparent shadow-2xl text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 hover:from-primary-700 hover:via-accent-800 hover:to-accent-800 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-110 hover:shadow-3xl"
              >
                <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                Add Plant Room
              </button>
            </div>
          </div>
        </div>
      )}
      
      {plantRooms.length > 0 && filteredPlantRooms.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-secondary-50 via-white to-primary-50 rounded-2xl p-12 max-w-md mx-auto shadow-lg border border-secondary-200">
            <div className="bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-xl p-6 inline-block mb-6 shadow-lg">
              <MagnifyingGlassIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-3">No results found</h3>
            <p className="text-secondary-600 mb-6">
              No plant rooms match your search criteria. Try adjusting your search terms or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantRooms;