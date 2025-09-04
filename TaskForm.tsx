import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile } from '../utils/storage';
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CameraIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';
import type { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assets?: Database['public']['Tables']['assets']['Row'];
  plant_rooms?: Database['public']['Tables']['plant_rooms']['Row'];
};

type FormTemplate = Database['public']['Tables']['form_templates']['Row'];
type FormField = FormTemplate['fields'][0];

const TaskForm: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [plantRoomAppliances, setPlantRoomAppliances] = useState<any[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const engineerSigRef = useRef<SignatureCanvas | null>(null);
  const clientSigRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTaskAndTemplate();
    }
  }, [taskId]);

  const fetchTaskAndTemplate = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assets("Asset ID", "Asset Name", "Asset Type"),
          plant_rooms("Block", "Address", "Postcode", "Plant Room ID")
        `)
        .eq('id', taskId!)
        .single();

      if (taskError) {
        throw new Error(taskError.message);
      }
      setTask(taskData);

      let assetType = 'General';
      if (taskData.type_of_task === 'LGSR') {
        assetType = 'LGSR';
      } else if (taskData.assets) {
        const type = taskData.assets["Asset Type"].toLowerCase();
        if (type.includes('pump')) {
          assetType = type.includes('fresh') ? 'Fresh Water Pump' : 'Pump';
        } else if (type.includes('boiler')) {
          assetType = 'Boiler';
        } else if (type.includes('vessel') || type.includes('pressure')) {
          assetType = 'Pressure Vessel';
        }
      }

      const { data: templateData, error: templateError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('asset_type', assetType)
        .single();
        
      if (templateError) {
        if (templateError.code === 'PGRST116') { // No rows found
          setError(`No form template found for asset type "${assetType}".`);
          setTemplate(null);
          return;
        }
        throw new Error(templateError.message);
      }

      setTemplate(templateData);
      
      const initialResponses: { [key: string]: any } = {};

      if (taskData.type_of_task === 'LGSR' && taskData.plant_rooms) {
        const { data: appliances, error: appliancesError } = await supabase
          .from('assets')
          .select('*')
          .eq('"Plant Room ID"', taskData.plant_rooms['Plant Room ID'])
          .in('"Asset Type"', ['Boiler', 'Water heater', 'Cooker', 'Fire'])
          .eq('"Operational"', true);
        
        if (appliancesError) console.error('Error fetching appliances for LGSR:', appliancesError);

        if (appliances) {
          setPlantRoomAppliances(appliances);
          initialResponses['property_address'] = taskData.plant_rooms.Address || '';
          initialResponses['property_postcode'] = taskData.plant_rooms.Postcode || '';
          
          if (userProfile) {
            initialResponses['engineer_name'] = userProfile.Name || '';
            initialResponses['engineer_contact_number'] = userProfile["Phone Number"] || '';
            initialResponses['engineer_company'] = 'Mech Hub Engineering Services';
          }
        }
      } else if (taskData.assets) {
        if (templateData?.fields) {
          templateData.fields.forEach((field: FormField) => {
            const label = field.label.toLowerCase();
            if (label.includes('location/id')) {
              initialResponses[field.id] = `${taskData.assets!["Asset Name"]} - ${taskData.plant_rooms?.Address || 'Plant Room'}`;
            }
          });
        }
      }
      setResponses(initialResponses);

    } catch (err: any) {
      console.error('Failed to load task and template:', err);
      setError(`Failed to load form: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (fieldId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setResponses(prev => ({ ...prev, [fieldId]: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      if (!task || !template || !userProfile) {
        throw new Error("Missing task, template, or user profile data.");
      }
      
      const formSubmissionId = `FORM-${Date.now()}`;
      const photoUrls: string[] = [];

      for (const key in responses) {
        const value = responses[key];
        const field = template.fields.find(f => f.id === key);
        
        if (field?.type === 'photo' && typeof value === 'string' && value.startsWith('data:image/')) {
          const fileBlob = await (await fetch(value)).blob();
          const photoFile = new File([fileBlob], `${formSubmissionId}-${field.id}.png`, { type: 'image/png' });
          const { publicUrl, error: uploadError } = await uploadFile(photoFile, 'form_submissions');
          if (uploadError) throw new Error(`Failed to upload photo for field ${field.label}: ${uploadError}`);
          if (publicUrl) photoUrls.push(publicUrl);
        }
      }
      
      const engineerSig = engineerSigRef.current?.toDataURL();
      const clientSig = clientSigRef.current?.toDataURL();
      
      const submissionData = {
        form_submission_id: formSubmissionId,
        task_id: task.id,
        asset_id: task.asset_id || null,
        engineer_id: userProfile.id || null,
        submission_date: new Date().toISOString(),
        responses,
        photos: photoUrls,
        engineer_signature: engineerSig || null,
        client_signature: clientSig || null,
        status: 'Submitted',
        form_template_id: template.id
      };

      const { error: submissionError } = await supabase.from('form_submissions').insert([submissionData]);
      if (submissionError) throw new Error(submissionError.message);

      const { error: taskError } = await supabase.from('tasks').update({
        status: 'Completed',
        date_completed: format(new Date(), 'yyyy-MM-dd'),
        updated_at: new Date().toISOString()
      }).eq('id', task.id);
      if (taskError) console.error('Error updating task status:', taskError);
      
      navigate('/tasks');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.type}
            value={responses[field.id] || ''}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={responses[field.id] || ''}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
            className="w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={responses[field.id] || ''}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className="w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        );
      case 'select':
        return (
          <select
            value={responses[field.id] || ''}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
            className="w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select an option...</option>
            {field.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={responses[field.id] === option}
                  onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
                  required={field.required}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={responses[field.id] || false}
              onChange={(e) => setResponses({ ...responses, [field.id]: e.target.checked })}
              required={field.required}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-secondary-700">
              {field.required ? 'Required' : 'Optional'}
            </span>
          </label>
        );
      case 'photo':
        return (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handlePhotoCapture(field.id)}
              className="inline-flex items-center px-4 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              Capture Photo
            </button>
            {responses[field.id] && (
              <div className="mt-2">
                <img
                  src={responses[field.id]}
                  alt="Captured photo"
                  className="w-32 h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => setResponses({ ...responses, [field.id]: null })}
                  className="mt-2 text-sm text-error-600 hover:text-error-500"
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>
        );
      case 'signature':
        return (
          <div className="space-y-3">
            <div className="border border-secondary-300 rounded-lg p-3">
              <SignatureCanvas
                ref={(ref) => {
                  if (field.id === 'engineer_signature') {
                    engineerSigRef.current = ref;
                  } else if (field.id === 'client_signature') {
                    clientSigRef.current = ref;
                  }
                }}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'signature-canvas border rounded'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (field.id === 'engineer_signature') {
                  engineerSigRef.current?.clear();
                } else if (field.id === 'client_signature') {
                  clientSigRef.current?.clear();
                }
              }}
              className="text-sm text-secondary-600 hover:text-secondary-800"
            >
              Clear signature
            </button>
          </div>
        );
      default:
        return null;
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
        
        {/* Task Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-3 rounded-xl mr-4">
                <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  {task.assets?.["Asset Name"] || 'General Task'}
                </h1>
                <p className="text-secondary-600">
                  {task.plant_rooms?.["Block"]} • {task.type_of_task}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-secondary-500">
                  <span>Task ID: {task.task_id}</span>
                  <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-100 text-warning-800">
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Show appliances info for LGSR tasks */}
        {task.type_of_task === 'LGSR' && plantRoomAppliances.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-warning-800 mb-3">
              Gas Appliances Found ({plantRoomAppliances.length})
            </h4>
            <div className="space-y-2 text-sm">
              {plantRoomAppliances.map((appliance, index) => (
                <div key={appliance.id} className="flex items-center justify-between">
                  <span className="text-warning-700">
                    {index + 1}. {appliance["Asset Type"]} - {appliance["Asset Name"]}
                  </span>
                  <span className="text-warning-600 text-xs">
                    {appliance["Manufacturer"]} {appliance["Model"]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-warning-600 mt-2">
              Form has been pre-populated with appliance details. Verify and update during inspection.
            </p>
          </div>
        )}

        {/* Form Header */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 mr-4" />
            <div>
              <h2 className="text-2xl font-bold">{template?.title || 'Form'}</h2>
              <p className="text-white text-opacity-90">Complete the maintenance form</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-error-400 mr-3" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {template && (
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {template.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-error-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
  
            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-secondary-200">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Engineer Signature
                </label>
                <div className="border border-secondary-300 rounded-lg p-3 bg-secondary-50">
                  <SignatureCanvas
                    ref={engineerSigRef}
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: 'signature-canvas border rounded bg-white'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => engineerSigRef.current?.clear()}
                  className="mt-2 text-sm text-secondary-600 hover:text-secondary-800"
                >
                  Clear signature
                </button>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Client Signature (Optional)
                </label>
                <div className="border border-secondary-300 rounded-lg p-3 bg-secondary-50">
                  <SignatureCanvas
                    ref={clientSigRef}
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: 'signature-canvas border rounded bg-white'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => clientSigRef.current?.clear()}
                  className="mt-2 text-sm text-secondary-600 hover:text-secondary-800"
                >
                  Clear signature
                </button>
              </div>
            </div>
  
            {/* Submit Button */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="flex-1 px-6 py-4 border-2 border-secondary-300 rounded-2xl text-lg font-bold text-secondary-700 hover:bg-secondary-50 transition-all duration-300 shadow-lg transform hover:scale-105 touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-4 border border-transparent rounded-2xl shadow-2xl text-xl font-bold text-white bg-gradient-to-r from-success-600 via-success-700 to-success-800 hover:from-success-700 hover:via-success-800 hover:to-success-900 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 touch-manipulation"
              >
                {submitting ? 'Submitting...' : 'Complete Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskForm;