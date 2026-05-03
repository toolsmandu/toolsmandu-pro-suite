import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileSpreadsheet, Trash2 } from "lucide-react";
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

type Sheet = {
  id: string;
  name: string;
  createdAt: string;
};

const STORAGE_KEY = "admin_sheets_list";

const loadSheets = (): Sheet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const AdminSheets = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setSheets(loadSheets());
  }, []);

  const persist = (next: Sheet[]) => {
    setSheets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const newSheet: Sheet = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    persist([newSheet, ...sheets]);
    setName("");
    setOpen(false);
    toast({ title: "Sheet created", description: trimmed });
  };

  const handleDelete = (id: string) => {
    persist(sheets.filter((s) => s.id !== id));
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
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sheets.length === 0 ? (
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
                to={`/admin/sheets/${sheet.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {sheet.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(sheet.createdAt).toLocaleString()}
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
