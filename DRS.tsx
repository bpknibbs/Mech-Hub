import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import { useAuth } from './src/contexts/AuthContext';
import {
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { format, startOfWeek, addDays, isSameDay, isWeekend } from 'date-fns';

interface Task {
  id: string;
  task_id: string;
  type_of_task: string;
  status: string;
  due_date: string;
  priority: string;
  assigned_to?: string;
  plant_room_id: string;
  asset_id?: string;
  scheduled_date?: string;
  assets?: {
    "Asset Name": string;
    "Asset Type": string;
  };
  plant_rooms?: {
    "Block": string;
  };
}

interface TeamMember {
  id: string;
  "Name": string;
  "Email": string;
  "Skills": string[];
  "Role": string;
}

interface DailySchedule {
  [engineerId: string]: {
    [date: string]: Task[];
  };
}

interface ScheduleOptimization {
  totalTasksScheduled: number;
  daysScheduled: number;
  engineersUsed: number;
  efficiency: number;
}

const DRS: React.FC = () => {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string>('');
  const [dailySchedule, setDailySchedule] = useState<DailySchedule>({});
  const [scheduleStats, setScheduleStats] = useState<ScheduleOptimization | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const isAdmin = userProfile?.Role === 'Admin' || userProfile?.Role === 'Access All';

  useEffect(() => {
    fetchData();
  }, [selectedWeek, userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch team members (excluding viewers)
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('*')
        .neq('"Role"', 'Viewer')
        .order('"Name"');

      if (teamError) throw teamError;
      setTeamMembers(teamData || []);

      // Fetch all open tasks (not just this week)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assets("Asset Name", "Asset Type"),
          plant_rooms("Block")
        `)
        .eq('status', 'Open')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch holidays
      const { data: holidaysData } = await supabase
        .from('holidays')
        .select('date, name, type');
      setHolidays(holidaysData || []);

      // Fetch approved leave requests
      const { data: leaveData } = await supabase
        .from('availability')
        .select('engineer_id, start_date, end_date')
        .eq('status', 'approved');
      setLeaveRequests(leaveData || []);

      // Calculate intelligent schedule
      if (teamData && tasksData) {
        const schedule = calculateIntelligentSchedule(tasksData, teamData, holidaysData || [], leaveData || []);
        setDailySchedule(schedule.dailySchedule);
        setScheduleStats(schedule.stats);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIntelligentSchedule = (
    allTasks: Task[], 
    engineers: TeamMember[], 
    holidayList: any[], 
    leaveList: any[]
  ): { dailySchedule: DailySchedule; stats: ScheduleOptimization } => {
    const schedule: DailySchedule = {};
    const today = new Date();
    const maxTasksPerDay = 8;
    const schedulingHorizon = 60; // Days to schedule ahead
    
    // Initialize schedule structure for next 60 days
    engineers.forEach(engineer => {
      schedule[engineer.id] = {};
      for (let i = 0; i < schedulingHorizon; i++) {
        const date = addDays(today, i);
        if (!isWeekend(date) && !isHoliday(date, holidayList)) {
          const dateStr = format(date, 'yyyy-MM-dd');
          schedule[engineer.id][dateStr] = [];
        }
      }
    });

    // Helper function to check if engineer is available on a date
    const isEngineerAvailable = (engineerId: string, date: Date): boolean => {
      if (isWeekend(date)) return false;
      if (isHoliday(date, holidayList)) return false;
      
      const dateStr = format(date, 'yyyy-MM-dd');
      return !leaveList.some(leave =>
        leave.engineer_id === engineerId &&
        dateStr >= leave.start_date &&
        dateStr <= leave.end_date
      );
    };

    // Skill matching function
    const getSkillMatchScore = (task: Task, engineer: TeamMember): number => {
      if (!engineer["Skills"] || !task.assets) return 0.5;

      const requiredSkills = getRequiredSkills(task.assets["Asset Type"]);
      const matches = requiredSkills.filter(skill => 
        engineer["Skills"].some(engineerSkill => 
          engineerSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      return matches.length / Math.max(requiredSkills.length, 1);
    };

    // Priority scoring
    const getPriorityScore = (priority: string): number => {
      switch (priority) {
        case 'High': return 3;
        case 'Medium': return 2;
        case 'Low': return 1;
        default: return 1;
      }
    };

    // Sort tasks by priority and due date
    const sortedTasks = [...allTasks].sort((a, b) => {
      const aOverdue = new Date(a.due_date) < today;
      const bOverdue = new Date(b.due_date) < today;
      
      // Overdue tasks first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by priority
      const priorityDiff = getPriorityScore(b.priority) - getPriorityScore(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by due date
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    let tasksScheduled = 0;
    const engineersUsed = new Set<string>();

    // Schedule each task
    for (const task of sortedTasks) {
      const taskDueDate = new Date(task.due_date);
      const isOverdue = taskDueDate < today;
      
      // Determine scheduling range
      const startDate = isOverdue ? today : taskDueDate;
      const endDate = addDays(startDate, 14); // 2-week scheduling window
      
      let bestAssignment: { engineerId: string; date: string; score: number } | null = null;
      
      // Find best engineer and date combination
      for (const engineer of engineers) {
        if (engineer["Role"] === 'Viewer') continue;
        
        for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
          if (!isEngineerAvailable(engineer.id, d)) continue;
          
          const dateStr = format(d, 'yyyy-MM-dd');
          if (!schedule[engineer.id][dateStr]) continue;
          
          const currentDailyLoad = schedule[engineer.id][dateStr].length;
          if (currentDailyLoad >= maxTasksPerDay) continue;
          
          // Calculate assignment score
          const skillMatch = getSkillMatchScore(task, engineer);
          const workloadScore = 1 - (currentDailyLoad / maxTasksPerDay);
          const proximityScore = isOverdue ? 1.0 : Math.max(0.1, 1 - ((d.getTime() - taskDueDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
          
          const totalScore = (skillMatch * 0.4) + (workloadScore * 0.3) + (proximityScore * 0.3);
          
          if (!bestAssignment || totalScore > bestAssignment.score) {
            bestAssignment = {
              engineerId: engineer.id,
              date: dateStr,
              score: totalScore
            };
          }
        }
      }
      
      // Assign task to best option
      if (bestAssignment && bestAssignment.score > 0.3) {
        schedule[bestAssignment.engineerId][bestAssignment.date].push({
          ...task,
          scheduled_date: bestAssignment.date
        });
        tasksScheduled++;
        engineersUsed.add(bestAssignment.engineerId);
      }
    }

    // Calculate efficiency
    const totalCapacity = engineers.length * maxTasksPerDay * 5; // 5 work days
    const efficiency = totalCapacity > 0 ? (tasksScheduled / Math.min(allTasks.length, totalCapacity)) * 100 : 0;

    return {
      dailySchedule: schedule,
      stats: {
        totalTasksScheduled: tasksScheduled,
        daysScheduled: schedulingHorizon,
        engineersUsed: engineersUsed.size,
        efficiency
      }
    };
  };

  const isHoliday = (date: Date, holidayList: any[]): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidayList.some(h => h.date === dateStr);
  };

  const getRequiredSkills = (assetType: string): string[] => {
    const type = assetType?.toLowerCase() || '';
    if (type.includes('pump') || type.includes('pressure')) return ['HVAC', 'Mechanical', 'Plumbing'];
    if (type.includes('boiler')) return ['HVAC', 'Mechanical', 'Boiler Maintenance'];
    if (type.includes('generator')) return ['Electrical', 'Generator Maintenance'];
    if (type.includes('fire')) return ['Fire Safety', 'Electrical'];
    if (type.includes('water')) return ['Plumbing', 'Water Treatment'];
    if (type.includes('gas')) return ['HVAC', 'Boiler Maintenance'];
    return ['Mechanical'];
  };

  const runIntelligentScheduling = async () => {
    if (!isAdmin) return;
    
    try {
      setOptimizing(true);
      setOptimizationResult('Running intelligent task scheduling...');

      // Apply the schedule by updating task assignments and dates
      const updatePromises: Promise<any>[] = [];
      let updatedCount = 0;

      Object.entries(dailySchedule).forEach(([engineerId, engineerSchedule]) => {
        Object.entries(engineerSchedule).forEach(([date, dayTasks]) => {
          dayTasks.forEach(task => {
            // Only update if task is not already properly assigned
            if (task.assigned_to !== engineerId || task.due_date !== date) {
              const updatePromise = supabase
                .from('tasks')
                .update({
                  assigned_to: engineerId,
                  due_date: date,
                  notes: `Intelligently scheduled for ${date} based on skills, availability, and workload optimization.`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', task.id);
              
              updatePromises.push(Promise.resolve(updatePromise));
              updatedCount++;
            }
          });
        });
      });

      // Execute all updates
      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter(r => r.status === 'rejected').length;
      const successes = updatedCount - failures;

      if (failures > 0) {
        setOptimizationResult(`Partially successful: ${successes} tasks scheduled, ${failures} failed. Check console for details.`);
      } else {
        setOptimizationResult(`Success! Intelligently scheduled ${successes} tasks across ${scheduleStats?.engineersUsed} engineers over the next ${scheduleStats?.daysScheduled} work days. Efficiency: ${scheduleStats?.efficiency.toFixed(1)}%`);
      }

      // Send notifications for newly assigned tasks
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'general',
            title: 'Schedule Optimization Complete',
            message: `Intelligent scheduling completed: ${successes} tasks optimally distributed across team members.`,
            priority: 'low'
          })
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      // Refresh data to show updated assignments
      await fetchData();

    } catch (error) {
      console.error('Error running intelligent scheduling:', error);
      setOptimizationResult(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setOptimizing(false);
      setTimeout(() => setOptimizationResult(''), 10000);
    }
  };

  const getTaskCountForWeek = (engineerId: string): number => {
    if (!dailySchedule[engineerId]) return 0;
    
    const weekStart = selectedWeek;
    const weekEnd = addDays(weekStart, 6);
    let totalTasks = 0;
    
    for (let d = weekStart; d <= weekEnd; d = addDays(d, 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (dailySchedule[engineerId][dateStr]) {
        totalTasks += dailySchedule[engineerId][dateStr].length;
      }
    }
    
    return totalTasks;
  };

  const getDailyTaskCount = (engineerId: string, date: string): number => {
    return dailySchedule[engineerId]?.[date]?.length || 0;
  };

  const getWorkloadPercentage = (engineerId: string): number => {
    const weeklyTasks = getTaskCountForWeek(engineerId);
    const weeklyCapacity = 40; // 8 tasks × 5 days
    return Math.min(Math.round((weeklyTasks / weeklyCapacity) * 100), 100);
  };

  const getUnscheduledTasks = (): Task[] => {
    const scheduledTaskIds = new Set<string>();
    
    Object.values(dailySchedule).forEach(engineerSchedule => {
      Object.values(engineerSchedule).forEach(dayTasks => {
        dayTasks.forEach(task => scheduledTaskIds.add(task.id));
      });
    });
    
    return tasks.filter(task => !scheduledTaskIds.has(task.id));
  };

  const renderCalendarView = () => {
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(selectedWeek, i));
    }

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-6">
          <h3 className="text-xl font-bold text-white">Intelligent Task Schedule</h3>
          <p className="text-white text-opacity-90">
            {format(selectedWeek, 'MMM dd')} - {format(addDays(selectedWeek, 6), 'MMM dd, yyyy')}
          </p>
          {scheduleStats && (
            <div className="mt-2 text-sm text-white text-opacity-80">
              {scheduleStats.totalTasksScheduled} tasks scheduled • {scheduleStats.efficiency.toFixed(1)}% efficiency
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="text-center">
                <div className="text-xs font-medium text-secondary-600 mb-1">
                  {format(day, 'EEE')}
                </div>
                <div className="text-sm font-bold text-secondary-900">
                  {format(day, 'dd')}
                </div>
                {isHoliday(day, holidays) && (
                  <div className="text-xs text-error-600 font-bold">HOLIDAY</div>
                )}
              </div>
            ))}
          </div>

          {teamMembers.map((member) => (
            <div key={member.id} className="mb-6 border border-secondary-200 rounded-xl overflow-hidden">
              <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-secondary-900">{member["Name"]}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-secondary-600">{member["Role"]}</span>
                      <span className="text-xs text-secondary-500">•</span>
                      <span className="text-xs text-secondary-600">
                        {getTaskCountForWeek(member.id)} tasks this week
                      </span>
                      <span className="text-xs text-secondary-500">•</span>
                      <span className="text-xs text-secondary-600">
                        {getWorkloadPercentage(member.id)}% capacity
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-secondary-900">
                      {Math.max(...weekDays.map(day => getDailyTaskCount(member.id, format(day, 'yyyy-MM-dd'))))}/8
                    </div>
                    <div className="text-xs text-secondary-600">max daily</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 p-2">
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayTasks = getDailyTaskCount(member.id, dateStr);
                  const isWeekendDay = isWeekend(day);
                  const isHolidayDay = isHoliday(day, holidays);
                  const isToday = isSameDay(day, new Date());
                  const isOnLeave = leaveRequests.some(leave =>
                    leave.engineer_id === member.id &&
                    dateStr >= leave.start_date &&
                    dateStr <= leave.end_date
                  );

                  return (
                    <div
                      key={`${member.id}-${dateStr}`}
                      className={`p-3 text-center rounded-lg border-2 transition-all duration-200 ${
                        isWeekendDay || isHolidayDay || isOnLeave ? 'bg-secondary-100 text-secondary-400 border-secondary-300' :
                        dayTasks >= 8 ? 'bg-error-100 border-error-300 text-error-800' :
                        dayTasks >= 6 ? 'bg-warning-100 border-warning-300 text-warning-800' :
                        dayTasks > 0 ? 'bg-success-100 border-success-300 text-success-800' :
                        'bg-white border-secondary-200 hover:border-primary-300'
                      } ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
                    >
                      {isWeekendDay || isHolidayDay || isOnLeave ? (
                        <div>
                          <div className="text-xs font-bold">-</div>
                          <div className="text-xs">
                            {isOnLeave ? 'LEAVE' : isHolidayDay ? 'HOL' : 'WKD'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-lg font-bold">{dayTasks}</div>
                          <div className="text-xs text-secondary-600">tasks</div>
                          {dayTasks >= 8 && (
                            <div className="text-xs text-error-700 font-bold mt-1">FULL</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Task Details for This Week */}
              <div className="bg-secondary-50 px-4 py-2">
                <div className="flex flex-wrap gap-1">
                  {weekDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayTasks = dailySchedule[member.id]?.[dateStr] || [];
                    if (dayTasks.length === 0) return null;
                    
                    return (
                      <div key={dateStr} className="text-xs">
                        <span className="font-medium text-secondary-700">
                          {format(day, 'EEE')}:
                        </span>
                        {dayTasks.slice(0, 2).map((task, idx) => (
                          <span key={idx} className="ml-1 text-secondary-600">
                            {task.assets?.["Asset Name"] || 'General'}
                            {idx === 0 && dayTasks.length > 1 ? ',' : ''}
                          </span>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="ml-1 text-secondary-500">+{dayTasks.length - 2}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const unscheduledTasks = getUnscheduledTasks();

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                Intelligent Dynamic Resource Scheduler
              </h1>
              <p className="mt-2 text-white text-opacity-90 text-lg">
                AI-powered task allocation and workload optimization
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                  {scheduleStats?.totalTasksScheduled || 0} Tasks Scheduled
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-warning-400 rounded-full mr-2"></div>
                  {unscheduledTasks.length} Unscheduled
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-accent-400 rounded-full mr-2"></div>
                  {scheduleStats?.efficiency.toFixed(1) || 0}% Efficiency
                </span>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={runIntelligentScheduling}
                disabled={optimizing}
                className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50"
              >
                {optimizing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <CogIcon className="-ml-1 mr-3 h-6 w-6" />
                    Apply Smart Schedule
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Result */}
      {optimizationResult && (
        <div className="mb-8 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
            <p className="text-sm text-success-700">{optimizationResult}</p>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
              className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 transition-colors"
            >
              ← Previous Week
            </button>
            <button
              onClick={() => setSelectedWeek(startOfWeek(new Date()))}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 transition-colors"
            >
              Next Week →
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-secondary-600">
              Schedule Horizon: {scheduleStats?.daysScheduled || 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload Distribution */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mb-8">
        <h3 className="text-xl font-bold text-secondary-900 flex items-center mb-6">
          <ChartBarIcon className="w-6 h-6 mr-2 text-primary-600" />
          Team Workload Distribution
        </h3>

        <div className="space-y-4">
          {teamMembers.map((member) => {
            const weeklyTaskCount = getTaskCountForWeek(member.id);
            const workloadPercentage = getWorkloadPercentage(member.id);
            const maxDailyTasks = Math.max(
              ...Array.from({length: 7}, (_, i) => {
                const date = format(addDays(selectedWeek, i), 'yyyy-MM-dd');
                return getDailyTaskCount(member.id, date);
              }),
              0
            );

            return (
              <div
                key={member.id}
                className="group bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 border border-secondary-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      workloadPercentage >= 100 ? 'bg-error-500' :
                      workloadPercentage >= 80 ? 'bg-warning-500' :
                      'bg-success-500'
                    }`}></div>
                    <div>
                      <h4 className="font-bold text-secondary-900">{member["Name"]}</h4>
                      <p className="text-sm text-secondary-600">{member["Role"]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-secondary-900">{weeklyTaskCount}</div>
                    <div className="text-sm text-secondary-600">tasks this week</div>
                    <div className="text-xs text-secondary-500">
                      Peak {maxDailyTasks}/8 per day
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-secondary-700">Weekly Capacity</span>
                    <span className="text-sm font-bold text-secondary-900">{workloadPercentage}%</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        workloadPercentage >= 100 ? 'bg-gradient-to-r from-error-400 to-error-500' :
                        workloadPercentage >= 80 ? 'bg-gradient-to-r from-warning-400 to-warning-500' :
                        'bg-gradient-to-r from-success-400 to-success-500'
                      }`}
                      style={{ width: `${Math.min(workloadPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {member["Skills"] && member["Skills"].length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {member["Skills"].slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-800 border border-accent-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {member["Skills"].length > 3 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                        +{member["Skills"].length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar View */}
      {renderCalendarView()}

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mt-8">
          <h3 className="text-xl font-bold text-secondary-900 flex items-center mb-6">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-warning-600" />
            Unscheduled Tasks ({unscheduledTasks.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unscheduledTasks.slice(0, 20).map((task) => {
              const isOverdue = new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isOverdue ? 'border-error-300 bg-error-50' : 'border-warning-300 bg-warning-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-secondary-900">
                        {task.assets?.["Asset Name"] || 'General Task'}
                      </h4>
                      <p className="text-sm text-secondary-600">
                        {task.plant_rooms?.["Block"]} • {task.type_of_task}
                      </p>
                      <p className="text-xs text-secondary-500">
                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        {isOverdue && (
                          <span className="ml-2 text-error-600 font-bold">
                            ({Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        task.priority === 'High' ? 'bg-error-100 text-error-800 border border-error-300' :
                        task.priority === 'Medium' ? 'bg-warning-100 text-warning-800 border border-warning-300' :
                        'bg-success-100 text-success-800 border border-success-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {unscheduledTasks.length > 20 && (
              <div className="text-center py-4 text-secondary-600">
                ... and {unscheduledTasks.length - 20} more unscheduled tasks
              </div>
            )}
          </div>
          
          {isAdmin && unscheduledTasks.length > 0 && (
            <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-warning-800">Scheduling Optimization Needed</h4>
                  <p className="text-sm text-warning-700 mt-1">
                    Click "Apply Smart Schedule" to automatically distribute these {unscheduledTasks.length} tasks 
                    across available team members over the next {scheduleStats?.daysScheduled || 60} work days.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Performance */}
      {scheduleStats && (
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6 mt-8">
          <h3 className="text-xl font-bold text-secondary-900 flex items-center mb-6">
            <ChartBarIcon className="w-6 h-6 mr-2 text-accent-600" />
            Schedule Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{scheduleStats.totalTasksScheduled}</div>
              <div className="text-sm text-secondary-600">Tasks Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">{scheduleStats.engineersUsed}</div>
              <div className="text-sm text-secondary-600">Engineers Utilized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">{scheduleStats.efficiency.toFixed(1)}%</div>
              <div className="text-sm text-secondary-600">Schedule Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600">{unscheduledTasks.length}</div>
              <div className="text-sm text-secondary-600">Remaining Tasks</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DRS;