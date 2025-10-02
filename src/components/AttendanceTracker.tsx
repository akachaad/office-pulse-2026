import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConsolidatedView from './ConsolidatedView';
import Navigation from './Navigation';

type AttendanceStatus = 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking' | null;

interface AttendanceData {
  [key: string]: AttendanceStatus; // Format: "YYYY-MM-DD"
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceTracker() {
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = October 2025
  const [currentYear, setCurrentYear] = useState(2025);
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [activeTab, setActiveTab] = useState("individual");

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

  const toggleAttendance = (day: number, month: number, year: number) => {
    if (isNonWorkingDay(day, month, year)) return; // Don't allow marking non-working days
    
    const dateKey = formatDateKey(day, month, year);
    const currentStatus = attendance[dateKey];
    
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
    
    setAttendance(prev => ({
      ...prev,
      [dateKey]: newStatus
    }));
  };

  const getAttendanceStats = () => {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthAttendance = Object.entries(attendance).filter(([date]) => 
      date.startsWith(monthKey)
    );
    
    const present = monthAttendance.filter(([, status]) => status === 'present').length;
    const sickness = monthAttendance.filter(([, status]) => status === 'sickness').length;
    const holidays = monthAttendance.filter(([, status]) => status === 'holidays').length;
    const training = monthAttendance.filter(([, status]) => status === 'training').length;
    const homeworking = monthAttendance.filter(([, status]) => status === 'homeworking').length;
    const total = getDaysInMonth(currentMonth, currentYear);
    const weekdays = Array.from({ length: total }, (_, i) => i + 1)
      .filter(day => !isNonWorkingDay(day, currentMonth, currentYear)).length;
    
    return { present, sickness, holidays, training, homeworking, total: weekdays, unmarked: weekdays - present - sickness - holidays - training - homeworking };
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
      const status = attendance[dateKey];
      const nonWorkingDay = isNonWorkingDay(day, currentMonth, currentYear);
      
      let dayClasses = "aspect-square flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 rounded-lg border-2 border-transparent";
      
      if (nonWorkingDay) {
        dayClasses += " bg-weekend text-weekend-foreground cursor-not-allowed";
      } else if (status === 'present') {
        dayClasses += " bg-present text-present-foreground shadow-soft hover:shadow-medium";
      } else if (status === 'sickness') {
        dayClasses += " bg-sickness text-sickness-foreground shadow-soft hover:shadow-medium";
      } else if (status === 'holidays') {
        dayClasses += " bg-holidays text-holidays-foreground shadow-soft hover:shadow-medium";
      } else if (status === 'training') {
        dayClasses += " bg-training text-training-foreground shadow-soft hover:shadow-medium";
      } else if (status === 'homeworking') {
        dayClasses += " bg-homeworking text-homeworking-foreground shadow-soft hover:shadow-medium";
      } else {
        dayClasses += " bg-card border-border hover:border-primary hover:shadow-soft hover:scale-105";
      }

      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => toggleAttendance(day, currentMonth, currentYear)}
        >
          {day}
        </div>
      );
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
                    onClick={() => {
                      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                      const newAttendance = { ...attendance };
                      for (let day = 1; day <= daysInMonth; day++) {
                        if (!isNonWorkingDay(day, currentMonth, currentYear)) {
                          const dateKey = formatDateKey(day, currentMonth, currentYear);
                          newAttendance[dateKey] = 'present';
                        }
                      }
                      setAttendance(newAttendance);
                    }}
                  >
                    Mark all as Present
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:shadow-soft"
                    onClick={() => {
                      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                      const newAttendance = { ...attendance };
                      for (let day = 1; day <= daysInMonth; day++) {
                        if (!isNonWorkingDay(day, currentMonth, currentYear)) {
                          const dateKey = formatDateKey(day, currentMonth, currentYear);
                          newAttendance[dateKey] = null;
                        }
                      }
                      setAttendance(newAttendance);
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
                          onClick={() => {
                            const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                            const newAttendance = { ...attendance };
                            for (let day = 1; day <= daysInMonth; day++) {
                              if (!isNonWorkingDay(day, currentMonth, currentYear)) {
                                const date = new Date(currentYear, currentMonth, day);
                                if (date.getDay() === weekdayIndex) {
                                  const dateKey = formatDateKey(day, currentMonth, currentYear);
                                  newAttendance[dateKey] = 'homeworking';
                                }
                              }
                            }
                            setAttendance(newAttendance);
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