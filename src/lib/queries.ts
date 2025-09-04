import type { DashboardStats, ChartData, TeamMember } from './types';

const retryFetch = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (i === maxRetries) throw error;
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

export const fetchDashboardStats = async (userProfile?: TeamMember): Promise<{ stats: DashboardStats; chartData: ChartData }> => {
  try {
    console.log('Fetching dashboard stats...');
    const response = await retryFetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-dashboard-stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userProfile })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch dashboard stats');
    }

    const result = await response.json();
    return { stats: result.stats, chartData: result.chartData };

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return default data structure when Edge Function is unreachable
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('Edge Function unreachable, returning default stats');
      return {
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          totalAssets: 0,
          operationalAssets: 0,
          totalPlantRooms: 0,
          totalEngineers: 0,
          openTasks: 0,
          myTasks: 0,
          myOverdueTasks: 0,
          totalLogs: 0,
          formSubmissions: 0,
          partsRequests: 0,
          pendingParts: 0,
          completionRate: 0
        },
        chartData: {
          tasksByType: [],
          assetsByType: [],
        }
      };
    }
    
    throw error;
  }
};

export const fetchRecentActivity = async (): Promise<any[]> => {
  try {
    // Call Edge Function to fetch recent activity
    console.log('Calling fetch-recent-activity function...');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-recent-activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch recent activity');
    }

    const result = await response.json();
    console.log('Function result:', result);
    return result.data || [];

  } catch (error) {
    console.error('Fetch recent activity error:', error);
    return [];
  }
};

export const fetchUpcomingTasks = async (): Promise<any[]> => {
  try {
    console.log('Calling fetch-upcoming-tasks function...');
    // Call Edge Function to fetch upcoming tasks
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-upcoming-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch upcoming tasks');
    }

    const result = await response.json();
    console.log('Function result:', result);
    return result.data || [];

  } catch (error) {
    console.error('Fetch upcoming tasks error:', error);
    return [];
  }
};