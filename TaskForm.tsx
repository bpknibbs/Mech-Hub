import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CameraIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';

interface Task {
  id: string;
  task_id: string;
  asset_id?: string;
  type_of_task: string;
  status: string;
  due_date: string;
  notes?: string;
  assets?: {
    "Asset ID": string;
    "Asset Name": string;
    "Asset Type": string;
  };
  plant_rooms?: {
    "Block": string;
    "Address": string;
  };
}

interface FormTemplate {
  id: string;
  form_template_id: string;
  asset_type: string;
  title: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'radio' | 'photo' | 'signature';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

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

  let engineerSigRef: SignatureCanvas | null = null;
  let clientSigRef: SignatureCanvas | null = null;

  useEffect(() => {
    if (taskId) {
      fetchTaskAndTemplate();
    }
  }, [taskId]);

  const fetchTaskAndTemplate = async () => {
    try {
      setLoading(true);

      // Fetch task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assets("Asset ID", "Asset Name", "Asset Type"),
          plant_rooms("Block", "Address", "Postcode", "Plant Room ID")
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      // If this is an LGSR task, fetch all gas appliances from the plant room
      if (taskData.type_of_task === 'LGSR' && taskData.plant_room_id) {
        // First get the plant room details to find the Plant Room ID
        const { data: plantRoomData, error: plantRoomError } = await supabase
          .from('plant_rooms')
          .select('"Plant Room ID"')
          .eq('id', taskData.plant_room_id)
          .single();

        if (plantRoomError) {
          console.error('Error fetching plant room:', plantRoomError);
        }

        // Fetch appliances using the Plant Room ID
        const { data: appliances, error: appliancesError } = await supabase
          .from('assets')
          .select('*')
          .eq('"Plant Room ID"', plantRoomData?.["Plant Room ID"])
          .in('"Asset Type"', ['Boiler', 'Gas Valve', 'Water heater', 'Fire - Radiant/Convector', 'Cooker'])
          .eq('"Operational"', true);

        if (!appliancesError && appliances) {
          setPlantRoomAppliances(appliances);
          console.log('Found appliances for LGSR:', appliances);
          
          // Auto-populate LGSR fields immediately after fetching appliances
          const lgsrResponses: { [key: string]: any } = {};
          
          // Auto-populate property details
          lgsrResponses['property_address'] = taskData.plant_rooms?.["Address"] || '';
          lgsrResponses['property_postcode'] = taskData.plant_rooms?.["Postcode"] || '';
          lgsrResponses['landlord_agent_name'] = 'Property Management Company';
          
          // Auto-populate engineer details from user profile
          if (userProfile) {
            lgsrResponses['engineer_name'] = userProfile.Name || '';
            lgsrResponses['engineer_contact_number'] = userProfile["Phone Number"] || '';
            lgsrResponses['engineer_company_name'] = 'Mech Hub Engineering Services';
          }
          
          // Auto-populate appliance details
          if (appliances.length > 0) {
            // Appliance 1
            const firstAppliance = appliances[0];
            lgsrResponses['appliance_1_type'] = getApplianceType(firstAppliance["Asset Type"]);
            lgsrResponses['appliance_1_location'] = taskData.plant_rooms?.["Block"] || 'Plant Room';
            lgsrResponses['appliance_1_make_model'] = `${firstAppliance["Manufacturer"] || 'Unknown'} ${firstAppliance["Model"] || ''}`.trim();
            lgsrResponses['appliance_1_flue_type'] = getDefaultFlueType(firstAppliance["Asset Type"]);
            
            // Appliance 2
            if (appliances.length > 1) {
              const secondAppliance = appliances[1];
              lgsrResponses['appliance_2_type'] = getApplianceType(secondAppliance["Asset Type"]);
              lgsrResponses['appliance_2_location'] = taskData.plant_rooms?.["Block"] || 'Plant Room';
              lgsrResponses['appliance_2_make_model'] = `${secondAppliance["Manufacturer"] || 'Unknown'} ${secondAppliance["Model"] || ''}`.trim();
              lgsrResponses['appliance_2_flue_type'] = getDefaultFlueType(secondAppliance["Asset Type"]);
            }
            
            // Appliance 3
            if (appliances.length > 2) {
              const thirdAppliance = appliances[2];
              lgsrResponses['appliance_3_type'] = getApplianceType(thirdAppliance["Asset Type"]);
              lgsrResponses['appliance_3_location'] = taskData.plant_rooms?.["Block"] || 'Plant Room';
              lgsrResponses['appliance_3_make_model'] = `${thirdAppliance["Manufacturer"] || 'Unknown'} ${thirdAppliance["Model"] || ''}`.trim();
              lgsrResponses['appliance_3_flue_type'] = getDefaultFlueType(thirdAppliance["Asset Type"]);
            }
            
            // Additional appliances beyond 3
            if (appliances.length > 3) {
              let additionalAppliances = '';
              for (let i = 3; i < appliances.length; i++) {
                const appliance = appliances[i];
                additionalAppliances += `Appliance ${i + 1}:\n`;
                additionalAppliances += `Type: ${getApplianceType(appliance["Asset Type"])}\n`;
                additionalAppliances += `Location: ${taskData.plant_rooms?.["Block"] || 'Plant Room'}\n`;
                additionalAppliances += `Make/Model: ${appliance["Manufacturer"] || 'Unknown'} ${appliance["Model"] || ''}`.trim() + '\n';
                additionalAppliances += `Asset ID: ${appliance["Asset ID"]}\n`;
                if (appliance["Serial Number"]) {
                  additionalAppliances += `Serial: ${appliance["Serial Number"]}\n`;
                }
                additionalAppliances += '\n';
              }
              lgsrResponses['appliance_4_details'] = additionalAppliances;
            }
          }
          
          console.log('LGSR auto-populated responses:', lgsrResponses);
          setResponses(lgsrResponses);
          return; // Exit early for LGSR tasks
        }
      }

      // Determine asset type for template matching
      let assetType = 'General';
     
     // Check if this is an LGSR task first
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

      // Fetch appropriate form template
      const { data: templateData, error: templateError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('asset_type', assetType)
        .single();

      let selectedTemplate = templateData;
      
      if (templateError) {
        // For LGSR tasks, try to find any LGSR template or create a basic one
        if (taskData.type_of_task === 'LGSR') {
          console.log('LGSR template not found, looking for alternatives...');
          
          // Try to find any LGSR template by form_template_id
          const { data: lgsrTemplate } = await supabase
            .from('form_templates')
            .select('*')
            .ilike('form_template_id', '%lgsr%')
            .single();
          
          if (lgsrTemplate) {
            selectedTemplate = lgsrTemplate;
            console.log('Found LGSR template by ID:', lgsrTemplate.form_template_id);
          } else {
            console.log('No LGSR template found, creating fallback template');
            // Create a basic LGSR template on the fly
            selectedTemplate = {
              id: 'temp-lgsr',
              form_template_id: 'basic-lgsr-fallback',
              asset_type: 'LGSR',
              title: 'Landlord Gas Safety Record (LGSR)',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              fields: [
                { id: 'property_address', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Enter full property address' },
                { id: 'property_postcode', label: 'Property Postcode', type: 'text', required: true, placeholder: 'Enter property postcode' },
                { id: 'landlord_agent_name', label: 'Landlord/Agent Name', type: 'text', required: true, placeholder: 'Enter landlord or managing agent name' },
                { id: 'inspection_date', label: 'Date of Inspection', type: 'date', required: true },
                { id: 'next_inspection_due', label: 'Next Inspection Due Date', type: 'date', required: true },
                
                // Appliance 1
                { id: 'appliance_1_type', label: 'Appliance 1 - Type', type: 'select', required: true, options: ['Boiler - Room sealed', 'Boiler - Open flue', 'Water heater', 'Fire - Radiant/Convector', 'Cooker', 'Other'] },
                { id: 'appliance_1_location', label: 'Appliance 1 - Location', type: 'text', required: true, placeholder: 'e.g., Plant room, Kitchen, etc.' },
                { id: 'appliance_1_make_model', label: 'Appliance 1 - Make and Model', type: 'text', required: true, placeholder: 'Enter manufacturer and model' },
                { id: 'appliance_1_flue_type', label: 'Appliance 1 - Flue Type', type: 'select', required: true, options: ['Room sealed', 'Open flue - Natural draught', 'Open flue - Fan assisted', 'Flueless', 'Not applicable'] },
                { id: 'appliance_1_gas_rate_actual', label: 'Appliance 1 - Gas Rate (m³/h)', type: 'number', required: true, placeholder: 'Enter gas consumption rate' },
                { id: 'appliance_1_operating_pressure', label: 'Appliance 1 - Operating Pressure (mbar)', type: 'number', required: true, placeholder: 'Enter operating pressure' },
                { id: 'appliance_1_co_reading', label: 'Appliance 1 - CO Reading (ppm)', type: 'number', required: true, placeholder: 'Carbon monoxide reading' },
                { id: 'appliance_1_co2_reading', label: 'Appliance 1 - CO₂ Reading (%)', type: 'number', required: true, placeholder: 'Carbon dioxide percentage' },
                
                // Appliance 2
                { id: 'appliance_2_type', label: 'Appliance 2 - Type', type: 'select', required: false, options: ['Boiler - Room sealed', 'Boiler - Open flue', 'Water heater', 'Fire - Radiant/Convector', 'Cooker', 'Other'] },
                { id: 'appliance_2_location', label: 'Appliance 2 - Location', type: 'text', required: false, placeholder: 'e.g., Plant room, Kitchen, etc.' },
                { id: 'appliance_2_make_model', label: 'Appliance 2 - Make and Model', type: 'text', required: false, placeholder: 'Enter manufacturer and model' },
                { id: 'appliance_2_flue_type', label: 'Appliance 2 - Flue Type', type: 'select', required: false, options: ['Room sealed', 'Open flue - Natural draught', 'Open flue - Fan assisted', 'Flueless', 'Not applicable'] },
                { id: 'appliance_2_gas_rate_actual', label: 'Appliance 2 - Gas Rate (m³/h)', type: 'number', required: false, placeholder: 'Enter gas consumption rate' },
                { id: 'appliance_2_operating_pressure', label: 'Appliance 2 - Operating Pressure (mbar)', type: 'number', required: false, placeholder: 'Enter operating pressure' },
                { id: 'appliance_2_co_reading', label: 'Appliance 2 - CO Reading (ppm)', type: 'number', required: false, placeholder: 'Carbon monoxide reading' },
                { id: 'appliance_2_co2_reading', label: 'Appliance 2 - CO₂ Reading (%)', type: 'number', required: false, placeholder: 'Carbon dioxide percentage' },
                
                // Appliance 3
                { id: 'appliance_3_type', label: 'Appliance 3 - Type', type: 'select', required: false, options: ['Boiler - Room sealed', 'Boiler - Open flue', 'Water heater', 'Fire - Radiant/Convector', 'Cooker', 'Other'] },
                { id: 'appliance_3_location', label: 'Appliance 3 - Location', type: 'text', required: false, placeholder: 'e.g., Plant room, Kitchen, etc.' },
                { id: 'appliance_3_make_model', label: 'Appliance 3 - Make and Model', type: 'text', required: false, placeholder: 'Enter manufacturer and model' },
                { id: 'appliance_3_flue_type', label: 'Appliance 3 - Flue Type', type: 'select', required: false, options: ['Room sealed', 'Open flue - Natural draught', 'Open flue - Fan assisted', 'Flueless', 'Not applicable'] },
                { id: 'appliance_3_gas_rate_actual', label: 'Appliance 3 - Gas Rate (m³/h)', type: 'number', required: false, placeholder: 'Enter gas consumption rate' },
                { id: 'appliance_3_operating_pressure', label: 'Appliance 3 - Operating Pressure (mbar)', type: 'number', required: false, placeholder: 'Enter operating pressure' },
                { id: 'appliance_3_co_reading', label: 'Appliance 3 - CO Reading (ppm)', type: 'number', required: false, placeholder: 'Carbon monoxide reading' },
                { id: 'appliance_3_co2_reading', label: 'Appliance 3 - CO₂ Reading (%)', type: 'number', required: false, placeholder: 'Carbon dioxide percentage' },
                
                // Additional appliances
                { id: 'appliance_4_details', label: 'Additional Appliances - Details (appliances 4+)', type: 'textarea', required: false, placeholder: 'List additional gas appliances with details' },
                
                // Engineer details
                { id: 'engineer_name', label: 'Engineer Name', type: 'text', required: true, placeholder: 'Enter engineer full name' },
                { id: 'engineer_gas_safe_number', label: 'Gas Safe Registration Number', type: 'text', required: true, placeholder: 'Enter Gas Safe registration number' },
                { id: 'engineer_company_name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
                { id: 'engineer_contact_number', label: 'Engineer Contact Number', type: 'text', required: true, placeholder: 'Enter contact number' },
                
                // Assessment
                { id: 'overall_assessment', label: 'Overall Installation Assessment', type: 'select', required: true, options: ['Satisfactory - Safe to use', 'At Risk - Defects require attention but appliance may continue to operate', 'Immediately Dangerous - Appliance isolated/turned off'] },
                
                // Notes
                { id: 'additional_notes', label: 'Additional Notes and Observations', type: 'textarea', required: false, placeholder: 'Record any additional observations or notes' }
              ] as FormField[]
            };
          }
        } else {
          // Fallback to General template for non-LGSR tasks
          const { data: fallbackTemplate } = await supabase
            .from('form_templates')
            .select('*')
            .eq('asset_type', 'General')
            .single();
          
          selectedTemplate = fallbackTemplate;
        }
      }
      
      setTemplate(selectedTemplate);

      // Auto-populate fields based on task type
      if (taskData.type_of_task === 'LGSR' && selectedTemplate) {
        // LGSR auto-population is handled above after appliance fetch
        // This section is for non-LGSR tasks only
      } else {
        // Auto-populate location fields for non-LGSR tasks
        if (selectedTemplate?.fields) {
          const generalResponses: { [key: string]: any } = {};
          selectedTemplate.fields.forEach((field: FormField) => {
            const label = field.label.toLowerCase();
            if (label.includes('location') && label.includes('id')) {
              // Auto-populate location/ID fields
              if (taskData.assets) {
                generalResponses[field.id] = `${taskData.assets["Asset Name"]} - ${taskData.plant_rooms?.["Address"] || 'Plant Room'}`;
              } else {
                generalResponses[field.id] = taskData.plant_rooms?.["Block"] || '';
              }
            }
          });
          setResponses(generalResponses);
        }
      }

    } catch (error) {
      console.error('Error fetching task and template:', error);
      setError('Failed to load form template');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map asset types to LGSR appliance types
  const getApplianceType = (assetType: string): string => {
    const type = assetType.toLowerCase();
    if (type.includes('boiler')) {
      return 'Boiler - Room sealed'; // Default, can be adjusted during inspection
    } else if (type.includes('water heater')) {
      return 'Water heater';
    } else if (type.includes('fire')) {
      return 'Fire - Radiant/Convector';
    } else if (type.includes('cooker')) {
      return 'Cooker';
    } else if (type.includes('gas')) {
      return 'Other (specify in notes)';
    }
    return 'Other (specify in notes)';
  };

  // Helper function to get default flue type based on asset type
  const getDefaultFlueType = (assetType: string): string => {
    const type = assetType.toLowerCase();
    if (type.includes('boiler') || type.includes('water heater')) {
      return 'Room sealed'; // Modern default
    } else if (type.includes('fire')) {
      return 'Open flue - Natural draught';
    } else if (type.includes('cooker')) {
      return 'Flueless';
    }
    return 'Room sealed';
  };

  const handlePhotoCapture = async (fieldId: string) => {
    try {
      // For demo purposes, we'll use a file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setResponses(prev => ({ ...prev, [fieldId]: base64 }));
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Generate submission ID
      const submissionId = `FORM-${Date.now()}`;

      // Prepare signatures
      const engineerSig = engineerSigRef?.toDataURL();
      const clientSig = clientSigRef?.toDataURL();

      // Collect photos from responses
      const photos = Object.values(responses).filter(value => 
        typeof value === 'string' && value.startsWith('data:image/')
      ) as string[];

      const submissionData = {
        form_submission_id: submissionId,
        task_id: taskId,
        asset_id: task?.asset_id || null,
        engineer_id: userProfile?.id || null,
        submission_date: new Date().toISOString(),
        responses,
        photos,
        engineer_signature: engineerSig || null,
        client_signature: clientSig || null,
        status: 'Submitted'
      };

      const { error: submissionError } = await supabase
        .from('form_submissions')
        .insert([submissionData]);

      if (submissionError) throw submissionError;

      // Update task status to completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'Completed',
          date_completed: new Date().toISOString().split('T')[0],
          notes: responses.additional_notes || task?.notes
        })
        .eq('id', taskId);

      if (taskError) {
        console.error('Error updating task status:', taskError);
      }

      // Navigate back to tasks with success message
      navigate('/tasks');

    } catch (error: any) {
      console.error('Error creating submission:', error);
      setError(`Error creating submission: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const isAutoPopulated = responses[field.id] && (
      field.label?.toLowerCase().includes('location') ||
      field.label?.toLowerCase().includes('id') ||
      field.type === 'text'
    );

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
            readOnly={isAutoPopulated}
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
                    engineerSigRef = ref;
                  } else if (field.id === 'client_signature') {
                    clientSigRef = ref;
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
                  engineerSigRef?.clear();
                } else if (field.id === 'client_signature') {
                  clientSigRef?.clear();
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

  if (!template) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900">No form template found</h3>
        <p className="text-secondary-600 mt-2">No form template is available for this asset type.</p>
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
              <h2 className="text-2xl font-bold">{template.title}</h2>
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
                  ref={(ref) => engineerSigRef = ref}
                  canvasProps={{
                    width: 300,
                    height: 150,
                    className: 'signature-canvas border rounded bg-white'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => engineerSigRef?.clear()}
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
                  ref={(ref) => clientSigRef = ref}
                  canvasProps={{
                    width: 300,
                    height: 150,
                    className: 'signature-canvas border rounded bg-white'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => clientSigRef?.clear()}
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
    </div>
  );
};

export default TaskForm;