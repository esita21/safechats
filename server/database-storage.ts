import { eq, and, or, desc, sql, not } from 'drizzle-orm';
import { db } from './db';
import { IStorage } from './storage';
import { 
  users, messages, friends, notifications, friendRequestLinks,
  type User, type InsertUser, type Message, type InsertMessage,
  type Friend, type InsertFriend, type Notification, type InsertNotification,
  type FriendRequestLink, type InsertFriendRequestLink
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getChildrenByParentId(parentId: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.parentId, parentId));
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.timestamp);
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async getPendingMessageReviews(parentId: number): Promise<Message[]> {
    // Get all children for this parent
    const children = await this.getChildrenByParentId(parentId);
    const childIds = children.map(child => child.id);
    
    if (childIds.length === 0) return [];
    
    // Get all messages that need review (either filtered or not reviewed yet)
    return db
      .select()
      .from(messages)
      .where(
        and(
          or(
            eq(messages.isFiltered, true),
            eq(messages.isReviewed, false)
          ),
          or(
            sql`${messages.senderId} = ANY(${childIds})`,
            sql`${messages.receiverId} = ANY(${childIds})`
          ),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(desc(messages.timestamp));
  }

  async getMessagesByChild(childId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, childId),
          eq(messages.receiverId, childId)
        )
      )
      .orderBy(messages.timestamp);
  }

  // Friend operations
  async createFriendRequest(requestData: InsertFriend): Promise<Friend> {
    const [friend] = await db
      .insert(friends)
      .values(requestData)
      .returning();
    return friend;
  }

  async getFriendRequest(id: number): Promise<Friend | undefined> {
    const [friendRequest] = await db
      .select()
      .from(friends)
      .where(eq(friends.id, id));
    return friendRequest;
  }

  async getFriendRequestsByUser(userId: number): Promise<Friend[]> {
    return db
      .select()
      .from(friends)
      .where(
        or(
          eq(friends.userId, userId),
          eq(friends.friendId, userId)
        )
      );
  }

  async getPendingFriendRequests(parentId: number): Promise<Friend[]> {
    // Get all children for this parent
    const children = await this.getChildrenByParentId(parentId);
    const childIds = children.map(child => child.id);
    
    if (childIds.length === 0) return [];
    
    // Get all pending friend requests for this parent's children
    return db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.status, 'pending'),
          or(
            sql`${friends.userId} = ANY(${childIds})`,
            sql`${friends.friendId} = ANY(${childIds})`
          )
        )
      );
  }

  async updateFriendRequest(id: number, updates: Partial<Friend>): Promise<Friend | undefined> {
    const [updatedRequest] = await db
      .update(friends)
      .set(updates)
      .where(eq(friends.id, id))
      .returning();
    return updatedRequest;
  }

  async getFriendsByUserId(userId: number): Promise<User[]> {
    // Get all approved friend connections
    const friendConnections = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.status, 'approved'),
          or(
            eq(friends.userId, userId),
            eq(friends.friendId, userId)
          )
        )
      );
    
    if (friendConnections.length === 0) return [];
    
    // Extract the friend IDs
    const friendIds = friendConnections.map(conn => 
      conn.userId === userId ? conn.friendId : conn.userId
    );
    
    // Get the user details for all friends
    return db
      .select()
      .from(users)
      .where(sql`${users.id} = ANY(${friendIds})`);
  }

  // Friend request link operations
  async createFriendRequestLink(userId: number, token: string): Promise<FriendRequestLink> {
    // Set expiration date to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const [link] = await db
      .insert(friendRequestLinks)
      .values({
        userId,
        token,
        expiresAt
      })
      .returning();
      
    return link;
  }

  async getFriendRequestLinkByToken(token: string): Promise<FriendRequestLink | undefined> {
    const now = new Date();
    
    const [link] = await db
      .select()
      .from(friendRequestLinks)
      .where(
        and(
          eq(friendRequestLinks.token, token),
          eq(friendRequestLinks.isUsed, false),
          sql`${friendRequestLinks.expiresAt} > ${now}`
        )
      );
      
    return link;
  }

  async markFriendRequestLinkAsUsed(id: number): Promise<FriendRequestLink | undefined> {
    const [updatedLink] = await db
      .update(friendRequestLinks)
      .set({ isUsed: true })
      .where(eq(friendRequestLinks.id, id))
      .returning();
      
    return updatedLink;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.timestamp));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
}