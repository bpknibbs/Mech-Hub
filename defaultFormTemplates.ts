import { supabase } from '../lib/supabase';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'radio' | 'photo' | 'signature';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormTemplate {
  form_template_id: string;
  asset_type: string;
  title: string;
  fields: FormField[];
}

export const defaultFormTemplates: FormTemplate[] = [
  {
    form_template_id: 'fresh-water-pump-ppm',
    asset_type: 'Fresh Water Pump',
    title: 'Fresh Water Pump PPM',
    fields: [
      {
        id: 'check_for_leaks',
        label: 'Check for leaks: Inspect seals, gaskets, and pipe connections for any signs of water leaks',
        type: 'radio',
        required: true,
        options: ['No leaks detected', 'Minor seepage', 'Moderate leak', 'Major leak']
      },
      {
        id: 'check_unusual_noise_vibration',
        label: 'Check for unusual noise or vibration: Listen for grinding, humming, or knocking sounds. Feel the pump for excessive vibration',
        type: 'radio',
        required: true,
        options: ['Normal operation', 'Slight noise/vibration', 'Moderate noise/vibration', 'Excessive noise/vibration']
      },
      {
        id: 'inspect_motor_pump_housing',
        label: 'Inspect motor and pump housing: Check for corrosion, damage, or overheating',
        type: 'select',
        required: true,
        options: ['Good condition', 'Minor wear', 'Corrosion present', 'Damage present', 'Overheating signs']
      },
      {
        id: 'check_pressure_gauge_readings',
        label: 'Check pressure gauge readings: Verify the pump\'s discharge and suction pressures are within the normal operating range',
        type: 'radio',
        required: true,
        options: ['Within normal range', 'Slightly out of range', 'Significantly out of range', 'Gauge malfunction']
      },
      {
        id: 'check_auto_manual_operation',
        label: 'Check for correct auto/manual operation: Test the pump\'s automatic start/stop functionality and manual override',
        type: 'radio',
        required: true,
        options: ['Auto/manual working correctly', 'Auto operation issues', 'Manual operation issues', 'Both auto and manual issues']
      },
      {
        id: 'clean_strainers_filters',
        label: 'Clean strainers or filters: Remove any debris from upstream filters',
        type: 'checkbox',
        required: true
      },
      {
        id: 'outgoing_pressure',
        label: 'Outgoing Pressure',
        type: 'number',
        required: true,
        placeholder: 'Enter outgoing pressure reading'
      },
      {
        id: 'additional_notes',
        label: 'Additional Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Record any additional observations or maintenance performed'
      },
      {
        id: 'pump_photo',
        label: 'Pump Photo',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    form_template_id: 'gas-boiler-ppm',
    asset_type: 'Boiler',
    title: 'Gas Boiler PPM',
    fields: [
      {
        id: 'boiler_location_id',
        label: 'Boiler Location/ID',
        type: 'text',
        required: true,
        placeholder: 'Enter boiler location or ID'
      },
      {
        id: 'check_gas_leaks',
        label: 'Check for gas leaks: Use a gas leak detector to inspect all gas connections',
        type: 'radio',
        required: true,
        options: ['No gas leaks detected', 'Minor gas leak detected', 'Significant gas leak detected']
      },
      {
        id: 'check_flue_integrity',
        label: 'Check flue integrity: Inspect the flue for blockages, corrosion, or damage',
        type: 'select',
        required: true,
        options: ['Flue clear and intact', 'Minor blockage', 'Corrosion present', 'Damage present', 'Major blockage']
      },
      {
        id: 'combustion_analysis',
        label: 'Check combustion analysis: Use a flue gas analyzer to measure CO, O2, and CO2 levels',
        type: 'radio',
        required: true,
        options: ['All levels within range', 'Some levels borderline', 'Levels outside safe range']
      },
      {
        id: 'burner_operation',
        label: 'Check burner operation: Observe the flame for correct color and stability',
        type: 'select',
        required: true,
        options: ['Blue stable flame', 'Yellow flame', 'Unstable flame', 'No ignition', 'Flame issues']
      },
      {
        id: 'test_safety_interlocks',
        label: 'Test all safety interlocks: Check low-water cut-off, high-temperature limit, and pressure relief valve',
        type: 'radio',
        required: true,
        options: ['All safety devices functional', 'Some devices need attention', 'Safety devices not working']
      },
      {
        id: 'inspect_clean_burner_pilot',
        label: 'Inspect and clean burner and pilot assembly: Remove any dust or debris',
        type: 'checkbox',
        required: true
      },
      {
        id: 'check_ignition_electrodes_flame_sensor',
        label: 'Check ignition electrodes and flame sensor: Ensure they are clean and correctly gapped',
        type: 'radio',
        required: true,
        options: ['Clean and correctly gapped', 'Needs cleaning', 'Incorrect gap', 'Needs replacement']
      },
      {
        id: 'inspect_heat_exchanger',
        label: 'Inspect heat exchanger: Look for soot buildup, scale, or cracks',
        type: 'select',
        required: true,
        options: ['Clean and intact', 'Minor soot buildup', 'Scale present', 'Cracks detected', 'Major issues']
      },
      {
        id: 'check_condensate_drain',
        label: 'Check condensate drain: Ensure the drain is clear and the trap is not blocked',
        type: 'radio',
        required: true,
        options: ['Drain clear', 'Partially blocked', 'Completely blocked']
      },
      {
        id: 'check_system_pressure',
        label: 'Check system pressure: Ensure the pressure is within the correct range',
        type: 'radio',
        required: true,
        options: ['Pressure within range', 'Pressure slightly out of range', 'Pressure significantly out of range']
      },
      {
        id: 'co_reading',
        label: 'CO (ppm)',
        type: 'number',
        required: true,
        placeholder: 'Enter CO reading in ppm'
      },
      {
        id: 'co2_reading',
        label: 'CO2 (%)',
        type: 'number',
        required: true,
        placeholder: 'Enter CO2 percentage'
      },
      {
        id: 'boiler_pressure',
        label: 'Boiler Pressure (bar)',
        type: 'number',
        required: true,
        placeholder: 'Enter boiler pressure reading'
      },
      {
        id: 'additional_notes',
        label: 'Additional Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Record any additional observations or maintenance performed'
      },
      {
        id: 'boiler_photo',
        label: 'Boiler Photo',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    form_template_id: 'circulator-pump-ppm',
    asset_type: 'Pump',
    title: 'Circulator Pump PPM',
    fields: [
      {
        id: 'pump_location_id',
        label: 'Pump Location/ID',
        type: 'text',
        required: true,
        placeholder: 'Enter pump location or ID'
      },
      {
        id: 'check_leaks',
        label: 'Check for leaks: Inspect flanges and seals for weeping or drips',
        type: 'radio',
        required: true,
        options: ['No leaks detected', 'Minor weeping', 'Moderate leak', 'Major leak']
      },
      {
        id: 'listen_unusual_noise',
        label: 'Listen for unusual noise: Check for rattling, grinding, or cavitation sounds',
        type: 'radio',
        required: true,
        options: ['Normal operation', 'Slight noise', 'Rattling/grinding', 'Cavitation sounds']
      },
      {
        id: 'feel_vibration',
        label: 'Feel for vibration: Check for smooth operation and minimal vibration',
        type: 'select',
        required: true,
        options: ['Smooth operation', 'Slight vibration', 'Moderate vibration', 'Excessive vibration']
      },
      {
        id: 'test_auto_manual_switch',
        label: 'Test auto/manual switch: Verify the functionality of the control switch',
        type: 'radio',
        required: true,
        options: ['Auto/manual working correctly', 'Auto operation issues', 'Manual operation issues', 'Switch malfunction']
      },
      {
        id: 'clean_inspect_strainer',
        label: 'Clean and inspect strainer: Remove any sludge or debris from the upstream strainer',
        type: 'checkbox',
        required: true
      },
      {
        id: 'pump_notes',
        label: 'Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Record any additional observations or maintenance performed'
      },
      {
        id: 'pump_photo',
        label: 'Pump Photo',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    form_template_id: 'general-plant-room-checks',
    asset_type: 'General',
    title: 'General Plant Room Checks',
    fields: [
      {
        id: 'plant_room_location_id',
        label: 'Plant Room Location/ID',
        type: 'text',
        required: true,
        placeholder: 'Enter plant room location or ID'
      },
      {
        id: 'check_cleanliness',
        label: 'Check for cleanliness: Ensure floors are clear of debris and spills',
        type: 'radio',
        required: true,
        options: ['Clean and clear', 'Minor debris', 'Moderate mess', 'Significant cleanup needed']
      },
      {
        id: 'check_fire_hazards',
        label: 'Check for fire hazards: Inspect for combustible materials near hot equipment',
        type: 'radio',
        required: true,
        options: ['No fire hazards', 'Minor concerns', 'Fire hazards present']
      },
      {
        id: 'verify_clear_access',
        label: 'Verify clear access: Ensure all panels, valves, and emergency exits are unobstructed',
        type: 'radio',
        required: true,
        options: ['All access clear', 'Some obstructions', 'Major access issues']
      },
      {
        id: 'check_lighting',
        label: 'Check lighting: Ensure the plant room is adequately lit',
        type: 'radio',
        required: true,
        options: ['Adequate lighting', 'Poor lighting', 'Lighting not working']
      },
      {
        id: 'check_ventilation',
        label: 'Check ventilation: Verify that ventilation systems are operating correctly',
        type: 'radio',
        required: true,
        options: ['Ventilation working correctly', 'Poor ventilation', 'Ventilation not working']
      },
      {
        id: 'check_water_levels',
        label: 'Check water levels: Inspect header tanks and expansion vessels',
        type: 'select',
        required: true,
        options: ['All levels normal', 'Some levels low', 'Levels critically low', 'Overflow present']
      },
      {
        id: 'check_pipework_leaks',
        label: 'Check for pipework leaks: Perform a visual inspection of all visible pipework, valves, and fittings for signs of leaks',
        type: 'radio',
        required: true,
        options: ['No leaks detected', 'Minor leaks', 'Moderate leaks', 'Major leaks']
      },
      {
        id: 'check_abnormal_noise',
        label: 'Check for abnormal noise: Listen for loud banging, humming, or cavitation from any equipment',
        type: 'radio',
        required: true,
        options: ['Normal operation', 'Minor noise', 'Loud banging/humming', 'Cavitation sounds']
      },
      {
        id: 'check_gauges_indicators',
        label: 'Check gauges and indicators: Verify all pressure and temperature gauges are reading correctly',
        type: 'radio',
        required: true,
        options: ['All gauges reading correctly', 'Some gauges questionable', 'Gauges not working']
      },
      {
        id: 'inspect_electrical_panels',
        label: 'Inspect electrical panels: Ensure all panels are closed and secured, and there are no signs of overheating',
        type: 'radio',
        required: true,
        options: ['Panels secure, no overheating', 'Panels open', 'Signs of overheating', 'Multiple issues']
      },
      {
        id: 'system_pressure',
        label: 'System Pressure (bar)',
        type: 'number',
        required: true,
        placeholder: 'Enter system pressure reading'
      },
      {
        id: 'plant_room_notes',
        label: 'Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Record any additional observations or issues'
      },
      {
        id: 'plant_room_photo',
        label: 'Plant Room Photo',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    form_template_id: 'vessel-ppm',
    asset_type: 'Pressure Vessel',
    title: 'Vessel PPM',
    fields: [
      {
        id: 'vessel_location_id',
        label: 'Pressure Vessel Location/ID',
        type: 'text',
        required: true,
        placeholder: 'Enter vessel location or ID'
      },
      {
        id: 'max_allowable_working_pressure',
        label: 'Max. Allowable Working Pressure (MAWP)',
        type: 'text',
        required: true,
        placeholder: 'Enter MAWP'
      },
      {
        id: 'temperature_min_max',
        label: 'Temperature (min/max)',
        type: 'text',
        required: true,
        placeholder: 'Enter temperature range'
      },
      {
        id: 'fluid_contained',
        label: 'Fluid Contained',
        type: 'text',
        required: true,
        placeholder: 'Enter fluid type'
      },
      {
        id: 'last_statutory_inspection',
        label: 'Date of Last Statutory Inspection',
        type: 'date',
        required: true
      },
      {
        id: 'external_surface_condition',
        label: 'External Surface: Check for signs of corrosion, pitting, cracks, or dents. Inspect paint or protective coating for damage or flaking. Check all external welds for visible cracks or defects. Verify the nameplate is legible and securely attached',
        type: 'select',
        required: true,
        options: ['Excellent condition', 'Minor corrosion/wear', 'Moderate damage', 'Significant issues', 'Critical condition']
      },
      {
        id: 'foundation_supports',
        label: 'Foundation & Supports: Check the vessel\'s foundation for cracks, settlement, or damage. Inspect supports, saddles, or legs for corrosion and secure mounting. Ensure anchor bolts are tight and not corroded',
        type: 'select',
        required: true,
        options: ['Foundation secure', 'Minor settlement', 'Loose bolts', 'Corrosion present', 'Structural issues']
      },
      {
        id: 'insulation_jacketing',
        label: 'Insulation & Jacketing (if applicable): Check the insulation for damage, moisture, or missing sections. Inspect the external jacket or cladding for integrity',
        type: 'select',
        required: false,
        options: ['Good condition', 'Minor damage', 'Moisture present', 'Missing sections', 'Not applicable']
      },
      {
        id: 'nozzles_flanges',
        label: 'Nozzles & Flanges: Check for leaks around all flanges and threaded connections. Inspect bolts and nuts for corrosion and proper torque',
        type: 'radio',
        required: true,
        options: ['No leaks, bolts secure', 'Minor leaks', 'Loose bolts', 'Significant issues']
      },
      {
        id: 'gauges_instruments',
        label: 'Gauges & Instruments: Verify the pressure gauge is functioning and reading correctly. Check temperature gauges/sensors for proper operation',
        type: 'radio',
        required: true,
        options: ['All instruments working', 'Some instruments faulty', 'Multiple instrument failures']
      },
      {
        id: 'current_pressure',
        label: 'Current Pressure',
        type: 'number',
        required: true,
        placeholder: 'Enter current pressure reading'
      },
      {
        id: 'current_temperature',
        label: 'Current Temperature',
        type: 'number',
        required: true,
        placeholder: 'Enter current temperature reading'
      },
      {
        id: 'vents_drains',
        label: 'Vents & Drains: Ensure vents and drains are not blocked and are functioning correctly. Check drain valves for leaks',
        type: 'radio',
        required: true,
        options: ['All clear and functional', 'Minor blockages', 'Significant blockages', 'Valve leaks']
      },
      {
        id: 'pressure_relief_valve',
        label: 'Pressure Relief Valve (PRV) / Safety Relief Valve (SRV): Verify the PRV is securely mounted and the outlet is unobstructed. Check for signs of tampering or damage',
        type: 'select',
        required: true,
        options: ['PRV secure and clear', 'Minor issues', 'Tampered with', 'Damaged', 'Outlet obstructed']
      },
      {
        id: 'rupture_disc',
        label: 'Rupture Disc (if applicable): Visually inspect the rupture disc housing and vent piping. Check for signs of a previous rupture or leakage',
        type: 'select',
        required: false,
        options: ['Good condition', 'Previous rupture signs', 'Leakage detected', 'Needs replacement', 'Not applicable']
      },
      {
        id: 'internal_surface',
        label: 'Internal Surface (if required by written scheme): Check for corrosion, pitting, erosion, or scale buildup on the internal walls. Inspect internal components such as baffles, trays, or agitators for damage or wear',
        type: 'select',
        required: false,
        options: ['Good internal condition', 'Minor corrosion/scale', 'Moderate damage', 'Significant issues', 'Inspection not required']
      },
      {
        id: 'internal_welds',
        label: 'Internal Welds (if accessible): Perform a visual inspection of all internal welds. Check for signs of cracking or fatigue',
        type: 'select',
        required: false,
        options: ['Welds good condition', 'Minor concerns', 'Cracking detected', 'Fatigue signs', 'Not accessible']
      },
      {
        id: 'defects_found',
        label: 'Defects Found',
        type: 'textarea',
        required: false,
        placeholder: 'List any defects found during inspection'
      },
      {
        id: 'corrective_actions_taken',
        label: 'Corrective Actions Taken',
        type: 'textarea',
        required: false,
        placeholder: 'Describe any corrective actions taken'
      },
      {
        id: 'recommendations_future_action',
        label: 'Recommendations for Future Action',
        type: 'textarea',
        required: false,
        placeholder: 'Provide recommendations for future maintenance'
      },
      {
        id: 'vessel_notes',
        label: 'Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Additional notes or observations'
      },
      {
        id: 'vessel_photo',
        label: 'Vessel Photo',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    form_template_id: 'lgsr-landlord-gas-safety',
    asset_type: 'LGSR',
    title: 'Landlord Gas Safety Record (LGSR)',
    fields: [
      {
        id: 'property_address',
        label: 'Property Address',
        type: 'text',
        required: true,
        placeholder: 'Enter full property address'
      },
      {
        id: 'property_postcode',
        label: 'Property Postcode',
        type: 'text',
        required: true,
        placeholder: 'Enter property postcode'
      },
      {
        id: 'landlord_name',
        label: 'Landlord/Agent Name',
        type: 'text',
        required: true,
        placeholder: 'Enter landlord or managing agent name'
      },
      {
        id: 'tenant_name',
        label: 'Tenant Name',
        type: 'text',
        required: false,
        placeholder: 'Enter tenant name (if applicable)'
      },
      {
        id: 'inspection_date',
        label: 'Date of Inspection',
        type: 'date',
        required: true
      },
      {
        id: 'next_inspection_due',
        label: 'Next Inspection Due Date',
        type: 'date',
        required: true
      },
      {
        id: 'gas_meter_location',
        label: 'Gas Meter Location',
        type: 'text',
        required: true,
        placeholder: 'e.g., External meter box, Plant room, etc.'
      },
      {
        id: 'emergency_control_valve',
        label: 'Emergency Control Valve Location',
        type: 'text',
        required: true,
        placeholder: 'Location of main gas emergency control valve'
      },
      {
        id: 'gas_installation_tightness_test',
        label: 'Gas Installation Tightness Test: Test the entire gas installation for gas tightness using appropriate test equipment',
        type: 'radio',
        required: true,
        options: ['Satisfactory - No gas leaks detected', 'Unsatisfactory - Gas leaks detected', 'Not tested - Access issues']
      },
      {
        id: 'gas_installation_visual_inspection',
        label: 'Gas Installation Visual Inspection: Check all visible gas pipework for corrosion, damage, and proper support',
        type: 'radio',
        required: true,
        options: ['Satisfactory - Good condition', 'Unsatisfactory - Issues identified', 'Not accessible']
      },
      {
        id: 'gas_installation_purging',
        label: 'Gas Installation Purging: Verify gas pipework has been properly purged of air',
        type: 'radio',
        required: true,
        options: ['Satisfactory', 'Unsatisfactory', 'Not applicable']
      },
      {
        id: 'appliance_1_type',
        label: 'Appliance 1 - Type',
        type: 'select',
        required: true,
        options: ['Boiler - Room sealed', 'Boiler - Open flue', 'Water heater', 'Fire - Radiant/Convector', 'Cooker', 'Other']
      },
      {
        id: 'appliance_1_location',
        label: 'Appliance 1 - Location',
        type: 'text',
        required: true,
        placeholder: 'e.g., Plant room, Kitchen, etc.'
      },
      {
        id: 'appliance_1_make_model',
        label: 'Appliance 1 - Make and Model',
        type: 'text',
        required: true,
        placeholder: 'Enter manufacturer and model'
      },
      {
        id: 'appliance_1_flue_type',
        label: 'Appliance 1 - Flue Type',
        type: 'select',
        required: true,
        options: ['Room sealed', 'Open flue - Natural draught', 'Open flue - Fan assisted', 'Flueless', 'Not applicable']
      },
      {
        id: 'appliance_1_gas_rate',
        label: 'Appliance 1 - Gas Rate (m³/h)',
        type: 'number',
        required: true,
        placeholder: 'Enter gas consumption rate'
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
        label: 'Appliance 1 - Heat Input (kW)',
        type: 'number',
        required: false,
        placeholder: 'Enter heat input rating'
      },
      {
        id: 'appliance_1_safety_checks',
        label: 'Appliance 1 - Safety Checks: Check operation of safety devices including flame supervision, overheat protection, and gas valve operation',
        type: 'radio',
        required: true,
        options: ['Satisfactory - All safety devices working', 'Unsatisfactory - Safety device failure', 'Not tested']
      },
      {
        id: 'appliance_1_combustion_analysis',
        label: 'Appliance 1 - Combustion Analysis: CO/CO2 ratio and spillage test',
        type: 'radio',
        required: true,
        options: ['Satisfactory - Within safe limits', 'Unsatisfactory - Outside safe limits', 'Not tested']
      },
      {
        id: 'appliance_1_co_reading',
        label: 'Appliance 1 - CO Reading (ppm)',
        type: 'number',
        required: true,
        placeholder: 'Carbon monoxide reading'
      },
      {
        id: 'appliance_1_co2_reading',
        label: 'Appliance 1 - CO2 Reading (%)',
        type: 'number',
        required: true,
        placeholder: 'Carbon dioxide percentage'
      },
      {
        id: 'appliance_1_flue_flow_test',
        label: 'Appliance 1 - Flue Flow Test: Check for adequate flow and no spillage',
        type: 'radio',
        required: true,
        options: ['Satisfactory - Good flow, no spillage', 'Unsatisfactory - Poor flow or spillage detected', 'Not applicable - Room sealed appliance']
      },
      {
        id: 'appliance_1_ventilation',
        label: 'Appliance 1 - Ventilation: Check adequate ventilation for appliance operation and room air requirements',
        type: 'radio',
        required: true,
        options: ['Satisfactory - Adequate ventilation', 'Unsatisfactory - Inadequate ventilation', 'Not applicable']
      },
      {
        id: 'appliance_2_details',
        label: 'Additional Appliances Present',
        type: 'textarea',
        required: false,
        placeholder: 'List additional gas appliances with details (Type, Location, Make/Model, Test Results)'
      },
      {
        id: 'defects_identified',
        label: 'Defects Identified (AR - At Risk, ID - Immediately Dangerous, NCS - Not to Current Standards)',
        type: 'textarea',
        required: false,
        placeholder: 'List any defects found with classification'
      },
      {
        id: 'remedial_action_taken',
        label: 'Remedial Action Taken',
        type: 'textarea',
        required: false,
        placeholder: 'Describe any immediate remedial actions taken'
      },
      {
        id: 'remedial_action_required',
        label: 'Remedial Action Required',
        type: 'textarea',
        required: false,
        placeholder: 'Describe any future remedial actions required'
      },
      {
        id: 'tenant_advised_of_defects',
        label: 'Tenant/Landlord Advised of Defects',
        type: 'checkbox',
        required: false
      },
      {
        id: 'appliance_isolation_required',
        label: 'Any Appliances Isolated/Turned Off',
        type: 'textarea',
        required: false,
        placeholder: 'Details of any appliances that were isolated or turned off for safety'
      },
      {
        id: 'gas_supply_isolation',
        label: 'Gas Supply Isolation Required',
        type: 'checkbox',
        required: false
      },
      {
        id: 'overall_assessment',
        label: 'Overall Installation Assessment',
        type: 'select',
        required: true,
        options: ['Satisfactory - Safe to use', 'At Risk - Defects require attention but appliance may continue to operate', 'Immediately Dangerous - Appliance isolated/turned off']
      },
      {
        id: 'engineer_gas_safe_number',
        label: 'Engineer Gas Safe Registration Number',
        type: 'text',
        required: true,
        placeholder: 'Enter Gas Safe registration number'
      },
      {
        id: 'engineer_name',
        label: 'Engineer Name',
        type: 'text',
        required: true,
        placeholder: 'Enter engineer full name'
      },
      {
        id: 'engineer_company',
        label: 'Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name'
      },
      {
        id: 'engineer_contact_number',
        label: 'Engineer Contact Number',
        type: 'text',
        required: true,
        placeholder: 'Enter engineer contact number'
      },
      {
        id: 'warning_notice_issued',
        label: 'Warning Notice Issued to Landlord/Tenant',
        type: 'checkbox',
        required: false
      },
      {
        id: 'riddor_notification_required',
        label: 'RIDDOR Notification Required',
        type: 'checkbox',
        required: false
      },
      {
        id: 'lgsr_notes',
        label: 'Additional Notes and Observations',
        type: 'textarea',
        required: false,
        placeholder: 'Record any additional observations, recommendations, or notes'
      },
      {
        id: 'installation_photos',
        label: 'Installation Photos',
        type: 'photo',
        required: false
      },
      {
        id: 'engineer_signature',
        label: 'Engineer Signature',
        type: 'signature',
        required: true
      },
      {
        id: 'landlord_signature',
        label: 'Landlord/Agent Signature',
        type: 'signature',
        required: false
      }
    ]
  }
];

export const createDefaultTemplates = async (): Promise<{ created: number; errors: string[] }> => {
  const errors: string[] = [];
  let created = 0;

  try {
    // Check which templates already exist
    const { data: existingTemplates } = await supabase
      .from('form_templates')
      .select('form_template_id');

    const existingIds = new Set(existingTemplates?.map(t => t.form_template_id) || []);

    // Filter out templates that already exist
    const templatesToCreate = defaultFormTemplates.filter(
      template => !existingIds.has(template.form_template_id)
    );

    if (templatesToCreate.length === 0) {
      return { created: 0, errors: [] };
    }

    // Insert new templates
    const { error } = await supabase
      .from('form_templates')
      .insert(templatesToCreate);

    if (error) {
      errors.push(`Error creating templates: ${error.message}`);
    } else {
      created = templatesToCreate.length;
    }

  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { created, errors };
};