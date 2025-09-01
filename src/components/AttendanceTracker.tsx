import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConsolidatedView from './ConsolidatedView';

type AttendanceStatus = 'present' | 'absent' | null;

interface AttendanceData {
  [key: string]: AttendanceStatus; // Format: "YYYY-MM-DD"
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceTracker() {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = January 2026
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [activeTab, setActiveTab] = useState("individual");

  const getDaysInMonth = (month: number, year: number = 2026) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number = 2026) => {
    return new Date(year, month, 1).getDay();
  };

  const isWeekend = (day: number, month: number, year: number = 2026) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const formatDateKey = (day: number, month: number, year: number = 2026) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const toggleAttendance = (day: number, month: number) => {
    if (isWeekend(day, month)) return; // Don't allow marking weekends
    
    const dateKey = formatDateKey(day, month);
    const currentStatus = attendance[dateKey];
    
    let newStatus: AttendanceStatus;
    if (currentStatus === null || currentStatus === undefined) {
      newStatus = 'present';
    } else if (currentStatus === 'present') {
      newStatus = 'absent';
    } else {
      newStatus = null;
    }
    
    setAttendance(prev => ({
      ...prev,
      [dateKey]: newStatus
    }));
  };

  const getAttendanceStats = () => {
    const monthKey = `2026-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthAttendance = Object.entries(attendance).filter(([date]) => 
      date.startsWith(monthKey)
    );
    
    const present = monthAttendance.filter(([, status]) => status === 'present').length;
    const absent = monthAttendance.filter(([, status]) => status === 'absent').length;
    const total = getDaysInMonth(currentMonth);
    const weekdays = Array.from({ length: total }, (_, i) => i + 1)
      .filter(day => !isWeekend(day, currentMonth)).length;
    
    return { present, absent, total: weekdays, unmarked: weekdays - present - absent };
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(day, currentMonth);
      const status = attendance[dateKey];
      const weekend = isWeekend(day, currentMonth);
      
      let dayClasses = "aspect-square flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 rounded-lg border-2 border-transparent";
      
      if (weekend) {
        dayClasses += " bg-weekend text-weekend-foreground cursor-not-allowed";
      } else if (status === 'present') {
        dayClasses += " bg-present text-present-foreground shadow-soft hover:shadow-medium";
      } else if (status === 'absent') {
        dayClasses += " bg-absent text-absent-foreground shadow-soft hover:shadow-medium";
      } else {
        dayClasses += " bg-card border-border hover:border-primary hover:shadow-soft hover:scale-105";
      }

      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => toggleAttendance(day, currentMonth)}
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
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Office Attendance Tracker
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track office presence for 2026
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
                onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                disabled={currentMonth === 0}
                className="hover:shadow-soft"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <CardTitle className="text-2xl font-bold">
                {MONTHS[currentMonth]} 2026
              </CardTitle>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))}
                disabled={currentMonth === 11}
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
                    <div className="w-4 h-4 bg-absent rounded"></div>
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-weekend rounded"></div>
                    <span className="text-sm">Weekend</span>
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
                <div className="flex justify-between items-center p-3 bg-absent-light rounded-lg">
                  <span className="font-medium">Absent</span>
                  <span className="font-bold text-absent">{stats.absent}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Not marked</span>
                  <span className="font-bold">{stats.unmarked}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Attendance Rate</span>
                    <span className="text-primary">
                      {stats.present + stats.absent > 0 
                        ? Math.round((stats.present / (stats.present + stats.absent)) * 100)
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
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:shadow-soft"
                  onClick={() => {
                    const daysInMonth = getDaysInMonth(currentMonth);
                    const newAttendance = { ...attendance };
                    for (let day = 1; day <= daysInMonth; day++) {
                      if (!isWeekend(day, currentMonth)) {
                        const dateKey = formatDateKey(day, currentMonth);
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
                    const daysInMonth = getDaysInMonth(currentMonth);
                    const newAttendance = { ...attendance };
                    for (let day = 1; day <= daysInMonth; day++) {
                      if (!isWeekend(day, currentMonth)) {
                        const dateKey = formatDateKey(day, currentMonth);
                        newAttendance[dateKey] = null;
                      }
                    }
                    setAttendance(newAttendance);
                  }}
                >
                  Clear this month
                </Button>
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