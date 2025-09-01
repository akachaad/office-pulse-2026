import { Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
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
    </div>
  );
}