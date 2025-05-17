import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Friend } from '@shared/schema';
import ParentLayout from '@/components/layouts/ParentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Check, Clock, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { TabsContent, TabsList, TabsTrigger, Tabs } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate, isEmpty } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Extended friend request with names for UI
interface EnhancedFriendRequest extends Friend {
  requesterName: string;
  requesteeName: string;
}

export default function FriendRequests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
  
  // Fetch pending friend requests
  const { data: friendRequests, isLoading } = useQuery<EnhancedFriendRequest[]>({
    queryKey: [`/api/parent/${user.id}/friend-requests`],
  });
  
  const respondToFriendRequest = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/friend-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          friendRequestId: requestId,
          status
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update friend request');
      }
      
      // Invalidate the cache to refresh the friend requests list
      queryClient.invalidateQueries({ queryKey: [`/api/parent/${user.id}/friend-requests`] });
      
      toast({
        title: status === 'approved' ? 'Request Approved' : 'Request Rejected',
        description: status === 'approved' 
          ? 'The friend request has been approved. The children can now chat with each other.' 
          : 'The friend request has been rejected.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process the friend request.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <ParentLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 mr-4"
              onClick={() => setLocation('/parent/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Friend Requests</h1>
          </div>
          
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Pending Approval
                {friendRequests && friendRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="mr-2 h-4 w-4" />
                Request History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Friend Requests Requiring Approval</CardTitle>
                  <CardDescription>
                    Review and approve or reject friend requests for your children
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : isEmpty(friendRequests) ? (
                    <div className="text-center py-8">
                      <Check className="mx-auto h-12 w-12 text-green-500" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">All clear!</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        There are no friend requests that need your approval right now.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {friendRequests?.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                              <Badge className="mb-2">Friend Request</Badge>
                              <p className="font-medium">{request.requesterName} wants to be friends with {request.requesteeName}</p>
                              <p className="text-sm text-gray-500">Requested on {formatDate(request.requestTime)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => respondToFriendRequest(request.id, 'approved')}
                              >
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => respondToFriendRequest(request.id, 'rejected')}
                              >
                                <ThumbsDown className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Friend Request History</CardTitle>
                  <CardDescription>
                    View previously approved or rejected friend requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Coming Soon</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Friend request history will be available in a future update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ParentLayout>
  );
}
