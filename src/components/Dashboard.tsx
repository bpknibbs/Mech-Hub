import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { fetchDashboardStats, fetchRecentActivity, fetchUpcomingTasks } from '../lib/queries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Home as HomeIcon,
  Building as BuildingOfficeIcon,
  Settings as CogIcon,
  ClipboardList as ClipboardDocumentListIcon,
  AlertTriangle as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  FileText as DocumentTextIcon,
  Wrench as WrenchScrewdriverIcon,
  BarChart as ChartBarIcon,
  Calendar as CalendarDaysIcon,
  Bell as BellIcon,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { DashboardStats, ChartData } from '../lib/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [stats, setStats] = useState<DashboardStats>({
    totalPlantRooms: 0,
    totalAssets: 0,
    operationalAssets: 0,
    totalTasks: 0,
    openTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
    myTasks: 0,
    myOverdueTasks: 0,
    totalLogs: 0,
    formSubmissions: 0,
    partsRequests: 0,
    pendingParts: 0,
    completionRate: 0,
    totalEngineers: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    tasksByType: [],
    assetsByType: []
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isEngineer = userProfile?.Role === 'Engineer';

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboardData, activityData, upcomingData] = await Promise.all([
        fetchDashboardStats(userProfile),
        fetchRecentActivity(),
        fetchUpcomingTasks()
      ]);

      setStats(dashboardData.stats);
      setChartData(dashboardData.chartData);
      setRecentActivity(activityData);
      setUpcomingTasks(upcomingData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-600" />;
      case 'log_entry':
        return <DocumentTextIcon className="w-5 h-5 text-primary-600" />;
      case 'form_submission':
        return <ClipboardDocumentListIcon className="w-5 h-5 text-accent-600" />;
      case 'parts_request':
        return <WrenchScrewdriverIcon className="w-5 h-5 text-warning-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-secondary-600" />;
    }
  };

  const CHART_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative text-white">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              Welcome back, {userProfile?.Name || 'User'}
            </h1>
            <p className="mt-2 text-white text-opacity-90 text-lg">
              Here's your plant room management overview for {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </p>
            <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                System Active
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-accent-400 rounded-full mr-2"></div>
                Real-time Data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {unreadCount > 0 && (
        <div className="mb-8 bg-gradient-to-r from-warning-50 to-accent-50 rounded-2xl p-6 shadow-lg border border-warning-200">
          <h3 className="text-lg font-semibold text-warning-800 flex items-center mb-4">
            <BellIcon className="w-5 h-5 mr-2" />
            Recent Notifications ({unreadCount} unread)
          </h3>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="bg-white rounded-xl p-4 border border-warning-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-secondary-900">{notification.title}</h4>
                    <p className="text-sm text-secondary-600">{notification.message}</p>
                    <p className="text-xs text-secondary-500 mt-1">
                      {format(new Date(notification.sent_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-primary-300 transition-all duration-500 relative cursor-pointer"
             onClick={() => navigate('/plant-rooms')}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-4 shadow-lg border border-primary-300">
                  <BuildingOfficeIcon className="h-7 w-7 text-primary-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Plant Rooms</dt>
                  <dd className="text-3xl font-bold text-secondary-900 mt-1">{stats.totalPlantRooms}</dd>
                  <dd className="text-sm text-secondary-600">Active locations</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-success-300 transition-all duration-500 relative cursor-pointer"
             onClick={() => navigate('/assets')}>
          <div className="absolute inset-0 bg-gradient-to-br from-success-50/20 via-transparent to-success-100/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-success-100 to-success-200 rounded-2xl p-4 shadow-lg border border-success-300">
                  <CogIcon className="h-7 w-7 text-success-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Assets</dt>
                  <dd className="text-3xl font-bold text-secondary-900 mt-1">{stats.totalAssets}</dd>
                  <dd className="text-sm text-success-600">{stats.operationalAssets} operational</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-warning-300 transition-all duration-500 relative cursor-pointer"
             onClick={() => navigate('/tasks')}>
          <div className="absolute inset-0 bg-gradient-to-br from-warning-50/20 via-transparent to-warning-100/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-warning-100 to-warning-200 rounded-2xl p-4 shadow-lg border border-warning-300">
                  <ClipboardDocumentListIcon className="h-7 w-7 text-warning-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">
                    {isEngineer ? 'My Tasks' : 'Total Tasks'}
                  </dt>
                  <dd className="text-3xl font-bold text-secondary-900 mt-1">
                    {isEngineer ? stats.myTasks : stats.totalTasks}
                  </dd>
                  <dd className="text-sm text-warning-600">
                    {isEngineer ? stats.myOverdueTasks : stats.openTasks} open
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-error-300 transition-all duration-500 relative cursor-pointer"
             onClick={() => navigate('/tasks')}>
          <div className="absolute inset-0 bg-gradient-to-br from-error-50/20 via-transparent to-error-100/20 pointer-events-none"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-error-100 to-error-200 rounded-2xl p-4 shadow-lg border border-error-300">
                  <ExclamationTriangleIcon className="h-7 w-7 text-error-600" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-bold text-secondary-700 uppercase tracking-wide">Overdue</dt>
                  <dd className="text-3xl font-bold text-error-600 mt-1">
                    {isEngineer ? stats.myOverdueTasks : stats.overdueTasks}
                  </dd>
                  <dd className="text-sm text-error-600">Require attention</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            System Analytics
          </h3>

          {/* Compliance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-700">Completion Rate</p>
                  <p className="text-2xl font-bold text-primary-900">{stats.completionRate.toFixed(1)}%</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-success-700">Completed</p>
                  <p className="text-2xl font-bold text-success-900">{stats.completedTasks}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-success-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-error-50 to-error-100 rounded-xl p-4 border border-error-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-error-700">Overdue</p>
                  <p className="text-2xl font-bold text-error-900">{stats.overdueTasks}</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border border-accent-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent-700">Asset Uptime</p>
                  <p className="text-2xl font-bold text-accent-900">
                    {stats.totalAssets > 0 ? Math.round((stats.operationalAssets / stats.totalAssets) * 100) : 0}%
                  </p>
                </div>
                <CogIcon className="h-8 w-8 text-accent-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Type */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
              <h4 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Tasks by Type
              </h4>
              {chartData.tasksByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.tasksByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Tasks']}
                      labelFormatter={(label) => `Type: ${label}`}
                    />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <ChartBarIcon className="h-8 w-8 text-primary-400 mx-auto mb-2" />
                    <p className="text-primary-600 font-medium">No task data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Assets by Type */}
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 border border-accent-200">
              <h4 className="text-lg font-semibold text-accent-900 mb-4 flex items-center">
                <CogIcon className="w-5 h-5 mr-2" />
                Assets by Type
              </h4>
              {chartData.assetsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.assetsByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="total"
                      label={({ name, total }) => `${name}: ${total}`}
                      nameKey="name"
                    >
                      {chartData.assetsByType.map((_, index) => (
                        <Cell key={`asset-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Assets']}
                      labelFormatter={(label) => `Type: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <CogIcon className="h-8 w-8 text-accent-400 mx-auto mb-2" />
                    <p className="text-accent-600 font-medium">No asset data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compliance Summary */}
          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 border border-secondary-200 mt-6">
            <h4 className="text-lg font-semibold text-secondary-900 mb-4">System Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-900">{stats.totalTasks}</p>
                <p className="text-sm text-secondary-600">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600">{stats.completedTasks}</p>
                <p className="text-sm text-secondary-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-error-600">{stats.overdueTasks}</p>
                <p className="text-sm text-secondary-600">Overdue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-600">{stats.operationalAssets}/{stats.totalAssets}</p>
                <p className="text-sm text-secondary-600">Assets Operational</p>
              </div>
            </div>
            
            {stats.overdueTasks > 0 && (
              <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />
                  <div className="ml-3">
                    <h5 className="text-sm font-medium text-warning-800">Attention Required</h5>
                    <p className="text-sm text-warning-700 mt-1">
                      {stats.overdueTasks} tasks are overdue and require immediate attention.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
            <CalendarDaysIcon className="h-5 w-5 text-white" />
          </div>
          <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-secondary-100 rounded-full p-4 inline-block mb-3">
                  <ClockIcon className="h-8 w-8 text-secondary-400" />
                </div>
                <p className="text-secondary-600 font-medium">No recent activity</p>
                <p className="text-sm text-secondary-500 mt-1">Activity will appear here as you use the system</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-secondary-50 transition-colors duration-200">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-secondary-900">
                          {activity.title}
                        </h4>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'Completed' ? 'bg-success-100 text-success-800' :
                            activity.status === 'Requested' ? 'bg-warning-100 text-warning-800' :
                            'bg-secondary-100 text-secondary-800'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-secondary-600 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-secondary-500">
                          {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-secondary-500">
                            by {activity.user.split('@')[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-1 bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-success-500 to-success-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              System Health
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700">Asset Uptime</span>
              <span className="text-lg font-bold text-success-600">
                {stats.totalAssets > 0 ? Math.round((stats.operationalAssets / stats.totalAssets) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-success-400 to-success-500 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.totalAssets > 0 ? (stats.operationalAssets / stats.totalAssets) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700">Task Completion</span>
                <span className="text-lg font-bold text-primary-600">
                  {stats.completionRate.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700">Form Submissions</span>
                <span className="text-lg font-bold text-accent-600">
                  {stats.formSubmissions}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700">Parts Pending</span>
                <span className="text-lg font-bold text-warning-600">
                  {stats.pendingParts}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="lg:col-span-1 bg-white shadow-xl rounded-2xl border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-warning-500 to-warning-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              Upcoming Tasks
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-white hover:text-warning-200 transition-colors font-medium"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-secondary-100 rounded-full p-4 inline-block mb-3">
                  <CalendarDaysIcon className="h-8 w-8 text-secondary-400" />
                </div>
                <p className="text-secondary-600 font-medium">No upcoming tasks</p>
                <p className="text-sm text-secondary-500 mt-1">All caught up for the next 7 days</p>
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const dueDate = new Date(task.due_date);
                const isToday = format(dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isTomorrow = format(dueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd');
                
                return (
                  <div 
                    key={task.id} 
                    className="p-4 hover:bg-secondary-50 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-secondary-900 flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            isToday ? 'bg-error-500 animate-pulse' :
                            isTomorrow ? 'bg-warning-500' :
                            task.priority === 'High' ? 'bg-error-400' :
                            'bg-primary-400'
                          }`}></div>
                          {task.assets?.["Asset Name"] || 'General Task'}
                        </h4>
                        <p className="text-xs text-secondary-600 ml-4 mt-1">
                          {task.plant_rooms?.["Block"]} • {task.type_of_task}
                        </p>
                        <p className="text-xs text-secondary-500 ml-4">
                          {isToday ? 'Due Today' :
                           isTomorrow ? 'Due Tomorrow' :
                           `Due ${format(dueDate, 'MMM dd')}`}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'High' ? 'bg-error-100 text-error-800' :
                        task.priority === 'Medium' ? 'bg-warning-100 text-warning-800' :
                        'bg-success-100 text-success-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;