import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { usePeople, Person } from '@/hooks/usePeople';
import { useAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Users, Save, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';
import { cn } from '@/lib/utils';

const AdminAttendance = () => {
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { data: attendance, refetch: refetchAttendance } = useAttendance();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
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
    if (!selectedPerson || !selectedDate || !selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a person, date, and status",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      // Check if attendance record already exists
      const existingRecord = getPersonCurrentStatus(selectedPerson, selectedDate);
      
      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status: selectedStatus })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            person_id: selectedPerson.id,
            date: dateStr,
            status: selectedStatus
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Attendance updated for ${selectedPerson.trigramme}`,
      });
      
      refetchAttendance();
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedStatus('');
    } catch (error) {
      console.error('Error saving attendance:', error);
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
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
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

              {selectedPerson && selectedDate && (
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm font-medium mb-2">Current Status:</div>
                  {(() => {
                    const currentStatus = getPersonCurrentStatus(selectedPerson, selectedDate);
                    if (currentStatus) {
                      const statusOption = statusOptions.find(s => s.value === currentStatus.status);
                      return (
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", statusOption?.color)} />
                          <span className="text-sm">{statusOption?.label || currentStatus.status}</span>
                        </div>
                      );
                    }
                    return <span className="text-sm text-muted-foreground">No record found</span>;
                  })()}
                </div>
              )}

              <Button
                onClick={saveAttendance}
                disabled={saving || !selectedPerson || !selectedDate || !selectedStatus}
                className="w-full flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Select a team member from the grid above</p>
            <p>• Choose a date using the calendar picker</p>
            <p>• Select the appropriate attendance status</p>
            <p>• Click Save to update the attendance record</p>
            <p>• Existing records will be updated, new records will be created</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAttendance;