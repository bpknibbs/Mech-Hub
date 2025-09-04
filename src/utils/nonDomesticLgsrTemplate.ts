import { supabase } from '../lib/supabase';
import { parseISO, addMonths } from 'date-fns';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'radio' | 'photo' | 'signature';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export const nonDomesticLgsrTemplate = {
  form_template_id: 'non-domestic-lgsr-commercial',
  asset_type: 'Non-Domestic LGSR',
  title: 'Commercial Servicing/Commissioning Record (Non-Domestic)',
  fields: [
    // Serial Number
    {
      id: 'serial_number',
      label: 'Serial No',
      type: 'text',
      required: true,
      placeholder: 'Enter form serial number'
    },

    // Registered Business Details
    {
      id: 'gas_engineer_name',
      label: 'Gas Engineer Name',
      type: 'text',
      required: true,
      placeholder: 'Enter gas engineer full name'
    },
    {
      id: 'gas_safe_reg_number',
      label: 'Gas Safe Registered Engineer No',
      type: 'text',
      required: true,
      placeholder: 'Enter Gas Safe registration number'
    },
    {
      id: 'company_name',
      label: 'Company',
      type: 'text',
      required: true,
      placeholder: 'Enter company name'
    },
    {
      id: 'company_address',
      label: 'Company Address',
      type: 'textarea',
      required: true,
      placeholder: 'Enter company address'
    },
    {
      id: 'company_postcode',
      label: 'Company Postcode',
      type: 'text',
      required: true,
      placeholder: 'Enter company postcode'
    },
    {
      id: 'company_telephone',
      label: 'Company Telephone',
      type: 'text',
      required: true,
      placeholder: 'Enter company telephone number'
    },

    // Inspection/Installation Address
    {
      id: 'inspection_name_title',
      label: 'Inspection Address - Name & Title',
      type: 'text',
      required: true,
      placeholder: 'Enter property name and title'
    },
    {
      id: 'inspection_address',
      label: 'Inspection Address',
      type: 'textarea',
      required: true,
      placeholder: 'Enter full inspection address'
    },
    {
      id: 'inspection_postcode',
      label: 'Inspection Postcode',
      type: 'text',
      required: true,
      placeholder: 'Enter inspection postcode'
    },
    {
      id: 'inspection_telephone',
      label: 'Inspection Telephone',
      type: 'text',
      required: false,
      placeholder: 'Enter inspection contact telephone'
    },
    {
      id: 'inspection_date',
      label: 'Date of Inspection',
      type: 'date',
      required: true
    },

    // Customer Details (if different)
    {
      id: 'customer_name_title',
      label: 'Customer Name & Title (if different)',
      type: 'text',
      required: false,
      placeholder: 'Enter customer name and title'
    },
    {
      id: 'customer_address',
      label: 'Customer Address (if different)',
      type: 'textarea',
      required: false,
      placeholder: 'Enter customer address if different from inspection address'
    },
    {
      id: 'customer_postcode',
      label: 'Customer Postcode',
      type: 'text',
      required: false,
      placeholder: 'Enter customer postcode'
    },

    // Appliance 1 Details
    {
      id: 'appliance_1_location',
      label: 'Appliance 1 - Location',
      type: 'text',
      required: true,
      placeholder: 'Enter appliance location'
    },
    {
      id: 'appliance_1_type',
      label: 'Appliance 1 - Type',
      type: 'select',
      required: true,
      options: [
        'Boiler - Room sealed',
        'Boiler - Open flue',
        'Water heater - Room sealed',
        'Water heater - Open flue',
        'Commercial cooker',
        'Space heater',
        'Warm air heater',
        'Generator',
        'Other (specify in notes)'
      ]
    },
    {
      id: 'appliance_1_model',
      label: 'Appliance 1 - Model',
      type: 'text',
      required: true,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_1_serial_no',
      label: 'Appliance 1 - Serial No',
      type: 'text',
      required: true,
      placeholder: 'Enter appliance serial number'
    },
    {
      id: 'appliance_1_burner_manufacturer',
      label: 'Appliance 1 - Burner Manufacturer (if different)',
      type: 'text',
      required: false,
      placeholder: 'Enter burner manufacturer if different'
    },
    {
      id: 'appliance_1_flue_type',
      label: 'Appliance 1 - Flue Type',
      type: 'select',
      required: true,
      options: [
        'Room sealed',
        'Open flue - Natural draught',
        'Open flue - Fan assisted',
        'Balanced flue',
        'Flueless',
        'Not applicable'
      ]
    },

    // Appliance 1 Combustion Checks
    {
      id: 'appliance_1_heat_input_low',
      label: 'Appliance 1 - Heat Input Rating Low (kW)',
      type: 'number',
      required: true,
      placeholder: 'Enter low firing heat input'
    },
    {
      id: 'appliance_1_heat_input_high',
      label: 'Appliance 1 - Heat Input Rating High (kW)',
      type: 'number',
      required: true,
      placeholder: 'Enter high firing heat input'
    },
    {
      id: 'appliance_1_gas_pressure_low',
      label: 'Appliance 1 - Gas Burner Pressure Low (mbar)',
      type: 'number',
      required: true,
      placeholder: 'Enter low firing gas pressure'
    },
    {
      id: 'appliance_1_gas_pressure_high',
      label: 'Appliance 1 - Gas Burner Pressure High (mbar)',
      type: 'number',
      required: true,
      placeholder: 'Enter high firing gas pressure'
    },
    {
      id: 'appliance_1_gas_rate_low',
      label: 'Appliance 1 - Gas Rate Low (m³/hr)',
      type: 'number',
      required: true,
      placeholder: 'Enter low firing gas rate'
    },
    {
      id: 'appliance_1_gas_rate_high',
      label: 'Appliance 1 - Gas Rate High (m³/hr)',
      type: 'number',
      required: true,
      placeholder: 'Enter high firing gas rate'
    },
    {
      id: 'appliance_1_air_gas_ratio_low',
      label: 'Appliance 1 - Air/Gas Ratio Control Setting Low',
      type: 'text',
      required: false,
      placeholder: 'Enter low firing air/gas ratio'
    },
    {
      id: 'appliance_1_air_gas_ratio_high',
      label: 'Appliance 1 - Air/Gas Ratio Control Setting High',
      type: 'text',
      required: false,
      placeholder: 'Enter high firing air/gas ratio'
    },
    {
      id: 'appliance_1_ambient_temp',
      label: 'Appliance 1 - Ambient (Room) Temperature (°C)',
      type: 'number',
      required: true,
      placeholder: 'Enter ambient temperature'
    },
    {
      id: 'appliance_1_flue_gas_temp',
      label: 'Appliance 1 - Flue Gas Temperature (°C)',
      type: 'number',
      required: true,
      placeholder: 'Enter flue gas temperature'
    },
    {
      id: 'appliance_1_flue_gas_temp_net',
      label: 'Appliance 1 - Flue Gas Temperature Net (°C)',
      type: 'number',
      required: true,
      placeholder: 'Enter net flue gas temperature'
    },
    {
      id: 'appliance_1_flue_draught_pressure',
      label: 'Appliance 1 - Flue Draught Pressure (mbar)',
      type: 'number',
      required: true,
      placeholder: 'Enter flue draught pressure'
    },
    {
      id: 'appliance_1_oxygen_percent',
      label: 'Appliance 1 - Oxygen (O₂) %',
      type: 'number',
      required: true,
      placeholder: 'Enter oxygen percentage'
    },
    {
      id: 'appliance_1_co_ppm',
      label: 'Appliance 1 - Carbon Monoxide (CO) ppm',
      type: 'number',
      required: true,
      placeholder: 'Enter CO reading in ppm'
    },
    {
      id: 'appliance_1_co2_percent',
      label: 'Appliance 1 - Carbon Dioxide (CO₂) %',
      type: 'number',
      required: true,
      placeholder: 'Enter CO₂ percentage'
    },
    {
      id: 'appliance_1_nox_percent',
      label: 'Appliance 1 - NOx %',
      type: 'number',
      required: false,
      placeholder: 'Enter NOx percentage'
    },
    {
      id: 'appliance_1_excess_air_percent',
      label: 'Appliance 1 - Excess Air %',
      type: 'number',
      required: false,
      placeholder: 'Enter excess air percentage'
    },
    {
      id: 'appliance_1_co_co2_ratio',
      label: 'Appliance 1 - CO/CO₂ Ratio',
      type: 'number',
      required: true,
      placeholder: 'Enter CO/CO₂ ratio'
    },
    {
      id: 'appliance_1_gross_efficiency_percent',
      label: 'Appliance 1 - Gross Efficiency %',
      type: 'number',
      required: true,
      placeholder: 'Enter gross efficiency percentage'
    },
    {
      id: 'appliance_1_co_flue_dilution',
      label: 'Appliance 1 - CO Flue Dilution (ppm)',
      type: 'number',
      required: false,
      placeholder: 'Enter CO flue dilution'
    },

    // Appliance 1 Additional Checks
    {
      id: 'appliance_1_flue_flow_test',
      label: 'Appliance 1 - Flue Flow Test Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_spillage_test',
      label: 'Appliance 1 - Spillage Test Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_ventilation_satisfactory',
      label: 'Appliance 1 - Ventilation Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_air_gas_pressure_switch',
      label: 'Appliance 1 - Air/Gas Pressure Switch Operating Correctly',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_flame_proving_safety',
      label: 'Appliance 1 - Flame Proving/Safety Devices Operating Correctly',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_burner_lockout_time',
      label: 'Appliance 1 - Burner Lock-out Time',
      type: 'text',
      required: false,
      placeholder: 'Enter burner lock-out time'
    },
    {
      id: 'appliance_1_temp_limit_thermostats',
      label: 'Appliance 1 - Temperature and Limit Thermostats Operating Correctly',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_serviced',
      label: 'Appliance 1 - Appliance Serviced',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'appliance_1_condensate_discharge',
      label: 'Appliance 1 - Condensate Discharge Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },

    // General Safety Checks
    {
      id: 'gas_booster_compressor_operating',
      label: 'Gas Booster(s)/Compressor(s) Operating Correctly',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'gas_installation_tightness_test',
      label: 'Gas Installation Tightness Test Carried Out',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'gas_pipework_adequately_supported',
      label: 'Gas Installation Pipework Adequately Supported',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'gas_pipework_sleeved_labelled',
      label: 'Gas Installation Pipework Sleeved/Labelled/Painted as Necessary',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'flue_system_installed_standards',
      label: 'Flue System Installed in Accordance with Appropriate Standards',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'flue_terminations_satisfactory',
      label: 'Flue Termination(s) Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'fan_flue_interlock_operating',
      label: 'Fan-Flue Interlock Operating Correctly',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },

    // Ventilation Type
    {
      id: 'ventilation_type',
      label: 'Ventilation Type',
      type: 'select',
      required: true,
      options: ['1. Natural', '2. Mechanical']
    },
    {
      id: 'plant_room_ventilation_low_level',
      label: 'Plant Room/Compartment Ventilation - Low-level Free Area (cm²)',
      type: 'number',
      required: false,
      placeholder: 'Enter low-level free area'
    },
    {
      id: 'plant_room_ventilation_high_level',
      label: 'Plant Room/Compartment Ventilation - High-level Free Area (cm²)',
      type: 'number',
      required: false,
      placeholder: 'Enter high-level free area'
    },
    {
      id: 'ventilation_grilles_clear_natural',
      label: 'All Ventilation Grilles Clear and Unobstructed (Natural)',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'mechanical_ventilation_inlet_flow',
      label: 'Mechanical Ventilation Flow Rate - Inlet (m³/s)',
      type: 'number',
      required: false,
      placeholder: 'Enter inlet flow rate'
    },
    {
      id: 'mechanical_ventilation_extract_flow',
      label: 'Mechanical Ventilation Flow Rate - Extract (m³/s)',
      type: 'number',
      required: false,
      placeholder: 'Enter extract flow rate'
    },
    {
      id: 'mechanical_ventilation_interlock',
      label: 'Mechanical Ventilation Interlock Operating Correctly',
      type: 'radio',
      required: false,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'ventilation_grilles_clear_mechanical',
      label: 'All Ventilation Grilles Clear and Unobstructed (Mechanical)',
      type: 'radio',
      required: false,
      options: ['Yes', 'No', 'N/A']
    },

    // Appliance 2 Details
    {
      id: 'appliance_2_location',
      label: 'Appliance 2 - Location',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance location'
    },
    {
      id: 'appliance_2_type',
      label: 'Appliance 2 - Type',
      type: 'select',
      required: false,
      options: [
        'Boiler - Room sealed',
        'Boiler - Open flue',
        'Water heater - Room sealed',
        'Water heater - Open flue',
        'Commercial cooker',
        'Space heater',
        'Warm air heater',
        'Generator',
        'Other (specify in notes)'
      ]
    },
    {
      id: 'appliance_2_model',
      label: 'Appliance 2 - Model',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_2_serial_no',
      label: 'Appliance 2 - Serial No',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance serial number'
    },
    {
      id: 'appliance_2_co_ppm',
      label: 'Appliance 2 - Carbon Monoxide (CO) ppm',
      type: 'number',
      required: false,
      placeholder: 'Enter CO reading'
    },
    {
      id: 'appliance_2_co2_percent',
      label: 'Appliance 2 - Carbon Dioxide (CO₂) %',
      type: 'number',
      required: false,
      placeholder: 'Enter CO₂ percentage'
    },
    {
      id: 'appliance_2_co_co2_ratio',
      label: 'Appliance 2 - CO/CO₂ Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter CO/CO₂ ratio'
    },
    {
      id: 'appliance_2_gross_efficiency',
      label: 'Appliance 2 - Gross Efficiency %',
      type: 'number',
      required: false,
      placeholder: 'Enter gross efficiency'
    },

    // Appliance 3 Details
    {
      id: 'appliance_3_location',
      label: 'Appliance 3 - Location',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance location'
    },
    {
      id: 'appliance_3_type',
      label: 'Appliance 3 - Type',
      type: 'select',
      required: false,
      options: [
        'Boiler - Room sealed',
        'Boiler - Open flue',
        'Water heater - Room sealed',
        'Water heater - Open flue',
        'Commercial cooker',
        'Space heater',
        'Warm air heater',
        'Generator',
        'Other (specify in notes)'
      ]
    },
    {
      id: 'appliance_3_model',
      label: 'Appliance 3 - Model',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_3_serial_no',
      label: 'Appliance 3 - Serial No',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance serial number'
    },
    {
      id: 'appliance_3_co_ppm',
      label: 'Appliance 3 - Carbon Monoxide (CO) ppm',
      type: 'number',
      required: false,
      placeholder: 'Enter CO reading'
    },
    {
      id: 'appliance_3_co2_percent',
      label: 'Appliance 3 - Carbon Dioxide (CO₂) %',
      type: 'number',
      required: false,
      placeholder: 'Enter CO₂ percentage'
    },

    // Appliance 4 Details
    {
      id: 'appliance_4_location',
      label: 'Appliance 4 - Location',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance location'
    },
    {
      id: 'appliance_4_type',
      label: 'Appliance 4 - Type',
      type: 'select',
      required: false,
      options: [
        'Boiler - Room sealed',
        'Boiler - Open flue',
        'Water heater - Room sealed',
        'Water heater - Open flue',
        'Commercial cooker',
        'Space heater',
        'Warm air heater',
        'Generator',
        'Other (specify in notes)'
      ]
    },
    {
      id: 'appliance_4_model',
      label: 'Appliance 4 - Model',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_4_serial_no',
      label: 'Appliance 4 - Serial No',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance serial number'
    },

    // Safety Information
    {
      id: 'warning_advice_notice_raised',
      label: 'Has a Warning/Advice Notice been Raised?',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'warning_labels_attached',
      label: 'Have Warning Labels been Attached?',
      type: 'radio',
      required: true,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'responsible_person_advised',
      label: 'Has Responsible Person been Advised?',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },

    // Work Details
    {
      id: 'remedial_work_required',
      label: 'Details of Remedial Work Required',
      type: 'textarea',
      required: false,
      placeholder: 'Describe any remedial work that needs to be completed'
    },
    {
      id: 'details_of_work_done',
      label: 'Details of Work Done',
      type: 'textarea',
      required: true,
      placeholder: 'Describe all work completed during this service/commissioning'
    },

    // Declaration and Signatures
    {
      id: 'gas_safety_declaration',
      label: 'Gas Safety Declaration',
      type: 'checkbox',
      required: true
    },
    {
      id: 'engineer_signature',
      label: 'Gas Engineer Signature',
      type: 'signature',
      required: true
    },
    {
      id: 'signature_date',
      label: 'Signature Date',
      type: 'date',
      required: true
    },

    // Photos
    {
      id: 'installation_photos',
      label: 'Installation Photos',
      type: 'photo',
      required: false
    },
    {
      id: 'appliance_photos',
      label: 'Appliance Photos',
      type: 'photo',
      required: false
    },
    {
      id: 'flue_system_photos',
      label: 'Flue System Photos',
      type: 'photo',
      required: false
    },

    // Additional Notes
    {
      id: 'additional_notes',
      label: 'Additional Notes and Observations',
      type: 'textarea',
      required: false,
      placeholder: 'Record any additional observations, recommendations, or notes'
    }
  ] as FormField[]
};

export const createNonDomesticLgsrTemplate = async (): Promise<{
  success: boolean;
  error?: string;
  templateId?: string
}> => {
  try {
    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('form_templates')
      .select('id')
      .eq('form_template_id', nonDomesticLgsrTemplate.form_template_id)
      .maybeSingle();

    if (existingTemplate) {
      return {
        success: false,
        error: 'Non-domestic LGSR template already exists'
      };
    }

    // Create the template
    const { data, error } = await supabase
      .from('form_templates')
      .insert([nonDomesticLgsrTemplate])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      templateId: data.id
    };

  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};