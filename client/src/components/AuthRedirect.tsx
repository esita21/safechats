import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

export default function AuthRedirect() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      // If not logged in, redirect to login page
      if (window.location.pathname !== '/') {
        setLocation('/');
      }
    } else {
      // If logged in as parent
      if (user.isParent) {
        if (window.location.pathname === '/') {
          setLocation('/parent/dashboard');
        }
      } 
      // If logged in as child
      else {
        if (window.location.pathname === '/') {
          setLocation('/child/dashboard');
        }
      }
    }
  }, [user, loading, setLocation]);

  return null;
}