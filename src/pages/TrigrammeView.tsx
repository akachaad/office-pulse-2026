import { useParams } from 'react-router-dom';
import { usePeople } from '@/hooks/usePeople';
import { useAttendance } from '@/hooks/useAttendance';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUpdateAttendance } from '@/hooks/useAttendance';

type AttendanceStatus = 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking';

const TrigrammeView = () => {
  const { trigramme } = useParams<{ trigramme: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: people } = usePeople();
  const { data: attendance } = useAttendance(currentDate.getMonth() + 1, currentDate.getFullYear());
  const updateAttendanceMutation = useUpdateAttendance();

  // Find the person with matching trigramme
  const person = people?.find(p => p.trigramme === trigramme);

  if (!person) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Person Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No person found with trigramme: {trigramme}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAttendanceForDay = (date: Date): AttendanceStatus | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance?.find(a => 
      a.person_id === person.id && 
      format(new Date(a.date), 'yyyy-MM-dd') === dateStr
    );
    return record?.status as AttendanceStatus || null;
  };

  const handleDayClick = (date: Date) => {
    const currentStatus = getAttendanceForDay(date);
    const statusCycle: (AttendanceStatus | null)[] = [null, 'holidays', 'sickness', 'training', 'homeworking'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    updateAttendanceMutation.mutate({
      personId: person.id,
      date: format(date, 'yyyy-MM-dd'),
      status: nextStatus,
    });
  };

  const getStatusColor = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'holidays': return 'bg-blue-500 hover:bg-blue-600';
      case 'sickness': return 'bg-red-500 hover:bg-red-600';
      case 'training': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'homeworking': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-muted hover:bg-muted-foreground/10 border-2 border-dashed border-muted-foreground/30';
    }
  };

  const getStatusText = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'holidays': return 'H';
      case 'sickness': return 'S';
      case 'training': return 'T';
      case 'homeworking': return 'W';
      default: return '';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  // Calculate stats for the person
  const currentMonthAttendance = attendance?.filter(a => a.person_id === person.id) || [];
  const stats = {
    holidays: currentMonthAttendance.filter(a => a.status === 'holidays').length,
    sickness: currentMonthAttendance.filter(a => a.status === 'sickness').length,
    training: currentMonthAttendance.filter(a => a.status === 'training').length,
    homeworking: currentMonthAttendance.filter(a => a.status === 'homeworking').length,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{person.trigramme}</CardTitle>
                  <p className="text-muted-foreground">{person.role} • {person.team}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                Capacity: {person.capacity}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Month Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {/* Add empty cells for days before month start */}
                  {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  
                  {calendarDays.map((day) => {
                    const status = getAttendanceForDay(day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={`
                          aspect-square rounded-lg border text-sm font-medium transition-all duration-200
                          flex items-center justify-center relative
                          ${getStatusColor(status)}
                          ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                          ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}
                        `}
                      >
                        <span className="text-xs absolute top-1 left-1 text-foreground/70">
                          {format(day, 'd')}
                        </span>
                        {status && (
                          <span className="text-white font-bold text-lg">
                            {getStatusText(status)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-sm">Holidays</span>
                  </div>
                  <Badge variant="secondary">{stats.holidays}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-sm">Sickness</span>
                  </div>
                  <Badge variant="secondary">{stats.sickness}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span className="text-sm">Training</span>
                  </div>
                  <Badge variant="secondary">{stats.training}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-sm">Homeworking</span>
                  </div>
                  <Badge variant="secondary">{stats.homeworking}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span>H = Holidays</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span>S = Sickness leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>T = Training</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>W = Homeworking</span>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Click on calendar days to cycle through statuses
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrigrammeView;