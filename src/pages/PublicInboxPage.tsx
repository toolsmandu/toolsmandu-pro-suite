import { useState } from "react";
import { DisposableInboxView } from "@/components/disposable-inbox/DisposableInboxView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const PASSCODE = "556699";

const PublicInboxPage = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");

  const handleUnlock = () => {
    if (passcode.trim() === PASSCODE) {
      setUnlocked(true);
    } else {
      toast.error("Invalid passcode");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {!unlocked ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Enter Passcode to View Inbox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Passcode</Label>
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                placeholder="Enter passcode"
                autoFocus
              />
            </div>
            <Button onClick={handleUnlock} className="w-full">Unlock</Button>
          </CardContent>
        </Card>
      ) : (
        <DisposableInboxView mode="public" persist={false} simpleMode={true} />
      )}
    </div>
  );
};

export default PublicInboxPage;
