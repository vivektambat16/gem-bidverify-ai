import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children: e }) => {
  const { isAuthenticated: t } = useAuth();
  return t ? <>{e}</> : <Navigate to="/login" replace />;
};
