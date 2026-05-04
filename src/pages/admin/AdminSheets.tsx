import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileSpreadsheet, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Sheet = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
};

const AdminSheets = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sheets")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load sheets", description: error.message, variant: "destructive" });
    } else {
      setSheets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("sheets")
      .insert({ name: trimmed, data: [], created_by: userRes.user?.id })
      .select("id, name, slug, created_at")
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
      return;
    }
    setSheets([data, ...sheets]);
    setName("");
    setOpen(false);
    toast({ title: "Sheet created", description: trimmed });
  };

  const handleDelete = async (id: string) => {
    const prev = sheets;
    setSheets(sheets.filter((s) => s.id !== id));
    const { error } = await supabase.from("sheets").delete().eq("id", id);
    if (error) {
      setSheets(prev);
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sheets</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your sheets.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Sheet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sheet</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                placeholder="Sheet name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-background flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : sheets.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-background">
          No sheets yet. Click "New Sheet" to create one.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-background divide-y divide-border">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-accent/40 transition-colors"
            >
              <Link
                to={`/admin/sheets/${sheet.slug || sheet.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {sheet.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(sheet.created_at).toLocaleString()}
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(sheet.id)}
                aria-label="Delete sheet"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSheets;
