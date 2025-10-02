import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConsolidatedView from './ConsolidatedView';
import Navigation from './Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePeople } from '@/hooks/usePeople';
import { useAttendance, useUpdateAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';

type AttendanceStatus = 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking' | null;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceTracker() {
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = October 2025
  const [currentYear, setCurrentYear] = useState(2025);
  const [activeTab, setActiveTab] = useState("individual");
  
  const { user } = useAuth();
  const { data: people } = usePeople();
  const { data: attendanceRecords } = useAttendance(currentMonth, currentYear);
  const updateAttendanceMutation = useUpdateAttendance();
  
  // Find the person associated with the current user
  const currentPerson = useMemo(() => {
    if (!user || !people) {
      console.log('AttendanceTracker: No user or people data', { user: !!user, people: !!people });
      return null;
    }
    const person = people.find(p => p.user_id === user.id);
    console.log('AttendanceTracker: Current person lookup', { 
      userId: user.id, 
      peopleCount: people.length,
      foundPerson: person?.trigramme 
    });
    return person;
  }, [user, people]);

  const getDaysInMonth = (month: number, year: number = 2025) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number = 2025) => {
    return new Date(year, month, 1).getDay();
  };

  const isWeekend = (day: number, month: number, year: number = 2025) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isFrenchBankHoliday = (day: number, month: number, year: number = 2025) => {
    // Fixed holidays
    const fixedHolidays = [
      { month: 0, day: 1 },   // New Year's Day
      { month: 4, day: 1 },   // Labour Day
      { month: 4, day: 8 },   // Victory in Europe Day
      { month: 6, day: 14 },  // Bastille Day
      { month: 7, day: 15 },  // Assumption of Mary
      { month: 10, day: 1 },  // All Saints' Day
      { month: 10, day: 11 }, // Armistice Day
      { month: 11, day: 25 }, // Christmas Day
    ];

    if (fixedHolidays.some(holiday => holiday.month === month && holiday.day === day)) {
      return true;
    }

    // Calculate Easter for variable holidays (2025)
    if (year === 2025) {
      const easterDate = new Date(2025, 3, 20); // Easter Sunday April 20, 2025
      
      // Easter Monday (day after Easter)
      const easterMonday = new Date(easterDate);
      easterMonday.setDate(easterDate.getDate() + 1);
      
      // Ascension Day (39 days after Easter)
      const ascensionDay = new Date(easterDate);
      ascensionDay.setDate(easterDate.getDate() + 39);
      
      // Whit Monday (50 days after Easter)
      const whitMonday = new Date(easterDate);
      whitMonday.setDate(easterDate.getDate() + 50);
      
      const variableHolidays = [easterMonday, ascensionDay, whitMonday];
      
      return variableHolidays.some(holiday => 
        holiday.getDate() === day && holiday.getMonth() === month
      );
    }

    return false;
  };

  const isNonWorkingDay = (day: number, month: number, year: number = 2025) => {
    return isWeekend(day, month, year) || isFrenchBankHoliday(day, month, year);
  };

  const formatDateKey = (day: number, month: number, year: number = 2025) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAttendanceForDay = (dateKey: string): {
    morning: AttendanceStatus;
    afternoon: AttendanceStatus;
    fullDay: AttendanceStatus;
  } => {
    if (!currentPerson || !attendanceRecords) {
      return { morning: null, afternoon: null, fullDay: null };
    }
    
    const records = attendanceRecords.filter(
      a => a.person_id === currentPerson.id && a.date === dateKey
    );
    
    const morningRecord = records.find(r => r.period === 'morning');
    const afternoonRecord = records.find(r => r.period === 'afternoon');
    const fullDayRecord = records.find(r => r.period === 'full_day');
    
    return {
      morning: (morningRecord?.status as AttendanceStatus) || null,
      afternoon: (afternoonRecord?.status as AttendanceStatus) || null,
      fullDay: (fullDayRecord?.status as AttendanceStatus) || null
    };
  };

  const toggleAttendance = (day: number, month: number, year: number, period: 'morning' | 'afternoon' | 'full_day') => {
    console.log('toggleAttendance called', { day, month, year, period, currentPerson: currentPerson?.trigramme });
    
    if (isNonWorkingDay(day, month, year)) {
      console.log('Day is non-working, ignoring');
      return;
    }
    
    if (!currentPerson) {
      console.error('No current person found - user may not be linked to a person record');
      return;
    }
    
    const dateKey = formatDateKey(day, month, year);
    const attendance = getAttendanceForDay(dateKey);
    
    let currentStatus: AttendanceStatus;
    if (period === 'morning') {
      currentStatus = attendance.morning;
    } else if (period === 'afternoon') {
      currentStatus = attendance.afternoon;
    } else {
      currentStatus = attendance.fullDay;
    }
    
    console.log('Current status for day', { dateKey, period, currentStatus });
    
    let newStatus: AttendanceStatus;
    if (currentStatus === null || currentStatus === undefined) {
      newStatus = 'present';
    } else if (currentStatus === 'present') {
      newStatus = 'holidays';
    } else if (currentStatus === 'holidays') {
      newStatus = 'sickness';
    } else if (currentStatus === 'sickness') {
      newStatus = 'training';
    } else if (currentStatus === 'training') {
      newStatus = 'homeworking';
    } else {
      newStatus = null;
    }
    
    console.log('Updating attendance', { personId: currentPerson.id, dateKey, period, newStatus });
    
    // If setting a half-day status, clear full-day status if it exists
    if (period !== 'full_day' && attendance.fullDay) {
      updateAttendanceMutation.mutate({
        personId: currentPerson.id,
        date: dateKey,
        status: null,
        period: 'full_day',
      });
    }
    
    // If setting full-day status, clear half-day statuses if they exist
    if (period === 'full_day' && (attendance.morning || attendance.afternoon)) {
      if (attendance.morning) {
        updateAttendanceMutation.mutate({
          personId: currentPerson.id,
          date: dateKey,
          status: null,
          period: 'morning',
        });
      }
      if (attendance.afternoon) {
        updateAttendanceMutation.mutate({
          personId: currentPerson.id,
          date: dateKey,
          status: null,
          period: 'afternoon',
        });
      }
    }
    
    // Update the current period
    updateAttendanceMutation.mutate({
      personId: currentPerson.id,
      date: dateKey,
      status: newStatus,
      period,
    });
    
    // Check if both half days now have the same status and merge them
    setTimeout(() => {
      const updatedAttendance = getAttendanceForDay(dateKey);
      const morningStatus = period === 'morning' ? newStatus : updatedAttendance.morning;
      const afternoonStatus = period === 'afternoon' ? newStatus : updatedAttendance.afternoon;
      
      if (morningStatus && afternoonStatus && morningStatus === afternoonStatus && morningStatus !== null) {
        // Both halves have the same status, merge into full day
        console.log('Merging half days into full day', { dateKey, status: morningStatus });
        
        // Delete both half-day records
        updateAttendanceMutation.mutate({
          personId: currentPerson.id,
          date: dateKey,
          status: null,
          period: 'morning',
        });
        updateAttendanceMutation.mutate({
          personId: currentPerson.id,
          date: dateKey,
          status: null,
          period: 'afternoon',
        });
        
        // Create full-day record
        updateAttendanceMutation.mutate({
          personId: currentPerson.id,
          date: dateKey,
          status: morningStatus,
          period: 'full_day',
        });
      }
    }, 100);
  };

  const getAttendanceStats = () => {
    if (!currentPerson || !attendanceRecords) {
      const weekdays = Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => i + 1)
        .filter(day => !isNonWorkingDay(day, currentMonth, currentYear)).length;
      return { present: 0, sickness: 0, holidays: 0, training: 0, homeworking: 0, total: weekdays, unmarked: weekdays };
    }

    const monthAttendance = attendanceRecords.filter(a => a.person_id === currentPerson.id);
    
    const present = monthAttendance.filter(a => a.status === 'present').length;
    const sickness = monthAttendance.filter(a => a.status === 'sickness').length;
    const holidays = monthAttendance.filter(a => a.status === 'holidays').length;
    const training = monthAttendance.filter(a => a.status === 'training').length;
    const homeworking = monthAttendance.filter(a => a.status === 'homeworking').length;
    const total = getDaysInMonth(currentMonth, currentYear);
    const weekdays = Array.from({ length: total }, (_, i) => i + 1)
      .filter(day => !isNonWorkingDay(day, currentMonth, currentYear)).length;
    
    return { present, sickness, holidays, training, homeworking, total: weekdays, unmarked: weekdays - present - sickness - holidays - training - homeworking };
  };

  const getStatusClasses = (status: AttendanceStatus) => {
    if (status === 'present') {
      return "bg-present text-present-foreground shadow-soft hover:shadow-medium";
    } else if (status === 'sickness') {
      return "bg-sickness text-sickness-foreground shadow-soft hover:shadow-medium";
    } else if (status === 'holidays') {
      return "bg-holidays text-holidays-foreground shadow-soft hover:shadow-medium";
    } else if (status === 'training') {
      return "bg-training text-training-foreground shadow-soft hover:shadow-medium";
    } else if (status === 'homeworking') {
      return "bg-homeworking text-homeworking-foreground shadow-soft hover:shadow-medium";
    } else {
      return "bg-card border-border hover:border-primary hover:shadow-soft";
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(day, currentMonth, currentYear);
      const attendance = getAttendanceForDay(dateKey);
      const nonWorkingDay = isNonWorkingDay(day, currentMonth, currentYear);
      const hasFullDay = attendance.fullDay !== null;
      const hasMorning = attendance.morning !== null;
      const hasAfternoon = attendance.afternoon !== null;
      
      if (nonWorkingDay) {
        days.push(
          <div
            key={day}
            className="aspect-square flex items-center justify-center text-sm font-medium bg-weekend text-weekend-foreground cursor-not-allowed rounded-lg border-2 border-transparent"
          >
            {day}
          </div>
        );
      } else if (hasFullDay) {
        days.push(
          <div
            key={day}
            className={`aspect-square flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 rounded-lg border-2 border-transparent ${getStatusClasses(attendance.fullDay)}`}
            onClick={() => toggleAttendance(day, currentMonth, currentYear, 'full_day')}
          >
            {day}
          </div>
        );
      } else {
        // Split day view for half-day attendance
        days.push(
          <div key={day} className="aspect-square flex flex-col rounded-lg border-2 border-transparent overflow-hidden">
            <div
              className={`flex-1 flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 border-b ${getStatusClasses(attendance.morning)}`}
              onClick={() => toggleAttendance(day, currentMonth, currentYear, 'morning')}
              title="Morning"
            >
              {hasMorning ? '●' : day}
            </div>
            <div
              className={`flex-1 flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 ${getStatusClasses(attendance.afternoon)}`}
              onClick={() => toggleAttendance(day, currentMonth, currentYear, 'afternoon')}
              title="Afternoon"
            >
              {hasAfternoon ? '●' : ''}
            </div>
          </div>
        );
      }
    }

    return days;
  };

  const stats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Office Attendance Tracker
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track office presence for {currentYear}
          </p>
          {!currentPerson && user && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-destructive text-sm font-medium">
                Your account is not linked to a person record. Please contact an administrator to link your account.
              </p>
            </div>
          )}
          {currentPerson && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-sm">
                Editing attendance for: <span className="font-bold">{currentPerson.trigramme}</span> ({currentPerson.role})
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Individual View
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6 mt-6">

        {/* Month Navigation */}
        <Card className="shadow-medium animate-scale-in">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
                className="hover:shadow-soft"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <CardTitle className="text-2xl font-bold">
                {MONTHS[currentMonth]} {currentYear}
              </CardTitle>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
                className="hover:shadow-soft"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="shadow-medium animate-scale-in">
              <CardContent className="p-6">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendarGrid()}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-present rounded"></div>
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-holidays rounded"></div>
                    <span className="text-sm">Holidays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-sickness rounded"></div>
                    <span className="text-sm">Sickness Leave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-training rounded"></div>
                    <span className="text-sm">Training</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-homeworking rounded"></div>
                    <span className="text-sm">Homeworking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-weekend rounded"></div>
                    <span className="text-sm">Weekend/Holiday</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-card border border-border rounded"></div>
                    <span className="text-sm">Not marked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-4 animate-fade-in">
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-present-light rounded-lg">
                  <span className="font-medium">Present</span>
                  <span className="font-bold text-present">{stats.present}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-holidays-light rounded-lg">
                  <span className="font-medium">Holidays</span>
                  <span className="font-bold text-holidays">{stats.holidays}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-sickness-light rounded-lg">
                  <span className="font-medium">Sickness Leave</span>
                  <span className="font-bold text-sickness">{stats.sickness}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-training-light rounded-lg">
                  <span className="font-medium">Training</span>
                  <span className="font-bold text-training">{stats.training}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-homeworking-light rounded-lg">
                  <span className="font-medium">Homeworking</span>
                  <span className="font-bold text-homeworking">{stats.homeworking}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Not marked</span>
                  <span className="font-bold">{stats.unmarked}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Attendance Rate</span>
                    <span className="text-primary">
                      {stats.present + stats.sickness + stats.holidays + stats.training + stats.homeworking > 0 
                        ? Math.round(((stats.present + stats.homeworking) / (stats.present + stats.sickness + stats.holidays + stats.training + stats.homeworking)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-accent" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:shadow-soft"
                    disabled={!currentPerson}
                    onClick={async () => {
                      if (!currentPerson) return;
                      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                      const updates = [];
                      
                      for (let day = 1; day <= daysInMonth; day++) {
                        if (!isNonWorkingDay(day, currentMonth, currentYear)) {
                          const dateKey = formatDateKey(day, currentMonth, currentYear);
                          updates.push({
                            personId: currentPerson.id,
                            date: dateKey,
                            status: 'present' as const,
                          });
                        }
                      }
                      
                      for (const update of updates) {
                        await updateAttendanceMutation.mutateAsync(update);
                      }
                    }}
                  >
                    Mark all as Present
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:shadow-soft"
                    disabled={!currentPerson}
                    onClick={async () => {
                      if (!currentPerson) return;
                      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                      const updates = [];
                      
                      for (let day = 1; day <= daysInMonth; day++) {
                        if (!isNonWorkingDay(day, currentMonth, currentYear)) {
                          const dateKey = formatDateKey(day, currentMonth, currentYear);
                          updates.push({
                            personId: currentPerson.id,
                            date: dateKey,
                            status: null,
                          });
                        }
                      }
                      
                      for (const update of updates) {
                        await updateAttendanceMutation.mutateAsync(update);
                      }
                    }}
                  >
                    Clear this month
                  </Button>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Mark Regular Homeworking Days:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, index) => {
                      const weekdayIndex = index + 1; // Monday = 1, Tuesday = 2, etc.
                      return (
                        <Button
                          key={dayName}
                          variant="outline"
                          size="sm"
                          className="text-xs hover:shadow-soft hover:bg-homeworking-light"
                          disabled={!currentPerson}
                          onClick={async () => {
                            if (!currentPerson) return;
                            const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                            const updates = [];
                            
                            for (let day = 1; day <= daysInMonth; day++) {
                              if (!isNonWorkingDay(day, currentMonth, currentYear)) {
                                const date = new Date(currentYear, currentMonth, day);
                                if (date.getDay() === weekdayIndex) {
                                  const dateKey = formatDateKey(day, currentMonth, currentYear);
                                  updates.push({
                                    personId: currentPerson.id,
                                    date: dateKey,
                                    status: 'homeworking' as const,
                                  });
                                }
                              }
                            }
                            
                            // Execute updates sequentially to avoid race conditions
                            for (const update of updates) {
                              await updateAttendanceMutation.mutateAsync(update);
                            }
                          }}
                        >
                          {dayName.slice(0, 3)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="consolidated" className="mt-6">
            <ConsolidatedView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}