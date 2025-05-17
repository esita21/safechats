import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Message, User } from '@shared/schema';
import { useAuth } from './auth';
import { filterMessageForProfanity } from './wordFilter';

interface MessageContextType {
  sendMessage: (receiverId: number, content: string) => void;
  messages: Map<number, Message[]>; // Messages grouped by conversation partner
  onlineFriends: Set<number>; // IDs of online friends
  selectedChat: number | null; // ID of currently selected chat
  setSelectedChat: (userId: number | null) => void;
}

const MessageContext = createContext<MessageContextType>({
  sendMessage: () => {},
  messages: new Map(),
  onlineFriends: new Set(),
  selectedChat: null,
  setSelectedChat: () => {},
});

interface MessageProviderProps {
  children: ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Map<number, Message[]>>(new Map());
  const [onlineFriends, setOnlineFriends] = useState<Set<number>>(new Set());
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      // Authenticate with the server
      ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message' || data.type === 'message_sent') {
          // Handle received or sent messages
          const message = data.message;
          
          setMessages(prevMessages => {
            const newMessages = new Map(prevMessages);
            const partnerId = message.senderId === user.id ? message.receiverId : message.senderId;
            
            const existingMessages = newMessages.get(partnerId) || [];
            newMessages.set(partnerId, [...existingMessages, message]);
            
            return newMessages;
          });
        } else if (data.type === 'status') {
          // Handle online/offline status updates
          if (data.status === 'online') {
            setOnlineFriends(prev => new Set(prev).add(data.userId));
          } else {
            setOnlineFriends(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [user]);
  
  // Load messages for a user when they first connect
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      
      try {
        // Load friends list
        const friendsResponse = await fetch(`/api/users/${user.id}/friends`);
        const friends: User[] = await friendsResponse.json();
        
        // Load messages for each friend
        const newMessages = new Map<number, Message[]>();
        
        for (const friend of friends) {
          const messagesResponse = await fetch(`/api/messages/${user.id}/${friend.id}`);
          const chatMessages: Message[] = await messagesResponse.json();
          newMessages.set(friend.id, chatMessages);
        }
        
        setMessages(newMessages);
      } catch (error) {
        console.error('Failed to load messages', error);
      }
    };
    
    loadMessages();
  }, [user]);
  
  const sendMessage = (receiverId: number, content: string) => {
    if (!socket || !user) return;
    
    // Filter message content for profanity
    const { filtered, containsProfanity } = filterMessageForProfanity(content);
    
    socket.send(JSON.stringify({
      type: 'message',
      receiverId,
      content: filtered,
      isFiltered: containsProfanity
    }));
  };
  
  return (
    <MessageContext.Provider 
      value={{ 
        sendMessage, 
        messages, 
        onlineFriends,
        selectedChat,
        setSelectedChat
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessageContext);
}
