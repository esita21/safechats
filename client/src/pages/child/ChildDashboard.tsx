import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useMessages } from '@/lib/MessageContext';
import { User, Notification } from '@shared/schema';
import ChildLayout from '@/components/layouts/ChildLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FriendsList from '@/components/FriendsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, UserPlus, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDate, isEmpty, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ChildDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onlineFriends, setSelectedChat } = useMessages();
  const [friendUsername, setFriendUsername] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  
  // Redirect if not logged in or not a child
  useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.isParent) {
      setLocation('/parent/dashboard');
    }
  }, [user, setLocation]);
  
  if (!user || user.isParent) return null;
  
  // Fetch friends list
  const { data: friends, isLoading: loadingFriends } = useQuery<User[]>({
    queryKey: [`/api/users/${user.id}/friends`],
  });
  
  // Fetch notifications
  const { data: notifications, isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: [`/api/users/${user.id}/notifications`]
  });
  
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  
  const handleFriendSelection = (friendId: number) => {
    setSelectedChat(friendId);
    setLocation(`/child/chat`);
  };
  
  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingFriend(true);
    
    try {
      // First find the user by username
      const userResponse = await fetch(`/api/users/by-username?username=${encodeURIComponent(friendUsername)}`);
      
      if (!userResponse.ok) {
        // If username doesn't exist, show error
        toast({
          title: "Friend not found",
          description: "We couldn't find a user with that username.",
          variant: "destructive"
        });
        return;
      }
      
      const friendUser = await userResponse.json();
      
      // Don't allow sending friend requests to parents
      if (friendUser.isParent) {
        toast({
          title: "Can't add parents",
          description: "You can only add other kids as friends.",
          variant: "destructive"
        });
        return;
      }
      
      // Don't allow adding yourself
      if (friendUser.id === user.id) {
        toast({
          title: "Can't add yourself",
          description: "You can't add yourself as a friend.",
          variant: "destructive"
        });
        return;
      }
      
      // Create the friend request
      const requestResponse = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          friendId: friendUser.id,
          status: 'pending'
        })
      });
      
      if (!requestResponse.ok) {
        const errorData = await requestResponse.json();
        throw new Error(errorData.message);
      }
      
      toast({
        title: "Friend request sent!",
        description: `We've sent a friend request to ${friendUser.name}. Your parent will need to approve it.`,
      });
      
      setFriendUsername('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong, please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingFriend(false);
    }
  };
  
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };
  
  return (
    <ChildLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Hello, {user.name}! 👋
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
                          className={`p-3 rounded-md ${notification.isRead ? 'bg-gray-100' : 'bg-blue-50'}`}
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
          
          <Card>
            <CardHeader>
              <CardTitle>Start Chatting</CardTitle>
              <CardDescription>
                Choose a friend to chat with or add a new friend!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="friends">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="friends">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    My Friends
                  </TabsTrigger>
                  <TabsTrigger value="add">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="friends" className="pt-4">
                  {loadingFriends ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <FriendsList 
                      friends={friends || []} 
                      onlineFriends={onlineFriends}
                      onSelectFriend={handleFriendSelection}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="add" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter friend's username"
                        value={friendUsername}
                        onChange={(e) => setFriendUsername(e.target.value)}
                      />
                      <Button 
                        onClick={handleSendFriendRequest}
                        disabled={isAddingFriend}
                      >
                        {isAddingFriend ? 'Sending...' : 'Send Request'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Remember, your parent will need to approve all friend requests!
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Chats</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFriends ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : isEmpty(friends) ? (
                <p className="text-center py-4 text-gray-500">
                  You don't have any friends yet. Add some to start chatting!
                </p>
              ) : (
                <div className="space-y-2">
                  {friends?.slice(0, 3).map(friend => (
                    <div 
                      key={friend.id}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFriendSelection(friend.id)}
                    >
                      <Avatar className="mr-3">
                        <AvatarFallback style={{ backgroundColor: friend.avatarColor }}>
                          {getInitials(friend.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-gray-500">{friend.status || 'No status'}</p>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-3 h-3 rounded-full ${onlineFriends.has(friend.id) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ChildLayout>
  );
}
