
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collection } from "@/types";
import { createCollection, updateCollection } from "@/services/collectionService";
import { uploadFileToCloudinary } from "@/lib/firebase";
import { Upload, X, Loader2 } from "lucide-react";

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection;
  onSuccess?: () => void;
}

const colorOptions = [
  { value: "from-purple-900/80", label: "Purple" },
  { value: "from-indigo-900/80", label: "Indigo" },
  { value: "from-amber-900/80", label: "Amber" },
  { value: "from-red-900/80", label: "Red" },
  { value: "from-blue-900/80", label: "Blue" },
  { value: "from-green-900/80", label: "Green" },
];

export function CollectionFormDialog({ 
  open, 
  onOpenChange, 
  collection, 
  onSuccess 
}: CollectionFormDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(collection?.image || null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const queryClient = useQueryClient();
  
  const form = useForm({
    defaultValues: {
      name: collection?.name || "",
      description: collection?.description || "",
      items: collection?.items?.toString() || "0",
      color: collection?.color || "from-purple-900/80"
    }
  });
  
  const isDirty = form.formState.isDirty || !!imageFile;
  
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Collection, 'id'>) => {
      return await createCollection(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      onSuccess?.();
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Collection> }) => {
      return await updateCollection(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      onSuccess?.();
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleClose = () => {
    if (isDirty || isUploading) {
      setShowExitConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setShowExitConfirm(false);
    onOpenChange(false);
  };

  const onSubmit = async (formData: any) => {
    try {
      setIsUploading(true);
      
      let imageUrl = collection?.image || "";
      
      // Upload image if a new file is selected
      if (imageFile) {
  
        imageUrl = await uploadFileToCloudinary(imageFile);
      }
      
      const collectionData = {
        name: formData.name,
        description: formData.description,
        items: 0,
        color: formData.color,
        image: imageUrl
      };
      
      if (collection) {
        // Update existing collection
        await updateMutation.mutateAsync({ 
          id: collection.id, 
          data: collectionData 
        });
      } else {
        // Create new collection
        await createMutation.mutateAsync(collectionData);
      }
      
    } catch (error) {
      console.error("Failed to save collection:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{collection ? "Edit Collection" : "Add New Collection"}</DialogTitle>
            <DialogDescription>
              {collection 
                ? "Update the details of this collection" 
                : "Fill in the details to create a new collection"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <FormLabel>Collection Image</FormLabel>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-2">Upload Image</p>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <p>Upload a high-quality image for the collection.</p>
                      <p>Recommended size: 800x600 pixels.</p>
                    </div>
                  </div>
                </div>
                
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Collection name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Traditional, Modern, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe this collection in a few sentences..." 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Items Count Field */}
                <FormField
                  control={form.control}
                  name="items"
                  rules={{ 
                    required: "Number of items is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Must be a number"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Items</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Color Selection */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overlay Color</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="flex flex-wrap gap-3"
                        >
                          {colorOptions.map((color) => (
                            <div key={color.value} className="flex items-center gap-2">
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem 
                                    value={color.value} 
                                    id={color.value}
                                  />
                                </FormControl>
                                <label
                                  htmlFor={color.value}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <div className={`w-6 h-6 rounded-full bg-gradient-to-t ${color.value} to-transparent`} />
                                  <span>{color.label}</span>
                                </label>
                              </FormItem>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                >
                  {(isUploading || createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {collection ? "Update Collection" : "Create Collection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you exit now, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
