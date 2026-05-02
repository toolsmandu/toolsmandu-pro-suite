import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2, Mail, Server, Globe, Inbox } from "lucide-react";

type ImapServer = {
  id: string;
  tag: string;
  host: string;
  port: number;
  encryption: string;
  username: string;
  validate_cert: boolean;
  is_active: boolean;
};

type Domain = {
  id: string;
  domain: string;
  imap_server_id: string;
  is_active: boolean;
  sort_order: number;
};

type InboxAddress = {
  id: string;
  email: string;
  username: string;
  domain_id: string;
  created_at: string;
};

type Message = {
  uid: number;
  subject: string;
  from: string;
  date: string;
  text: string;
  html: string | null;
};

const AdminDisposableInbox = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Inbox className="h-6 w-6" /> Disposable Inbox</h1>
        <p className="text-muted-foreground text-sm">Manage IMAP servers, domains, and view temporary inboxes.</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox"><Mail className="mr-2 h-4 w-4" /> Inbox Viewer</TabsTrigger>
          <TabsTrigger value="domains"><Globe className="mr-2 h-4 w-4" /> Domains</TabsTrigger>
          <TabsTrigger value="servers"><Server className="mr-2 h-4 w-4" /> IMAP Servers</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4"><InboxViewer /></TabsContent>
        <TabsContent value="domains" className="mt-4"><DomainsTab /></TabsContent>
        <TabsContent value="servers" className="mt-4"><ServersTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// =============================================================
