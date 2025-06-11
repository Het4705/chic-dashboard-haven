import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { uploadFileToCloudinary } from "@/lib/firebase";
import { getProducts } from "@/services/productService";
import { Product, Reel } from "@/types";
import { Switch } from "@/components/ui/switch";


interface AddReelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onAddReel: (reel: Omit<Reel, "id">) => Promise<void>;
}

export function AddReelDialog({
  open,
  onOpenChange,
  onSuccess,
  onAddReel,
}: AddReelDialogProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [featured, setFeatured] = useState(false); // Optional field for featured reels
  const { toast } = useToast();

  // Fetch products on open
  useEffect(() => {
    if (open) {
      getProducts().then((data) => setProducts(data as Product[]));
    }
  }, [open]);

  const handleAddReel = async () => {
    
    if (!video || !productId) {
      toast({
        title: "Error",
        description: "Please select a video and product.",
        variant: "destructive",
      });
      return;
    }
    if (video.size > 30 * 1024 * 1024) {
      toast({
        title: "Video too large",
        description: "Video must be less than 30MB.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) throw new Error("Product not found");

      const videoUrl = await uploadFileToCloudinary(video);
      let thumbnailUrl = "";
      if (thumbnail) {
        thumbnailUrl = await uploadFileToCloudinary(thumbnail);
      }

      const reel: Omit<Reel, "id"> = {
        src: videoUrl,
        thumbnail: thumbnailUrl,
        productId,
        title: product.name,
        description: product.description,
        price: product.price?.toString() ?? "",
        featured,
      };
      await onAddReel(reel);
      toast({ title: "Success", description: "Reel added successfully!" });
      onOpenChange(false);
      if (onSuccess) onSuccess();
      setVideo(null);
      setThumbnail(null);
      setProductId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reel.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Video (max 30MB)</label>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Thumbnail (optional)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Featured</label>
            <Switch  checked={featured} onCheckedChange={setFeatured} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Product</label>
            <select
              className="w-full border rounded p-2"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.id})
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleAddReel} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Add Reel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
