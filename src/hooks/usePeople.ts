import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Person {
  id: number;
  name: string;
  surname: string;
  role: string;
  team: string;
  capacity: number;
  nature: string;
  trigramme: string;
  created_at: string;
}

export const usePeople = () => {
  return useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('People')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      return data as Person[];
    },
  });
};