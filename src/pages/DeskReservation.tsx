import { useState } from 'react';
import { Calendar, Users, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

interface DeskReservation {
  deskId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Desk {
  id: string;
  islandId: number;
  position: number;
  isAvailable: boolean;
}

// Mock data
const DESKS: Desk[] = Array.from({ length: 20 }, (_, i) => ({
  id: `desk-${i + 1}`,
  islandId: Math.floor(i / 4) + 1,
  position: (i % 4) + 1,
  isAvailable: true,
}));

const MOCK_PEOPLE = [
  { id: '1', name: 'Alice Johnson' },
  { id: '2', name: 'Bob Smith' },
  { id: '3', name: 'Carol Davis' },
  { id: '4', name: 'David Wilson' },
];

export default function DeskReservation() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
  const [reservations, setReservations] = useState<DeskReservation[]>([
    {
      deskId: 'desk-1',
      userId: '1',
      userName: 'Alice Johnson',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
    },
    {
      deskId: 'desk-5',
      userId: '2',
      userName: 'Bob Smith',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '16:00',
    },
  ]);

  const getDeskReservation = (deskId: string, date: string) => {
    return reservations.find(r => r.deskId === deskId && r.date === date);
  };

  const isDeskReserved = (deskId: string, date: string) => {
    return !!getDeskReservation(deskId, date);
  };

  const handleDeskClick = (deskId: string) => {
    if (isDeskReserved(deskId, selectedDate)) {
      const reservation = getDeskReservation(deskId, selectedDate);
      toast.info(`Desk reserved by ${reservation?.userName} (${reservation?.startTime} - ${reservation?.endTime})`);
      return;
    }
    setSelectedDesk(deskId);
  };

  const handleReservation = () => {
    if (!selectedDesk) return;

    const newReservation: DeskReservation = {
      deskId: selectedDesk,
      userId: '1', // Mock current user
      userName: 'Current User',
      date: selectedDate,
      startTime: '09:00',
      endTime: '17:00',
    };

    setReservations(prev => [...prev, newReservation]);
    toast.success(`Desk ${selectedDesk.split('-')[1]} reserved successfully!`);
    setSelectedDesk(null);
  };

  const handleCancelReservation = (deskId: string) => {
    setReservations(prev => prev.filter(r => !(r.deskId === deskId && r.date === selectedDate)));
    toast.success('Reservation cancelled successfully!');
  };

  const getReservationStats = () => {
    const todayReservations = reservations.filter(r => r.date === selectedDate);
    return {
      total: DESKS.length,
      reserved: todayReservations.length,
      available: DESKS.length - todayReservations.length,
    };
  };

  const stats = getReservationStats();

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Desk Reservation System
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Reserve your workspace for optimal productivity
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-card border-2 border-border rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent rounded"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Office Layout */}
          <div className="lg:col-span-3">
            <Card className="shadow-medium animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Office Floor Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {Array.from({ length: 5 }, (_, islandIndex) => (
                    <div key={islandIndex + 1} className="space-y-4">
                      <h3 className="text-lg font-semibold text-center">
                        Island {islandIndex + 1}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {DESKS.filter(desk => desk.islandId === islandIndex + 1).map(desk => {
                          const isReserved = isDeskReserved(desk.id, selectedDate);
                          const isSelected = selectedDesk === desk.id;
                          const reservation = getDeskReservation(desk.id, selectedDate);

                          let deskClasses = "aspect-square flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-soft";
                          
                          if (isSelected) {
                            deskClasses += " bg-primary text-primary-foreground border-primary shadow-medium";
                          } else if (isReserved) {
                            deskClasses += " bg-accent text-accent-foreground border-accent cursor-not-allowed";
                          } else {
                            deskClasses += " bg-card border-border hover:border-primary hover:shadow-soft hover:scale-105";
                          }

                          return (
                            <div
                              key={desk.id}
                              className={deskClasses}
                              onClick={() => handleDeskClick(desk.id)}
                            >
                              <div className="text-lg font-bold">
                                {desk.id.split('-')[1]}
                              </div>
                              {isReserved && reservation && (
                                <div className="text-xs text-center mt-1 opacity-80">
                                  {reservation.userName.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedDesk && (
                  <div className="mt-6 p-4 bg-primary-light rounded-lg border border-primary">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          Desk {selectedDesk.split('-')[1]} Selected
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Island {Math.ceil(parseInt(selectedDesk.split('-')[1]) / 4)} • Date: {selectedDate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDesk(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleReservation}
                          className="shadow-soft"
                        >
                          Reserve Desk
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics & Reservations */}
          <div className="space-y-4 animate-fade-in">
            {/* Stats */}
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Desk Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border">
                  <span className="font-medium">Total Desks</span>
                  <span className="font-bold">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent-light rounded-lg">
                  <span className="font-medium">Reserved</span>
                  <span className="font-bold text-accent">{stats.reserved}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-present-light rounded-lg">
                  <span className="font-medium">Available</span>
                  <span className="font-bold text-present">{stats.available}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Occupancy Rate</span>
                    <span className="text-primary">
                      {Math.round((stats.reserved / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Reservations */}
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-accent" />
                  Today's Reservations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservations
                  .filter(r => r.date === selectedDate)
                  .map(reservation => (
                    <div
                      key={`${reservation.deskId}-${reservation.date}`}
                      className="p-3 bg-muted rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            Desk {reservation.deskId.split('-')[1]}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reservation.userName}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Island {Math.ceil(parseInt(reservation.deskId.split('-')[1]) / 4)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          {reservation.startTime} - {reservation.endTime}
                        </span>
                        {reservation.userId === '1' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelReservation(reservation.deskId)}
                            className="text-xs h-7"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                
                {reservations.filter(r => r.date === selectedDate).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reservations for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}