import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileSpreadsheet, Trash2, Loader2, Pencil, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Sheet = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  created_at: string;
  link_count?: number;
};

type AdminSheetsProps = {
  kind?: "family" | "simple";
  title?: string;
  description?: string;
  newButtonLabel?: string;
  dialogTitle?: string;
  basePath?: string;
};

const AdminSheets = ({
  kind = "family",
  title = "Family Sheets",
  description = "Create and manage your family sheets.",
  newButtonLabel = "Add New Family Sheet",
  dialogTitle = "Add New Family Sheet",
  basePath = "/admin/family-sheets",
}: AdminSheetsProps = {}) => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Sheet | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Sheet | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sheets")
      .select("id, name, slug, image_url, created_at, kind")
      .eq("kind", kind)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load sheets", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const list = data || [];
    const ids = list.map((s) => s.id);
    const counts: Record<string, number> = {};
    if (ids.length) {
      const { data: links } = await supabase
        .from("sheet_variant_links")
        .select("sheet_id")
        .in("sheet_id", ids);
      (links || []).forEach((l: { sheet_id: string }) => {
        counts[l.sheet_id] = (counts[l.sheet_id] || 0) + 1;
      });
    }
    setSheets(list.map((s) => ({ ...s, link_count: counts[s.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("sheet-images").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("sheet-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      if (editing) setEditing({ ...editing, image_url: url });
      else setImageUrl(url);
    }
    e.target.value = "";
  };

  const resetCreate = () => {
    setName("");
    setImageUrl(null);
  };

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
      .insert({ name: trimmed, data: [], image_url: imageUrl, kind, created_by: userRes.user?.id })
      .select("id, name, slug, image_url, created_at")
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
      return;
    }
    setSheets([data, ...sheets]);
    resetCreate();
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-sidebar-sheets"] });
    toast({ title: "Sheet created", description: trimmed });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const trimmed = editing.name.trim();
    if (!trimmed) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("sheets")
      .update({ name: trimmed, image_url: editing.image_url })
      .eq("id", editing.id)
      .select("id, name, slug, image_url, created_at")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    setSheets(sheets.map((s) => (s.id === data.id ? data : s)));
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["admin-sidebar-sheets"] });
    toast({ title: "Sheet updated" });
  };

  const handleDelete = async (id: string) => {
    const prev = sheets;
    setSheets(sheets.filter((s) => s.id !== id));
    const { error } = await supabase.from("sheets").delete().eq("id", id);
    if (error) {
      setSheets(prev);
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-sidebar-sheets"] });
    }
  };

  const currentImage = editing ? editing.image_url : imageUrl;

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetCreate(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {newButtonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Sheet name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Image (optional)</Label>
                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <div className="relative">
                      <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {imageUrl ? "Change" : "Upload"}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || uploading}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sheet</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  {currentImage ? (
                    <div className="relative">
                      <img src={currentImage} alt="" className="h-16 w-16 rounded object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, image_url: null })}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {currentImage ? "Change" : "Upload"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving || uploading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-background flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : sheets.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-background">
          No sheets yet. Click "{newButtonLabel}" to create one.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-background overflow-hidden">
          <div className="grid grid-cols-[1fr_180px_220px] gap-4 px-4 py-2 bg-muted/40 border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div>Product Name</div>
            <div>Link Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border">
            {sheets.map((sheet) => {
              const count = sheet.link_count || 0;
              const linkLabel = count === 0
                ? "No Link"
                : `${count} Variation${count > 1 ? "s" : ""} Linked`;
              return (
                <div
                  key={sheet.id}
                  className="grid grid-cols-[1fr_180px_220px] items-center gap-4 px-4 py-3 hover:bg-accent/40 transition-colors"
                >
                  <Link
                    to={`${basePath}/${sheet.slug || sheet.id}`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    {sheet.image_url ? (
                      <img
                        src={sheet.image_url}
                        alt={sheet.name}
                        className="h-10 w-10 rounded object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {sheet.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(sheet.created_at).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                  <div className={`text-sm ${count === 0 ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {linkLabel}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`${basePath}/${sheet.slug || sheet.id}`}>
                        Open Sheet
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(sheet)}
                      aria-label="Edit sheet"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(sheet)}
                      aria-label="Delete sheet"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) {
                  await handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSheets;
