import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddPersonDialogProps {
  onPersonAdded: () => void;
}

export const AddPersonDialog = ({ onPersonAdded }: AddPersonDialogProps) => {
  const [open, setOpen] = useState(false);
  const [trigramme, setTrigramme] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [nature, setNature] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [startDate, setStartDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trigramme.trim()) {
      toast({
        title: "Validation Error",
        description: "Trigramme is required",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "Validation Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('People')
        .insert({
          trigramme: trigramme.trim().toUpperCase(),
          role: role.trim() || null,
          team: team.trim() || null,
          nature: nature.trim() || null,
          capacity: parseFloat(capacity) || 1,
          start_date: format(startDate, 'yyyy-MM-dd'),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Person added successfully",
      });

      // Reset form
      setTrigramme('');
      setRole('');
      setTeam('');
      setNature('');
      setCapacity('1');
      setStartDate(undefined);
      setOpen(false);
      onPersonAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add person",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New Person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Person</DialogTitle>
          <DialogDescription>
            Add a new person to the system with their start date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigramme">Trigramme *</Label>
            <Input
              id="trigramme"
              value={trigramme}
              onChange={(e) => setTrigramme(e.target.value)}
              placeholder="ABC"
              maxLength={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Developer, Manager, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Input
              id="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Engineering, HR, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nature">Nature</Label>
            <Input
              id="nature"
              value={nature}
              onChange={(e) => setNature(e.target.value)}
              placeholder="Full-time, Part-time, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="1.0"
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
