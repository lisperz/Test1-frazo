import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoadingScreen from './components/Common/LoadingScreen';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import JobsPage from './pages/JobsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import VideoInpaintingPage from './pages/VideoInpaintingPage';
import SimpleVideoInpaintingPage from './pages/SimpleVideoInpaintingPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // For simple video inpainting page, render without layout
  if (window.location.pathname === '/') {
    return <>{children}</>;
  }
  
  if (!user) {
    return <>{children}</>;
  }
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 7, sm: 8 }, // Account for navbar height
          pl: { sm: 0 }, // Sidebar takes care of padding on larger screens
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={<SimpleVideoInpaintingPage />}
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/jobs" 
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Video Inpainting - Public Route for testing */}
        <Route 
          path="/inpaint" 
          element={<VideoInpaintingPage />} 
        />
        
        {/* Fallback Route */}
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </Layout>
  );
};

export default App;