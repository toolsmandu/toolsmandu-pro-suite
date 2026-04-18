import { useState } from 'react';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, List, ArrowLeft } from 'lucide-react';

type TicketView = 'home' | 'create' | 'list';

const TicketsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<TicketView>('home');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [orderId, setOrderId] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDesc, setProblemDesc] = useState('');

  // Fetch user's orders for the dropdown
  const { data: orders } = useQuery({
    queryKey: ['my-orders-for-ticket'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, order_items(variation_name, products(name))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data || []).map((o: any) => {
        const parts = (o.order_items || []).map((it: any) => {
          const productName = it.products?.name || 'Product';
          return it.variation_name ? `${productName} - ${it.variation_name}` : productName;
        });
        const itemsLabel = parts.join(', ') || 'No items';
        return { id: o.id, order_number: o.order_number, label: `Order ID #${o.order_number} - ${itemsLabel}` };
      });
    },
    enabled: !!user,
  });

  // Fetch tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('tickets').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch all messages for selected ticket
  const { data: allMessages } = useQuery({
    queryKey: ['ticket-messages', selectedTicketId],
    queryFn: async () => {
      const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', selectedTicketId!).order('created_at');
      return data || [];
    },
    enabled: !!selectedTicketId,
  });

  const userMessage = allMessages?.find(msg => msg.sender_id === user?.id);
  const adminMessages = allMessages?.filter(msg => msg.sender_id !== user?.id) || [];

  const createTicket = useMutation({
    mutationFn: async () => {
      const insertData: any = { user_id: user!.id, subject: problemTitle };
      if (orderId) insertData.order_id = orderId;
      const { data: ticket, error } = await supabase.from('tickets').insert(insertData).select().single();
      if (error) throw error;
      if (ticket && problemDesc) {
        await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: user!.id, message: problemDesc });
      }
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setOrderId(''); setProblemTitle(''); setProblemDesc('');
      toast.success('Ticket created successfully!');
      setView('list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create ticket');
    },
  });

  const handleViewResponse = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDialogOpen(true);
  };

  // HOME VIEW - Two boxes
  if (view === 'home') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
          onClick={() => setView('create')}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Plus className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Create New Ticket</h3>
            <p className="text-sm text-muted-foreground text-center">Submit a new support request</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
          onClick={() => setView('list')}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <List className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">List All Tickets</h3>
            <p className="text-sm text-muted-foreground text-center">View your existing support tickets</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CREATE VIEW - Form
  if (view === 'create') {
    return (
      <div>
        <Button variant="ghost" onClick={() => setView('home')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
          <CardHeader><CardTitle>Create New Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Order ID</Label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger className="border-0 focus:ring-0">
                  <SelectValue placeholder="Select an order (optional)" />
                </SelectTrigger>
                <SelectContent className="border-0">
                  {orders?.map(order => (
                    <SelectItem key={order.id} value={order.id}>{order.order_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Problem Title</Label>
              <Input value={problemTitle} onChange={e => setProblemTitle(e.target.value)} placeholder="Brief title of your issue" className="border-0" />
            </div>
            <div>
              <Label>Problem Description</Label>
              <Textarea value={problemDesc} onChange={e => setProblemDesc(e.target.value)} placeholder="Describe your issue in detail..." rows={5} className="border-0" />
            </div>
            <Button
              onClick={() => problemTitle && createTicket.mutate()}
              disabled={!problemTitle || createTicket.isPending}
              className="w-full"
            >
              {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LIST VIEW - Table
  return (
    <div>
      <Button variant="ghost" onClick={() => setView('home')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <Card style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
        <CardHeader><CardTitle>All Tickets</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !tickets?.length ? (
            <p className="text-center text-muted-foreground py-8">No tickets yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="text-center">Ticket No.</TableHead>
                     <TableHead className="text-center">Order ID</TableHead>
                     <TableHead className="text-center">Problem Title</TableHead>
                     <TableHead className="text-center">Opened Date</TableHead>
                     <TableHead className="text-center">Status</TableHead>
                     <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map(ticket => (
                    <TableRow key={ticket.id}>
                       <TableCell className="text-center font-medium">#{(ticket as any).ticket_number}</TableCell>
                       <TableCell className="text-center">{orders?.find(o => o.id === (ticket as any).order_id)?.order_number || '-'}</TableCell>
                      <TableCell className="text-center">{ticket.subject}</TableCell>
                      <TableCell className="text-center">{formatDate(ticket.created_at)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={ticket.status === 'open' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewResponse(ticket.id)}
                          style={{ backgroundColor: '#16a249', color: 'white', borderColor: '#16a249' }}
                        >
                          View Response
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Response Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-success">Admin's Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userMessage && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Your Message</p>
                <p className="text-sm text-foreground">{userMessage.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(userMessage.created_at)}</p>
              </div>
            )}
            {!adminMessages.length ? (
              <p className="text-muted-foreground text-center py-4">No response from admin yet.</p>
            ) : (
              adminMessages.map(msg => (
                <div key={msg.id} className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-foreground">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(msg.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketsPage;
