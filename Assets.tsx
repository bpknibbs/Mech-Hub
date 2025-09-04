import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';
import {
  Plus as PlusIcon,
  Settings as CogIcon,
  MapPin as MapPinIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Search as MagnifyingGlassIcon,
  Filter as FunnelIcon,
  Clock as ClockIcon,
  Wrench as WrenchScrewdriverIcon
} from 'lucide-react';

interface Asset {
  id: string;
  "Asset ID": string;
  "Asset Name": string;
  "Asset Type": string;
  "Vessel Size"?: string;
  "Pre-Charge Pressure"?: string;
  "Manufacturer"?: string;
  "Model"?: string;
  "Serial Number"?: string;
  "Install Date"?: string;
  "Last Service Date"?: string;
  "Frequency": string;
  "Operational": boolean;
  "Photo"?: string;
  "QR Code"?: string;
  "Plant Room ID"?: string;
  created_at: string;
  updated_at: string;
  plant_rooms?: {
    "Block": string;
    "Address": string;
    "Plant Room Type": string;
  };
}

const Assets: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [plantRooms, setPlantRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newAsset, setNewAsset] = useState({
    assetName: '',
    assetType: 'Fresh Water Booster Pump',
    vesselSize: '',
    preChargePressure: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    installDate: '',
    lastServiceDate: '',
    frequency: 'Monthly',
    operational: true,
    plantRoomId: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const isAdmin = userProfile?.Role === 'Admin' || userProfile?.Role === 'Access All';

  useEffect(() => {
    fetchAssets();
    fetchPlantRooms();
  }, []);

  const fetchAssets = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          plant_rooms("Block", "Address", "Plant Room Type")
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Sort by Plant Room ID ascending (numerical then alphabetical)
      const sortedData = (data || []).sort((a, b) => {
        const aId = a["Plant Room ID"] || '';
        const bId = b["Plant Room ID"] || '';
        
        // Try to parse as numbers first
        const aNum = parseInt(aId);
        const bNum = parseInt(bId);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Fallback to string comparison
        return aId.localeCompare(bId);
      });
      
      setAssets(sortedData);
    } catch (error) {
      console.error('Error fetching assets:', error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (
        error instanceof TypeError && error.message.includes('Failed to fetch') ||
        error instanceof Error && error.message.includes('fetch')
      )) {
        console.log(`Retrying asset fetch... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchAssets(retryCount + 1);
        }, retryDelay * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Set a more user-friendly error message
      setError('Unable to load assets. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('plant_rooms')
        .select('id, "Plant Room ID", "Block"')
        .order('"Block"');

      if (error) throw error;
      setPlantRooms(data || []);
    } catch (error) {
      console.error('Error fetching plant rooms:', error);
    }
  };

  const generateQRCode = async (assetId: string): Promise<string> => {
    try {
      const qrUrl = `${window.location.origin}/assets/${assetId}`;
      return await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Generate unique Asset ID
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const generatedAssetId = `AST-${timestamp}-${randomSuffix}`;
      
      // Generate QR code for the new asset
      const qrCodeData = await generateQRCode(generatedAssetId);
      
      const { error } = await supabase
        .from('assets')
        .insert([{
          "Asset ID": generatedAssetId,
          "Asset Name": newAsset.assetName,
          "Asset Type": newAsset.assetType,
          "Vessel Size": newAsset.vesselSize || null,
          "Pre-Charge Pressure": newAsset.preChargePressure || null,
          "Manufacturer": newAsset.manufacturer || null,
          "Model": newAsset.model || null,
          "Serial Number": newAsset.serialNumber || null,
          "Install Date": newAsset.installDate || null,
          "Last Service Date": newAsset.lastServiceDate || null,
          "Frequency": newAsset.frequency,
          "Operational": newAsset.operational,
          "QR Code": qrCodeData,
          "Plant Room ID": newAsset.plantRoomId || null
        }]);

      if (error) throw error;

      setSuccess(`Asset added successfully with ID: ${generatedAssetId}`);
      setNewAsset({
        assetName: '',
        assetType: 'Fresh Water Booster Pump',
        vesselSize: '',
        preChargePressure: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        installDate: '',
        lastServiceDate: '',
        frequency: 'Monthly',
        operational: true,
        plantRoomId: ''
      });
      setShowAddForm(false);
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error creating asset:', error);
      setError(`Error adding asset: ${error.message || error}`);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setNewAsset({
      assetName: asset["Asset Name"],
      assetType: asset["Asset Type"],
      vesselSize: asset["Vessel Size"] || '',
      preChargePressure: asset["Pre-Charge Pressure"] || '',
      manufacturer: asset["Manufacturer"] || '',
      model: asset["Model"] || '',
      serialNumber: asset["Serial Number"] || '',
      installDate: asset["Install Date"] || '',
      lastServiceDate: asset["Last Service Date"] || '',
      frequency: asset["Frequency"],
      operational: asset["Operational"] ?? true,
      plantRoomId: asset["Plant Room ID"] || ''
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!editingAsset) return;

    try {
      const { error } = await supabase
        .from('assets')
        .update({
          "Asset Name": newAsset.assetName,
          "Asset Type": newAsset.assetType,
          "Vessel Size": newAsset.vesselSize || null,
          "Pre-Charge Pressure": newAsset.preChargePressure || null,
          "Manufacturer": newAsset.manufacturer || null,
          "Model": newAsset.model || null,
          "Serial Number": newAsset.serialNumber || null,
          "Install Date": newAsset.installDate || null,
          "Last Service Date": newAsset.lastServiceDate || null,
          "Frequency": newAsset.frequency,
          "Operational": newAsset.operational,
          "Plant Room ID": newAsset.plantRoomId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAsset.id);

      if (error) throw error;

      setSuccess('Asset updated successfully!');
      setNewAsset({
        assetName: '',
        assetType: 'Fresh Water Booster Pump',
        vesselSize: '',
        preChargePressure: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        installDate: '',
        lastServiceDate: '',
        frequency: 'Monthly',
        operational: true,
        plantRoomId: ''
      });
      setShowEditForm(false);
      setEditingAsset(null);
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating asset:', error);
      setError(`Error updating asset: ${error.message || error}`);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      setSuccess('Asset deleted successfully!');
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      setError(`Error deleting asset: ${error.message || error}`);
    }
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'Fresh Water Booster Pump':
      case 'Fresh Water Pump':
        return 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800 border-primary-300';
      case 'Heating Circulator Pump':
      case 'Hot Water Circulator Pump':
        return 'bg-gradient-to-br from-error-100 to-error-200 text-error-800 border-error-300';
      case 'Pressure Unit':
      case 'Pressure Vessel':
      case 'Potable Vessel':
        return 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800 border-accent-300';
      case 'Boiler':
        return 'bg-gradient-to-br from-warning-100 to-warning-200 text-warning-800 border-warning-300';
      default:
        return 'bg-gradient-to-br from-secondary-100 to-secondary-200 text-secondary-800 border-secondary-300';
    }
  };

  const assetTypes = [
    'Fresh Water Pump',
    'Heating Circulator Pump', 
    'Hot Water Circulator Pump',
    'Shunt Pump',
    'Sump Pump',
    'Pressure Unit',
    'Degasser',
    'Gas Valve',
    'Boiler',
    'Water Tank',
    'Potable Vessel',
    'Heating Vessel',
    'Other'
  ];

  const frequencies = [
    'Daily',
    'Weekly', 
    'Fortnightly',
    'Monthly',
    'Quarterly',
    'Annually'
  ];

  // Filter and search assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset["Asset ID"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset["Asset Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset["Asset Type"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset["Manufacturer"] && asset["Manufacturer"].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset["Model"] && asset["Model"].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.plant_rooms?.["Block"] && asset.plant_rooms["Block"].toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || asset["Asset Type"] === filterType;
    
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
                <CogIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Assets</h1>
                <p className="text-xl text-white text-opacity-90">
                  Manage equipment and systems across all plant rooms
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-white text-opacity-70">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                {assets.filter(a => a["Operational"]).length} Operational
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-accent-400 rounded-full mr-2"></div>
                {assets.length} Total Assets
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl shadow-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
              >
                <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                Add Asset
              </button>
            )}
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

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-secondary-700 mb-2">
              Search Assets
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
                placeholder="Search by ID, name, type, manufacturer, model, or location..."
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
                {assetTypes.map((type) => (
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
              Showing {filteredAssets.length} of {assets.length} assets
              {searchTerm && ` matching "${searchTerm}"`}
              {filterType !== 'all' && ` filtered by ${filterType}`}
            </p>
            {filteredAssets.length === 0 && (
              <p className="text-sm text-secondary-500 mt-2">
                No assets match your search criteria. Try adjusting your search terms or filters.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-3xl border border-secondary-200">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-6 mb-6 text-white">
              <h3 className="text-2xl font-bold">Add New Asset</h3>
              <p className="text-white text-opacity-90 mt-2">Create a new equipment asset</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <div className="bg-primary-500 rounded-full p-2 mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-primary-800">Auto-Generated Asset ID</h4>
                        <p className="text-sm text-primary-700">A unique Asset ID will be automatically generated when you create this asset</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.assetName}
                    onChange={(e) => setNewAsset({...newAsset, assetName: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Asset Type
                  </label>
                  <select
                    value={newAsset.assetType}
                    onChange={(e) => setNewAsset({...newAsset, assetType: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    {assetTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Plant Room
                  </label>
                  <select
                    value={newAsset.plantRoomId}
                    onChange={(e) => setNewAsset({...newAsset, plantRoomId: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    <option value="">No Plant Room</option>
                    {plantRooms.map((room) => (
                      <option key={room.id} value={room["Plant Room ID"]}>
                        {room["Block"]} ({room["Plant Room ID"]})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={newAsset.manufacturer}
                    onChange={(e) => setNewAsset({...newAsset, manufacturer: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({...newAsset, model: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({...newAsset, serialNumber: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Service Frequency
                  </label>
                  <select
                    value={newAsset.frequency}
                    onChange={(e) => setNewAsset({...newAsset, frequency: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Install Date
                  </label>
                  <input
                    type="date"
                    value={newAsset.installDate}
                    onChange={(e) => setNewAsset({...newAsset, installDate: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Last Service Date
                  </label>
                  <input
                    type="date"
                    value={newAsset.lastServiceDate}
                    onChange={(e) => setNewAsset({...newAsset, lastServiceDate: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Operational Status
                  </label>
                  <select
                    value={newAsset.operational.toString()}
                    onChange={(e) => setNewAsset({...newAsset, operational: e.target.value === 'true'})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    <option value="true">Operational</option>
                    <option value="false">Down</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Vessel Size
                  </label>
                  <input
                    type="text"
                    value={newAsset.vesselSize}
                    onChange={(e) => setNewAsset({...newAsset, vesselSize: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
              </div>
              
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
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Form */}
      {showEditForm && editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-3xl border border-secondary-200">
            <div className="bg-gradient-to-r from-accent-600 to-primary-600 rounded-2xl p-6 mb-6 text-white">
              <h3 className="text-2xl font-bold">Edit Asset</h3>
              <p className="text-white text-opacity-90 mt-2">Update asset information</p>
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 mb-4">
                  <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="bg-secondary-500 rounded-full p-2 mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-secondary-800">Editing Asset: {editingAsset?.["Asset ID"]}</h4>
                        <p className="text-sm text-secondary-700">Asset ID cannot be modified after creation</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.assetName}
                    onChange={(e) => setNewAsset({...newAsset, assetName: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Asset Type
                  </label>
                  <select
                    value={newAsset.assetType}
                    onChange={(e) => setNewAsset({...newAsset, assetType: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    {assetTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Plant Room
                  </label>
                  <select
                    value={newAsset.plantRoomId}
                    onChange={(e) => setNewAsset({...newAsset, plantRoomId: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    <option value="">No Plant Room</option>
                    {plantRooms.map((room) => (
                      <option key={room.id} value={room["Plant Room ID"]}>
                        {room["Block"]} ({room["Plant Room ID"]})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Service Frequency
                  </label>
                  <select
                    value={newAsset.frequency}
                    onChange={(e) => setNewAsset({...newAsset, frequency: e.target.value})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-700 mb-2">
                    Operational Status
                  </label>
                  <select
                    value={newAsset.operational.toString()}
                    onChange={(e) => setNewAsset({...newAsset, operational: e.target.value === 'true'})}
                    className="w-full rounded-xl border-2 border-secondary-300 shadow-lg focus:border-primary-500 focus:ring-primary-500 p-4 text-lg"
                  >
                    <option value="true">Operational</option>
                    <option value="false">Down</option>
                  </select>
                </div>
              </div>
              
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
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="group bg-white overflow-hidden shadow-2xl rounded-3xl border border-secondary-200 hover:shadow-3xl hover:-translate-y-4 hover:border-primary-300 transition-all duration-500 relative cursor-pointer"
            onClick={() => navigate(`/assets/${asset.id}`)}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-accent-50/30 pointer-events-none"></div>
            
            {/* Header with Asset ID and Status */}
            <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center text-white">
                  <div className="bg-white bg-opacity-25 p-3 rounded-xl mr-4 backdrop-blur-sm shadow-lg border border-white border-opacity-30">
                    <span className="text-white font-bold text-sm">{asset["Asset ID"]}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {asset["Asset Name"]}
                    </h3>
                    <p className="text-white text-opacity-80 text-sm font-medium">{asset["Asset Type"]}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                  asset["Operational"] 
                    ? 'bg-success-100 text-success-800 border-2 border-success-300' 
                    : 'bg-error-100 text-error-800 border-2 border-error-300'
                } shadow-lg`}>
                  {asset["Operational"] ? 'Operational' : 'Down'}
                </span>
              </div>
              
              {/* Asset Type Badge */}
              <div className="relative mt-4">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getAssetTypeColor(asset["Asset Type"])} shadow-lg backdrop-blur-sm`}>
                  <CogIcon className="w-4 h-4 mr-2" />
                  {asset["Asset Type"]}
                </span>
              </div>
            </div>
            
            <div className="relative p-6">
              {/* Plant Room Location */}
              {asset.plant_rooms && (
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-5 mb-6 border border-secondary-200 shadow-lg">
                  <div className="flex items-center">
                    <div className="bg-primary-500 p-2 rounded-lg mr-3 shadow-md">
                      <MapPinIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-secondary-900 font-bold text-lg">{asset.plant_rooms["Block"]}</p>
                      <p className="text-secondary-600 font-medium">{asset.plant_rooms["Plant Room Type"]} Plant Room</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {(asset["Manufacturer"] || asset["Model"]) && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full mr-3 shadow-lg"></div>
                    <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Technical Details</h4>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border border-accent-200 shadow-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {asset["Manufacturer"] && (
                        <div>
                          <span className="text-xs font-semibold text-accent-700">Manufacturer:</span>
                          <p className="text-sm font-bold text-secondary-900">{asset["Manufacturer"]}</p>
                        </div>
                      )}
                      {asset["Model"] && (
                        <div>
                          <span className="text-xs font-semibold text-accent-700">Model:</span>
                          <p className="text-sm font-bold text-secondary-900">{asset["Model"]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Service Information */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-warning-500 to-warning-600 rounded-full mr-3 shadow-lg"></div>
                  <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Service Schedule</h4>
                </div>
                <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 text-warning-600 mr-2" />
                        <span className="text-sm font-bold text-warning-800">{asset["Frequency"]} Service</span>
                      </div>
                      {asset["Last Service Date"] && (
                        <p className="text-xs text-warning-700 mt-1">
                          Last: {new Date(asset["Last Service Date"]).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <WrenchScrewdriverIcon className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </div>

              <div className="text-sm text-secondary-500 mb-6 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-200 shadow-lg">
                <span className="font-semibold">Created:</span> {new Date(asset.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-primary-300 text-primary-800 rounded-xl text-sm font-bold hover:from-primary-200 hover:to-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  View Details
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(asset)}
                      className="px-4 py-3 bg-gradient-to-r from-accent-100 to-accent-200 border-2 border-accent-300 rounded-xl text-sm font-bold text-accent-800 hover:from-accent-200 hover:to-accent-300 focus:outline-none focus:ring-4 focus:ring-accent-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                      <PencilIcon className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="px-4 py-3 bg-gradient-to-r from-error-100 to-error-200 border-2 border-error-300 rounded-xl text-sm font-bold text-error-800 hover:from-error-200 hover:to-error-300 focus:outline-none focus:ring-4 focus:ring-error-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {assets.length === 0 && !loading && (
        <div className="text-center py-24">
          <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-3xl border border-primary-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-accent-100/30"></div>
            <div className="relative bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl p-8 inline-block mb-8 shadow-2xl">
              <CogIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="relative text-2xl font-bold text-secondary-900 mb-4">No assets</h3>
            <p className="relative text-secondary-600 mb-10 leading-relaxed text-lg">
              Get started by adding your first equipment asset.
            </p>
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-8 py-4 border border-transparent shadow-2xl text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 hover:from-primary-700 hover:via-primary-800 hover:to-accent-800 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-110 hover:shadow-3xl"
                >
                  <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                  Add Asset
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {assets.length > 0 && filteredAssets.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-secondary-50 via-white to-primary-50 rounded-2xl p-12 max-w-md mx-auto shadow-lg border border-secondary-200">
            <div className="bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-xl p-6 inline-block mb-6 shadow-lg">
              <MagnifyingGlassIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-3">No results found</h3>
            <p className="text-secondary-600 mb-6">
              No assets match your search criteria. Try adjusting your search terms or filters.
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

export default Assets;