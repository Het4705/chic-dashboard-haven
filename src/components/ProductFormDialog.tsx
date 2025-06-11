import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createProduct, updateProduct } from '@/services/productService';
import { getCollections } from '@/services/collectionService';
import { uploadFileToCloudinary } from '@/lib/firebase';
import { Product, Collection, Gender, SizeOption } from '@/types';
import { cn } from '@/lib/utils';

type ProductFormData = Omit<
  Product,
  "id" | "rating" | "reviewCount" | "reviews"
>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  product?: Product;
}

export function ProductFormDialog({ open, onOpenChange, onSuccess, product }: ProductFormDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [editImage,setEditImage] = useState(false);
  const [discountDate, setDiscountDate] = useState<Date | undefined>(
    product?.discount?.validDate ? new Date((product.discount.validDate as any).seconds * 1000) : undefined
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const { toast } = useToast();
  
  const isEditMode = !!product;
  
  const [sizes, setSizes] = useState<SizeOption[]>(() => {
    if (product?.size && product.size.length > 0) return product.size;
    return [{ length: '', available: false }];
  });
  
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name || '',
      price: product?.price || 0,
      images: product?.images || [],
      featuredProduct: product?.featuredProduct || false,
      videoUrl: product?.videoUrl || '',
      category: product?.category || '',
      description: product?.description || '',
      material: product?.material || '',
      stock: product?.stock || 0,
      size: product?.size || sizes,
      collectionId: product?.collectionId || '',
      gender: product?.gender || Gender.UNISEX,
      discount: product?.discount ? {
        offerPercentage: product.discount.offerPercentage,
        validDate: product.discount.validDate
      } : null
    }
  });
  
  useEffect(() => {
    // Fetch collections when the dialog opens
    if (open) {
      fetchCollections();
    }
  }, [open]);
  
  const fetchCollections = async () => {
    try {
      const collectionsData = await getCollections();
      setCollections(collectionsData as Collection[]);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    }
  };
  
  // size handlling
  const handleSizeChange = (index: number, field: 'length' | 'available', value: string | boolean) => {
    setSizes((prev) =>
      prev.map((size, i) =>
        i === index ? { ...size, [field]: value } : size
      )
    );
  };

  const addSizeField = () => {
    setSizes((prev) => [...prev, { length: '', available: false }]);
  };

  const removeSizeField = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const isDirty = form.formState.isDirty || selectedImages.length > 0;
  
  const handleDialogChange = (open: boolean) => {
    if (!open && isDirty && !pendingClose) {
      setShowWarningDialog(true);
      return;
    }

    onOpenChange(open);

    if (!open) {
      setPendingClose(false);
    }
  };

  const confirmClose = () => {
    setShowWarningDialog(false);
    setPendingClose(true);
    onOpenChange(false);
    setIsUploading(false); 
    form.reset();
    setSelectedImages([]);
    setImageUrls(product?.images || []);
    setDiscountDate(undefined);
  };

  const cancelClose = () => {
    setShowWarningDialog(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imageUrls.length + files.length > 5) {
      toast({
        title: "Maximum 5 images allowed",
        description: "Please select fewer images",
        variant: "destructive",
      });
      return;
    }

    setSelectedImages((prev) => [...prev, ...files]);

    const newImageUrls = files.map((file) => URL.createObjectURL(file));
    setImageUrls((prev) => [...prev, ...newImageUrls]);
  };

  const removeImage = (index: number) => {
    // If it's a newly added image (from selectedImages)
    if (index >= (product?.images?.length || 0)) {
      const adjustedIndex = index - (product?.images?.length || 0);
      const newSelectedImages = [...selectedImages];
      newSelectedImages.splice(adjustedIndex, 1);
      setSelectedImages(newSelectedImages);
      
      const newImageUrls = [...imageUrls];
      URL.revokeObjectURL(newImageUrls[index]);
      newImageUrls.splice(index, 1);
      setImageUrls(newImageUrls);
    } else {
      // It's an existing image
      const newImageUrls = [...imageUrls];
      newImageUrls.splice(index, 1);
      setImageUrls(newImageUrls);
      
      if (isEditMode) {
        form.setValue('images', newImageUrls);
      }
    }
  };
  
  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsUploading(true);
      // Upload new images (those that are File objects)
      const uploadPromises = selectedImages.map((file) =>
        uploadFileToCloudinary(file)
      );
      const uploadedImageUrls = await Promise.all(uploadPromises);

      // Keep only real URLs (not local blob previews) in imageUrls
      const existingImageUrls = imageUrls.filter(url => !url.startsWith('blob:'));

      // Combine existing (kept) and newly uploaded image URLs
      const allImageUrls = [
        ...existingImageUrls,
        ...uploadedImageUrls
      ];

      // Process discount data
      let discountData = null;
      if (data.discount?.offerPercentage && discountDate) {
        discountData = {
          offerPercentage: parseFloat(data.discount.offerPercentage.toString()),
          validDate: discountDate,
        };
      }

      const productData = {
        ...data,
        images: allImageUrls,
        discount: discountData, // will be null if not provided
        size: sizes,
      };

      if (isEditMode && product?.id) {
        await updateProduct(product.id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await createProduct(productData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      form.reset();
      setSelectedImages([]);
      setImageUrls([]);
      setSizes([]);
      setDiscountDate(undefined);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update product" : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  useEffect(() => {
    // Reset the form when the product changes
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        images: product.images,
        featuredProduct: product.featuredProduct,
        videoUrl: product.videoUrl,
        category: product.category,
        description: product.description,
        material: product.material,
        stock: product.stock,
        size: product.size,
        collectionId: product.collectionId,
        gender: product.gender || Gender.UNISEX,
        discount: product.discount
      });

      setImageUrls(product.images || []);
      setDiscountDate(
        product.discount?.validDate 
          ? new Date((product.discount.validDate as any).seconds * 1000) 
          : undefined
      );
      // Ensure sizes state is set to product.size or default
      setSizes(
        Array.isArray(product.size) && product.size.length > 0
          ? product.size
          : [{ length: '', available: false }]
      );
    }
  }, [product, form]);
  
  useEffect(() => {
    // Reset the form to empty when switching to Add Product mode
    if (!product && open) {
      form.reset({
        name: '',
        price: 0,
        images: [],
        featuredProduct: false,
        videoUrl: '',
        category: '',
        description: '',
        material: '',
        stock: 0,
        size: [{ length: '', available: false }],
        collectionId: '',
        gender: Gender.UNISEX,
        discount: undefined,
      });
      setImageUrls([]);
      setSelectedImages([]);
      setSizes([{ length: '', available: false }]);
      setDiscountDate(undefined);
    }
  }, [product, open, form]);

  useEffect(() => {
    return () => {
      // Cleanup object URLs
      selectedImages.forEach((_, index) => {
        const startIndex = (product?.images?.length || 0);
        if (imageUrls[startIndex + index]) {
          URL.revokeObjectURL(imageUrls[startIndex + index]);
        }
      });
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto hide-scrollbar-container"
          onInteractOutside={(e) => {
            if (isDirty || isUploading) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Collection Selector */}
              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Gender/Sex Field */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                        <SelectItem value={Gender.UNISEX}>Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Discount Section */}
              <div className="p-4 border rounded-md space-y-4">
                <div className="font-medium">Discount (Optional)</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discount.offerPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. 10" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !discountDate && "text-muted-foreground"
                            )}
                          >
                            {discountDate ? (
                              format(discountDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={discountDate}
                          onSelect={setDiscountDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select when the discount expires
                    </FormDescription>
                  </FormItem>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="Material" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              
      {/* Size Fields */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Size Options</label>
        {sizes.map((size, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Length"
              value={size.length}
              onChange={(e) => handleSizeChange(index, 'length', e.target.value)}
              className="border p-1 rounded w-2/3"
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={size.available}
                onChange={(e) => handleSizeChange(index, 'available', e.target.checked)}
              />
              Available
            </label>
            <button
              type="button"
              onClick={() => removeSizeField(index)}
              className="text-red-600 font-bold"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addSizeField} className="text-blue-600 underline mt-1">
          + Add Size
        </button>
      </div>

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/video.mp4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featuredProduct"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Featured Product
                      </FormLabel>
                      <FormDescription>
                        Display this product in featured sections
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div>
                <Label htmlFor="images">Product Images (Max 5)</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {imageUrls.length < 5 && (
                      <Label 
                        htmlFor="product-images" 
                        className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="mt-2 text-xs">Upload</span>
                        <Input
                          id="product-images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageSelect}
                          disabled={imageUrls.length >= 5 || isUploading}
                        />
                      </Label>
                    )}
                    
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative h-24 w-24">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="h-full w-full rounded-md object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {imageUrls.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please upload at least one product image
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || imageUrls.length === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    isEditMode ? 'Update Product' : 'Add Product'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave without
              saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}