import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  loginSchema, insertUserSchema, createChildSchema, 
  updateProfileSchema, insertMessageSchema, insertFriendSchema,
  friendRequestResponseSchema, messageReviewSchema
} from "@shared/schema";
import { addPreSavedFriendsForChild } from "./preSavedFriends";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { is } from "drizzle-orm";
import { isDataView } from "util/types";

// Keep track of active connections
const activeConnections = new Map<number, WebSocket>();

function validateApiRequest<T>(schema: any, data: any): { valid: boolean; data?: T; error?: string } {
  try {
    const validatedData = schema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  wss.on('listening', () => {
    console.log('WebSocket server is listening');
  });
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    console.log('New WebSocket connection established');
    
    ws.on('message', async (message) => {
      console.log('Received WebSocket message:', message.toString());
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          // Authenticate user
          userId = data.userId;
          activeConnections.set(userId, ws);
          
          // Send online status to all connected friends
          const friends = await storage.getFriendsByUserId(userId);
          friends.forEach(friend => {
            const friendWs = activeConnections.get(friend.id);
            if (friendWs && friendWs.readyState === WebSocket.OPEN) {
              friendWs.send(JSON.stringify({
                type: 'status',
                userId: userId,
                status: 'online'
              }));
            }
          });

        
        } else if (data.type === 'message' && userId) {
          console.log('Handling message from user:', userId);
          // Handle message sending
          const { valid, data: validData, error } = validateApiRequest(
            insertMessageSchema, 
            { senderId: userId, receiverId: data.receiverId, content: data.content ,isFiltered: data.isFiltered || false, isReviewed: !data.isFiltered || true ,isDeleted: data.isDeleted || false }
          );
          
          if (!valid) {
            console.log('Invalid message data:', error);
            ws.send(JSON.stringify({ type: 'error', error }));
            return;
          }
          console.log('Valid message data:', validData);
          // Store the message
          const message = await storage.createMessage(validData);
          
          // Send to recipient if they are connected
          const recipientWs = activeConnections.get(data.receiverId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'message',
              message
            }));
          }
          console.log('Message sent to recipient:', data.receiverId);
          // Confirm receipt to sender
          ws.send(JSON.stringify({
            type: 'message_sent',
            message
          }));
          console.log('Message sent confirmation to sender:', userId);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', async () => {
      if (userId) {
        // Remove from active connections
        activeConnections.delete(userId);
        
        // Notify friends about offline status
        const friends = await storage.getFriendsByUserId(userId);
        friends.forEach(friend => {
          const friendWs = activeConnections.get(friend.id);
          if (friendWs && friendWs.readyState === WebSocket.OPEN) {
            friendWs.send(JSON.stringify({
              type: 'status',
              userId: userId,
              status: 'offline'
            }));
          }
        });
      }
    });
  });

  // API Routes
  
  // Auth routes
  app.post('/api/login', async (req: Request, res: Response) => {
    const { valid, data, error } = validateApiRequest(loginSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    
    const user = await storage.getUserByUsername(data.username);
    if (!user || user.password !== data.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    console.log('User logged in:', user,valid);
    res.json(userWithoutPassword);
  });
  
  app.post('/api/register', async (req: Request, res: Response) => {
    const { valid, data, error } = validateApiRequest(insertUserSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Create new parent user
    const newUser = await storage.createUser({
      ...data,
      isParent: true,
      parentId: null
    });
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  });
  
  // Child account routes
  app.post('/api/children', async (req: Request, res: Response) => {
    const { valid, data, error } = validateApiRequest(createChildSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Create child account
    const newChild = await storage.createUser({
      ...(typeof data === 'object' && data !== null ? data : {}),
      isParent: false
    });
    
    // Add pre-saved friends for this child account
    await addPreSavedFriendsForChild(newChild.id);
    
    // Don't send password in response
    const { password, ...childWithoutPassword } = newChild;
    
    res.status(201).json(childWithoutPassword);
  });
  
  app.get('/api/parent/:parentId/children', async (req: Request, res: Response) => {
    const parentId = parseInt(req.params.parentId);
    if (isNaN(parentId)) {
      return res.status(400).json({ message: 'Invalid parent ID' });
    }
    
    const children = await storage.getChildrenByParentId(parentId);
    
    // Remove passwords from response
    const childrenWithoutPasswords = children.map(({ password, ...child }) => child);
    
    res.json(childrenWithoutPasswords);
  });
  
  // Profile routes
  app.patch('/api/users/:userId/profile', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const { valid, data, error } = validateApiRequest(updateProfileSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    
    const updatedUser = await storage.updateUser(userId, data);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  });
  
  // Message routes
  app.get('/api/messages/:user1Id/:user2Id', async (req: Request, res: Response) => {
    const user1Id = parseInt(req.params.user1Id);
    const user2Id = parseInt(req.params.user2Id);
    
    if (isNaN(user1Id) || isNaN(user2Id)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }
    
    const messages = await storage.getMessagesBetweenUsers(user1Id, user2Id);
    res.json(messages);
  });
  
  app.get('/api/parent/:parentId/message-reviews', async (req: Request, res: Response) => {
    const parentId = parseInt(req.params.parentId);
    if (isNaN(parentId)) {
      return res.status(400).json({ message: 'Invalid parent ID' });
    }
    
    const messages = await storage.getPendingMessageReviews(parentId);
    console.log("Pending message reviews for parent:", parentId, messages);
    res.json(messages);
  });
  
  app.patch('/api/messages/:messageId/review', async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }
    
    const { valid, data, error } = validateApiRequest(messageReviewSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    
    const message = await storage.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Update message based on review
    const updates = {
      isReviewed: true,
      isDeleted: data.action === 'delete'
    };
    
    const updatedMessage = await storage.updateMessage(messageId, updates);
    res.json(updatedMessage);
  });
  
  app.get('/api/parent/:parentId/child/:childId/messages', async (req: Request, res: Response) => {
    const parentId = parseInt(req.params.parentId);
    const childId = parseInt(req.params.childId);
    
    if (isNaN(parentId) || isNaN(childId)) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }
    
    // Verify that the child belongs to this parent
    const children = await storage.getChildrenByParentId(parentId);
    const childBelongsToParent = children.some(child => child.id == childId);
    
    if (!childBelongsToParent) {
      return res.status(403).json({ message: 'Child does not belong to this parent' });
    }
    
    const messages = await storage.getMessagesByChild(childId);
    res.json(messages);
  });
  
  // Friend routes
  app.post('/api/friend-requests', async (req: Request, res: Response) => {
    const { valid, data, error } = validateApiRequest(insertFriendSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    
    // Check if users exist
    const typedData = data as { userId: number; friendId: number };
    const user = await storage.getUser(typedData.userId);
    const friend = await storage.getUser(typedData.friendId);
    
    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if this is a child-to-child request (non-parents)
    if (user.isParent || friend.isParent) {
      return res.status(400).json({ message: 'Friend requests can only be between children' });
    }
    
    // Check if request already exists
    //const typedData = data as { userId: number; friendId: number };
    const existingRequests = await storage.getFriendRequestsByUser(typedData.userId);
    const alreadyRequested = existingRequests.some(
      req => 
        (req.userId === typedData.userId && req.friendId === typedData.friendId) || 
        (req.userId === typedData.friendId && req.friendId === typedData.userId)
    );
    
    if (alreadyRequested) {
      return res.status(409).json({ message: 'Friend request already exists' });
    }
    
    // Create friend request
    const friendRequest = await storage.createFriendRequest(typedData);
    
    // Notify parent of the request recipient
    if (friend.parentId) {
      await storage.createNotification({
        userId: friend.parentId,
        message: `New friend request for ${friend.name} from ${user.name}`,
        isRead: false
      });
    }
    
    res.status(201).json(friendRequest);
  });
  
  // Generate a friend request link with a token
  app.post('/api/friend-request-links', async (req: Request, res: Response) => {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if user exists and is a child
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isParent) {
      return res.status(400).json({ message: 'Only children can generate friend request links' });
    }
    
    // Generate a request token (simple version - in production would use JWT or similar)
    const requestToken = Buffer.from(`${userId}-${Date.now()}`).toString('base64');
    
    // Store the token (in a real app, we'd use a dedicated table for this)
    const linkData = await storage.createFriendRequestLink(userId, requestToken);
    
    res.status(201).json({
      requestToken,
      userId,
      requestLink: `/friend-request?token=${requestToken}` 
    });
  });
  
  // Validate a friend request token
  app.get('/api/friend-request-links/:token', async (req: Request, res: Response) => {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Get the token data
    const linkData = await storage.getFriendRequestLinkByToken(token);
    
    if (!linkData) {
      return res.status(404).json({ message: 'Invalid or expired friend request link' });
    }
    
    // Get the user who created the link
    const user = await storage.getUser(linkData.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the user info (without sensitive data)
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      tokenData: linkData,
      user: userWithoutPassword
    });
  });
  app.get('/api/users/:userId', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
     if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
   const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  app.get('/api/users/:userId/friends', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const friends = await storage.getFriendsByUserId(userId);
    const newFriends = friends.map(friend => {
      let newFriend = { ...friend };
      newFriend.id= Number(newFriend.id);
      return newFriend;
    });
    // Remove passwords from response
    const friendsWithoutPasswords = newFriends.map(({ password, ...friend }) => friend);
    
    res.json(friendsWithoutPasswords);
  });
  
  app.get('/api/parent/:parentId/friend-requests', async (req: Request, res: Response) => {
    const parentId = parseInt(req.params.parentId);
    if (isNaN(parentId)) {
      return res.status(400).json({ message: 'Invalid parent ID' });
    }
    
    // Get pending friend requests for this parent's children
    const pendingRequests = await storage.getPendingFriendRequests(parentId);
    
    // Enhance with user details
    const enhancedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const requester = await storage.getUser(request.userId);
        const requestee = await storage.getUser(request.friendId);
        return {
          ...request,
          requesterName: requester?.name || 'Unknown',
          requesteeName: requestee?.name || 'Unknown',
        };
      })
    );
    
    res.json(enhancedRequests);
  });
  
  app.patch('/api/friend-requests/:requestId', async (req: Request, res: Response) => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    
    const { valid, data, error } = validateApiRequest(friendRequestResponseSchema, req.body);
    if (!valid) return res.status(400).json({ message: error });
    const typedData = data as { status: string };
    
    const friendRequest = await storage.getFriendRequest(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Update friend request status
    const updatedRequest = await storage.updateFriendRequest(requestId, { status: typedData.status });
    
    // Create notifications for both users
    const requester = await storage.getUser(friendRequest.userId);
    const recipient = await storage.getUser(friendRequest.friendId);
    
    if (requester && recipient) {
      // Notify the requester about the decision
      await storage.createNotification({
        userId: requester.id,
        message: `Your friend request to ${recipient.name} was ${typedData.status}`,
        isRead: false
      });
      
      // Notify the recipient about the new friend if approved
      if (typedData.status === 'approved') {
        await storage.createNotification({
          userId: recipient.id,
          message: `You are now friends with ${requester.name}`,
          isRead: false
        });
      }
    }
    
    res.json(updatedRequest);
  });
  
  // Notification routes
  app.get('/api/users/:userId/notifications', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const notifications = await storage.getNotificationsByUser(userId);
    res.json(notifications);
  });
  
  app.patch('/api/notifications/:notificationId/read', async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await storage.markNotificationAsRead(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  });
  app.get('/api/users/by-username/:username', async (req: Request, res: Response) => {
    const username = req.params.username;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  return httpServer;
}
