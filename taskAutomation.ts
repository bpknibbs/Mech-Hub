import { supabase } from '../lib/supabase';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

export interface AutoTaskConfig {
  assetId: string;
  assetName: string;
  plantRoomId: string;
  frequency: string;
  lastServiceDate: string;
  taskType: string;
}

export interface OverdueTask {
  id: string;
  taskId: string;
  assetName: string;
  plantRoomBlock: string;
  dueDate: string;
  assignedEngineerEmail: string;
  priority: string;
  daysPastDue: number;
}

// Calculate next service date based on frequency
export const calculateNextServiceDate = (lastServiceDate: string, frequency: string): Date => {
  const lastDate = new Date(lastServiceDate);

  switch (frequency.toLowerCase()) {
    case 'daily': return addDays(lastDate, 1);
    case 'weekly': return addWeeks(lastDate, 1);
    case 'fortnightly': return addWeeks(lastDate, 2);
    case 'monthly': return addMonths(lastDate, 1);
    case 'quarterly': return addMonths(lastDate, 3);
    case 'annually': return addMonths(lastDate, 12);
    default: return addMonths(lastDate, 1);
  }
};

// Generate auto PPM tasks
export const generateAutoPPMTasks = async (assignedToTeamId?: string): Promise<{ created: number; errors: string[]; details: any[] }> => {
  const errors: string[] = [];
  const details: any[] = [];
  let created = 0;

  try {
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select(`id, "Asset ID", "Asset Name", "Plant Room ID", "Last Service Date", "Frequency", "Operational"`)
      .eq('"Operational"', true)
      .not('"Last Service Date"', 'is', null);

    if (assetsError) { errors.push(assetsError.message); return { created, errors, details }; }
    if (!assets?.length) { details.push('No assets found'); return { created, errors, details }; }

    const plantRoomIds = [...new Set(assets.map(a => a["Plant Room ID"]))];
    const { data: plantRooms } = await supabase
      .from('plant_rooms')
      .select('id, "Plant Room ID"')
      .in('"Plant Room ID"', plantRoomIds);

    const plantRoomMap = new Map(plantRooms?.map(pr => [pr["Plant Room ID"], pr.id]) || []);
    const today = new Date();
    const tasksToCreate: any[] = [];

    for (const asset of assets) {
      if (!asset["Last Service Date"] || !asset["Frequency"]) continue;

      const nextServiceDate = calculateNextServiceDate(asset["Last Service Date"], asset["Frequency"]);
      const daysDifference = Math.floor((today.getTime() - nextServiceDate.getTime()) / (1000 * 60 * 60 * 24));

      details.push({
        assetId: asset["Asset ID"],
        assetName: asset["Asset Name"],
        lastServiceDate: asset["Last Service Date"],
        frequency: asset["Frequency"],
        nextServiceDate: format(nextServiceDate, 'yyyy-MM-dd'),
        daysDifference,
        needsService: daysDifference >= 0
      });

      if (daysDifference >= 0) {
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('asset_id', asset.id)
          .gte('due_date', format(nextServiceDate, 'yyyy-MM-dd'))
          .eq('type_of_task', 'PPM');

        if (!existingTasks?.length) {
          const plantRoomDbId = plantRoomMap.get(asset["Plant Room ID"]);
          if (plantRoomDbId) {
            tasksToCreate.push({
              task_id: `AUTO-PPM-${asset["Asset ID"]}-${Date.now()}`,
              plant_room_id: plantRoomDbId,
              asset_id: asset.id,
              assigned_to: assignedToTeamId || null,
              due_date: daysDifference > 7 ? format(today, 'yyyy-MM-dd') : format(nextServiceDate, 'yyyy-MM-dd'),
              type_of_task: 'PPM',
              status: 'Open',
              priority: daysDifference > 30 ? 'High' : daysDifference > 7 ? 'Medium' : 'Low',
              notes: `Auto-generated PPM task for ${asset["Asset Name"]}. Last service: ${asset["Last Service Date"]}. ${daysDifference > 0 ? `${daysDifference} days overdue.` : 'Due today.'}`
            });
          }
        }
      }
    }

    if (tasksToCreate.length > 0) {
      const { error: insertError } = await supabase.from('tasks').insert(tasksToCreate);
      if (insertError) errors.push(insertError.message); else created = tasksToCreate.length;
    }
  } catch (error) {
    errors.push(`Unexpected error in generateAutoPPMTasks: ${error}`);
  }

  return { created, errors, details };
};

