import { marked } from "marked";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getCollections, deleteCollection } from "@/services/collectionService";
import { Collection } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { CollectionFormDialog } from "@/components/CollectionFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Collections = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const queryClient = useQueryClient();

  const { data: collections = [], isLoading, isError } = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollections(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteCollection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast({
        title: "Success",
        description: "Collection deleted successfully.",
      });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading collections...</div>;
  }

  if (isError) {
    return <div className="flex items-center justify-center h-96 text-red-500">Error loading collections</div>;
  }

  const handleEdit = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedCollection(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast({
      title: "Success",
      description: `Collection ${selectedCollection ? "updated" : "created"} successfully.`,
    });
    handleCloseDialog();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-bold">Collections</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Collection
        </Button>
      </div>

      {collections && Array.isArray(collections) && collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground mb-4">No collections found</p>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections && Array.isArray(collections) && collections.map((collection: Collection) => (
            <Card key={collection.id} className="overflow-hidden">
              <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${collection.image})` }}>
                <div className={`absolute inset-0 bg-gradient-to-t ${collection.color} to-transparent`} />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="text-xl font-semibold">{collection.name}</h3>
                  <p className="text-sm opacity-90">{collection.items} products</p>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: marked(collection.description) }}></p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEdit(collection)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{collection.name}" collection and remove the image from storage.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(collection.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isAddDialogOpen && (
        <CollectionFormDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleSuccess}
        />
      )}

      {isEditDialogOpen && selectedCollection && (
        <CollectionFormDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          collection={selectedCollection}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Collections;
