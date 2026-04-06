import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccess, getDeniedRedirect } from '@/lib/role-access';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  path: string;
  children: React.ReactNode;
}

/**
 * Wraps a route element — redirects if the current user's role
 * does not have access to the given path.
 */
export default function RoleGuard({ path, children }: RoleGuardProps) {
  const { role, loading, user } = useAuth();

  // While auth is loading, show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Public pages always pass through
  if (canAccess(null, path)) return <>{children}</>;

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Role check
  if (!canAccess(role, path)) {
    return <Navigate to={getDeniedRedirect(role)} replace />;
  }

  return <>{children}</>;
}
