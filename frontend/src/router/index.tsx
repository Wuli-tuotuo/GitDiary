import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/store/AuthContext';
import { Spin } from 'antd';
import type { ReactNode } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Login from '@/pages/Login';
import OAuthCallback from '@/pages/OAuthCallback';
import Dashboard from '@/pages/Dashboard';
import Generate from '@/pages/Generate';
import History from '@/pages/History';
import DiaryDetail from '@/pages/History/DiaryDetail';
import Share from '@/pages/Share';

// 路由守卫：需要登录
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/oauth/callback',
    element: <OAuthCallback />,
  },
  {
    path: '/share/:token',
    element: <Share />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'generate', element: <Generate /> },
      { path: 'history', element: <History /> },
      { path: 'history/:id', element: <DiaryDetail /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
