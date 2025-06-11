
import { 
  collectionsCollection, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument, 
  getCollection,
  deleteFileFromCloudinary
} from '@/lib/firebase';
import { Collection } from '@/types';

export const getCollections = async (constraints = []) => {
  return await getCollection(collectionsCollection, constraints);
};

export const getCollectionById = async (id: string) => {
  return await getDocument('collections', id);
};

export const createCollection = async (collectionData: Omit<Collection, 'id'>) => {
  try {
    return await createDocument(collectionsCollection, collectionData);
  } catch (error) {
    // If there's an error creating the document, clean up any uploaded image
    if (collectionData.image) {
      try {
        await deleteFileFromCloudinary(collectionData.image);
      } catch (cleanupError) {
        console.error('Failed to clean up image after document creation error:', cleanupError);
      }
    }
    throw error;
  }
};

export const updateCollection = async (id: string, collectionData: Partial<Collection>) => {
  return await updateDocument('collections', id, collectionData);
};

export const deleteCollection = async (id: string) => {
  // First get the collection to get its image URL
  const collection = await getCollectionById(id) as Collection | null;
  
  if (!collection) {
    throw new Error('Collection not found');
  }
  
  // Then delete the document
  await deleteDocument('collections', id);
  
  // After successfully deleting from Firestore, delete the image from Cloudinary
  if (collection && collection.image) {
    try {
      await deleteFileFromCloudinary(collection.image);
    } catch (error) {
      console.error('Failed to delete image after document deletion:', error);
    }
  }
};