// Get overdue tasks
export const getOverdueTasks = async (): Promise<OverdueTask[]> => {
  try {
    const today = new Date();
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`id, task_id, due_date, priority, assets("Asset Name"), plant_rooms("Block"), team("Email")`)
      .neq('status', 'Completed')
      .lt('due_date', format(today, 'yyyy-MM-dd'));

    if (error) { console.error(error); return []; }

    return tasks?.map(task => ({
      id: task.id,
      taskId: task.task_id,
      assetName: (task.assets as any)?.[`Asset Name`] || 'General Task',
      plantRoomBlock: (task.plant_rooms as any)?.[`Block`] || 'Unknown',
      dueDate: task.due_date,
      assignedEngineerEmail: (task.team as any)?.[`Email`] || 'Unassigned',
      priority: task.priority,
      daysPastDue: Math.floor((today.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
    })) || [];
  } catch (error) { console.error(error); return []; }
};

// Create follow-up task
export const createFollowUpTask = async (
  sourceType: 'log' | 'form',
  sourceId: string,
  issue: string,
  plantRoomId: string,
  assetId?: string,
  priority: 'Low' | 'Medium' | 'High' = 'Medium'
): Promise<{ success: boolean; taskId?: string; error?: string }> => {
  try {
    const taskId = `FOLLOWUP-${sourceType.toUpperCase()}-${Date.now()}`;
    const { data, error } = await supabase.from('tasks').insert([{
      task_id: taskId,
      plant_room_id: plantRoomId,
      asset_id: assetId || null,
      due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      type_of_task: 'Corrective Maintenance',
      status: 'Open',
      priority,
      notes: `Follow-up task created from ${sourceType} (ID: ${sourceId}). Issue: ${issue}`
    }]).select().single();

    if (error) return { success: false, error: error.message };
    return { success: true, taskId: data.task_id };
  } catch (error) { return { success: false, error: `Unexpected error: ${error}` }; }
};

// Generate recurring tasks
export const generateRecurringTasks = async (): Promise<{ created: number; errors: string[] }> => {
  const errors: string[] = [];
  let created = 0;
  // ... logic from your existing generateRecurringTasks function goes here ...
  return { created, errors }; // placeholder to keep code functional
};

// Stub optimization check
export const checkOptimizationNeeded = async (): Promise<{
  needed: boolean;
  unassignedCount: number;
  notificationsSent: number;
  errors: string[];
}> => {
  return {
    needed: false,
    unassignedCount: 0,
    notificationsSent: 0,
    errors: []
  };
};

// Main automation runner
export const runTaskAutomation = async (assignedToTeamId?: string): Promise<{
  ppmTasks: number;
  recurringTasks: number;
  overdueCount: number;
  optimizationCheck: { needed: boolean; unassignedCount: number; notificationsSent: number };
  errors: string[];
  ppmDetails?: any[];
}> => {
  // Call the edge function for automated task generation
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-task-automation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignedToTeamId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        ppmTasks: 0,
        recurringTasks: 0,
        overdueCount: 0,
        optimizationCheck: { needed: false, unassignedCount: 0, notificationsSent: 0 },
        errors: [errorData.error || 'Failed to run automation'],
        ppmDetails: []
      };
    }

    const result = await response.json();
    
    return {
      ppmTasks: result.tasksCreated || 0,
      recurringTasks: 0,
      overdueCount: result.overdueTasksFound || 0,
      optimizationCheck: { needed: false, unassignedCount: 0, notificationsSent: 0 },
      errors: result.errors || [],
      ppmDetails: result.results || []
    };

  } catch (error) {
    return {
      ppmTasks: 0,
      recurringTasks: 0,
      overdueCount: 0,
      optimizationCheck: { needed: false, unassignedCount: 0, notificationsSent: 0 },
      errors: [`Network error: ${error}`],
      ppmDetails: []
    };
  }
 
  // Legacy implementation below - keeping for reference
  const allErrors: string[] = [];

  const [ppmResult, recurringResult, overdueTasks, optimizationResult] = await Promise.all([
    generateAutoPPMTasks(assignedToTeamId),
    generateRecurringTasks(),
    getOverdueTasks(),
    checkOptimizationNeeded()
  ]);

  allErrors.push(...ppmResult.errors, ...recurringResult.errors, ...optimizationResult.errors);

  return {
    ppmTasks: ppmResult.created,
    recurringTasks: recurringResult.created,
    overdueCount: overdueTasks.length,
    optimizationCheck: {
      needed: optimizationResult.needed,
      unassignedCount: optimizationResult.unassignedCount,
      notificationsSent: optimizationResult.notificationsSent
    },
    errors: allErrors,
    ppmDetails: ppmResult.details
  };
};