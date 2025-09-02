import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type AttendanceStatus = 'present' | 'absent' | null;

interface Person {
  id: string;
  name: string;
  role: string;
  team: string;
  attendance: { [key: string]: AttendanceStatus };
}

// Mock data for demonstration
const MOCK_PEOPLE: Person[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    role: 'Senior Developer',
    team: 'Engineering',
    attendance: {
      '2026-01-02': 'present',
      '2026-01-03': 'present',
      '2026-01-06': 'absent',
      '2026-01-07': 'present',
      '2026-01-08': 'present',
      '2026-01-09': 'absent',
      '2026-01-10': 'present',
    }
  },
  {
    id: '2',
    name: 'Bob Smith',
    role: 'Product Manager',
    team: 'Product',
    attendance: {
      '2026-01-02': 'present',
      '2026-01-03': 'absent',
      '2026-01-06': 'present',
      '2026-01-07': 'present',
      '2026-01-08': 'absent',
      '2026-01-09': 'present',
      '2026-01-10': 'present',
    }
  },
  {
    id: '3',
    name: 'Carol Davis',
    role: 'UX Designer',
    team: 'Design',
    attendance: {
      '2026-01-02': 'absent',
      '2026-01-03': 'present',
      '2026-01-06': 'present',
      '2026-01-07': 'absent',
      '2026-01-08': 'present',
      '2026-01-09': 'present',
      '2026-01-10': 'absent',
    }
  },
  {
    id: '4',
    name: 'David Wilson',
    role: 'DevOps Engineer',
    team: 'Engineering',
    attendance: {
      '2026-01-02': 'present',
      '2026-01-03': 'present',
      '2026-01-06': 'present',
      '2026-01-07': 'present',
      '2026-01-08': 'present',
      '2026-01-09': 'present',
      '2026-01-10': 'present',
    }
  }
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ConsolidatedView() {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = January 2026
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [people] = useState<Person[]>(MOCK_PEOPLE);

  const teams = ['All', ...Array.from(new Set(people.map(p => p.team)))];

  const filteredPeople = selectedTeam === 'All' 
    ? people 
    : people.filter(p => p.team === selectedTeam);

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

  const getWorkingDays = (month: number) => {
    const daysInMonth = getDaysInMonth(month);
    const workingDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      if (!isWeekend(day, month)) {
        workingDays.push(day);
      }
    }
    return workingDays;
  };

  const getPersonStats = (person: Person, month: number) => {
    const monthKey = `2026-${String(month + 1).padStart(2, '0')}`;
    const monthAttendance = Object.entries(person.attendance).filter(([date]) => 
      date.startsWith(monthKey)
    );
    
    const present = monthAttendance.filter(([, status]) => status === 'present').length;
    const absent = monthAttendance.filter(([, status]) => status === 'absent').length;
    const total = monthAttendance.length;
    
    return { present, absent, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    if (status === 'present') return '✓';
    if (status === 'absent') return '✗';
    return '—';
  };

  const getStatusColor = (status: AttendanceStatus) => {
    if (status === 'present') return 'text-present';
    if (status === 'absent') return 'text-absent';
    return 'text-muted-foreground';
  };

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
                        <TableCell className="font-medium">{person.name}</TableCell>
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