// IMAP SERVERS TAB
// =============================================================
const ServersTab = () => {
  const qc = useQueryClient();
  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["inbox_imap_servers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox_imap_servers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ImapServer[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ImapServer | null>(null);
  const [form, setForm] = useState({
    host: "", port: 993, encryption: "ssl",
    username: "", password: "", validate_cert: true, is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm({ host: "", port: 993, encryption: "ssl", username: "", password: "", validate_cert: true, is_active: true }); setOpen(true); };
  const openEdit = (s: ImapServer) => { setEditing(s); setForm({ host: s.host, port: s.port, encryption: s.encryption, username: s.username, password: "", validate_cert: s.validate_cert, is_active: s.is_active }); setOpen(true); };

  const save = async () => {
    if (!form.host || !form.username) return toast.error("Host and username required");
    if (!editing && !form.password) return toast.error("Password required for new server");
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("inbox-save-server", {
        body: {
          id: editing?.id ?? null,
          tag: form.username,
          host: form.host,
          port: form.port,
          encryption: form.encryption,
          username: form.username,
          password: form.password,
          validate_cert: form.validate_cert,
          is_active: form.is_active,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(editing ? "Server updated" : "Server added");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["inbox_imap_servers"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const test = async (id: string) => {
    const t = toast.loading("Testing connection...");
    const { data, error } = await supabase.functions.invoke("inbox-test-imap", { body: { server_id: id } });
    toast.dismiss(t);
    if (error || !data?.ok) toast.error(data?.error || error?.message || "Connection failed");
    else toast.success("Connection successful");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this IMAP server?")) return;
    const { error } = await supabase.from("inbox_imap_servers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["inbox_imap_servers"] }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>IMAP Servers</CardTitle>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Server</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead><TableHead>Host</TableHead>
                <TableHead>Encryption</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.username}</TableCell>
                  <TableCell>{s.host}:{s.port}</TableCell>
                  <TableCell><Badge variant="outline">{s.encryption}</Badge></TableCell>
                  <TableCell>{s.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => test(s.id)}>Test</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {servers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No servers yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} IMAP Server</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Username (catch-all mailbox)</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="catchall@example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Host</Label><Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="mail.example.com" /></div>
              <div><Label>Port</Label><Input type="number" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 993 })} /></div>
            </div>
            <div><Label>Encryption</Label>
              <Select value={form.encryption} onValueChange={v => setForm({ ...form, encryption: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Username (catch-all mailbox)</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="catchall@example.com" /></div>
            <div><Label>Password {editing && <span className="text-xs text-muted-foreground">(leave blank to keep)</span>}</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="flex items-center justify-between"><Label>Validate SSL Certificate</Label>
              <Switch checked={form.validate_cert} onCheckedChange={v => setForm({ ...form, validate_cert: v })} />
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// =============================================================
// DOMAINS TAB
// =============================================================
const DomainsTab = () => {
  const qc = useQueryClient();
  const { data: domains = [] } = useQuery({
    queryKey: ["inbox_domains"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inbox_domains").select("*").order("sort_order");
      if (error) throw error;
      return data as Domain[];
    },
  });
  const { data: servers = [] } = useQuery({
    queryKey: ["inbox_imap_servers"],
    queryFn: async () => {
      const { data } = await supabase.from("inbox_imap_servers").select("id, tag");
      return (data || []) as { id: string; tag: string }[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ domain: "", imap_server_id: "", is_active: true, sort_order: 0 });

  const add = async () => {
    if (!form.domain || !form.imap_server_id) return toast.error("Domain and server required");
    const { error } = await supabase.from("inbox_domains").insert({
      domain: form.domain.trim().toLowerCase(),
      imap_server_id: form.imap_server_id,
      is_active: form.is_active,
      sort_order: form.sort_order,
    });
    if (error) return toast.error(error.message);
    toast.success("Domain added");
    setOpen(false);
    setForm({ domain: "", imap_server_id: "", is_active: true, sort_order: 0 });
    qc.invalidateQueries({ queryKey: ["inbox_domains"] });
  };

  const toggle = async (d: Domain) => {
    const { error } = await supabase.from("inbox_domains").update({ is_active: !d.is_active }).eq("id", d.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["inbox_domains"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this domain?")) return;
    const { error } = await supabase.from("inbox_domains").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["inbox_domains"] }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Domains (manual entry)</CardTitle>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Domain</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Domain</TableHead><TableHead>IMAP Server</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {domains.map(d => {
              const srv = servers.find(s => s.id === d.imap_server_id);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-mono">@{d.domain}</TableCell>
                  <TableCell>{srv?.tag || <span className="text-destructive">missing</span>}</TableCell>
                  <TableCell><Switch checked={d.is_active} onCheckedChange={() => toggle(d)} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {domains.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No domains yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Domain</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Domain (without @)</Label><Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="example.com" /></div>
            <div><Label>IMAP Server</Label>
              <Select value={form.imap_server_id} onValueChange={v => setForm({ ...form, imap_server_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select server" /></SelectTrigger>
                <SelectContent>{servers.map(s => <SelectItem key={s.id} value={s.id}>{s.tag}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex items-center justify-between"><Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={add}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// =============================================================
// INBOX VIEWER
// =============================================================
const InboxViewer = () => {
  const { data: domains = [] } = useQuery({
    queryKey: ["inbox_domains_active"],
    queryFn: async () => {
      const { data } = await supabase.from("inbox_domains").select("*").eq("is_active", true).order("sort_order");
      return (data || []) as Domain[];
    },
  });

  const [username, setUsername] = useState("");
  const [domainId, setDomainId] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    if (!domainId && domains.length > 0) setDomainId(domains[0].id);
  }, [domains, domainId]);

  const generateRandom = () => {
    const adj = ["swift","silent","cosmic","hidden","quick","brave","lucky","clever"];
    const noun = ["fox","wolf","panda","tiger","eagle","river","stone","cloud"];
    const n = Math.floor(Math.random() * 999);
    setUsername(`${adj[Math.floor(Math.random()*adj.length)]}${noun[Math.floor(Math.random()*noun.length)]}${n}`);
  };

  const createInbox = async () => {
    if (!username || !domainId) return toast.error("Username and domain required");
    const dom = domains.find(d => d.id === domainId);
    if (!dom) return;
    const email = `${username.toLowerCase().trim()}@${dom.domain}`;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Not signed in");

    // Upsert by email (admin-owned)
    const { data: existing } = await supabase.from("inbox_addresses").select("*").eq("email", email).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("inbox_addresses").insert({
        email, username: username.toLowerCase().trim(), domain_id: domainId, user_id: user.id,
      });
      if (error) return toast.error(error.message);
    }
    setCurrentEmail(email);
    setMessages([]);
    fetchMail(email);
  };

  const fetchMail = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("inbox-fetch", { body: { email } });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data?.error) return toast.error(data.error);
    setMessages(data?.messages || []);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Create / Open Inbox</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Username</Label>
              <div className="flex gap-2">
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="myname123" />
                <Button variant="outline" type="button" onClick={generateRandom}>Random</Button>
              </div>
            </div>
            <div className="min-w-[180px]">
              <Label>Domain</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{domains.map(d => <SelectItem key={d.id} value={d.id}>@{d.domain}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={createInbox}><Mail className="mr-2 h-4 w-4" /> Open Inbox</Button>
          </div>
        </CardContent>
      </Card>

      {currentEmail && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-mono text-base">{currentEmail}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
            </div>
            <Button variant="outline" onClick={() => fetchMail(currentEmail)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {messages.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">No messages yet. Send mail to {currentEmail} and click Refresh.</p>}
            <div className="divide-y">
              {messages.map(m => (
                <button key={m.uid} onClick={() => setSelected(m)} className="w-full text-left py-3 hover:bg-muted/50 px-2 rounded">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{m.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{m.from}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(m.date).toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2">
              <p className="text-sm"><span className="text-muted-foreground">From:</span> {selected.from}</p>
              <p className="text-sm"><span className="text-muted-foreground">Date:</span> {new Date(selected.date).toLocaleString()}</p>
              <hr />
              {selected.html ? (
                <iframe srcDoc={selected.html} className="w-full min-h-[400px] border rounded" sandbox="" />
              ) : (
                <pre className="whitespace-pre-wrap text-sm">{selected.text}</pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisposableInbox;
