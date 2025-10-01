import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'admin' | 'hr' | 'employee';
}

const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && requireRole) {
      const hasPermission = 
        requireRole === 'admin' && (userRole === 'admin') ||
        requireRole === 'hr' && (userRole === 'admin' || userRole === 'hr') ||
        requireRole === 'employee' && (userRole === 'admin' || userRole === 'hr' || userRole === 'employee');

      if (!hasPermission) {
        navigate('/');
      }
    }
  }, [user, loading, userRole, requireRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireRole) {
    const hasPermission = 
      requireRole === 'admin' && (userRole === 'admin') ||
      requireRole === 'hr' && (userRole === 'admin' || userRole === 'hr') ||
      requireRole === 'employee' && (userRole === 'admin' || userRole === 'hr' || userRole === 'employee');

    if (!hasPermission) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
