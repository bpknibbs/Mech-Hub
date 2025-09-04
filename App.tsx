import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthForm from './AuthForm';
import Layout from './src/components/Layout';
import Dashboard from './src/components/Dashboard';
import PlantRooms from './src/components/PlantRooms';
import PlantRoomDetails from './src/components/PlantRoomDetails';
import Assets from './src/components/Assets';
import AssetDetails from './src/components/AssetDetails';
import Tasks from './src/components/Tasks';
import Logs from './src/components/Logs';
import Team from './src/components/Team';
import Forms from './src/components/Forms';
import DRS from './src/components/DRS';
import AvailabilityPortal from './src/components/AvailabilityPortal';
import PartsManagement from './src/components/PartsManagement';
import TaskForm from './src/components/TaskForm';
import TaskDetails from './src/components/TaskDetails';
import './index.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Show a message if user doesn't have a profile yet
  // This could happen if they just signed up and haven't been added to the team table
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout currentPage="dashboard"><Dashboard /></Layout>} />
        <Route path="/plant-rooms" element={<Layout currentPage="plant-rooms"><PlantRooms /></Layout>} />
        <Route path="/plant-rooms/:id" element={<Layout currentPage="plant-rooms"><PlantRoomDetails /></Layout>} />
        <Route path="/assets" element={<Layout currentPage="assets"><Assets /></Layout>} />
        <Route path="/assets/:id" element={<Layout currentPage="assets"><AssetDetails /></Layout>} />
        <Route path="/tasks" element={<Layout currentPage="tasks"><Tasks /></Layout>} />
        <Route path="/tasks/:id" element={<Layout currentPage="tasks"><TaskDetails /></Layout>} />
        <Route path="/logs" element={<Layout currentPage="logs"><Logs /></Layout>} />
        <Route path="/team" element={<Layout currentPage="team"><Team /></Layout>} />
        <Route path="/forms" element={<Layout currentPage="forms"><Forms /></Layout>} />
        <Route path="/drs" element={<Layout currentPage="drs"><DRS /></Layout>} />
        <Route path="/availability" element={<Layout currentPage="availability"><AvailabilityPortal /></Layout>} />
        <Route path="/parts" element={<Layout currentPage="parts"><PartsManagement /></Layout>} />
        <Route path="/tasks/:taskId/form" element={<Layout currentPage="tasks"><TaskForm /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;