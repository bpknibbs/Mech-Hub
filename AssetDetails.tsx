import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import {
  Settings as CogIcon,
  ArrowLeft as ArrowLeftIcon,
  ClipboardList as ClipboardDocumentListIcon,
  QrCode as QrCodeIcon,
  Camera as PhotoIcon,
  Wrench as WrenchScrewdriverIcon,
  AlertTriangle as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Pencil as PencilIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface AssetDetail {
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
  plant_rooms?: {
    "Block": string;
    "Address": string;
    "Plant Room Type": string;
  };
}

interface Task {
  id: string;
  task_id: string;
  type_of_task: string;
  status: string;
  due_date: string;
  priority: string;
  date_completed?: string;
  notes?: string;
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

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setUpdateKey] = useState(0); // Force re-render
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [uploadingPhoto, _setUploadingPhoto] = useState(false);
  const [editAsset, setEditAsset] = useState({
    assetName: '',
    assetType: '',
    vesselSize: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    installDate: '',
    lastServiceDate: '',
    frequency: '',
    operational: true
  });

  useEffect(() => {
    if (id) {
      fetchAssetDetails();
    }
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);

      // Fetch asset details
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select(`
          *,
          plant_rooms("Block", "Address", "Plant Room Type")
        `)
        .eq('id', id!)
        .single();

      if (assetError) throw assetError;
      
      // Force React re-render with fresh object reference
      const freshAsset = { ...assetData };
      setAsset(freshAsset);
      setUpdateKey(prev => prev + 1);

      // Fetch tasks for this asset
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('asset_id', id!)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch form submissions for this asset
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select(`
          *,
          team("Name")
        `)
        .eq('asset_id', id!)
        .order('submission_date', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

    } catch (error) {
      console.error('Error fetching asset details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!asset) return;
    
    setEditAsset({
      assetName: asset["Asset Name"],
      assetType: asset["Asset Type"],
      vesselSize: asset["Vessel Size"] || '',
      manufacturer: asset["Manufacturer"] || '',
      model: asset["Model"] || '',
      serialNumber: asset["Serial Number"] || '',
      installDate: asset["Install Date"] || '',
      lastServiceDate: asset["Last Service Date"] || '',
      frequency: asset["Frequency"],
      operational: asset["Operational"] ?? true
    });
    setSelectedPhoto(null);
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    try {
      
      // Use the exact column names from the database schema
      const updateData: Database['public']['Tables']['assets']['Update'] = {
        "Asset Name": editAsset.assetName,
        "Asset Type": editAsset.assetType,
        "Vessel Size": editAsset.vesselSize || undefined,
        "Manufacturer": editAsset.manufacturer || undefined,
        "Model": editAsset.model || undefined,
        "Serial Number": editAsset.serialNumber || undefined,
        "Install Date": editAsset.installDate || undefined,
        "Last Service Date": editAsset.lastServiceDate || undefined,
        "Frequency": editAsset.frequency,
        "Operational": editAsset.operational,
        "updated_at": new Date().toISOString()
      };

      // Handle photo upload if a new photo is selected
      if (selectedPhoto) {
        // Check file size (limit to 5MB for base64 storage)
        if (selectedPhoto.size > 5 * 1024 * 1024) {
          alert('Photo file is too large. Please select a file smaller than 5MB.');
          return;
        }

        // Convert file to base64 for storage
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(selectedPhoto);
        });
        
        updateData["Photo"] = base64String;
      }

      const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', asset.id);


      if (error) {
       throw error;
      }

      
      // Refresh asset details from database
      await fetchAssetDetails();
      
      setSelectedPhoto(null);
      setShowEditForm(false);
      
    } catch (error) {
      alert(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  const getTaskIcon = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'Completed';
    if (isOverdue) return <ExclamationTriangleIcon className="w-5 h-5 text-error-600" />;
    
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-600" />;
      case 'In Progress':
        return <ClockIcon className="w-5 h-5 text-warning-600" />;
      default:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-secondary-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-error-100 text-error-800';
      case 'Medium':
        return 'bg-warning-100 text-warning-800';
      case 'Low':
        return 'bg-success-100 text-success-800';
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

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900">Asset not found</h3>
        <button
          onClick={() => navigate('/assets')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Assets
        </button>
      </div>
    );
  }

  const overdueTasks = tasks.filter(t => 
    new Date(t.due_date) < new Date() && t.status !== 'Completed'
  ).length;

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/assets')}
          className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-6 transition-all duration-200 hover:translate-x-1"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Assets
        </button>
        
        {/* Modern Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                <CogIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {asset["Asset Name"]}
                </h1>
                <p className="text-white text-opacity-80 text-lg">
                  {asset["Asset Type"]} • {asset["Frequency"]} Maintenance
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white backdrop-blur-sm">
                    ID: {asset["Asset ID"]}
                  </span>
                  <span className="text-white text-opacity-70 text-sm">
                    {asset.plant_rooms?.["Block"]} Plant Room
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 bg-white bg-opacity-20 text-white backdrop-blur-sm shadow-lg border-white border-opacity-30`}>
                {asset["Operational"] ? 'Operational' : 'Out of Service'}
              </span>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-white border-opacity-30 text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200 backdrop-blur-sm"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Asset Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Asset</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editAsset.assetName}
                    onChange={(e) => setEditAsset({...editAsset, assetName: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Asset Type
                  </label>
                  <select
                    value={editAsset.assetType}
                    onChange={(e) => setEditAsset({...editAsset, assetType: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Fresh Water Booster Pump">Fresh Water Booster Pump</option>
                    <option value="Heating Circulator Pump">Heating Circulator Pump</option>
                    <option value="Hot Water Circulator Pump">Hot Water Circulator Pump</option>
                    <option value="Shunt Pump">Shunt Pump</option>
                    <option value="Sump Pump">Sump Pump</option>
                    <option value="Pressure Unit">Pressure Unit</option>
                    <option value="Degasser">Degasser</option>
                    <option value="Gas Valve">Gas Valve</option>
                    <option value="Boiler">Boiler</option>
                    <option value="Chiller">Chiller</option>
                    <option value="Generator">Generator</option>
                    <option value="Air Handler">Air Handler</option>
                    <option value="Fire Panel">Fire Panel</option>
                    <option value="Sprinkler System">Sprinkler System</option>
                    <option value="Water Tank">Water Tank</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Vessel Size
                  </label>
                  <input
                    type="text"
                    value={editAsset.vesselSize}
                    onChange={(e) => setEditAsset({...editAsset, vesselSize: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={editAsset.manufacturer}
                    onChange={(e) => setEditAsset({...editAsset, manufacturer: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={editAsset.model}
                    onChange={(e) => setEditAsset({...editAsset, model: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={editAsset.serialNumber}
                    onChange={(e) => setEditAsset({...editAsset, serialNumber: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Service Frequency
                  </label>
                  <select
                    value={editAsset.frequency}
                    onChange={(e) => setEditAsset({...editAsset, frequency: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Fortnightly">Fortnightly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Install Date
                  </label>
                  <input
                    type="date"
                    value={editAsset.installDate}
                    onChange={(e) => setEditAsset({...editAsset, installDate: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Last Service Date
                  </label>
                  <input
                    type="date"
                    value={editAsset.lastServiceDate}
                    onChange={(e) => setEditAsset({...editAsset, lastServiceDate: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Operational Status
                  </label>
                  <select
                    value={editAsset.operational.toString()}
                    onChange={(e) => setEditAsset({...editAsset, operational: e.target.value === 'true'})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="true">Operational</option>
                    <option value="false">Out of Service</option>
                  </select>
                </div>
              </div>
              
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Asset Photo
                </label>
                {asset["Photo"] && !selectedPhoto && (
                  <div className="mb-4">
                    <img 
                      src={asset["Photo"]} 
                      alt="Current asset photo" 
                      className="w-32 h-24 object-cover rounded border border-secondary-300"
                    />
                    <p className="text-xs text-secondary-500 mt-1">Current photo</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                    className="w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  
                  {selectedPhoto && (
                    <div className="space-y-2">
                      <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                        <p className="text-sm text-primary-700">
                          📎 {selectedPhoto.name} ({(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <p className="text-xs text-primary-600 mt-1">
                          Photo will be uploaded when you save the asset
                        </p>
                      </div>
                      
                      {/* Photo Preview */}
                      <div className="w-32 h-24 border border-secondary-300 rounded overflow-hidden">
                        <img 
                          src={URL.createObjectURL(selectedPhoto)} 
                          alt="Photo preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(null)}
                        className="text-sm text-error-600 hover:text-error-500"
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Update Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Information */}
      <div className="bg-white shadow-xl rounded-3xl border border-secondary-200 p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none"></div>
        <div className="relative">
          <h3 className="text-2xl font-bold text-secondary-900 mb-8">Asset Information</h3>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-3 shadow-lg"></div>
                <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Basic Information</h4>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200 shadow-lg space-y-3">
                <div>
                  <span className="text-sm font-medium text-primary-700">Location</span>
                  <p className="text-secondary-900 font-bold">{asset.plant_rooms?.["Block"] || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-700">Plant Room Type</span>
                  <p className="text-secondary-900 font-bold">{asset.plant_rooms?.["Plant Room Type"] || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-700">Service Frequency</span>
                  <p className="text-secondary-900 font-bold">{asset["Frequency"]}</p>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full mr-3 shadow-lg"></div>
                <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Technical Details</h4>
              </div>
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border border-accent-200 shadow-lg space-y-3">
                {asset["Manufacturer"] && (
                  <div>
                    <span className="text-sm font-medium text-accent-700">Manufacturer</span>
                    <p className="text-secondary-900 font-bold">{asset["Manufacturer"]}</p>
                  </div>
                )}
                {asset["Model"] && (
                  <div>
                    <span className="text-sm font-medium text-accent-700">Model</span>
                    <p className="text-secondary-900 font-bold">{asset["Model"]}</p>
                  </div>
                )}
                {asset["Serial Number"] && (
                  <div>
                    <span className="text-sm font-medium text-accent-700">Serial Number</span>
                    <p className="text-secondary-900 font-bold">{asset["Serial Number"]}</p>
                  </div>
                )}
                {asset["Vessel Size"] && (
                  <div>
                    <span className="text-sm font-medium text-accent-700">Vessel Size</span>
                    <p className="text-secondary-900 font-bold">{asset["Vessel Size"]}</p>
                  </div>
                )}
                {!asset["Manufacturer"] && !asset["Model"] && !asset["Serial Number"] && !asset["Vessel Size"] && (
                  <p className="text-accent-600 italic">No technical details available</p>
                )}
              </div>
            </div>

            {/* Service Information */}
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-warning-500 to-warning-600 rounded-full mr-3 shadow-lg"></div>
                <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Service Information</h4>
              </div>
              <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200 shadow-lg space-y-3">
                {asset["Install Date"] && (
                  <div>
                    <span className="text-sm font-medium text-warning-700">Install Date</span>
                    <p className="text-secondary-900 font-bold">{format(new Date(asset["Install Date"]), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                {asset["Last Service Date"] && (
                  <div>
                    <span className="text-sm font-medium text-warning-700">Last Service</span>
                    <p className="text-secondary-900 font-bold">{format(new Date(asset["Last Service Date"]), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                {!asset["Install Date"] && !asset["Last Service Date"] && (
                  <p className="text-warning-600 italic">No service history available</p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code and Photo */}
          {(asset["QR Code"] || asset["Photo"]) && (
            <div className="mt-8 pt-8 border-t border-secondary-200">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full mr-3 shadow-lg"></div>
                <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Asset Media</h4>
              </div>
              <div className="flex items-center space-x-8">
                {asset["QR Code"] && (
                  <div className="text-center bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 border border-secondary-200 shadow-lg">
                    <QrCodeIcon className="mx-auto h-6 w-6 text-secondary-600 mb-3" />
                    <img 
                      src={asset["QR Code"]} 
                      alt="Asset QR Code" 
                      className="w-24 h-24 border border-secondary-300 rounded-lg shadow-md"
                    />
                    <p className="text-sm font-bold text-secondary-700 mt-3">QR Code</p>
                  </div>
                )}
                {asset["Photo"] && (
                  <div className="text-center bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 border border-accent-200 shadow-lg">
                    <PhotoIcon className="mx-auto h-6 w-6 text-accent-600 mb-3" />
                    <img 
                      src={asset["Photo"]} 
                      alt="Asset Photo" 
                      className="w-24 h-24 object-cover border border-accent-300 rounded-lg shadow-md"
                    />
                    <p className="text-sm font-bold text-accent-700 mt-3">Asset Photo</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-primary-300 transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-4 shadow-lg border border-primary-300">
                  <ClipboardDocumentListIcon className="h-7 w-7 text-primary-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Total Tasks</dt>
                  <dd className="text-3xl font-bold text-secondary-900 mt-1">{tasks.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-success-300 transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-success-50/20 via-transparent to-success-100/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-success-100 to-success-200 rounded-2xl p-4 shadow-lg border border-success-300">
                  <CheckCircleIcon className="h-7 w-7 text-success-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Completed</dt>
                  <dd className="text-3xl font-bold text-success-600 mt-1">{completedTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-error-300 transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-error-50/20 via-transparent to-error-100/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-error-100 to-error-200 rounded-2xl p-4 shadow-lg border border-error-300">
                  <ExclamationTriangleIcon className="h-7 w-7 text-error-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Overdue</dt>
                  <dd className="text-3xl font-bold text-error-600 mt-1">{overdueTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-accent-300 transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-50/20 via-transparent to-accent-100/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl p-4 shadow-lg border border-accent-300">
                  <WrenchScrewdriverIcon className="h-7 w-7 text-accent-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Submissions</dt>
                  <dd className="text-3xl font-bold text-accent-600 mt-1">{submissions.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks */}
        <div className="bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden hover:shadow-2xl transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-accent-50/20 pointer-events-none"></div>
          <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Tasks
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-white hover:text-primary-200 transition-colors font-medium"
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
                <p className="text-secondary-600 font-medium">No tasks for this asset</p>
                <p className="text-sm text-secondary-500 mt-1">All maintenance is up to date</p>
              </div>
            ) : (
              tasks.map((task) => {
                return (
                  <div key={task.id} className="p-4 hover:bg-secondary-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {getTaskIcon(task.status, task.due_date)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-secondary-900">{task.type_of_task}</h4>
                          <p className="text-sm text-secondary-500 mt-1">Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</p>
                          {task.notes && (
                            <p className="text-xs text-secondary-400 mt-1 line-clamp-2">{task.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status, task.due_date)}`}>
                          {task.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Form Submissions */}
        <div className="bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden hover:shadow-2xl transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-50/30 via-transparent to-accent-100/20 pointer-events-none"></div>
          <div className="relative bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
              Recent Submissions
            </h3>
            <button
              onClick={() => navigate('/submissions')}
              className="text-sm text-white hover:text-accent-200 transition-colors font-medium"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-secondary-100 rounded-full p-4 inline-block mb-3">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-secondary-400" />
                </div>
                <p className="text-secondary-600 font-medium">No submissions yet</p>
                <p className="text-sm text-secondary-500 mt-1">Service reports will appear here</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div key={submission.id} className="p-4 hover:bg-secondary-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-secondary-900">
                        Form #{submission.form_submission_id}
                      </h4>
                      <p className="text-sm text-secondary-500 mt-1">
                        {format(new Date(submission.submission_date), 'MMM dd, yyyy')}
                      </p>
                      {submission.team && (
                        <p className="text-xs text-secondary-400 mt-1">
                          Team: {submission.team["Name"]}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'Completed' 
                        ? 'bg-success-100 text-success-800'
                        : submission.status === 'In Progress'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-secondary-100 text-secondary-800'
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
    </div>
  );
};

export default AssetDetails;