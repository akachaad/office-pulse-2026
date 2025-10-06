import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { usePeople, Person } from '@/hooks/usePeople';
import { useAttendance, useUpdateAttendance } from '@/hooks/useAttendance';
import { CalendarIcon, Users, Save, Plus } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import Navigation from '@/components/Navigation';
import RecurrentAttendanceManager from '@/components/RecurrentAttendanceManager';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { z } from 'zod';

const attendanceSchema = z.object({
  personId: z.number().positive('Invalid person selected'),
  dateRange: z.object({
    from: z.date(),
    to: z.date().optional(),
  }),
  status: z.enum(['present', 'sickness', 'holidays', 'training', 'homeworking'], {
    errorMap: () => ({ message: 'Invalid status selected' }),
  }),
});

const AdminAttendance = () => {
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { data: attendance } = useAttendance();
  const updateAttendance = useUpdateAttendance();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'present', label: 'Present', color: 'bg-present' },
    { value: 'absent', label: 'Absent', color: 'bg-absent' },
    { value: 'sickness', label: 'Sickness Leave', color: 'bg-sickness' },
    { value: 'holidays', label: 'Holidays', color: 'bg-holidays' },
    { value: 'training', label: 'Training', color: 'bg-training' },
    { value: 'homeworking', label: 'Home Working', color: 'bg-homeworking' },
  ];

  const getPersonCurrentStatus = (person: Person, date: Date) => {
    if (!attendance) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(a => a.person_id === person.id && a.date === dateStr);
  };

  const saveAttendance = async () => {
    if (!selectedPerson || !selectedDateRange?.from || !selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a person, date range, and status",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    try {
      attendanceSchema.parse({
        personId: selectedPerson.id,
        dateRange: selectedDateRange,
        status: selectedStatus,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    
    try {
      // Get all dates in the range
      const dates = selectedDateRange.to 
        ? eachDayOfInterval({ start: selectedDateRange.from, end: selectedDateRange.to })
        : [selectedDateRange.from];

      // Process each date using the mutation hook
      for (const date of dates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        await updateAttendance.mutateAsync({
          personId: selectedPerson.id,
          date: dateStr,
          status: selectedStatus as 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking',
          period: 'full_day'
        });
      }

      const dateText = selectedDateRange.to 
        ? `${format(selectedDateRange.from, 'PPP')} - ${format(selectedDateRange.to, 'PPP')}`
        : format(selectedDateRange.from, 'PPP');

      toast({
        title: "Success",
        description: `Attendance updated for ${selectedPerson.trigramme} (${dateText})`,
      });
      
      // Reset form
      setSelectedDateRange(undefined);
      setSelectedStatus('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (peopleLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <Navigation />
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-32 bg-muted rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <Navigation />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Person Selection */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Team Member
              </CardTitle>
              <CardDescription>
                Choose a team member to manage their attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {people?.map((person) => (
                  <Button
                    key={person.id}
                    variant={selectedPerson?.id === person.id ? 'default' : 'outline'}
                    onClick={() => setSelectedPerson(person)}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Badge variant="outline">{person.trigramme}</Badge>
                    <div className="text-xs text-center">
                      <div className="font-medium">{person.team}</div>
                      <div className="text-muted-foreground">{person.role}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Form */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Edit Attendance
              </CardTitle>
              <CardDescription>
                Set attendance status for the selected team member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedPerson && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Selected Member:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{selectedPerson.trigramme}</Badge>
                    <span className="text-sm">{selectedPerson.team} - {selectedPerson.role}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateRange?.from ? (
                        selectedDateRange.to ? (
                          `${format(selectedDateRange.from, "PPP")} - ${format(selectedDateRange.to, "PPP")}`
                        ) : (
                          format(selectedDateRange.from, "PPP")
                        )
                      ) : (
                        "Pick date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={selectedDateRange}
                      onSelect={setSelectedDateRange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select attendance status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", status.color)} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPerson && selectedDateRange?.from && (
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm font-medium mb-2">Current Status:</div>
                  {(() => {
                    // Show status for first date in range
                    const currentStatus = getPersonCurrentStatus(selectedPerson, selectedDateRange.from);
                    if (currentStatus) {
                      const statusOption = statusOptions.find(s => s.value === currentStatus.status);
                      return (
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", statusOption?.color)} />
                          <span className="text-sm">{statusOption?.label || currentStatus.status}</span>
                          {selectedDateRange.to && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (showing first date)
                            </span>
                          )}
                        </div>
                      );
                    }
                    return <span className="text-sm text-muted-foreground">No record found</span>;
                  })()}
                </div>
              )}

              <Button
                onClick={saveAttendance}
                disabled={saving || !selectedPerson || !selectedDateRange?.from || !selectedStatus}
                className="w-full flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <RecurrentAttendanceManager selectedPerson={selectedPerson} />

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Select a team member from the grid above</p>
            <p>• Choose a date or date range using the calendar picker</p>
            <p>• Select the appropriate attendance status</p>
            <p>• Click Save to update attendance for all selected dates</p>
            <p>• Existing records will be updated, new records will be created</p>
            <p className="pt-2 border-t"><strong>Recurrent Patterns:</strong> Set default status for specific weekdays (e.g., "every Monday = homeworking")</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAttendance;