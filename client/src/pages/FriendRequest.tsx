import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, UserPlus, XCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function FriendRequest() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      // Store token in session storage so we can process it after login
      if (token) {
        sessionStorage.setItem('pendingFriendRequestToken', token);
      }
      setLocation('/login');
    }
  }, [user, token, setLocation]);
  
  // Fetch friend request data
  const { data: requestData, isLoading, error } = useQuery({
    queryKey: ['/api/friend-request-links', token],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch(`/api/friend-request-links/${token}`);
      if (!response.ok) {
        throw new Error('Invalid or expired friend request link');
      }
      return response.json();
    },
    enabled: !!token && !!user
  });
  
  const handleAcceptRequest = async () => {
    if (!user || !requestData) return;
    
    setIsAccepting(true);
    
    try {
      // Create a friend request
      const response = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          friendId: requestData.user.id,
          status: 'pending'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      
      toast({
        title: 'Friend request sent!',
        description: `We've sent a friend request to ${requestData.user.name}.`,
      });
      
      // If user is a child, go to dashboard
      if (!user.isParent) {
        setLocation('/child/dashboard');
      } else {
        setLocation('/parent/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong, please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAccepting(false);
    }
  };
  
  const handleCancel = () => {
    if (user?.isParent) {
      setLocation('/parent/dashboard');
    } else {
      setLocation('/child/dashboard');
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Friend Request</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading request details...' : 
             error ? 'Error loading friend request' : 
             `${requestData?.user.name} wants to be your friend!`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">
              <XCircle className="h-12 w-12 mx-auto mb-2" />
              <p>This friend request link is invalid or has expired.</p>
            </div>
          ) : requestData?.user ? (
            <div className="flex items-center space-x-4 py-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback 
                  style={{ backgroundColor: requestData.user.avatarColor || '#3b82f6' }}
                  className="text-lg"
                >
                  {getInitials(requestData.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">{requestData.user.name}</h3>
                <p className="text-gray-500">{requestData.user.status || 'No status'}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          
          {!error && requestData?.user && (
            <Button 
              onClick={handleAcceptRequest}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Send Friend Request
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}