import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Trash2, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Person } from '@/hooks/usePeople';
import {
  useRecurrentAttendance,
  useCreateRecurrentAttendance,
  useUpdateRecurrentAttendance,
  useDeleteRecurrentAttendance,
} from '@/hooks/useRecurrentAttendance';

interface RecurrentAttendanceManagerProps {
  selectedPerson: Person | null;
}

const RecurrentAttendanceManager = ({ selectedPerson }: RecurrentAttendanceManagerProps) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { toast } = useToast();

  const { data: recurrentRules, isLoading } = useRecurrentAttendance(selectedPerson?.id);
  const createMutation = useCreateRecurrentAttendance();
  const updateMutation = useUpdateRecurrentAttendance();
  const deleteMutation = useDeleteRecurrentAttendance();

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
  ];

  const statusOptions = [
    { value: 'present', label: 'Present', color: 'bg-present' },
    { value: 'sickness', label: 'Sickness Leave', color: 'bg-sickness' },
    { value: 'holidays', label: 'Holidays', color: 'bg-holidays' },
    { value: 'training', label: 'Training', color: 'bg-training' },
    { value: 'homeworking', label: 'Home Working', color: 'bg-homeworking' },
  ];

  const handleAddRule = async () => {
    if (!selectedPerson || selectedDay === null || !selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a day and status",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        person_id: selectedPerson.id,
        day_of_week: selectedDay,
        status: selectedStatus,
      });

      const existingRule = getRuleForDay(selectedDay);
      toast({
        title: "Success",
        description: existingRule ? "Recurrent pattern updated successfully" : "Recurrent pattern added successfully",
      });

      setSelectedDay(null);
      setSelectedStatus('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add recurrent pattern",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Recurrent pattern removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove recurrent pattern",
        variant: "destructive",
      });
    }
  };

  const getRuleForDay = (dayOfWeek: number) => {
    return recurrentRules?.find((rule) => rule.day_of_week === dayOfWeek);
  };

  if (!selectedPerson) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recurrent Attendance Patterns
          </CardTitle>
          <CardDescription>
            Select a team member to manage their recurrent attendance patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team member selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Recurrent Attendance Patterns
        </CardTitle>
        <CardDescription>
          Set default attendance status for specific days of the week for {selectedPerson.trigramme}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Rule */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="text-sm font-medium">Add New Pattern</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Day of Week</label>
              <Select
                value={selectedDay?.toString() || ''}
                onValueChange={(v) => setSelectedDay(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
              <SelectContent>
                  {daysOfWeek.map((day) => {
                    const hasRule = getRuleForDay(day.value);
                    return (
                      <SelectItem
                        key={day.value}
                        value={day.value.toString()}
                      >
                        {day.label} {hasRule && '(will overwrite)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Default Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', status.color)} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAddRule}
            disabled={selectedDay === null || !selectedStatus || createMutation.isPending}
            className="w-full flex items-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? 'Adding...' : 'Add Pattern'}
          </Button>
        </div>

        {/* Existing Rules */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Current Patterns</div>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              <div className="animate-pulse">Loading...</div>
            </div>
          ) : recurrentRules && recurrentRules.length > 0 ? (
            <div className="space-y-2">
              {daysOfWeek.map((day) => {
                const rule = getRuleForDay(day.value);
                if (!rule) return null;

                const statusOption = statusOptions.find((s) => s.value === rule.status);

                return (
                  <div
                    key={day.value}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{day.label}</Badge>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', statusOption?.color)} />
                        <span className="text-sm">{statusOption?.label}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No recurrent patterns set</p>
              <p className="text-xs mt-1">Add a pattern above to get started</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Recurrent patterns set default status for specific weekdays.
            You can still override them with specific date entries using the attendance form above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurrentAttendanceManager;
