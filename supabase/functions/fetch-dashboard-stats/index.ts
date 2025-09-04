/*
  # Fetch Dashboard Stats Function
  
  Proxies dashboard statistics queries through Edge Function to bypass webcontainer network restrictions
  
  1. Functionality
    - Fetches comprehensive dashboard statistics
    - Calculates chart data for analytics
    - Returns recent activity and metrics
    
  2. Security
    - Uses service role for database access. This function operates with elevated privileges and should be secured via API gateway or other means in a production environment.
    - Returns aggregated data only
*/

import { createClient } from 'npm:@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DashboardStats {
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
}

interface ChartData {
  tasksByType: Array<{ name: string; count: number }>;
  assetsByType: Array<{ name: string; total: number; operational: number }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let supabase;
    let userProfile = {};
    
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      const requestBody = await req.json().catch(() => ({}));
      userProfile = requestBody.userProfile || {};
    } catch (initError) {
      console.error('Error initializing client:', initError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize database client' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('Fetching dashboard stats...');

    // Fetch all data in parallel
    let plantRoomsResult, assetsResult, tasksResult, logsResult, submissionsResult, partsResult, teamResult;
    
    try {
      [
        plantRoomsResult,
        assetsResult,
        tasksResult,
        logsResult,
        submissionsResult,
        partsResult,
        teamResult
      ] = await Promise.all([
        supabase.from('plant_rooms').select('id'),
        supabase.from('assets').select('id, "Asset Type", "Operational"'),
        supabase.from('tasks').select('id, task_id, type_of_task, status, due_date, date_completed, assigned_to, priority'),
        supabase.from('logs').select('id'),
        supabase.from('form_submissions').select('id'),
        supabase.from('parts_requests').select('id, status'),
        supabase.from('team').select('id')
      ]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return new Response(
        JSON.stringify({ 
          error: `Database query failed: ${dbError.message}`,
          success: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process raw data
    const plantRooms = plantRoomsResult.data || [];
    const assets = assetsResult.data || [];
    const tasks = tasksResult.data || [];
    const logs = logsResult.data || [];
    const submissions = submissionsResult.data || [];
    const partsRequests = partsResult.data || [];
    const team = teamResult.data || [];

    // Calculate basic stats
    const today = new Date();
    const operationalAssets = assets.filter(a => a["Operational"] === true).length;
    const openTasks = tasks.filter(t => t.status === 'Open').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const overdueTasks = tasks.filter(t => 
      new Date(t.due_date) < today && t.status !== 'Completed'
    ).length;

    // User-specific stats
    const isEngineer = userProfile?.Role === 'Engineer';
    const myTasks = isEngineer ? tasks.filter(t => t.assigned_to === userProfile?.id).length : 0;
    const myOverdueTasks = isEngineer ? tasks.filter(t => 
      t.assigned_to === userProfile?.id && 
      new Date(t.due_date) < today && 
      t.status !== 'Completed'
    ).length : 0;

    const pendingParts = partsRequests.filter(p => 
      p.status === 'Requested' || p.status === 'Ordered'
    ).length;

    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Process chart data
    const taskTypeMap = new Map<string, number>();
    tasks.forEach(task => {
      const type = task.type_of_task || 'Unknown';
      taskTypeMap.set(type, (taskTypeMap.get(type) || 0) + 1);
    });

    const assetTypeMap = new Map<string, { total: number; operational: number }>();
    assets.forEach(asset => {
      const type = asset["Asset Type"] || 'Unknown';
      const current = assetTypeMap.get(type) || { total: 0, operational: 0 };
      current.total += 1;
      if (asset["Operational"]) current.operational += 1;
      assetTypeMap.set(type, current);
    });

    const stats: DashboardStats = {
      totalPlantRooms: plantRooms.length,
      totalAssets: assets.length,
      totalEngineers: team.length,
      operationalAssets,
      totalTasks: tasks.length,
      openTasks,
      overdueTasks,
      completedTasks,
      myTasks,
      myOverdueTasks,
      totalLogs: logs.length,
      formSubmissions: submissions.length,
      partsRequests: partsRequests.length,
      pendingParts,
      completionRate
    };

    const chartData: ChartData = {
      tasksByType: Array.from(taskTypeMap.entries()).map(([name, count]) => ({ name, count })),
      assetsByType: Array.from(assetTypeMap.entries()).map(([name, data]) => ({ 
        name, 
        total: data.total, 
        operational: data.operational 
      }))
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        stats,
        chartData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-dashboard-stats function:', error);
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}`,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});