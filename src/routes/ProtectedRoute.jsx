import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OFFICER_ROLES = [
  'Procurement Officer',
  'Evaluation Cell Lead',
  'Vigilance Officer',
  'admin',
  'Super Admin',
];

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role;
  const isAuthorizedOfficer = userRole && OFFICER_ROLES.includes(userRole);

  if (!isAuthorizedOfficer) {
    return <Navigate to="/login?unauthorized=1" replace />;
  }

  return <>{children}</>;
};

