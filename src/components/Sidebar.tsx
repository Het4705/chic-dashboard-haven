
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Package, 
  List, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  PlayIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/collections', label: 'Collections', icon: List },
    { href: '/reels', label: 'Reels', icon: PlayIcon },
    

  ];

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            The Label H
          </h2>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <nav className="flex-1 pt-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={cn(
                  "flex items-center group py-2 px-3 rounded-md transition-all duration-200 hover:bg-accent",
                  isActive(link.href) && "bg-accent text-accent-foreground"
                )}
              >
                <link.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                {!collapsed && <span>{link.label}</span>}
                
                {isActive(link.href) && !collapsed && (
                  <div className="ml-auto w-1.5 h-6 bg-primary rounded-full" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className={cn(
        "border-t border-border p-4",
        collapsed ? "flex flex-col items-center gap-2" : "space-y-2"
      )}>
        <Button 
          variant="ghost" 
          size={collapsed ? "icon" : "default"}
          onClick={() => signOut()}
          className="w-full justify-start"
        >
          <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
          {!collapsed && <span>Logout</span>}
        </Button>
        
        <div className={cn(
          "flex items-center", 
          collapsed ? "flex-col pt-2" : "justify-between"
        )}>
          <ThemeToggle />
          {!collapsed && <span className="text-sm text-muted-foreground">v1.0.0</span>}
        </div>
      </div>
    </aside>
  );
};
