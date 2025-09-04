import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables - check deployment configuration');
}

export const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export const fetchDashboardStats = async (userProfile?: any) => {
  const [plantRoomsResult, assetsResult, tasksResult, logsResult, submissionsResult, partsResult, teamResult] =
    await Promise.all([
      supabaseService.from('plant_rooms').select('id'),
      supabaseService.from('assets').select('id, "Asset Type", "Operational"'),
      supabaseService.from('tasks').select('id, task_id, type_of_task, status, due_date, date_completed, assigned_to, priority'),
      supabaseService.from('logs').select('id'),
      supabaseService.from('form_submissions').select('id'),
      supabaseService.from('parts_requests').select('id, status'),
      supabaseService.from('team').select('id')
    ]);

  if (plantRoomsResult.error) throw plantRoomsResult.error;
  if (assetsResult.error) throw assetsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (logsResult.error) throw logsResult.error;
  if (submissionsResult.error) throw submissionsResult.error;
  if (partsResult.error) throw partsResult.error;
  if (teamResult.error) throw teamResult.error;

  const plantRooms = plantRoomsResult.data || [];
  const assets = assetsResult.data || [];
  const tasks = tasksResult.data || [];
  const logs = logsResult.data || [];
  const submissions = submissionsResult.data || [];
  const partsRequests = partsResult.data || [];
  const team = teamResult.data || [];

  const today = new Date();
  const operationalAssets = assets.filter(a => a["Operational"] === true).length;
  const openTasks = tasks.filter(t => t.status === 'Open').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overdueTasks = tasks.filter(t =>
    new Date(t.due_date) < today && t.status !== 'Completed'
  ).length;

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

  const stats = {
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

  const chartData = {
    tasksByType: Array.from(taskTypeMap.entries()).map(([name, count]) => ({ name, count })),
    assetsByType: Array.from(assetTypeMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      operational: data.operational
    }))
  };

  return { stats, chartData };
};

export const fetchRecentActivity = async () => {
  const { data, error } = await supabaseService.from('logs')
    .select(`
      id, created_at, user_email, log_entry,
      plant_rooms:plant_rooms(Block)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  return data?.map(log => ({
    id: log.id,
    type: 'log_entry',
    title: `Log Entry by ${log.user_email.split('@')[0]}`,
    description: log.log_entry,
    timestamp: log.created_at,
    status: null,
    user: log.user_email,
  })) || [];
};

export const fetchUpcomingTasks = async () => {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const { data, error } = await supabaseService.from('tasks')
    .select(`
      id, due_date, type_of_task, priority,
      assets:assets("Asset Name"),
      plant_rooms:plant_rooms("Block")
    `)
    .gte('due_date', format(today, 'yyyy-MM-dd'))
    .lte('due_date', format(nextWeek, 'yyyy-MM-dd'))
    .eq('status', 'Open')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
};