import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessageCircle, Plus, Send } from 'lucide-react';

const TicketsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('tickets').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ['ticket-messages', selectedTicket],
    queryFn: async () => {
      const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', selectedTicket!).order('created_at');
      return data || [];
    },
    enabled: !!selectedTicket,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: ticket } = await supabase.from('tickets').insert({ user_id: user!.id, subject: newSubject }).select().single();
      if (ticket && newMessage) {
        await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: user!.id, message: newMessage });
      }
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setNewSubject(''); setNewMessage(''); setDialogOpen(false);
      toast.success('Ticket created!');
    },
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      await supabase.from('ticket_messages').insert({ ticket_id: selectedTicket!, sender_id: user!.id, message: replyMsg });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', selectedTicket] });
      setReplyMsg('');
    },
  });

  const closeTicket = async (ticketId: string) => {
    await supabase.from('tickets').update({ status: 'closed' as const }).eq('id', ticketId);
    queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    toast.success('Ticket closed');
  };

  if (selectedTicket) {
    const ticket = tickets?.find(t => t.id === selectedTicket);
    return (
      <div>
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">← Back to Tickets</Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{ticket?.subject}</CardTitle>
              <Badge className={ticket?.status === 'open' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>{ticket?.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {messages?.map(msg => (
                <div key={msg.id} className={`p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-primary/10 ml-8' : 'bg-secondary mr-8'}`}>
                  <p className="text-sm text-foreground">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
            {ticket?.status === 'open' && (
              <div className="flex gap-2">
                <Input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type a reply..." onKeyDown={e => e.key === 'Enter' && replyMsg && sendReply.mutate()} />
                <Button onClick={() => replyMsg && sendReply.mutate()} disabled={!replyMsg}><Send className="h-4 w-4" /></Button>
                <Button variant="outline" onClick={() => closeTicket(selectedTicket)}>Close</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Support Tickets</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <Textarea placeholder="Describe your issue..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
              <Button onClick={() => newSubject && createTicket.mutate()} disabled={!newSubject} className="w-full">Create Ticket</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : !tickets?.length ? (
        <div className="text-center py-16">
          <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No tickets yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedTicket(ticket.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
                <Badge className={ticket.status === 'open' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>{ticket.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
