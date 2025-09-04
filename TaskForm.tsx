import React, { useEffect, useState, useRef } from 'react';
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
    "Postcode": string;
    "Plant Room ID": string;
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

  const engineerSigRef = useRef<SignatureCanvas | null>(null);
  const clientSigRef = useRef<SignatureCanvas | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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
          assetType = 'Pressure