import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { WorkspaceProvider } from '@/features/workspaces/WorkspaceContext';
import { WorkspaceDashboard } from '@/features/workspaces/pages/WorkspaceDashboard';
import { PeriodBoard } from '@/features/planning/pages/PeriodBoard';

export function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Главный дашборд (настройки воркспейса) */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <WorkspaceDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Страница конкретного квартала */}
            <Route 
              path="/workspace/:workspaceId/period/:periodId" 
              element={
                <ProtectedRoute>
                  <PeriodBoard />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
