import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Guards routes based on authentication and role.
 *
 * Props:
 *   requiredRole: 'patient' | 'doctor' (optional)
 *
 * Behavior:
 *   - Not authenticated → redirect to /login
 *   - Wrong role → redirect to own dashboard
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'patient' ? '/patient' : '/doctor'} replace />;
  }

  return children;
}
