import { db } from './firebase';
import { IStorage } from './storage';
import {
  type User, type InsertUser, type Message, type InsertMessage,
  type Friend, type InsertFriend, type Notification, type InsertNotification,
  type FriendRequestLink, type InsertFriendRequestLink
} from "@shared/schema";

// Collection references
const usersCollection = adminFirestore.collection('users');
const messagesCollection = adminFirestore.collection('messages');
const friendsCollection = adminFirestore.collection('friends');
const notificationsCollection = adminFirestore.collection('notifications');
const friendRequestLinksCollection = adminFirestore.collection('friendRequestLinks');

export class FirebaseStorage implements IStorage {
  // Helper to convert Firestore timestamp to Date
  private convertTimestamps(doc: any): any {
    const result = { ...doc };
    
    // Convert all timestamp fields to Date objects
    for (const key in result) {
      if (result[key] && typeof result[key].toDate === 'function') {
        result[key] = result[key].toDate();
      }
    }
    
    return result;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const doc = await usersCollection.where('id', '==', id).limit(1).get();
      if (doc.empty) return undefined;
      
      return this.convertTimestamps(doc.docs[0].data()) as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const doc = await usersCollection.where('username', '==', username).limit(1).get();
      if (doc.empty) return undefined;
      
      return this.convertTimestamps(doc.docs[0].data()) as User;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Get the next ID
      const counterDoc = await adminFirestore.collection('counters').doc('users').get();
      let nextId = 1;
      
      if (counterDoc.exists) {
        nextId = counterDoc.data()?.nextId || 1;
      }
      
      // Create the user document
      const user: User = { ...userData, id: nextId };
      await usersCollection.doc(nextId.toString()).set(user);
      
      // Update the counter
      await adminFirestore.collection('counters').doc('users').set({
        nextId: nextId + 1
      });
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const userDoc = await usersCollection.where('id', '==', id).limit(1).get();
      if (userDoc.empty) return undefined;
      
      const docId = userDoc.docs[0].id;
      await usersCollection.doc(docId).update(updates);
      
      const updatedDoc = await usersCollection.doc(docId).get();
      return this.convertTimestamps(updatedDoc.data()) as User;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async getChildrenByParentId(parentId: number): Promise<User[]> {
    try {
      const snapshot = await usersCollection
        .where('parentId', '==', parentId)
        .where('isParent', '==', false)
        .get();
      
      return snapshot.docs.map(doc => 
        this.convertTimestamps(doc.data()) as User
      );
    } catch (error) {
      console.error('Error getting children:', error);
      return [];
    }
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    try {
      // Get the next ID
      const counterDoc = await adminFirestore.collection('counters').doc('messages').get();
      let nextId = 1;
      
      if (counterDoc.exists) {
        nextId = counterDoc.data()?.nextId || 1;
      }
      
      // Create the message document
      const message: Message = { 
        ...messageData, 
        id: nextId,
        timestamp: new Date(),
        isDeleted: false,
        isFiltered: false,
        isReviewed: false
      };
      
      await messagesCollection.doc(nextId.toString()).set(message);
      
      // Update the counter
      await adminFirestore.collection('counters').doc('messages').set({
        nextId: nextId + 1
      });
      
      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    try {
      const doc = await messagesCollection.where('id', '==', id).limit(1).get();
      if (doc.empty) return undefined;
      
      return this.convertTimestamps(doc.docs[0].data()) as Message;
    } catch (error) {
      console.error('Error getting message:', error);
      return undefined;
    }
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    try {
      const sentMessages = await messagesCollection
        .where('senderId', '==', user1Id)
        .where('receiverId', '==', user2Id)
        .get();
      
      const receivedMessages = await messagesCollection
        .where('senderId', '==', user2Id)
        .where('receiverId', '==', user1Id)
        .get();
      
      const allMessages = [
        ...sentMessages.docs,
        ...receivedMessages.docs
      ].map(doc => this.convertTimestamps(doc.data()) as Message);
      
      // Sort by timestamp
      return allMessages.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
    } catch (error) {
      console.error('Error getting messages between users:', error);
      return [];
    }
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    try {
      const messageDoc = await messagesCollection.where('id', '==', id).limit(1).get();
      if (messageDoc.empty) return undefined;
      
      const docId = messageDoc.docs[0].id;
      await messagesCollection.doc(docId).update(updates);
      
      const updatedDoc = await messagesCollection.doc(docId).get();
      return this.convertTimestamps(updatedDoc.data()) as Message;
    } catch (error) {
      console.error('Error updating message:', error);
      return undefined;
    }
  }

  async getPendingMessageReviews(parentId: number): Promise<Message[]> {
    try {
      // Get all children for this parent
      const children = await this.getChildrenByParentId(parentId);
      if (children.length === 0) return [];
      
      const childIds = children.map(child => child.id);
      
      // Filter messages that need review (not elegant but Firestore has limitations)
      const allMessages = await messagesCollection
        .where('isDeleted', '==', false)
        .get();
      
      const pendingReviews = allMessages.docs
        .map(doc => this.convertTimestamps(doc.data()) as Message)
        .filter(msg => {
          // Filter for messages that involve children of this parent
          const involvesChild = 
            childIds.includes(msg.senderId) || 
            childIds.includes(msg.receiverId);
          
          // Filter for messages that need review
          const needsReview = 
            msg.isFiltered || !msg.isReviewed;
          
          return involvesChild && needsReview;
        });
      
      // Sort by timestamp descending
      return pendingReviews.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      console.error('Error getting pending message reviews:', error);
      return [];
    }
  }

  async getMessagesByChild(childId: number): Promise<Message[]> {
    try {
      const sentMessages = await messagesCollection
        .where('senderId', '==', childId)
        .get();
      
      const receivedMessages = await messagesCollection
        .where('receiverId', '==', childId)
        .get();
      
      const allMessages = [
        ...sentMessages.docs,
        ...receivedMessages.docs
      ].map(doc => this.convertTimestamps(doc.data()) as Message);
      
      // Sort by timestamp
      return allMessages.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
    } catch (error) {
      console.error('Error getting messages by child:', error);
      return [];
    }
  }

  // Friend operations
  async createFriendRequest(requestData: InsertFriend): Promise<Friend> {
    try {
      // Get the next ID
      const counterDoc = await adminFirestore.collection('counters').doc('friends').get();
      let nextId = 1;
      
      if (counterDoc.exists) {
        nextId = counterDoc.data()?.nextId || 1;
      }
      
      // Create the friend request document
      const friend: Friend = { 
        ...requestData, 
        id: nextId,
        requestTime: new Date(),
        status: requestData.status || 'pending'
      };
      
      await friendsCollection.doc(nextId.toString()).set(friend);
      
      // Update the counter
      await adminFirestore.collection('counters').doc('friends').set({
        nextId: nextId + 1
      });
      
      return friend;
    } catch (error) {
      console.error('Error creating friend request:', error);
      throw error;
    }
  }

  async getFriendRequest(id: number): Promise<Friend | undefined> {
    try {
      const doc = await friendsCollection.where('id', '==', id).limit(1).get();
      if (doc.empty) return undefined;
      
      return this.convertTimestamps(doc.docs[0].data()) as Friend;
    } catch (error) {
      console.error('Error getting friend request:', error);
      return undefined;
    }
  }

  async getFriendRequestsByUser(userId: number): Promise<Friend[]> {
    try {
      const sentRequests = await friendsCollection
        .where('userId', '==', userId)
        .get();
      
      const receivedRequests = await friendsCollection
        .where('friendId', '==', userId)
        .get();
      
      return [
        ...sentRequests.docs,
        ...receivedRequests.docs
      ].map(doc => this.convertTimestamps(doc.data()) as Friend);
    } catch (error) {
      console.error('Error getting friend requests by user:', error);
      return [];
    }
  }

  async getPendingFriendRequests(parentId: number): Promise<Friend[]> {
    try {
      // Get all children for this parent
      const children = await this.getChildrenByParentId(parentId);
      if (children.length === 0) return [];
      
      const childIds = children.map(child => child.id);
      
      // Get all pending friend requests
      const allRequests = await friendsCollection
        .where('status', '==', 'pending')
        .get();
      
      // Filter for requests involving this parent's children
      return allRequests.docs
        .map(doc => this.convertTimestamps(doc.data()) as Friend)
        .filter(req => 
          childIds.includes(req.userId) || 
          childIds.includes(req.friendId)
        );
    } catch (error) {
      console.error('Error getting pending friend requests:', error);
      return [];
    }
  }

  async updateFriendRequest(id: number, updates: Partial<Friend>): Promise<Friend | undefined> {
    try {
      const friendDoc = await friendsCollection.where('id', '==', id).limit(1).get();
      if (friendDoc.empty) return undefined;
      
      const docId = friendDoc.docs[0].id;
      await friendsCollection.doc(docId).update(updates);
      
      const updatedDoc = await friendsCollection.doc(docId).get();
      return this.convertTimestamps(updatedDoc.data()) as Friend;
    } catch (error) {
      console.error('Error updating friend request:', error);
      return undefined;
    }
  }

  async getFriendsByUserId(userId: number): Promise<User[]> {
    try {
      // Get all approved friend connections
      const sentRequests = await friendsCollection
        .where('userId', '==', userId)
        .where('status', '==', 'approved')
        .get();
      
      const receivedRequests = await friendsCollection
        .where('friendId', '==', userId)
        .where('status', '==', 'approved')
        .get();
      
      // Extract the friend IDs
      const friendIds = new Set<number>();
      
      sentRequests.docs.forEach(doc => {
        const data = doc.data();
        friendIds.add(data.friendId);
      });
      
      receivedRequests.docs.forEach(doc => {
        const data = doc.data();
        friendIds.add(data.userId);
      });
      
      // Get all users with those IDs
      const friendUsers: User[] = [];
      
      for (const friendId of friendIds) {
        const user = await this.getUser(friendId);
        if (user) friendUsers.push(user);
      }
      
      return friendUsers;
    } catch (error) {
      console.error('Error getting friends by user ID:', error);
      return [];
    }
  }

  // Friend request link operations
  async createFriendRequestLink(userId: number, token: string): Promise<FriendRequestLink> {
    try {
      // Get the next ID
      const counterDoc = await adminFirestore.collection('counters').doc('friendRequestLinks').get();
      let nextId = 1;
      
      if (counterDoc.exists) {
        nextId = counterDoc.data()?.nextId || 1;
      }
      
      // Set expiration date to 7 days from now
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create the link document
      const link: FriendRequestLink = {
        id: nextId,
        userId,
        token,
        isUsed: false,
        createdAt: now,
        expiresAt
      };
      
      await friendRequestLinksCollection.doc(nextId.toString()).set(link);
      
      // Update the counter
      await adminFirestore.collection('counters').doc('friendRequestLinks').set({
        nextId: nextId + 1
      });
      
      return link;
    } catch (error) {
      console.error('Error creating friend request link:', error);
      throw error;
    }
  }

  async getFriendRequestLinkByToken(token: string): Promise<FriendRequestLink | undefined> {
    try {
      const now = new Date();
      
      const doc = await friendRequestLinksCollection
        .where('token', '==', token)
        .where('isUsed', '==', false)
        .limit(1)
        .get();
      
      if (doc.empty) return undefined;
      
      const link = this.convertTimestamps(doc.docs[0].data()) as FriendRequestLink;
      
      // Check if link is expired
      if (link.expiresAt < now) return undefined;
      
      return link;
    } catch (error) {
      console.error('Error getting friend request link by token:', error);
      return undefined;
    }
  }

  async markFriendRequestLinkAsUsed(id: number): Promise<FriendRequestLink | undefined> {
    try {
      const linkDoc = await friendRequestLinksCollection.where('id', '==', id).limit(1).get();
      if (linkDoc.empty) return undefined;
      
      const docId = linkDoc.docs[0].id;
      await friendRequestLinksCollection.doc(docId).update({ isUsed: true });
      
      const updatedDoc = await friendRequestLinksCollection.doc(docId).get();
      return this.convertTimestamps(updatedDoc.data()) as FriendRequestLink;
    } catch (error) {
      console.error('Error marking friend request link as used:', error);
      return undefined;
    }
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      // Get the next ID
      const counterDoc = await adminFirestore.collection('counters').doc('notifications').get();
      let nextId = 1;
      
      if (counterDoc.exists) {
        nextId = counterDoc.data()?.nextId || 1;
      }
      
      // Create the notification document
      const notification: Notification = { 
        ...notificationData, 
        id: nextId,
        timestamp: new Date(),
        isRead: false
      };
      
      await notificationsCollection.doc(nextId.toString()).set(notification);
      
      // Update the counter
      await adminFirestore.collection('counters').doc('notifications').set({
        nextId: nextId + 1
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      const snapshot = await notificationsCollection
        .where('userId', '==', userId)
        .get();
      
      const notifications = snapshot.docs.map(doc => 
        this.convertTimestamps(doc.data()) as Notification
      );
      
      // Sort by timestamp descending
      return notifications.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      console.error('Error getting notifications by user:', error);
      return [];
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const notificationDoc = await notificationsCollection.where('id', '==', id).limit(1).get();
      if (notificationDoc.empty) return undefined;
      
      const docId = notificationDoc.docs[0].id;
      await notificationsCollection.doc(docId).update({ isRead: true });
      
      const updatedDoc = await notificationsCollection.doc(docId).get();
      return this.convertTimestamps(updatedDoc.data()) as Notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return undefined;
    }
  }
}