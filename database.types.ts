export interface Database {
  public: {
    Tables: {
      plant_rooms: {
        Row: {
          id: string;
          "Plant Room ID": string;
          "Block": string;
          "Address": string;
          "Postcode": string;
          "Plant Room Type": string;
          photo?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          "Plant Room ID": string;
          "Block": string;
          "Address": string;
          "Postcode": string;
          "Plant Room Type": string;
          photo?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          "Plant Room ID"?: string;
          "Block"?: string;
          "Address"?: string;
          "Postcode"?: string;
          "Plant Room Type"?: string;
          photo?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
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
        };
        Insert: {
          id?: string;
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
          "Operational"?: boolean;
          "Photo"?: string;
          "QR Code"?: string;
          "Plant Room ID"?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          "Asset ID"?: string;
          "Asset Name"?: string;
          "Asset Type"?: string;
          "Vessel Size"?: string;
          "Pre-Charge Pressure"?: string;
          "Manufacturer"?: string;
          "Model"?: string;
          "Serial Number"?: string;
          "Install Date"?: string;
          "Last Service Date"?: string;
          "Frequency"?: string;
          "Operational"?: boolean;
          "Photo"?: string;
          "QR Code"?: string;
          "Plant Room ID"?: string;
          updated_at?: string;
        };
      };
      team: {
        Row: {
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
        };
        Insert: {
          id?: string;
          "Engineer ID": string;
          "Name": string;
          "Email": string;
          "Phone Number"?: string;
          "Role": string;
          "Skills"?: string[];
          user_id?: string;
          roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          "Engineer ID"?: string;
          "Name"?: string;
          "Email"?: string;
          "Phone Number"?: string;
          "Role"?: string;
          "Skills"?: string[];
          user_id?: string;
          roles?: string[];
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
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
        };
        Insert: {
          id?: string;
          task_id: string;
          plant_room_id: string;
          asset_id?: string;
          assigned_to?: string;
          due_date: string;
          type_of_task?: string;
          status?: string;
          date_completed?: string;
          notes?: string;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          plant_room_id?: string;
          asset_id?: string;
          assigned_to?: string;
          due_date?: string;
          type_of_task?: string;
          status?: string;
          date_completed?: string;
          notes?: string;
          priority?: string;
          updated_at?: string;
        };
      };
      logs: {
        Row: {
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
        };
        Insert: {
          id?: string;
          log_id: string;
          plant_room_id: string;
          date?: string;
          time?: string;
          user_email: string;
          log_entry: string;
          photo?: string;
          gps_location?: string;
          status?: string;
          comments?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          log_id?: string;
          plant_room_id?: string;
          date?: string;
          time?: string;
          user_email?: string;
          log_entry?: string;
          photo?: string;
          gps_location?: string;
          status?: string;
          comments?: string;
        };
      };
      form_templates: {
        Row: {
          id: string;
          form_template_id: string;
          asset_type: string;
          title: string;
          fields: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_template_id: string;
          asset_type: string;
          title: string;
          fields?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_template_id?: string;
          asset_type?: string;
          title?: string;
          fields?: any;
          updated_at?: string;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          form_submission_id: string;
          task_id?: string;
          asset_id?: string;
          engineer_id?: string;
          submission_date: string;
          responses: any;
          photos: string[];
          engineer_signature?: string;
          client_signature?: string;
          pdf_url?: string;
          emailed_to: string[];
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_submission_id: string;
          task_id?: string;
          asset_id?: string;
          engineer_id?: string;
          submission_date?: string;
          responses?: any;
          photos?: string[];
          engineer_signature?: string;
          client_signature?: string;
          pdf_url?: string;
          emailed_to?: string[];
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_submission_id?: string;
          task_id?: string;
          asset_id?: string;
          engineer_id?: string;
          submission_date?: string;
          responses?: any;
          photos?: string[];
          engineer_signature?: string;
          client_signature?: string;
          pdf_url?: string;
          emailed_to?: string[];
          status?: string;
        };
      };
    };
  };
}