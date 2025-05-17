import * as crypto from 'crypto';
import { storage } from './storage';

// Helper function to create pre-saved friends for child accounts
export async function addPreSavedFriendsForChild(childId: number) {
  try {
    // Check if KidChat Guide exists, if not create it
    let kidGuide = await storage.getUserByUsername('kidschat_guide');
    if (!kidGuide) {
      kidGuide = await storage.createUser({
        username: 'kidschat_guide',
        password: crypto.randomBytes(20).toString('hex'),
        name: 'KidChat Guide',
        isParent: false,
        parentId: null,
        status: 'online',
        avatarColor: '#FF9500'
      });
      
      console.log('Created KidChat Guide friend');
    }
    
    // Check if Fun Bot exists, if not create it
    let funBot = await storage.getUserByUsername('fun_bot');
    if (!funBot) {
      funBot = await storage.createUser({
        username: 'fun_bot',
        password: crypto.randomBytes(20).toString('hex'),
        name: 'Fun Bot',
        isParent: false,
        parentId: null,
        status: 'online',
        avatarColor: '#4CAF50'
      });
      
      console.log('Created Fun Bot friend');
    }
    
    // Create friend connections between child and guide
    await storage.createFriendRequest({
      userId: kidGuide.id,
      friendId: childId,
      status: 'approved'
    });
    
    // Create friend connections between child and fun bot
    await storage.createFriendRequest({
      userId: funBot.id,
      friendId: childId,
      status: 'approved'
    });
    
    // Send welcome message from guide to child
    await storage.createMessage({
      senderId: kidGuide.id,
      receiverId: childId,
      content: 'Welcome to KidChat! I\'m your guide. If you have any questions about how to use the app, just message me here!'
    });
    
    // Send welcome message from fun bot to child
    await storage.createMessage({
      senderId: funBot.id,
      receiverId: childId,
      content: 'Hello! I\'m Fun Bot! I can tell you jokes, play games, and share fun facts. Just ask me for a joke or a fun fact to get started!'
    });
    
    console.log('Added pre-saved friends for child account:', childId);
  } catch (error) {
    console.error('Error adding pre-saved friends:', error);
  }
}