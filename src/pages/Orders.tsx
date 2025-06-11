import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { 
  ShoppingBag, 
  Search, 
  Loader2, 
  Package, 
  Clock, 
  Check, 
  Truck, 
  XCircle
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Order, OrderStatus, PaymentStatus, Timestamp } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getOrders, updateOrderStatus, updateOrder } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DialogDescription } from '@radix-ui/react-dialog';

// Helper function to convert Firestore Timestamp to JavaScript Date
const timestampToDate = (timestamp: Timestamp): Date => {
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firestore Timestamp with toDate method
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's some other object with seconds and nanoseconds (Firestore Timestamp-like)
  if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
    return new Date((timestamp.seconds as number) * 1000);
  }
  
  // Fallback - just create a new date
  return new Date();
};

// Helper function to get status badge UI
const getOrderStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending</Badge>;
    case OrderStatus.PROCESSING:
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Processing</Badge>;
    case OrderStatus.SHIPPED:
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200">Shipped</Badge>;
    case OrderStatus.DELIVERED:
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Delivered</Badge>;
    case OrderStatus.CANCELLED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Cancelled</Badge>;
    case OrderStatus.RETURNED:
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Returned</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PENDING:
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending</Badge>;
    case PaymentStatus.PAID:
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Paid</Badge>;
    case PaymentStatus.FAILED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Failed</Badge>;
    case PaymentStatus.REFUNDED:
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    type: 'order' | 'payment';
    id: string;
    newStatus: OrderStatus | PaymentStatus;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrders();
      setOrders(ordersData as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      
      // Update the order in state
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: PaymentStatus) => {
    try {
      await updateOrder(id, { paymentStatus: newStatus });
      toast({
        title: "Success",
        description: `Payment status updated to ${newStatus}`,
      });
      setOrders(prev =>
        prev.map(order =>
          order.id === id ? { ...order, paymentStatus: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.shippingAddress.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (date: Timestamp) => {
    return format(timestampToDate(date), 'MMM dd, yyyy');
  };

  const getOrderIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-4 w-4 text-amber-500" />;
      case OrderStatus.PROCESSING:
        return <Package className="h-4 w-4 text-blue-500" />;
      case OrderStatus.SHIPPED:
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case OrderStatus.DELIVERED:
        return <Check className="h-4 w-4 text-green-500" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const hasOrders = orders.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders, check order status, and process shipments.
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasOrders ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState 
              icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
              title="No orders"
              description="There are no orders in the system yet."
              action={{
                label: "Refresh",
                onClick: () => fetchOrders()
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer name, or tracking number..."
              className="pl-10 w-full max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>
                  {filteredOrders.length === 0 
                    ? "No orders match your search." 
                    : `Showing ${filteredOrders.length} of ${orders.length} orders.`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getOrderIcon(order.status)}
                          {order.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.shippingAddress.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(order.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(timestampToDate(order.createdAt), 'h:mm a')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getOrderStatusBadge(order.status)}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2"
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                            setStatusDialogOpen(true);
                          }}
                        >
                          Change
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPaymentStatusBadge(order.paymentStatus)}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-2"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewPaymentStatus(order.paymentStatus);
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Change
                          </Button>
                          <div className="text-xs text-muted-foreground">{order.paymentMethod}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">${order.total.toFixed(2)}</div>
                        {order.trackingNumber && (
                          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Truck className="h-3 w-3" />
                            {order.trackingNumber}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 mt-2"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOrderDetailsDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Order Status</DialogTitle>
                <DialogDescription>
                  Update the status of order <strong>{selectedOrder?.id}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm font-medium">Current Status</label>
                  <div className="mt-1">
                    {selectedOrder && getOrderStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select
                    value={newStatus ?? selectedOrder?.status}
                    onValueChange={(value) => setNewStatus(value as OrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(OrderStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!newStatus || newStatus === selectedOrder?.status}
                  onClick={async () => {
                    if (selectedOrder && newStatus) {
                      await handleUpdateStatus(selectedOrder.id, newStatus);
                      setStatusDialogOpen(false);
                      setSelectedOrder(null);
                      setNewStatus(null);
                    }
                  }}
                >
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  Details for order <strong>{selectedOrder?.id}</strong>
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-2">
                  <div>
                    <strong>Customer:</strong> {selectedOrder.shippingAddress.name}
                  </div>
                  <div>
                    <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                  </div>
                  <div>
                    <strong>Status:</strong> {getOrderStatusBadge(selectedOrder.status)}
                  </div>
                  <div>
                    <strong>Payment:</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                  <div>
                    <strong>Total:</strong> ${selectedOrder.total.toFixed(2)}
                  <div>
                    <strong>Contact:</strong> {selectedOrder.shippingAddress.phoneNumber || 'N/A'}
                  </div>
                  </div>
                  <div>
                    <strong>Items:</strong>
                    <ul className="list-disc ml-5">
                      {selectedOrder.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.quantity} (${item.price.toFixed(2)} each)
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div>
                      <strong>Tracking Number:</strong> {selectedOrder.trackingNumber}
                    </div>
                  )}
                  <div>
                    <strong>Shipping Address:</strong>
                    <div className="text-sm text-muted-foreground">
                       {selectedOrder.shippingAddress.name}<br />
                       {selectedOrder.shippingAddress.addressLine1}<br />
                       {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                        <br />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOrderDetailsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Payment Status</DialogTitle>
                <DialogDescription>
                  Update the payment status of order <strong>{selectedOrder?.id}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm font-medium">Current Payment Status</label>
                  <div className="mt-1">
                    {selectedOrder && getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">New Payment Status</label>
                  <Select
                    value={newPaymentStatus ?? selectedOrder?.paymentStatus}
                    onValueChange={(value) => setNewPaymentStatus(value as PaymentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!newPaymentStatus || newPaymentStatus === selectedOrder?.paymentStatus}
                  onClick={() => {
                    if (selectedOrder && newPaymentStatus) {
                      setPendingChange({
                        type: 'payment',
                        id: selectedOrder.id,
                        newStatus: newPaymentStatus,
                      });
                      setPaymentDialogOpen(false);
                      setConfirmDialogOpen(true);
                    }
                  }}
                >
                  Update Payment Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  {pendingChange?.type === 'order'
                    ? `Do you really want to change the order status to "${pendingChange?.newStatus}"?`
                    : `Do you really want to change the payment status to "${pendingChange?.newStatus}"?`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (pendingChange) {
                      if (pendingChange.type === 'order') {
                        await handleUpdateStatus(pendingChange.id, pendingChange.newStatus as OrderStatus);
                      } else if (pendingChange.type === 'payment') {
                        await handleUpdatePaymentStatus(pendingChange.id, pendingChange.newStatus as PaymentStatus);
                      }
                      setConfirmDialogOpen(false);
                      setPendingChange(null);
                      setSelectedOrder(null);
                      setNewStatus(null);
                      setNewPaymentStatus(null);
                    }
                  }}
                >
                  Yes, Change
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Orders;
