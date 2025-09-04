import { supabase } from './src/lib/supabase';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'radio' | 'photo' | 'signature';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export const domesticLgsrTemplate = {
  form_template_id: 'domestic-lgsr-comprehensive',
  asset_type: 'Domestic LGSR',
  title: 'Domestic Landlord Gas Safety Record (CP12)',
  fields: [
    // Company Details
    {
      id: 'cert_no',
      label: 'Cert no.',
      type: 'text',
      required: true,
      placeholder: 'Enter certificate number'
    },
    {
      id: 'engineer_name',
      label: 'Engineer',
      type: 'text',
      required: true,
      placeholder: 'Enter engineer name'
    },
    {
      id: 'company_name',
      label: 'Company',
      type: 'text',
      required: true,
      placeholder: 'Enter company name'
    },
    {
      id: 'company_address_line_1',
      label: 'Address Line 1',
      type: 'text',
      required: true,
      placeholder: 'Enter address line 1'
    },
    {
      id: 'company_address_line_2',
      label: 'Address Line 2',
      type: 'text',
      required: false,
      placeholder: 'Enter address line 2'
    },
    {
      id: 'company_address_line_3',
      label: 'Address Line 3',
      type: 'text',
      required: false,
      placeholder: 'Enter address line 3'
    },
    {
      id: 'company_address_line_4',
      label: 'Address Line 4',
      type: 'text',
      required: false,
      placeholder: 'Enter address line 4'
    },
    {
      id: 'company_postcode',
      label: 'Postcode',
      type: 'text',
      required: true,
      placeholder: 'Enter company postcode'
    },
    {
      id: 'company_telephone',
      label: 'Telephone Number',
      type: 'text',
      required: true,
      placeholder: 'Enter company telephone number'
    },
    {
      id: 'gas_safe_reg_no',
      label: 'Gas Safe Reg No.',
      type: 'text',
      required: true,
      placeholder: 'Enter Gas Safe registration number'
    },
    {
      id: 'id_card_no',
      label: 'ID Card No.',
      type: 'text',
      required: true,
      placeholder: 'Enter ID card number'
    },

    // Job Address Details
    {
      id: 'job_address_name',
      label: 'Job Address - Name',
      type: 'text',
      required: true,
      placeholder: 'Enter job address name'
    },
    {
      id: 'job_address_line_1',
      label: 'Job Address - Address Line 1',
      type: 'text',
      required: true,
      placeholder: 'Enter job address line 1'
    },
    {
      id: 'job_address_line_2',
      label: 'Job Address - Address Line 2',
      type: 'text',
      required: false,
      placeholder: 'Enter job address line 2'
    },
    {
      id: 'job_address_line_3',
      label: 'Job Address - Address Line 3',
      type: 'text',
      required: false,
      placeholder: 'Enter job address line 3'
    },
    {
      id: 'job_address_line_4',
      label: 'Job Address - Address Line 4',
      type: 'text',
      required: false,
      placeholder: 'Enter job address line 4'
    },
    {
      id: 'job_address_postcode',
      label: 'Job Address - Postcode',
      type: 'text',
      required: true,
      placeholder: 'Enter job address postcode'
    },
    {
      id: 'job_address_telephone',
      label: 'Job Address - Telephone Number',
      type: 'text',
      required: false,
      placeholder: 'Enter job address telephone number'
    },

    // Customer Details
    {
      id: 'customer_name',
      label: 'Customer - Name',
      type: 'text',
      required: false,
      placeholder: 'Enter customer name'
    },
    {
      id: 'customer_company',
      label: 'Customer - Company',
      type: 'text',
      required: false,
      placeholder: 'Enter customer company'
    },
    {
      id: 'customer_address_line_1',
      label: 'Customer - Address Line 1',
      type: 'text',
      required: false,
      placeholder: 'Enter customer address line 1'
    },
    {
      id: 'customer_address_line_2',
      label: 'Customer - Address Line 2',
      type: 'text',
      required: false,
      placeholder: 'Enter customer address line 2'
    },
    {
      id: 'customer_address_line_3',
      label: 'Customer - Address Line 3',
      type: 'text',
      required: false,
      placeholder: 'Enter customer address line 3'
    },
    {
      id: 'customer_address_line_4',
      label: 'Customer - Address Line 4',
      type: 'text',
      required: false,
      placeholder: 'Enter customer address line 4'
    },
    {
      id: 'customer_postcode',
      label: 'Customer - Postcode',
      type: 'text',
      required: false,
      placeholder: 'Enter customer postcode'
    },
    {
      id: 'customer_telephone',
      label: 'Customer - Telephone Number',
      type: 'text',
      required: false,
      placeholder: 'Enter customer telephone number'
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
      label: 'Appliance 1 - Appliance Type',
      type: 'select',
      required: true,
      options: [
        'Boiler',
        'Water heater',
        'Fire',
        'Cooker',
        'Space heater',
        'Other'
      ]
    },
    {
      id: 'appliance_1_make',
      label: 'Appliance 1 - Make',
      type: 'text',
      required: true,
      placeholder: 'Enter appliance make'
    },
    {
      id: 'appliance_1_model',
      label: 'Appliance 1 - Model',
      type: 'text',
      required: true,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_1_flue_type',
      label: 'Appliance 1 - Flue Type',
      type: 'select',
      required: true,
      options: [
        'Room sealed',
        'Open flue',
        'Balanced flue',
        'Flueless',
        'Not applicable'
      ]
    },
    {
      id: 'appliance_1_owner',
      label: 'Appliance 1 - Appliance Owner',
      type: 'text',
      required: true,
      placeholder: 'Enter appliance owner'
    },
    {
      id: 'appliance_1_inspected',
      label: 'Appliance 1 - Appliance Inspected',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_1_operating_pressure',
      label: 'Appliance 1 - Operating Pressure (mbar)',
      type: 'number',
      required: true,
      placeholder: 'Enter operating pressure'
    },
    {
      id: 'appliance_1_heat_input',
      label: 'Appliance 1 - Heat Input (kW/h)',
      type: 'number',
      required: true,
      placeholder: 'Enter heat input'
    },
    {
      id: 'appliance_1_high_ratio',
      label: 'Appliance 1 - High Combustion Readings - Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter high ratio'
    },
    {
      id: 'appliance_1_high_co',
      label: 'Appliance 1 - High Combustion Readings - CO ppm',
      type: 'number',
      required: true,
      placeholder: 'Enter high CO ppm'
    },
    {
      id: 'appliance_1_high_co2',
      label: 'Appliance 1 - High Combustion Readings - CO2 %',
      type: 'number',
      required: true,
      placeholder: 'Enter high CO2 %'
    },
    {
      id: 'appliance_1_low_ratio',
      label: 'Appliance 1 - Low Combustion Readings - Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter low ratio'
    },
    {
      id: 'appliance_1_low_co',
      label: 'Appliance 1 - Low Combustion Readings - CO ppm',
      type: 'number',
      required: true,
      placeholder: 'Enter low CO ppm'
    },
    {
      id: 'appliance_1_low_co2',
      label: 'Appliance 1 - Low Combustion Readings - CO2 %',
      type: 'number',
      required: true,
      placeholder: 'Enter low CO2 %'
    },
    {
      id: 'appliance_1_safety_devices',
      label: 'Appliance 1 - Safety Devices Correct Operation',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_1_ventilation',
      label: 'Appliance 1 - Ventilation Provision Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_1_flue_condition',
      label: 'Appliance 1 - Visual condition of flue and termination satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_1_flue_performance',
      label: 'Appliance 1 - Flue performance test',
      type: 'radio',
      required: true,
      options: ['Satisfactory', 'Unsatisfactory', 'N/A']
    },
    {
      id: 'appliance_1_serviced',
      label: 'Appliance 1 - Appliance Serviced',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_1_safe_to_use',
      label: 'Appliance 1 - Appliance Safe to Use',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_1_defects',
      label: 'Appliance 1 - Defects Identified',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any defects identified'
    },
    {
      id: 'appliance_1_warning_notice',
      label: 'Appliance 1 - Labels and Warning Notice Issued?',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
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
      label: 'Appliance 2 - Appliance Type',
      type: 'select',
      required: false,
      options: [
        'Boiler',
        'Water heater',
        'Fire',
        'Cooker',
        'Space heater',
        'Other'
      ]
    },
    {
      id: 'appliance_2_make',
      label: 'Appliance 2 - Make',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance make'
    },
    {
      id: 'appliance_2_model',
      label: 'Appliance 2 - Model',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_2_flue_type',
      label: 'Appliance 2 - Flue Type',
      type: 'select',
      required: false,
      options: [
        'Room sealed',
        'Open flue',
        'Balanced flue',
        'Flueless',
        'Not applicable'
      ]
    },
    {
      id: 'appliance_2_owner',
      label: 'Appliance 2 - Appliance Owner',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance owner'
    },
    {
      id: 'appliance_2_inspected',
      label: 'Appliance 2 - Appliance Inspected',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_2_operating_pressure',
      label: 'Appliance 2 - Operating Pressure (mbar)',
      type: 'number',
      required: false,
      placeholder: 'Enter operating pressure'
    },
    {
      id: 'appliance_2_heat_input',
      label: 'Appliance 2 - Heat Input (kW/h)',
      type: 'number',
      required: false,
      placeholder: 'Enter heat input'
    },
    {
      id: 'appliance_2_high_ratio',
      label: 'Appliance 2 - High Combustion Readings - Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter high ratio'
    },
    {
      id: 'appliance_2_high_co',
      label: 'Appliance 2 - High Combustion Readings - CO ppm',
      type: 'number',
      required: false,
      placeholder: 'Enter high CO ppm'
    },
    {
      id: 'appliance_2_high_co2',
      label: 'Appliance 2 - High Combustion Readings - CO2 %',
      type: 'number',
      required: false,
      placeholder: 'Enter high CO2 %'
    },
    {
      id: 'appliance_2_low_ratio',
      label: 'Appliance 2 - Low Combustion Readings - Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter low ratio'
    },
    {
      id: 'appliance_2_low_co',
      label: 'Appliance 2 - Low Combustion Readings - CO ppm',
      type: 'number',
      required: false,
      placeholder: 'Enter low CO ppm'
    },
    {
      id: 'appliance_2_low_co2',
      label: 'Appliance 2 - Low Combustion Readings - CO2 %',
      type: 'number',
      required: false,
      placeholder: 'Enter low CO2 %'
    },
    {
      id: 'appliance_2_safety_devices',
      label: 'Appliance 2 - Safety Devices Correct Operation',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_2_ventilation',
      label: 'Appliance 2 - Ventilation Provision Satisfactory',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_2_flue_condition',
      label: 'Appliance 2 - Visual condition of flue and termination satisfactory',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_2_flue_performance',
      label: 'Appliance 2 - Flue performance test',
      type: 'radio',
      required: false,
      options: ['Satisfactory', 'Unsatisfactory', 'Not Applicable']
    },
    {
      id: 'appliance_2_serviced',
      label: 'Appliance 2 - Appliance Serviced',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_2_safe_to_use',
      label: 'Appliance 2 - Appliance Safe to Use',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_2_defects',
      label: 'Appliance 2 - Defects Identified',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any defects identified'
    },
    {
      id: 'appliance_2_warning_notice',
      label: 'Appliance 2 - Labels and Warning Notice Issued?',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
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
      id: 'appliance_2_type',
      label: 'Appliance 3 - Appliance Type',
      type: 'select',
      required: false,
      options: [
        'Boiler',
        'Water heater',
        'Fire',
        'Cooker',
        'Space heater',
        'Other'
      ]
    },
    {
      id: 'appliance_3_make',
      label: 'Appliance 3 - Make',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance make'
    },
    {
      id: 'appliance_3_model',
      label: 'Appliance 3 - Model',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance model'
    },
    {
      id: 'appliance_3_flue_type',
      label: 'Appliance 3 - Flue Type',
      type: 'select',
      required: false,
      options: [
        'Room sealed',
        'Open flue',
        'Balanced flue',
        'Flueless',
        'Not applicable'
      ]
    },
    {
      id: 'appliance_3_owner',
      label: 'Appliance 3 - Appliance Owner',
      type: 'text',
      required: false,
      placeholder: 'Enter appliance owner'
    },
    {
      id: 'appliance_3_inspected',
      label: 'Appliance 3 - Appliance Inspected',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_3_operating_pressure',
      label: 'Appliance 3 - Operating Pressure (mbar)',
      type: 'number',
      required: false,
      placeholder: 'Enter operating pressure'
    },
    {
      id: 'appliance_3_heat_input',
      label: 'Appliance 3 - Heat Input (kW/h)',
      type: 'number',
      required: false,
      placeholder: 'Enter heat input'
    },
    {
      id: 'appliance_3_high_ratio',
      label: 'Appliance 3 - High Combustion Readings - Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter high ratio'
    },
    {
      id: 'appliance_3_high_co',
      label: 'Appliance 3 - High Combustion Readings - CO ppm',
      type: 'number',
      required: false,
      placeholder: 'Enter high CO ppm'
    },
    {
      id: 'appliance_3_high_co2',
      label: 'Appliance 3 - High Combustion Readings - CO2 %',
      type: 'number',
      required: false,
      placeholder: 'Enter high CO2 %'
    },
    {
      id: 'appliance_3_low_ratio',
      label: 'Appliance 3 - Low Combustion Readings - Ratio',
      type: 'number',
      required: false,
      placeholder: 'Enter low ratio'
    },
    {
      id: 'appliance_3_low_co',
      label: 'Appliance 3 - Low Combustion Readings - CO ppm',
      type: 'number',
      required: false,
      placeholder: 'Enter low CO ppm'
    },
    {
      id: 'appliance_3_low_co2',
      label: 'Appliance 3 - Low Combustion Readings - CO2 %',
      type: 'number',
      required: false,
      placeholder: 'Enter low CO2 %'
    },
    {
      id: 'appliance_3_safety_devices',
      label: 'Appliance 3 - Safety Devices Correct Operation',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_3_ventilation',
      label: 'Appliance 3 - Ventilation Provision Satisfactory',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_3_flue_condition',
      label: 'Appliance 3 - Visual condition of flue and termination satisfactory',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_3_flue_performance',
      label: 'Appliance 3 - Flue performance test',
      type: 'radio',
      required: false,
      options: ['Satisfactory', 'Unsatisfactory', 'N/A']
    },
    {
      id: 'appliance_3_serviced',
      label: 'Appliance 3 - Appliance Serviced',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_3_safe_to_use',
      label: 'Appliance 3 - Appliance Safe to Use',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },
    {
      id: 'appliance_3_defects',
      label: 'Appliance 3 - Defects Identified',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any defects identified'
    },
    {
      id: 'appliance_3_warning_notice',
      label: 'Appliance 3 - Labels and Warning Notice Issued?',
      type: 'radio',
      required: false,
      options: ['Yes', 'No']
    },

    // Safety Checks
    {
      id: 'co_alarms',
      label: 'CO Alarm(s)',
      type: 'radio',
      required: false,
      options: ['Fitted', 'Not fitted', 'N/A']
    },
    {
      id: 'cp_alarms_fitted',
      label: 'CP Alarm(s) Fitted',
      type: 'radio',
      required: false,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'cp_alarms_tested',
      label: 'CP Alarm(s) tested and Satisfactory',
      type: 'radio',
      required: false,
      options: ['Yes', 'No', 'N/A']
    },
    {
      id: 'emergency_control_accessible',
      label: 'Emergency Control Accessible',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'gas_tightness_satisfactory',
      label: 'Gas Tightness Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'gas_installation_visual_inspection',
      label: 'Gas Installation Pipework Visual Inspection Satisfactory',
      type: 'radio',
      required: true,
      options: ['Yes', 'No']
    },
    {
      id: 'equipotential_bonding',
      label: 'Equipotential Bonding',
      type: 'radio',
      required: true,
      options: ['Satisfactory', 'Unsatisfactory', 'N/A']
    },
    {
      id: 'next_inspection_due',
      label: 'Next Inspection Due Before',
      type: 'date',
      required: true
    },
    {
      id: 'comments',
      label: 'Comments',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any additional comments'
    },

    // Signatures
    {
      id: 'issued_by',
      label: 'Issued By',
      type: 'text',
      required: true,
      placeholder: 'Enter name of person issuing'
    },
    {
      id: 'received_by',
      label: 'Received By',
      type: 'text',
      required: false,
      placeholder: 'Enter name of person receiving'
    },
    {
      id: 'issued_date',
      label: 'Issued Date',
      type: 'date',
      required: true,
    },
    {
      id: 'engineer_signature',
      label: 'Gas Engineer Signature',
      type: 'signature',
      required: true
    },
    {
      id: 'customer_signature',
      label: 'Customer/Representative Signature',
      type: 'signature',
      required: false
    },
    {
      id: 'installation_photos',
      label: 'Installation Photos',
      type: 'photo',
      required: false
    }
  ] as FormField[]
};

export const createDomesticLgsrTemplate = async (): Promise<{ 
  success: boolean; 
  error?: string; 
  templateId?: string 
}> => {
  try {
    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('form_templates')
      .select('id')
      .eq('form_template_id', domesticLgsrTemplate.form_template_id)
      .maybeSingle();

    if (existingTemplate) {
      return { 
        success: false, 
        error: 'Domestic LGSR template already exists' 
      };
    }

    // Create the template
    const { data, error } = await supabase
      .from('form_templates')
      .insert([domesticLgsrTemplate])
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