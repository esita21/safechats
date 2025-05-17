import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Home, MessageCircle, User, LogOut } from 'lucide-react';

interface ChildLayoutProps {
  children: ReactNode;
}

export default function ChildLayout({ children }: ChildLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    logout();
    setLocation('/');
  };
  
  if (!user) return null;
  
  const navItems = [
    {
      icon: <Home className="h-6 w-6" />,
      label: 'Home',
      path: '/child/dashboard',
      active: location === '/child/dashboard'
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: 'Chat',
      path: '/child/chat',
      active: location === '/child/chat'
    },
    {
      icon: <User className="h-6 w-6" />,
      label: 'Profile',
      path: '/child/profile',
      active: location === '/child/profile'
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">KidChat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback style={{ backgroundColor: user.avatarColor }}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Bottom navigation (mobile-first approach) */}
      <nav className="bg-white border-t fixed bottom-0 left-0 right-0 py-2 md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={`flex flex-col items-center p-2 ${item.active ? 'text-primary' : 'text-gray-500'}`}
              onClick={() => setLocation(item.path)}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
      
      {/* Side navigation (desktop) */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-16 bg-white border-r pt-16">
        <div className="flex flex-col items-center gap-6">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="icon"
              className={`rounded-full p-2 ${item.active ? 'bg-primary text-white' : 'text-gray-500'}`}
              onClick={() => setLocation(item.path)}
              title={item.label}
            >
              {item.icon}
            </Button>
          ))}
        </div>
      </nav>
      
      {/* Add padding for mobile bottom navigation */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}
