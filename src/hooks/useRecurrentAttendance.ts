import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecurrentAttendance {
  id: string;
  person_id: number;
  day_of_week: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useRecurrentAttendance = (personId?: number) => {
  return useQuery({
    queryKey: ['recurrent-attendance', personId],
    queryFn: async () => {
      let query = supabase
        .from('recurrent_attendance')
        .select('*')
        .order('day_of_week', { ascending: true });
      
      if (personId) {
        query = query.eq('person_id', personId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as RecurrentAttendance[];
    },
  });
};

export const useCreateRecurrentAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { person_id: number; day_of_week: number; status: string }) => {
      const { data: result, error } = await supabase
        .from('recurrent_attendance')
        .upsert(data, {
          onConflict: 'person_id,day_of_week',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrent-attendance'] });
    },
  });
};

export const useUpdateRecurrentAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('recurrent_attendance')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrent-attendance'] });
    },
  });
};

export const useDeleteRecurrentAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurrent_attendance')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrent-attendance'] });
    },
  });
};
