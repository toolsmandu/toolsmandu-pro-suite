import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ListChecks, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const EditorTaskStatsBar = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['editor-task-stats', user?.id],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id,status,due_at,completed_at')
        .eq('assigned_to', user!.id);

      const list = tasks || [];
      const today = list.filter((t: any) => {
        const d = new Date(t.due_at);
        return d >= startOfDay && d <= endOfDay;
      });
      const completedToday = list.filter((t: any) => {
        if (!t.completed_at) return false;
        const d = new Date(t.completed_at);
        return d >= startOfDay && d <= endOfDay;
      }).length;
      const pending = list.filter((t: any) => t.status === 'pending' && new Date(t.due_at) >= now).length;
      const overdue = list.filter((t: any) => t.status !== 'completed' && new Date(t.due_at) < now).length;

      return { today: today.length, completedToday, pending, overdue };
    },
  });

  const stats = data || { today: 0, completedToday: 0, pending: 0, overdue: 0 };

  const Item = ({ icon: Icon, label, value, className, style }: any) => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${className}`} style={style}>
      <Icon className="h-4 w-4" />
      <span className="text-xs text-white">{label}:</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Item icon={Clock} label="Today's Tasks" value={stats.today} className="text-white border-transparent" style={{ backgroundColor: '#377F8C' }} />
      <Item icon={CheckCircle2} label="Completed Today" value={stats.completedToday} className="bg-emerald-700 text-white border-transparent" />
      <Item icon={ListChecks} label="Pending" value={stats.pending} className="bg-blue-700 text-white border-transparent" />
      <Item icon={AlertTriangle} label="Overdue" value={stats.overdue} className="bg-red-700 text-white border-transparent" />
    </div>
  );
};

export default EditorTaskStatsBar;
