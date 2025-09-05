import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Person {
  id: number;
  role: string;
  team: string;
  capacity: number;
  nature: string;
  name: string;
  surname: string;
  created_at: string;
}

export const usePeople = () => {
  return useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('People')
        .select('*')
        .order('trigramme');
      
      if (error) {
        throw error;
      }
      
      return data.map(person => ({
        id: person.id,
        role: person.role || 'Team Member',
        team: person.team || 'General',
        capacity: person.capacity || 0,
        nature: person.nature || '',
        name: person.name || 'N/A',
        surname: person.surname || '',
        created_at: person.created_at,
      })) as Person[];
    },
  });
};