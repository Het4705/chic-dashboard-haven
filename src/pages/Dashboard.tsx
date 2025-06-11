
import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp,
  Clock,
  Loader2
} from 'lucide-react';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { SalesChart } from '@/components/charts/SalesChart';
import { UserChart } from '@/components/charts/UserChart';
import { ProductChart } from '@/components/charts/ProductChart';
import { StatCard } from '@/components/StatCard';
import { AnalyticsData } from '@/types';
import { getDashboardData } from '@/services/analyticsService';
import { useToast } from '@/hooks/use-toast';

// Transform the topProducts data to the format expected by SalesChart
const transformProductsData = (products: Array<{ name: string; sales: number }>) => {
  return products.map(product => ({
    name: product.name,
    total: product.sales,
  }));
};

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="h-full w-full flex items-center justify-center py-20">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to The Label H admin dashboard. Here's an overview of your business.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Sales" 
          value={analytics.totalSales}
          icon={<BarChart3 className="h-4 w-4" />}
          description="Total orders processed"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Active Users" 
          value={analytics.activeUsers}
          icon={<Users className="h-4 w-4" />}
          description="Unique users this month"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          description="Total earnings"
          trend={{ value: 14, isPositive: true }}
        />
        <StatCard 
          title="Pending Orders" 
          value={analytics.pendingOrders}
          icon={<Clock className="h-4 w-4" />}
          description="Orders awaiting processing"
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart data={analytics.revenueByMonth} />
        <SalesChart data={transformProductsData(analytics.topProducts)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UserChart />
        <ProductChart data={analytics.orderStatusCounts} />
      </div>
    </div>
  );
};

export default Dashboard;
