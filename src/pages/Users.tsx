
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
  Users as UsersIcon, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { User, Timestamp } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { getUsers } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

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

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.phoneNumber?.includes(searchQuery))
  );

  const formatDate = (date: Timestamp) => {
    return formatDistanceToNow(timestampToDate(date), { addSuffix: true });
  };

  const hasUsers = users.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Users</h1>
        <p className="text-muted-foreground">
          Manage your customer accounts and view their activity.
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasUsers ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState 
              icon={<UsersIcon className="h-8 w-8 text-muted-foreground" />}
              title="No users"
              description="There are no users in the system yet."
              action={{
                label: "Refresh",
                onClick: () => fetchUsers()
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or phone..."
              className="pl-10 w-full max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>
                  {filteredUsers.length === 0 
                    ? "No users match your search." 
                    : `Showing ${filteredUsers.length} of ${users.length} users.`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-center">Favorites</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{user.displayName || 'Anonymous User'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.phoneNumber ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No phone</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.addresses && user.addresses.length > 0 ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-1 shrink-0" />
                            <div className="text-sm">
                              <div>{user.addresses[0].addressLine1}</div>
                              {user.addresses[0].addressLine2 && (
                                <div>{user.addresses[0].addressLine2}</div>
                              )}
                              <div>
                                {user.addresses[0].city}, {user.addresses[0].state} {user.addresses[0].postalCode}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No address</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.favorites.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>{user.favorites.length}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </div>
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
    </div>
  );
};

export default Users;
