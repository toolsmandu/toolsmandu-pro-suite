import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatDate';

const AdminTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyMsg, setReplyMsg] = useState('');

  const { data: tickets } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('tickets').select('*, profiles(email)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['admin-ticket-messages', selectedTicket],
    queryFn: async () => {
      const { data } = await supabase.from('ticket_messages').select('*, profiles:sender_id(email)').eq('ticket_id', selectedTicket!).order('created_at');
      return data || [];
    },
    enabled: !!selectedTicket,
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      await supabase.from('ticket_messages').insert({ ticket_id: selectedTicket!, sender_id: user!.id, message: replyMsg });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-messages', selectedTicket] });
      setReplyMsg('');
    },
  });

  const closeTicket = async (id: string) => {
    await supabase.from('tickets').update({ status: 'closed' as const }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
  };

  if (selectedTicket) {
    const ticket = tickets?.find((t: any) => t.id === selectedTicket);
    return (
      <div>
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">← Back</Button>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>{ticket?.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">{(ticket as any)?.profiles?.email}</p>
              </div>
              <Badge className={ticket?.status === 'open' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>{ticket?.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {messages?.map((msg: any) => (
                <div key={msg.id} className={`p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-primary/10 ml-8' : 'bg-secondary mr-8'}`}>
                  <p className="text-xs text-muted-foreground mb-1">{msg.profiles?.email || 'Unknown'}</p>
                  <p className="text-sm text-foreground">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(msg.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type reply..." onKeyDown={e => e.key === 'Enter' && replyMsg && sendReply.mutate()} />
              <Button onClick={() => replyMsg && sendReply.mutate()}><Send className="h-4 w-4" /></Button>
              {ticket?.status === 'open' && <Button variant="outline" onClick={() => closeTicket(selectedTicket)}>Close</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openCount = tickets?.filter((t: any) => t.status === 'open').length || 0;
  const totalCount = tickets?.length || 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h2 className="text-2xl font-bold text-foreground">Support Tickets</h2>
        <Badge className="bg-success/20 text-success border-0">Open: {openCount}</Badge>
        <Badge variant="secondary">Total: {totalCount}</Badge>
      </div>
      <div className="space-y-3">
        {tickets?.map((t: any) => (
          <Card key={t.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedTicket(t.id)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">{t.subject}</h3>
                <p className="text-xs text-muted-foreground">{t.profiles?.email} • {formatDate(t.created_at)}</p>
              </div>
              <Badge className={t.status === 'open' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>{t.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminTickets;
