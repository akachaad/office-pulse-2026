import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Calendar, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAttendance } from '@/hooks/useAttendance';
import { usePeople } from '@/hooks/usePeople';
import { startOfWeek, endOfWeek, isSameWeek, format, parseISO } from 'date-fns';

interface Warning {
  personId: number;
  trigramme: string;
  weekStart: string;
  homeworkingDays: number;
}

interface CapacityWarning {
  date: string;
  presentCount: number;
  capacityLimit: number;
}

const AdminWarnings = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [capacityLimit, setCapacityLimit] = useState<number>(() => {
    const saved = localStorage.getItem('capacityLimit');
    return saved ? parseInt(saved) : 50;
  });

  useEffect(() => {
    localStorage.setItem('capacityLimit', capacityLimit.toString());
  }, [capacityLimit]);
  
  const { data: attendance, isLoading: attendanceLoading } = useAttendance(selectedMonth, selectedYear);
  const { data: people, isLoading: peopleLoading } = usePeople();

  const warnings = useMemo(() => {
    if (!attendance || !people) return [];

    const warningsList: Warning[] = [];
    const personMap = new Map(people.map(p => [p.id, p.trigramme || 'Unknown']));

    // Group attendance by person
    const attendanceByPerson = attendance.reduce((acc, record) => {
      if (record.status === 'homeworking') {
        if (!acc[record.person_id]) {
          acc[record.person_id] = [];
        }
        acc[record.person_id].push(record.date);
      }
      return acc;
    }, {} as Record<number, string[]>);

    // Check each person's homeworking days per week
    Object.entries(attendanceByPerson).forEach(([personIdStr, dates]) => {
      const personId = parseInt(personIdStr);
      
      // Group dates by week
      const weekGroups = dates.reduce((acc, dateStr) => {
        const date = parseISO(dateStr);
        const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        if (!acc[weekKey]) {
          acc[weekKey] = [];
        }
        acc[weekKey].push(dateStr);
        return acc;
      }, {} as Record<string, string[]>);

      // Check each week
      Object.entries(weekGroups).forEach(([weekStart, weekDates]) => {
        if (weekDates.length > 3) {
          warningsList.push({
            personId,
            trigramme: personMap.get(personId) || 'Unknown',
            weekStart,
            homeworkingDays: weekDates.length,
          });
        }
      });
    });

    return warningsList.sort((a, b) => 
      b.homeworkingDays - a.homeworkingDays || a.trigramme.localeCompare(b.trigramme)
    );
  }, [attendance, people]);

  const capacityWarnings = useMemo(() => {
    if (!attendance || capacityLimit <= 0) return [];

    // Group by date and count "present" status
    const dailyCounts = attendance.reduce((acc, record) => {
      if (record.status === 'present') {
        if (!acc[record.date]) {
          acc[record.date] = 0;
        }
        acc[record.date]++;
      }
      return acc;
    }, {} as Record<string, number>);

    // Filter dates exceeding capacity
    const capacityWarningsList: CapacityWarning[] = Object.entries(dailyCounts)
      .filter(([_, count]) => count > capacityLimit)
      .map(([date, count]) => ({
        date,
        presentCount: count,
        capacityLimit,
      }))
      .sort((a, b) => b.presentCount - a.presentCount || a.date.localeCompare(b.date));

    return capacityWarningsList;
  }, [attendance, capacityLimit]);

  const isLoading = attendanceLoading || peopleLoading;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <Navigation />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Homeworking Warnings</h1>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Period & Configure Limits
            </CardTitle>
            <CardDescription>
              View warnings for employees exceeding policies and capacity limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2 border-t">
              <Label htmlFor="capacity-limit" className="flex items-center gap-2 whitespace-nowrap">
                <Users className="h-4 w-4" />
                Daily Capacity Limit:
              </Label>
              <Input
                id="capacity-limit"
                type="number"
                min="1"
                value={capacityLimit}
                onChange={(e) => setCapacityLimit(parseInt(e.target.value) || 50)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">people/day</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity Overflow Warnings
              </span>
              {!isLoading && capacityWarnings.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {capacityWarnings.length} day{capacityWarnings.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Days where the number of people present exceeds the capacity limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-pulse">Loading warnings...</div>
              </div>
            ) : capacityWarnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No capacity warnings</p>
                <p className="text-sm mt-2">All days are within the capacity limit of {capacityLimit} people.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>People Present</TableHead>
                    <TableHead>Capacity Limit</TableHead>
                    <TableHead>Overflow</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capacityWarnings.map((warning) => (
                    <TableRow key={warning.date}>
                      <TableCell className="font-medium">
                        {format(parseISO(warning.date), 'EEE, MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {warning.presentCount} people
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {warning.capacityLimit} max
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          +{warning.presentCount - warning.capacityLimit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Exceeds capacity</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Homeworking Policy Warnings</span>
              {!isLoading && warnings.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {warnings.length} violation{warnings.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Employees with more than 3 homeworking days in a single week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-pulse">Loading warnings...</div>
              </div>
            ) : warnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No warnings found</p>
                <p className="text-sm mt-2">All employees are respecting the homeworking policy for this period.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigramme</TableHead>
                    <TableHead>Week Starting</TableHead>
                    <TableHead>Homeworking Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warnings.map((warning, idx) => (
                    <TableRow key={`${warning.personId}-${warning.weekStart}-${idx}`}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{warning.trigramme}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(warning.weekStart), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warning.homeworkingDays > 4 ? 'destructive' : 'default'}>
                          {warning.homeworkingDays} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Exceeds limit (max 3 days/week)</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Policy Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Capacity Warnings:</p>
            <p>• Days exceeding the configured capacity limit are highlighted</p>
            <p>• Adjust the capacity limit above to match your office capacity</p>
            <p>• Warnings are sorted by severity (highest overflow first)</p>
            
            <p className="font-semibold text-foreground mb-2 mt-4">Homeworking Policy:</p>
            <p>• <strong>Maximum:</strong> 3 homeworking days per week</p>
            <p>• <strong>Week definition:</strong> Monday to Sunday</p>
            <p>• Contact employees shown in red for immediate attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWarnings;
