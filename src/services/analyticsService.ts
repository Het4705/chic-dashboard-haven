
import { 
  db, 
  ordersCollection, 
  productsCollection, 
  usersCollection,
  getCollection,
  where,
  orderBy,
  limit,
  Timestamp 
} from '@/lib/firebase';
import { AnalyticsData, OrderStatus, Order, Product } from '@/types';

// Helper function to get month name
const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'short' });
};

// Helper to calculate total revenue from orders
const calculateTotalRevenue = (orders: Order[]): number => {
  return orders.reduce((total, order) => total + (order.total || 0), 0);
};

// Helper function to safely convert Firebase Timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  
  return new Date();
};

export const getDashboardData = async (): Promise<AnalyticsData> => {
  // Get all orders
  const orders = await getCollection(ordersCollection) as Order[];
  
  // Get users count
  const users = await getCollection(usersCollection);
  
  // Get top products
  const topProducts = await getCollection(
    productsCollection, 
    [orderBy('reviewCount', 'desc'), limit(5)]
  ) as Product[];
  
  // Calculate revenue by month for the last 7 months
  const today = new Date();
  const sevenMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  
  // Filter orders for last 7 months
  const recentOrders = orders.filter(order => {
    const orderDate = timestampToDate(order.createdAt);
    return orderDate >= sevenMonthsAgo;
  });
  
  // Group by month and calculate revenue
  const revenueByMonth: { month: string; revenue: number }[] = [];
  const monthsData: { [key: string]: number } = {};
  
  recentOrders.forEach(order => {
    const orderDate = timestampToDate(order.createdAt);
    const monthName = getMonthName(orderDate);
    
    if (!monthsData[monthName]) {
      monthsData[monthName] = 0;
    }
    
    monthsData[monthName] += order.total || 0;
  });
  
  // Get last 7 months in order
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(getMonthName(d));
  }
  
  // Format revenue data in order
  months.forEach(month => {
    revenueByMonth.push({
      month,
      revenue: Math.round(monthsData[month] || 0)
    });
  });
  
  // Count orders by status
  const orderStatusCounts = Object.values(OrderStatus).map(status => {
    const count = orders.filter(order => order.status === status).length;
    return { status, count };
  });
  
  // Calculate pending orders
  const pendingOrders = orders.filter(
    order => order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING
  ).length;
  
  return {
    totalSales: orders.length,
    activeUsers: users.length,
    totalRevenue: Math.round(calculateTotalRevenue(orders)),
    pendingOrders,
    topProducts: topProducts.map(product => ({
      name: product.name,
      sales: product.reviewCount || 0  // Using reviewCount as a proxy for sales
    })),
    revenueByMonth,
    orderStatusCounts
  };
};
