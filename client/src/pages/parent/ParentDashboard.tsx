import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Friend, Message, Notification } from '@shared/schema';
import ParentLayout from '@/components/layouts/ParentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Users, MessageSquare, UserCog } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isEmpty, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Redirect if not logged in or not a parent
  useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (!user.isParent) {
      setLocation('/child/dashboard');
    }
  }, [user, setLocation]);
  
  if (!user || !user.isParent) return null;
  
  // Fetch children accounts
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: [`/api/parent/${user.id}/children`],
  });
  
  // Fetch pending friend requests
  const { data: friendRequests, isLoading: loadingFriendRequests } = useQuery<Friend[]>({
    queryKey: [`/api/parent/${user.id}/friend-requests`],
  });
  
  // Fetch message reviews
  const { data: messageReviews, isLoading: loadingMessageReviews } = useQuery<Message[]>({
    queryKey: [`/api/parent/${user.id}/message-reviews`],
  });
  
  // Fetch notifications
  const { data: notifications, isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: [`/api/users/${user.id}/notifications`],
  });
  
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/notifications`] });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };
  
  return (
    <ParentLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Parent Dashboard
            </h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="relative">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Your Notifications</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : isEmpty(notifications) ? (
                    <p className="text-center py-4 text-gray-500">No notifications yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {notifications?.map(notification => (
                        <li 
                          key={notification.id}
                          className={`p-3 rounded-md cursor-pointer ${notification.isRead ? 'bg-gray-100' : 'bg-blue-50'}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="children">Children</TabsTrigger>
              <TabsTrigger value="friend-requests">Friend Requests</TabsTrigger>
              <TabsTrigger value="message-reviews">Messages</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Children Accounts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold">{children?.length || 0}</div>
                      <p className="text-sm text-gray-500">Children registered</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setLocation('/parent/children')}
                    >
                      <UserCog className="mr-2 h-4 w-4" /> Manage Children
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending Friend Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold">{friendRequests?.length || 0}</div>
                      <p className="text-sm text-gray-500">Awaiting your approval</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setLocation('/parent/friend-requests')}
                    >
                      <Users className="mr-2 h-4 w-4" /> Review Requests
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Message Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold">{messageReviews?.length || 0}</div>
                      <p className="text-sm text-gray-500">Flagged messages</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setLocation('/parent/message-reviews')}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Review Messages
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest activity from your children's accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingNotifications ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : isEmpty(notifications) ? (
                    <Alert>
                      <AlertDescription>
                        No recent activity. Check back later!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ul className="space-y-2">
                      {notifications?.slice(0, 5).map(notification => (
                        <li 
                          key={notification.id}
                          className="border-b border-gray-100 py-2 last:border-0"
                        >
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="children" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Children Accounts</CardTitle>
                  <CardDescription>
                    Create and manage accounts for your children
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setLocation('/parent/children')}
                    className="w-full"
                  >
                    Go to Children Accounts
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="friend-requests" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Friend Requests</CardTitle>
                  <CardDescription>
                    Review and approve friend requests for your children
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setLocation('/parent/friend-requests')}
                    className="w-full"
                  >
                    Review Friend Requests
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="message-reviews" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Message Reviews</CardTitle>
                  <CardDescription>
                    Review flagged messages from your children's conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setLocation('/parent/message-reviews')}
                    className="w-full"
                  >
                    Review Messages
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ParentLayout>
  );
}
