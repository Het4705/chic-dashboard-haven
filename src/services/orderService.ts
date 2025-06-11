
import { 
  ordersCollection, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument, 
  getCollection,
  where,
  orderBy,
  limit
} from '@/lib/firebase';
import { Order, OrderStatus } from '@/types';

export const getOrders = async (constraints = []) => {
  return await getCollection(ordersCollection, constraints);
};

export const getOrder = async (id: string) => {
  return await getDocument('orders', id);
};

export const createOrder = async (orderData: Omit<Order, 'id'>) => {
  return await createDocument(ordersCollection, orderData);
};

export const updateOrder = async (id: string, orderData: Partial<Order>) => {
  return await updateDocument('orders', id, orderData);
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  return await updateDocument('orders', id, { status });
};

export const deleteOrder = async (id: string) => {
  return await deleteDocument('orders', id);
};

export const getOrdersByUser = async (userId: string) => {
  return await getCollection(ordersCollection, [where('userId', '==', userId)]);
};

export const getRecentOrders = async (limitCount: number = 10) => {
  return await getCollection(ordersCollection, [orderBy('createdAt', 'desc'), limit(limitCount)]);
};
