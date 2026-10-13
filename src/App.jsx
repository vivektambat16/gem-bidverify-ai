import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TendersPage } from './pages/TendersPage';
import { BiddersPage } from './pages/BiddersPage';
import { BidsPage } from './pages/BidsPage';
import { BidDetailPage } from './pages/BidDetailPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AuditPage } from './pages/AuditPage';
import { AuthProvider } from './context/AuthContext';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="tenders" element={<TendersPage />} />
      <Route path="bidders" element={<BiddersPage />} />
      <Route path="bids" element={<BidsPage />} />
      <Route path="bids/:id" element={<BidDetailPage />} />
      <Route path="integrations" element={<IntegrationsPage />} />
      <Route path="audit" element={<AuditPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export const App = () => (
  <AuthProvider>
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  </AuthProvider>
);
