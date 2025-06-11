
import { 
  usersCollection, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument, 
  getCollection,
  where,
  orderBy,
  limit
} from '@/lib/firebase';
import { User, Address } from '@/types';

export const getUsers = async (constraints = []) => {
  return await getCollection(usersCollection, constraints);
};

export const getUser = async (id: string) => {
  return await getDocument('users', id) as User | null;
};

export const getUserByEmail = async (email: string) => {
  const users = await getCollection(usersCollection, [where('email', '==', email), limit(1)]);
  return users.length > 0 ? users[0] as User : null;
};

export const createUser = async (userData: Omit<User, 'id'>) => {
  return await createDocument(usersCollection, userData);
};

export const updateUser = async (id: string, userData: Partial<User>) => {
  return await updateDocument('users', id, userData);
};

export const deleteUser = async (id: string) => {
  return await deleteDocument('users', id);
};

export const addAddressToUser = async (userId: string, address: Omit<Address, 'id' | 'userId'>) => {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');
  
  const addresses = user.addresses || [];
  
  if (address.isDefault) {
    // If new address is default, remove default from other addresses
    addresses.forEach((addr: Address) => {
      addr.isDefault = false;
    });
  }
  
  addresses.push({
    ...address,
    id: Date.now().toString(), // Simple ID generation
    userId
  });
  
  return await updateDocument('users', userId, { addresses });
};

export const toggleFavorite = async (userId: string, productId: string) => {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');
  
  const favorites = user.favorites || [];
  const index = favorites.indexOf(productId);
  
  if (index === -1) {
    favorites.push(productId);
  } else {
    favorites.splice(index, 1);
  }
  
  return await updateDocument('users', userId, { favorites });
};
