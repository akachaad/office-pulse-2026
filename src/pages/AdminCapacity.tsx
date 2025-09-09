import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePeople, Person } from '@/hooks/usePeople';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, User } from 'lucide-react';
import Navigation from '@/components/Navigation';

const AdminCapacity = () => {
  const { data: people, isLoading, refetch } = usePeople();
  const [capacities, setCapacities] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Filter developers based on role or nature
  const developers = useMemo(() => 
    people?.filter(person => 
      person.role?.toLowerCase().includes('developer') || 
      person.role?.toLowerCase().includes('dev') ||
      person.nature?.toLowerCase().includes('developer') ||
      person.nature?.toLowerCase().includes('dev')
    ) || [], [people]);

  useEffect(() => {
    if (developers.length > 0) {
      const initialCapacities: Record<number, number> = {};
      developers.forEach(dev => {
        initialCapacities[dev.id] = dev.capacity || 1;
      });
      setCapacities(initialCapacities);
    }
  }, [developers]);

  const handleCapacityChange = (personId: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setCapacities(prev => ({
        ...prev,
        [personId]: numValue
      }));
    }
  };

  const saveCapacity = async (personId: number) => {
    setSaving(prev => new Set(prev).add(personId));
    
    try {
      const { error } = await supabase
        .from('People')
        .update({ capacity: capacities[personId] })
        .eq('id', personId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Capacity updated successfully",
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating capacity:', error);
      toast({
        title: "Error",
        description: "Failed to update capacity",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(personId);
        return newSet;
      });
    }
  };

  if (isLoading) {
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
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Developer Capacity Management</h1>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Developer Capacities
            </CardTitle>
            <CardDescription>
              Manage the daily capacity for developers. Capacity can be 1 (full day) or a fraction (e.g., 0.5, 0.8).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {developers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No developers found in the system.</p>
                <p className="text-sm mt-2">People with "developer" or "dev" in their role/nature will appear here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigramme</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Current Capacity</TableHead>
                    <TableHead>New Capacity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {developers.map((dev) => (
                    <TableRow key={dev.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{dev.trigramme}</Badge>
                      </TableCell>
                      <TableCell>{dev.team || 'N/A'}</TableCell>
                      <TableCell>{dev.role || 'N/A'}</TableCell>
                      <TableCell>{dev.nature || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {dev.capacity || 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={capacities[dev.id] || 1}
                          onChange={(e) => handleCapacityChange(dev.id, e.target.value)}
                          className="w-24"
                          placeholder="0.0"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => saveCapacity(dev.id)}
                          disabled={saving.has(dev.id) || capacities[dev.id] === dev.capacity}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {saving.has(dev.id) ? 'Saving...' : 'Save'}
                        </Button>
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
            <CardTitle className="text-sm font-medium">Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Capacity 1.0:</strong> Full day availability</p>
            <p>• <strong>Capacity 0.5:</strong> Half day availability</p>
            <p>• <strong>Capacity 0.8:</strong> 80% day availability</p>
            <p>• Only people with "developer" or "dev" in their role/nature are shown</p>
            <p>• Changes are saved immediately when you click the Save button</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCapacity;