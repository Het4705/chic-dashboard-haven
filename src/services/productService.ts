
import { 
  productsCollection, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument, 
  getCollection as getFirestoreCollection,
  where,
  orderBy,
  limit,
  deleteFileFromCloudinary
} from '@/lib/firebase';
import { Collection, Product, Gender } from '@/types';
import { updateCollection, getCollectionById } from './collectionService';

export const getProducts = async (constraints = []) => {
  return await getFirestoreCollection(productsCollection, constraints);
};

export const getProduct = async (id: string) => {
  return await getDocument('products', id);
};

export const createProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => {
  try {
    const productWithDefaults = {
      ...productData,
      rating: 0,
      reviewCount: 0
    };
    
    const productRef = await createDocument(productsCollection, productWithDefaults);
    
    if (productData.collectionId) {
      const collection = await getCollectionById(productData.collectionId) as Collection | null;
      if (collection) {
        await updateCollection(productData.collectionId, { 
          items: (collection.items || 0) + 1 
        });
      }
    }
    
    return productRef;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  try {
    const existingProduct = await getProduct(id) as Product;
    const oldCollectionId = existingProduct?.collectionId;
    const newCollectionId = productData.collectionId;
    
    // If collection has changed
    if (newCollectionId !== oldCollectionId) {
      // If there was a previous collection, decrement its item count
      if (oldCollectionId) {
        const oldCollection = await getCollectionById(oldCollectionId) as Collection | null;
        if (oldCollection && oldCollection.items > 0) {
          await updateCollection(oldCollectionId, { 
            items: oldCollection.items - 1 
          });
        }
      }
      
      // If there's a new collection, increment its item count
      if (newCollectionId) {
        const newCollection = await getCollectionById(newCollectionId) as Collection | null;
        if (newCollection) {
          await updateCollection(newCollectionId, { 
            items: (newCollection.items || 0) + 1 
          });
        }
      }
    }
    
    return await updateDocument('products', id, productData);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  const product = await getProduct(id) as Product | null;
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  await deleteDocument('products', id);
  
  if (product.collectionId) {
    try {
      const collection = await getCollectionById(product.collectionId) as Collection | null;
      if (collection && collection.items > 0) {
        await updateCollection(product.collectionId, { 
          items: collection.items - 1 
        });
      }
    } catch (error) {
      console.error('Failed to update collection count after product deletion:', error);
    }
  }
  
  if (product && product.images && product.images.length > 0) {
    try {
      const deletePromises = product.images.map(imageUrl => 
        deleteFileFromCloudinary(imageUrl)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to delete images after document deletion:', error);
    }
  }
};

export const getProductsByCategory = async (category: string) => {
  return await getFirestoreCollection(productsCollection, [where('category', '==', category)]);
};

export const getTopProducts = async (limitCount = 5) => {
  return await getFirestoreCollection(productsCollection, [orderBy('reviewCount', 'desc'), limit(limitCount)]);
};

export const getFeaturedProducts = async () => {
  return await getFirestoreCollection(productsCollection, [where('featuredProduct', '==', true)]);
};
