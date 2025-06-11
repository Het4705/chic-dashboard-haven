import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Loader2,
  ShoppingBag
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Product } from '@/types';
import { getProducts, deleteProduct } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { ProductFormDialog } from '@/components/ProductFormDialog';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      setProducts(productsData as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddProductDialog = () => {
    setSelectedProduct(undefined);
    setIsDialogOpen(true);
  };

  const openEditProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const confirmDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      // Remove product from state
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productToDelete));
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory, prices, and stock levels.
          </p>
        </div>
        <Button className="shrink-0" onClick={openAddProductDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasProducts ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Package className="h-8 w-8 text-muted-foreground" />}
              title="No products"
              description="You haven't added any products yet. Start by creating your first product."
              action={{
                label: "Add Product",
                onClick: openAddProductDialog
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 w-full max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>
                  {filteredProducts.length === 0
                    ? "No products match your search."
                    : `Showing ${filteredProducts.length} of ${products.length} products.`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Id</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-secondary">
                          <img 
                            src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg'} 
                            alt={product.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="text-sm text-muted-foreground">
                          {product.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          {product.featuredProduct && (
                            <span className="text-xs font-semibold text-white bg-amber-500 px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                          {product.discount && (
                            <span className="text-xs font-semibold text-white bg-primary px-1.5 py-0.5 rounded">
                              {product.discount.offerPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>${product.price.toFixed(2)}</span>
                          {product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviewCount})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`${
                            product.stock < 20
                              ? "text-destructive"
                              : product.stock > 40
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => openEditProductDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => confirmDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <ProductFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
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

export default Products;
