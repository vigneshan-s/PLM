import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Modern Lazy Loaded Feature Modules
const Login = lazy(() => import('./features/auth/Login'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const Assembly = lazy(() => import('./features/assembly/Assembly'));
const FileManagement = lazy(() => import('./features/files/FileManagement'));
const Revision = lazy(() => import('./features/changes/Revision'));
const ECNCreation = lazy(() => import('./features/changes/ECNCreation'));
const ECOApproval = lazy(() => import('./features/changes/ECOApproval'));
const FinalRelease = lazy(() => import('./features/changes/FinalRelease'));
const ImpactAnalysis = lazy(() => import('./features/impact/ImpactAnalysis'));
const AdminPanel = lazy(() => import('./features/admin/AdminPanel'));
const Profile = lazy(() => import('./features/settings/Profile'));
const SystemSettings = lazy(() => import('./features/settings/Settings'));

// Custom Full-Screen Setup Loader
const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
    <div style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' } }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Protected Working Area */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/assembly" element={<Assembly />} />
            <Route path="/files" element={<FileManagement />} />
            
            <Route path="/revision" element={<Revision />} />
            <Route path="/ecn" element={<ECNCreation />} />
            <Route path="/eco" element={<ECOApproval />} />
            <Route path="/release" element={<FinalRelease />} />
            
            <Route path="/impact" element={<ImpactAnalysis />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
