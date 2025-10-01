import { Calendar, MapPin, Settings, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, userRole } = useAuth();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
    navigate('/auth');
  };

  const isAdminOrHr = userRole === 'admin' || userRole === 'hr';

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant={isActive('/') ? 'default' : 'outline'}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shadow-soft"
        >
          <Calendar className="h-4 w-4" />
          Attendance Tracker
        </Button>
        
        <Button
          variant={isActive('/desk-reservation') ? 'default' : 'outline'}
          onClick={() => navigate('/desk-reservation')}
          className="flex items-center gap-2 shadow-soft"
        >
          <MapPin className="h-4 w-4" />
          Desk Reservation
        </Button>

        {isAdminOrHr && (
          <>
            <Button
              variant={isActive('/admin/capacity') ? 'default' : 'outline'}
              onClick={() => navigate('/admin/capacity')}
              className="flex items-center gap-2 shadow-soft"
            >
              <Settings className="h-4 w-4" />
              Admin Capacity
            </Button>

            <Button
              variant={isActive('/admin/attendance') ? 'default' : 'outline'}
              onClick={() => navigate('/admin/attendance')}
              className="flex items-center gap-2 shadow-soft"
            >
              <Users className="h-4 w-4" />
              Admin Attendance
            </Button>
          </>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.email} {userRole && `(${userRole})`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}