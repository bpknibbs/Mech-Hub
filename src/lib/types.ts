export interface PlantRoom {
  id: string;
  "Plant Room ID": string;
  "Block": string;
  "Address": string;
  "Postcode": string;
  "Plant Room Type": string;
  photo?: string;
  last_lgsr_date?: string;
  domestic_classification?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
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
}

export interface Task {
  id: string;
  task_id: string;
  plant_room_id: string;
  asset_id?: string;
  assigned_to?: string;
  due_date: string;
  type_of_task: string;
  status: string;
  date_completed?: string;
  notes?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  "Engineer ID": string;
  "Name": string;
  "Email": string;
  "Phone Number"?: string;
  "Role": string;
  "Skills": string[];
  user_id?: string;
  roles?: string[];
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  log_id: string;
  plant_room_id: string;
  date: string;
  time: string;
  user_email: string;
  log_entry: string;
  photo?: string;
  gps_location?: string;
  status: string;
  comments?: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_submission_id: string;
  task_id?: string;
  asset_id?: string;
  engineer_id?: string;
  submission_date: string;
  responses: any;
  photos?: string[];
  engineer_signature?: string;
  client_signature?: string;
  pdf_url?: string;
  emailed_to?: string[];
  status: string;
  created_at: string;
}

export interface PartsRequest {
  id: string;
  parts_request_id: string;
  task_id?: string;
  asset_id?: string;
  requested_by?: string;
  part_name: string;
  part_number?: string;
  manufacturer?: string;
  quantity: number;
  supplier?: string;
  estimated_cost?: number;
  urgency: string;
  status: string;
  order_date?: string;
  expected_delivery?: string;
  received_date?: string;
  installed_date?: string;
  notes?: string;
  corrective_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalPlantRooms: number;
  totalAssets: number;
  operationalAssets: number;
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  completedTasks: number;
  myTasks: number;
  myOverdueTasks: number;
  totalLogs: number;
  formSubmissions: number;
  partsRequests: number;
  pendingParts: number;
  completionRate: number;
  totalEngineers: number;
}

export interface ChartData {
  tasksByType: Array<{ name: string; count: number }>;
  assetsByType: Array<{ name: string; total: number; operational: number }>;
}

export interface TaskWithRelations extends Task {
  assets?: Pick<Asset, "Asset Name" | "Asset Type" | "Asset ID">;
  plant_rooms?: Pick<PlantRoom, "Block" | "Address" | "Plant Room Type">;
  team?: Pick<TeamMember, "Name" | "Email" | "Phone Number">;
}

export interface AssetWithRelations extends Asset {
  plant_rooms?: Pick<PlantRoom, "Block" | "Address" | "Plant Room Type">;
}

export interface LogWithRelations extends Log {
  plant_rooms?: Pick<PlantRoom, "Block" | "Address" | "Plant Room Type">;
}