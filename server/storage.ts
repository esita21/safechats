import { 
  users, messages, friends, notifications, friendRequestLinks,
  type User, type InsertUser, type Message, type InsertMessage,
  type Friend, type InsertFriend, type Notification, type InsertNotification,
  type FriendRequestLink, type InsertFriendRequestLink
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getChildrenByParentId(parentId: number): Promise<User[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined>;
  getPendingMessageReviews(parentId: number): Promise<Message[]>;
  getMessagesByChild(childId: number): Promise<Message[]>;
  
  // Friend operations
  createFriendRequest(request: InsertFriend): Promise<Friend>;
  getFriendRequest(id: number): Promise<Friend | undefined>;
  getFriendRequestsByUser(userId: number): Promise<Friend[]>;
  getPendingFriendRequests(parentId: number): Promise<Friend[]>;
  updateFriendRequest(id: number, updates: Partial<Friend>): Promise<Friend | undefined>;
  getFriendsByUserId(userId: number): Promise<User[]>;
  createFriendRequestLink(userId: number, token: string): Promise<FriendRequestLink>;
  getFriendRequestLinkByToken(token: string): Promise<FriendRequestLink | undefined>;
  markFriendRequestLinkAsUsed(id: number): Promise<FriendRequestLink | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private friends: Map<number, Friend>;
  private notifications: Map<number, Notification>;
  private friendRequestLinks: Map<number, FriendRequestLink>;
  private userIdCounter: number;
  private messageIdCounter: number;
  private friendIdCounter: number;
  private notificationIdCounter: number;
  private friendRequestLinkIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.friends = new Map();
    this.notifications = new Map();
    this.friendRequestLinks = new Map();
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    this.friendIdCounter = 1;
    this.notificationIdCounter = 1;
    this.friendRequestLinkIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getChildrenByParentId(parentId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.parentId === parentId);
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = { 
      ...messageData, 
      id, 
      timestamp: now,
      isDeleted: false,
      isFiltered: false,
      isReviewed: false
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => (
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      ))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...updates };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getPendingMessageReviews(parentId: number): Promise<Message[]> {
    // Get all children IDs for this parent
    const childrenIds = Array.from(this.users.values())
      .filter(user => user.parentId === parentId)
      .map(child => child.id);
    
    // Get all filtered messages that haven't been reviewed yet involving these children
    return Array.from(this.messages.values())
      .filter(message => {
        const involvesChild = childrenIds.includes(message.senderId) || childrenIds.includes(message.receiverId);
        return involvesChild && message.isFiltered && !message.isReviewed;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getMessagesByChild(childId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => (
        message.senderId === childId || message.receiverId === childId
      ))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Friend operations
  async createFriendRequest(requestData: InsertFriend): Promise<Friend> {
    const id = this.friendIdCounter++;
    const now = new Date();
    const friendRequest: Friend = { 
      ...requestData, 
      id, 
      requestTime: now, 
      status: requestData.status ?? "pending" 
    };
    this.friends.set(id, friendRequest);
    return friendRequest;
  }

  async getFriendRequest(id: number): Promise<Friend | undefined> {
    return this.friends.get(id);
  }

  async getFriendRequestsByUser(userId: number): Promise<Friend[]> {
    return Array.from(this.friends.values())
      .filter(friend => friend.userId === userId || friend.friendId === userId)
      .sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime());
  }

  async getPendingFriendRequests(parentId: number): Promise<Friend[]> {
    // Get all children IDs for this parent
    const childrenIds = Array.from(this.users.values())
      .filter(user => user.parentId === parentId)
      .map(child => child.id);
    
    // Get all pending friend requests involving these children
    return Array.from(this.friends.values())
      .filter(friend => {
        const involvesChild = 
          (childrenIds.includes(friend.userId) || childrenIds.includes(friend.friendId));
        return involvesChild && friend.status === 'pending';
      })
      .sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime());
  }

  async updateFriendRequest(id: number, updates: Partial<Friend>): Promise<Friend | undefined> {
    const friendRequest = this.friends.get(id);
    if (!friendRequest) return undefined;
    
    const updatedRequest = { ...friendRequest, ...updates };
    this.friends.set(id, updatedRequest);
    return updatedRequest;
  }

  async getFriendsByUserId(userId: number): Promise<User[]> {
    // Get approved friend connections
    const approvedFriends = Array.from(this.friends.values())
      .filter(friend => 
        (friend.userId === userId || friend.friendId === userId) && 
        friend.status === 'approved'
      );
    
    // Get the friend IDs
    const friendIds = approvedFriends.map(friend => 
      friend.userId === userId ? friend.friendId : friend.userId
    );
    
    // Get the user objects for these friends
    return Array.from(this.users.values())
      .filter(user => friendIds.includes(user.id));
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = { 
      ...notificationData, 
      id, 
      timestamp: now,
      isRead: false
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Friend request link operations
  async createFriendRequestLink(userId: number, token: string): Promise<FriendRequestLink> {
    const id = this.friendRequestLinkIdCounter++;
    const now = new Date();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const linkData: FriendRequestLink = {
      id,
      userId,
      token,
      isUsed: false,
      createdAt: now,
      expiresAt
    };
    
    this.friendRequestLinks.set(id, linkData);
    return linkData;
  }
  
  async getFriendRequestLinkByToken(token: string): Promise<FriendRequestLink | undefined> {
    return Array.from(this.friendRequestLinks.values())
      .find(link => link.token === token && !link.isUsed && link.expiresAt > new Date());
  }
  
  async markFriendRequestLinkAsUsed(id: number): Promise<FriendRequestLink | undefined> {
    const link = this.friendRequestLinks.get(id);
    if (!link) return undefined;
    
    const updatedLink = { ...link, isUsed: true };
    this.friendRequestLinks.set(id, updatedLink);
    return updatedLink;
  }
}

// Use the simple in-memory storage for now
// This ensures data persistence while the application is running
//export const storage = new MemStorage();
import { DatabaseStorage } from './database-storage';
export const storage = new DatabaseStorage();
