import { supabase } from '../lib/supabase';
import { addDays, format } from 'date-fns';

export interface CorrectiveTaskOptions {
  originalTaskId: string;
  reason: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  assignToOriginalEngineer?: boolean;
  daysFromNow?: number;
  additionalNotes?: string;
}

export interface TaskStatusUpdateOptions {
  taskId: string;
  newStatus: 'Awaiting Parts' | 'Parts Required' | 'On Hold' | 'Requires Follow-up';
  reason: string;
  partsRequired?: string[];
  followUpDate?: string;
}

/**
 * Creates a corrective maintenance task when issues are found during maintenance
 */
export const createCorrectiveTask = async (options: CorrectiveTaskOptions): Promise<{ 
  success: boolean; 
  taskId?: string; 
  error?: string 
}> => {
  try {
    // Get original task details
    const { data: originalTask, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        assets("Asset Name", "Asset ID"),
        plant_rooms("Block")
      `)
      .eq('id', options.originalTaskId)
      .single();

    if (taskError || !originalTask) {
      return { success: false, error: 'Original task not found' };
    }

    // Generate corrective task ID
    const correctiveTaskId = `CORRECTIVE-${originalTask.task_id}-${Date.now()}`;
    
    // Determine due date based on urgency
    const daysToAdd = options.daysFromNow || (
      options.urgency === 'Critical' ? 1 :
      options.urgency === 'High' ? 2 :
      options.urgency === 'Medium' ? 5 : 7
    );
    
    const dueDate = format(addDays(new Date(), daysToAdd), 'yyyy-MM-dd');
    
    // Create corrective task
    const { data: newTask, error: createError } = await supabase
      .from('tasks')
      .insert([{
        task_id: correctiveTaskId,
        plant_room_id: originalTask.plant_room_id,
        asset_id: originalTask.asset_id,
        assigned_to: options.assignToOriginalEngineer ? originalTask.assigned_to : null,
        due_date: dueDate,
        type_of_task: 'Corrective Maintenance',
        status: 'Open',
        priority: options.urgency === 'Critical' ? 'High' : options.urgency,
        notes: `${options.reason}. Original task: ${originalTask.task_id}${options.additionalNotes ? '. ' + options.additionalNotes : ''}`
      }])
      .select()
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    return { success: true, taskId: newTask.task_id };

  } catch (error) {
    return { success: false, error: `Unexpected error: ${error}` };
  }
};

/**
 * Updates task status with reason and creates follow-up actions if needed
 */
export const updateTaskWithIssue = async (options: TaskStatusUpdateOptions): Promise<{
  success: boolean;
  correctiveTaskId?: string;
  error?: string;
}> => {
  try {
    // Update original task status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: options.newStatus,
        notes: options.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', options.taskId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create corrective task if status indicates follow-up is needed
    if (options.newStatus === 'Requires Follow-up') {
      const correctiveResult = await createCorrectiveTask({
        originalTaskId: options.taskId,
        reason: options.reason,
        urgency: 'Medium',
        assignToOriginalEngineer: true
      });

      if (correctiveResult.success) {
        return { success: true, correctiveTaskId: correctiveResult.taskId };
      } else {
        return { success: false, error: correctiveResult.error };
      }
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: `Unexpected error: ${error}` };
  }
};

/**
 * Handle parts received and generate follow-up installation task
 */
export const handlePartsReceived = async (partsRequestId: string): Promise<{
  success: boolean;
  correctiveTaskId?: string;
  error?: string;
}> => {
  try {
    // Get parts request details
    const { data: partsRequest, error: requestError } = await supabase
      .from('parts_requests')
      .select(`
        *,
        tasks(*, assets("Asset Name"), plant_rooms("Block"))
      `)
      .eq('id', partsRequestId)
      .single();

    if (requestError || !partsRequest) {
      return { success: false, error: 'Parts request not found' };
    }

    // Update parts request status
    await supabase
      .from('parts_requests')
      .update({
        status: 'Received',
        received_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', partsRequestId);
      
      const correctiveResult = await createCorrectiveTask({
        originalTaskId: partsRequest.task_id,
        reason: `Parts received: ${partsRequest.part_name}. Complete installation and return equipment to service.`,
        urgency: partsRequest.urgency,
        assignToOriginalEngineer: true,
        daysFromNow: partsRequest.urgency === 'Critical' ? 1 : 2,
        additionalNotes: `Received parts: ${partsRequest.quantity}x ${partsRequest.part_name}${partsRequest.part_number ? ` (${partsRequest.part_number})` : ''}`
      });

      if (correctiveResult.success) {
        // Link corrective task to parts request
        await supabase
          .from('parts_requests')
          .update({ corrective_task_id: correctiveResult.taskId })
          .eq('id', partsRequestId);

        // Update original task status back to In Progress
        await supabase
          .from('tasks')
          .update({ 
            status: 'In Progress',
            notes: `Parts received. Corrective task created: ${correctiveResult.taskId}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', partsRequest.task_id);

        return { success: true, correctiveTaskId: correctiveResult.taskId };
      } else {
        return { success: false, error: correctiveResult.error };
      }


  } catch (error) {
    return { success: false, error: `Unexpected error: ${error}` };
  }
};

/**
 * Mark parts as installed and complete related tasks
 */
export const markPartsInstalled = async (partsRequestId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { data: partsRequest, error: requestError } = await supabase
      .from('parts_requests')
      .select('*')
      .eq('id', partsRequestId)
      .single();

    if (requestError || !partsRequest) {
      return { success: false, error: 'Parts request not found' };
    }

    // Update parts request
    await supabase
      .from('parts_requests')
      .update({
        status: 'Installed',
        installed_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', partsRequestId);

    // Complete corrective task if it exists
    if (partsRequest.corrective_task_id) {
      await supabase
        .from('tasks')
        .update({
          status: 'Completed',
          date_completed: new Date().toISOString().split('T')[0],
          notes: `Parts installation completed: ${partsRequest.part_name}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', partsRequest.corrective_task_id);
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: `Unexpected error: ${error}` };
  }
};