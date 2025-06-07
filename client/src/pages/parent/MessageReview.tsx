import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Message, User } from '@shared/schema';
import ParentLayout from '@/components/layouts/ParentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Check, Eye, Search, Trash, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, isEmpty } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import MessageItem from '@/components/MessageItem';

export default function MessageReview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/parent/message-reviews');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  
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
  const { data: children, isLoading: loadingChildren } = useQuery<User[]>({
    queryKey: [`/api/parent/${user.id}/children`],
  });
  
  // Fetch flagged messages that need review
  const { data: flaggedMessages, isLoading: loadingFlagged } = useQuery<Message[]>({
    queryKey: [`/api/parent/${user.id}/message-reviews`],
  });
  
  // Fetch messages for a specific child
  const { data: childMessages, isLoading: loadingChildMessages } = useQuery<Message[]>({
    queryKey: [`/api/parent/${user.id}/child/${selectedChild}/messages`],
    enabled: !!selectedChild,
  });
  
  // Filter messages based on search term
  const filteredMessages = childMessages?.filter(message => 
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const reviewMessage = async (messageId: number, action: 'allow' | 'delete') => {
    try {
      const response = await fetch(`/api/messages/${messageId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId :Number(messageId),
          isReviewed: true,
          action
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update message');
      }
      
      // Invalidate the cache to refresh the message lists
      queryClient.invalidateQueries({ queryKey: [`/api/parent/${user.id}/message-reviews`] });
      if (selectedChild) {
        queryClient.invalidateQueries({ queryKey: [`/api/parent/${user.id}/child/${selectedChild}/messages`] });
      }
      
      toast({
        title: action === 'allow' ? 'Message Approved' : 'Message Deleted',
        description: action === 'allow' 
          ? 'The message has been approved and will remain visible.' 
          : 'The message has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process the message review.',
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
            <h1 className="text-2xl font-bold">Message Reviews</h1>
          </div>
          
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Pending Reviews
                {flaggedMessages && flaggedMessages.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {flaggedMessages.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="browse">
                <Eye className="mr-2 h-4 w-4" />
                Browse Messages
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Messages Requiring Review</CardTitle>
                  <CardDescription>
                    These messages have been flagged for containing potentially inappropriate content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingFlagged ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : isEmpty(flaggedMessages) ? (
                    <div className="text-center py-8">
                      <Check className="mx-auto h-12 w-12 text-green-500" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">All clear!</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        There are no messages that need your review right now.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {flaggedMessages?.map((message) => (
                        <div key={message.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium">
                                Message from Child #{message.senderId} to Child #{message.receiverId}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(message.timestamp)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => reviewMessage(message.id, 'allow')}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Allow
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => reviewMessage(message.id, 'delete')}
                              >
                                <Trash className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p>{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="browse" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Browse Child Messages</CardTitle>
                  <CardDescription>
                    View all messages sent and received by your children
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Select Child</label>
                      <Select
                        value={selectedChild || ''}
                        onValueChange={(value) => setSelectedChild(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a child" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingChildren ? (
                            <SelectItem value="loading">Loading...</SelectItem>
                          ) : (
                            children?.map((child) => (
                              <SelectItem key={child.id} value={child.id.toString()}>
                                {child.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Search Messages</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search message content..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          disabled={!selectedChild}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {!selectedChild ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Select a child to view their messages</p>
                    </div>
                  ) : loadingChildMessages ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : isEmpty(filteredMessages) ? (
                    <div className="text-center py-8">
                      <X className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No messages found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm 
                          ? `No messages matching "${searchTerm}"` 
                          : "This child hasn't sent or received any messages yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMessages?.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          onReview={(action) => reviewMessage(message.id, action)}
                          isParentView={true}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ParentLayout>
  );
}
