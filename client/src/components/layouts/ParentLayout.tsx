import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  UserPlus, 
  LogOut,
  Menu
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ParentLayoutProps {
  children: ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    logout();
    setLocation('/');
  };
  
  if (!user) return null;
  
  const navItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
      path: '/parent/dashboard',
      active: location === '/parent/dashboard'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Children Accounts',
      path: '/parent/children',
      active: location === '/parent/children'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Message Reviews',
      path: '/parent/message-reviews',
      active: location === '/parent/message-reviews'
    },
    {
      icon: <UserPlus className="h-5 w-5" />,
      label: 'Friend Requests',
      path: '/parent/friend-requests',
      active: location === '/parent/friend-requests'
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm py-3 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="py-4 border-b">
                  <h2 className="text-xl font-bold text-primary px-1">KidChat Parent</h2>
                </div>
                <nav className="flex-1 py-4">
                  <ul className="space-y-2 px-1">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <Button
                          variant={item.active ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setLocation(item.path)}
                        >
                          {item.icon}
                          <span className="ml-2">{item.label}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="border-t py-4 px-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-primary ml-2 md:ml-0">KidChat Parent</h1>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback style={{ backgroundColor: user.avatarColor || '#3b82f6' }}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden md:inline">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
            <LogOut className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>
      
      {/* Main content with sidebar (for desktop) */}
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-64 bg-white border-r">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setLocation(item.path)}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
