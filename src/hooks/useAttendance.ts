import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceRecord {
  id: string;
  person_id: number;
  date: string;
  status: 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking';
  created_at: string;
  updated_at: string;
}

export const useAttendance = (month?: number, year: number = 2025) => {
  return useQuery({
    queryKey: ['attendance', month, year],
    queryFn: async () => {
      let query = supabase.from('attendance').select('*');
      
      if (month !== undefined) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        // Calculate the last day of the month correctly
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as AttendanceRecord[];
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      personId, 
      date, 
      status 
    }: { 
      personId: number; 
      date: string; 
      status: 'present' | 'sickness' | 'holidays' | 'training' | 'homeworking' | null;
    }) => {
      if (status === null) {
        // Delete the attendance record
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('person_id', personId)
          .eq('date', date);
          
        if (error) throw error;
        return null;
      } else {
        // Upsert the attendance record
        const { data, error } = await supabase
          .from('attendance')
          .upsert({
            person_id: personId,
            date,
            status,
          }, {
            onConflict: 'person_id,date'
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};