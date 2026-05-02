import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Mail, RefreshCw, Copy, Trash2 } from "lucide-react";

type Domain = { id: string; domain: string; is_active: boolean };
type Address = { id: string; email: string; username: string; domain_id: string; created_at: string };
type Message = { uid: number; subject: string; from: string; date: string; text: string; html: string | null };

interface Props {
  /** "user" = signed-in (uses user_id); "public" = anon (uses session_id via edge fn) */
  mode: "user" | "public";
}

const STORAGE_KEY_SESSION = "disposable_inbox_session_id";
const STORAGE_KEY_CURRENT = "disposable_inbox_current_email";

export const DisposableInboxView = ({ mode }: Props) => {
  const { data: domains = [] } = useQuery({
    queryKey: ["inbox_domains_active"],
    queryFn: async () => {
      const { data } = await supabase.from("inbox_domains").select("id, domain, is_active").eq("is_active", true).order("sort_order");
      return (data || []) as Domain[];
    },
  });

  const [username, setUsername] = useState("");
  const [domainId, setDomainId] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [myAddresses, setMyAddresses] = useState<Address[]>([]);

  // Session id for public mode
  const getSessionId = () => {
    let s = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!s) { s = crypto.randomUUID(); localStorage.setItem(STORAGE_KEY_SESSION, s); }
    return s;
  };

  useEffect(() => {
    if (!domainId && domains.length > 0) setDomainId(domains[0].id);
  }, [domains, domainId]);

  // Load saved addresses
  useEffect(() => {
    const load = async () => {
      if (mode === "user") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("inbox_addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        setMyAddresses((data || []) as Address[]);
      } else {
        const sid = getSessionId();
        const { data } = await supabase.from("inbox_addresses").select("*").eq("session_id", sid).order("created_at", { ascending: false });
        setMyAddresses((data || []) as Address[]);
      }
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (saved) {
        setCurrentEmail(saved);
        fetchMail(saved);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const generateRandom = () => {
    const adj = ["swift","silent","cosmic","hidden","quick","brave","lucky","clever","brisk","mellow"];
    const noun = ["fox","wolf","panda","tiger","eagle","river","stone","cloud","spark","aero"];
    const n = Math.floor(Math.random() * 999);
    setUsername(`${adj[Math.floor(Math.random()*adj.length)]}${noun[Math.floor(Math.random()*noun.length)]}${n}`);
  };

  const createInbox = async () => {
    if (!username || !domainId) return toast.error("Username and domain required");
    const dom = domains.find(d => d.id === domainId);
    if (!dom) return;
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
    if (cleanUser.length < 2) return toast.error("Username must be at least 2 characters");
    const email = `${cleanUser}@${dom.domain}`;

    setCreating(true);
    try {
      if (mode === "user") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { data: existing } = await supabase.from("inbox_addresses").select("*").eq("email", email).maybeSingle();
        if (existing) {
          if (existing.user_id !== user.id) throw new Error("Address already taken");
        } else {
          const { error } = await supabase.from("inbox_addresses").insert({
            email, username: cleanUser, domain_id: domainId, user_id: user.id,
          });
          if (error) throw error;
        }
      } else {
        const sid = getSessionId();
        const { data, error } = await supabase.functions.invoke("inbox-create-public", {
          body: { username: cleanUser, domain_id: domainId, session_id: sid },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      setCurrentEmail(email);
      localStorage.setItem(STORAGE_KEY_CURRENT, email);
      setMessages([]);
      // refresh saved list
      if (mode === "user") {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase.from("inbox_addresses").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
        setMyAddresses((data || []) as Address[]);
      } else {
        const sid = getSessionId();
        const { data } = await supabase.from("inbox_addresses").select("*").eq("session_id", sid).order("created_at", { ascending: false });
        setMyAddresses((data || []) as Address[]);
      }
      fetchMail(email);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const fetchMail = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("inbox-fetch", { body: { email } });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data?.error) return toast.error(data.error);
    setMessages(data?.messages || []);
  };

  const switchTo = (email: string) => {
    setCurrentEmail(email);
    localStorage.setItem(STORAGE_KEY_CURRENT, email);
    setMessages([]);
    fetchMail(email);
  };

  const deleteAddr = async (id: string, email: string) => {
    if (!confirm(`Delete inbox ${email}?`)) return;
    const { error } = await supabase.from("inbox_addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMyAddresses(myAddresses.filter(a => a.id !== id));
    if (currentEmail === email) {
      setCurrentEmail(null);
      localStorage.removeItem(STORAGE_KEY_CURRENT);
      setMessages([]);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Disposable Email Inbox</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Choose username</Label>
              <div className="flex gap-2">
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="myname123" />
                <Button variant="outline" type="button" onClick={generateRandom}>Random</Button>
              </div>
            </div>
            <div className="min-w-[180px]">
              <Label>Domain</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{domains.map(d => <SelectItem key={d.id} value={d.id}>@{d.domain}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={createInbox} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
              Open Inbox
            </Button>
          </div>
          {domains.length === 0 && <p className="text-sm text-muted-foreground mt-3">No domains available yet.</p>}
        </CardContent>
      </Card>

      {myAddresses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">My inboxes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myAddresses.map(a => (
                <div key={a.id} className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${currentEmail === a.email ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <button onClick={() => switchTo(a.email)} className="font-mono">{a.email}</button>
                  <button onClick={() => copy(a.email)} className="opacity-70 hover:opacity-100"><Copy className="h-3 w-3" /></button>
                  <button onClick={() => deleteAddr(a.id, a.email)} className="opacity-70 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentEmail && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-mono text-base flex items-center gap-2">
                {currentEmail}
                <Button size="icon" variant="ghost" onClick={() => copy(currentEmail)}><Copy className="h-4 w-4" /></Button>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
            </div>
            <Button variant="outline" onClick={() => fetchMail(currentEmail)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {messages.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">No messages yet. Send mail to {currentEmail} and click Refresh.</p>
            )}
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
                <iframe srcDoc={selected.html} className="w-full min-h-[400px] border rounded bg-white" sandbox="" />
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
