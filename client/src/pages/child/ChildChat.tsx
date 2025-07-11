import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useMessages } from '@/lib/MessageContext';
import { User } from '@shared/schema';
import ChildLayout from '@/components/layouts/ChildLayout';
import ChatBox from '@/components/ChatBox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { getInitials, isEmpty } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChildChat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { messages, sendMessage, selectedChat, onlineFriends } = useMessages();
  const [messageText, setMessageText] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Redirect if not logged in or not a child
  useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.isParent) {
      setLocation('/parent/dashboard');
    } else if (!selectedChat) {
      setLocation('/child/dashboard');
    }
  }, [user, selectedChat, setLocation]);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedChat]);
  
  if (!user || user.isParent || !selectedChat) return null;
  
  // Fetch details about the friend we're chatting with
  const { data: friend, isLoading: loadingFriend } = useQuery<User>({
    queryKey: [`/api/users/${selectedChat}`],
  });
  
  const chatMessages = messages.get(selectedChat) || [];
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;
    console.log('Sending message:', messageText);
    // Filter message for profanity if needed
    sendMessage(selectedChat, messageText , friend?.name || 'Unknown');
    setMessageText('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <ChildLayout>
      <div className="h-full flex flex-col">
        {/* Chat header */}
        <div className="border-b p-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => setLocation('/child/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {loadingFriend ? (
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <Skeleton className="h-5 w-32" />
            </div>
          ) : (
            <>
              <Avatar className="mr-3">
                <AvatarFallback style={{ backgroundColor: friend?.avatarColor }}>
                  {friend ? getInitials(friend.name) : '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{friend?.name}</p>
                <div className="flex items-center text-xs">
                  <span className={`w-2 h-2 rounded-full mr-1 ${onlineFriends.has(selectedChat) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span>{onlineFriends.has(selectedChat) ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isEmpty(chatMessages) ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>No messages yet. Say hello to start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <ChatBox
                  key={message.id}
                  message={message}
                  isSentByMe={message.senderId == user.id}
                />
              ))}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>
        
        {/* Message input */}
        <Card className="rounded-none">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChildLayout>
  );
}
