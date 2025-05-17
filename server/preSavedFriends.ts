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
    
    // Create friend connections between child and guide
    await storage.createFriendRequest({
      userId: kidGuide.id,
      friendId: childId,
      status: 'approved'
    });
    
    // Send welcome message from guide to child
    await storage.createMessage({
      senderId: kidGuide.id,
      receiverId: childId,
      content: 'Welcome to KidChat! I\'m your guide. If you have any questions about how to use the app, just message me here!'
    });
    
    console.log('Added pre-saved friends for child account:', childId);
  } catch (error) {
    console.error('Error adding pre-saved friends:', error);
  }
}