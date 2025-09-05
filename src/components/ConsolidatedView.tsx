import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePeople } from '@/hooks/usePeople';
import { useAttendance } from '@/hooks/useAttendance';

type AttendanceStatus = 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking' | null;

interface PersonWithAttendance {
  id: number;
  name: string;
  surname: string;
  role: string;
  team: string;
  attendance: { [key: string]: AttendanceStatus };
}

export default function ConsolidatedView() {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = January 2026
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  
  const { data: peopleData, isLoading: peopleLoading } = usePeople();
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance(currentMonth);
  
  // Transform data to match component interface
  const people = useMemo<PersonWithAttendance[]>(() => {
    if (!peopleData || !attendanceData) return [];
    
    return peopleData.map(person => {
      const personAttendance: { [key: string]: AttendanceStatus } = {};
      
      attendanceData
        .filter(record => record.person_id === person.id)
        .forEach(record => {
          personAttendance[record.date] = record.status;
        });
      
      return {
        id: person.id,
        name: person.name || 'N/A',
        surname: person.surname || '',
        role: person.role || 'Team Member',
        team: person.team || 'General',
        attendance: personAttendance,
      };
    });
  }, [peopleData, attendanceData]);

  const teams = ['All', ...Array.from(new Set(people.map(p => p.team)))];

  const filteredPeople = selectedTeam === 'All' 
    ? people 
    : people.filter(p => p.team === selectedTeam);

  if (peopleLoading || attendanceLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="flex items-center justify-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Team Attendance Overview
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Loading team data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getDaysInMonth = (month: number, year: number = 2026) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const isWeekend = (day: number, month: number, year: number = 2026) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const formatDateKey = (day: number, month: number, year: number = 2026) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isFrenchBankHoliday = (day: number, month: number, year: number = 2026) => {
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

    // Calculate Easter for variable holidays (2026)
    if (year === 2026) {
      const easterDate = new Date(2026, 3, 5); // Easter Sunday April 5, 2026
      
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

  const isNonWorkingDay = (day: number, month: number, year: number = 2026) => {
    return isWeekend(day, month, year) || isFrenchBankHoliday(day, month, year);
  };

  const getWorkingDays = (month: number) => {
    const daysInMonth = getDaysInMonth(month);
    const workingDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      if (!isNonWorkingDay(day, month)) {
        workingDays.push(day);
      }
    }
    return workingDays;
  };

  const getPersonStats = (person: PersonWithAttendance, month: number) => {
    const monthKey = `2026-${String(month + 1).padStart(2, '0')}`;
    const monthAttendance = Object.entries(person.attendance).filter(([date]) => 
      date.startsWith(monthKey)
    );
    
    const present = monthAttendance.filter(([, status]) => status === 'present').length;
    const sickness = monthAttendance.filter(([, status]) => status === 'sickness').length;
    const holidays = monthAttendance.filter(([, status]) => status === 'holidays').length;
    const training = monthAttendance.filter(([, status]) => status === 'training').length;
    const homeworking = monthAttendance.filter(([, status]) => status === 'homeworking').length;
    const total = monthAttendance.length;
    
    return { present, sickness, holidays, training, homeworking, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    if (status === 'present') return '✓';
    if (status === 'sickness') return '🤒';
    if (status === 'holidays') return '🏖️';
    if (status === 'training') return '📚';
    if (status === 'homeworking') return '🏠';
    return '—';
  };

  const getStatusColor = (status: AttendanceStatus) => {
    if (status === 'present') return 'text-present';
    if (status === 'sickness') return 'text-sickness';
    if (status === 'holidays') return 'text-holidays';
    if (status === 'training') return 'text-training';
    if (status === 'homeworking') return 'text-homeworking';
    return 'text-muted-foreground';
  };

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

  const workingDays = getWorkingDays(currentMonth);

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Team Attendance Overview
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            View everyone's office presence at a glance
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Month Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
              disabled={currentMonth === 0}
              className="hover:shadow-soft"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-bold min-w-[160px] text-center">
              {MONTHS[currentMonth]} 2026
            </h2>
            
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

          {/* Team Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              {teams.map(team => (
                <Button
                  key={team}
                  variant={selectedTeam === team ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeam(team)}
                  className="hover:shadow-soft"
                >
                  {team}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <Card className="shadow-medium animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daily Attendance - Full Month</span>
              <Badge variant="outline" className="text-sm">
                {filteredPeople.length} people
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                    <TableHead className="min-w-[100px]">Team</TableHead>
                    {workingDays.map(day => (
                      <TableHead key={day} className="text-center min-w-[50px]">
                        {day}
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[80px]">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map(person => {
                    const stats = getPersonStats(person, currentMonth);
                    return (
                      <TableRow key={person.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{person.name} {person.surname}</TableCell>
                        <TableCell className="text-muted-foreground">{person.role}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {person.team}
                          </Badge>
                        </TableCell>
                        {workingDays.map(day => {
                          const dateKey = formatDateKey(day, currentMonth);
                          const status = person.attendance[dateKey];
                          return (
                            <TableCell key={day} className="text-center">
                              <span className={`text-lg font-bold ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <span className={`font-bold ${stats.rate >= 80 ? 'text-present' : stats.rate >= 60 ? 'text-warning' : 'text-absent'}`}>
                            {stats.rate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {teams.filter(team => team !== 'All').map(team => {
            const teamPeople = people.filter(p => p.team === team);
            const totalPresent = teamPeople.reduce((acc, person) => {
              const stats = getPersonStats(person, currentMonth);
              return acc + stats.present;
            }, 0);
            const totalPossible = teamPeople.reduce((acc, person) => {
              const stats = getPersonStats(person, currentMonth);
              return acc + stats.total;
            }, 0);
            const teamRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

            return (
              <Card key={team} className="shadow-medium">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">{team}</h3>
                    <div className="text-2xl font-bold text-primary">{teamRate}%</div>
                    <p className="text-sm text-muted-foreground">
                      {teamPeople.length} member{teamPeople.length !== 1 ? 's' : ''}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {totalPresent}/{totalPossible} days present
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}