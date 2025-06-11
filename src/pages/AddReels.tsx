import  { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddReelDialog } from "@/components/AddReelDialog";
import { createReel, getReels } from "@/services/reelService";
import { Reel } from "@/types";

const AddReels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchReels = async () => {
    const data = await getReels();
    setReels(data as Reel[]);
  };

  const handleAddReel = async (reel: Omit<Reel, "id">) => {
    await createReel(reel);
    fetchReels();
  };

  useEffect(() => {
    fetchReels();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Reels</h1>
        <Button onClick={() => setDialogOpen(true)}>Add Reel</Button>
      </div>
      <Card>
        <CardContent>
          {reels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No reels yet.</div>
          ) : (
            <ul className="space-y-4">
              {reels.map(reel => (
                <li key={reel.id} className="flex my-2  gap-4">
                  <video src={reel.src} poster={reel.thumbnail} controls className="h-24 w-24 object-cover rounded" />
                  <div>
                    <div className="font-medium">{reel.title}</div>
                    <div className="text-sm text-muted-foreground">{reel.description}</div>
                    <div className="text-sm">Product ID: {reel.productId}</div>
                    {reel.price && <div className="text-sm">Price: RS:{reel.price}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <AddReelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchReels}
        onAddReel={handleAddReel}
      />
    </div>
  );
};

export default AddReels;