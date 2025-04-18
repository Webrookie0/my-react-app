import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Get all users except the current user
export const getUsers = async (currentUserId) => {
  try {
    console.log('🔍 Fetching all users except current user:', currentUserId);
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach(doc => {
      const userData = doc.data();
      if (doc.id !== currentUserId) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    console.log(`✅ Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error('❌ Error getting users:', error);
    
    // For testing/demo purposes, return dummy users if Firebase fails
    return [
      { 
        id: 'dummy1', 
        username: 'fashion_influencer',
        email: 'fashion@example.com',
        bio: 'Fashion and lifestyle blogger',
        avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        isDummy: true
      },
      { 
        id: 'dummy2', 
        username: 'tech_reviewer',
        email: 'tech@example.com',
        bio: 'Tech reviews and unboxing',
        avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        isDummy: true
      }
    ];
  }
};

// Search users with more flexible matching (case-insensitive, partial matches)
export const searchUsers = async (searchTerm, currentUserId) => {
  try {
    console.log('🔍 Searching users with term:', searchTerm);
    
    // Get all users from Firestore
    const usersRef = collection(db, 'users');
    
    // If no search term, show all visible users (limited to 20 recent ones)
    if (!searchTerm || !searchTerm.trim()) {
      // First try to get users with isVisible=true flag
      let q = query(usersRef, where('isVisible', '==', true));
      let querySnapshot = await getDocs(q);
      
      // If no visible users found, get all users as fallback
      if (querySnapshot.empty) {
        console.log('⚠️ No users with isVisible flag found, getting all users');
        querySnapshot = await getDocs(usersRef);
      }
      
      const results = [];
      let count = 0;
      
      // Process the results - add them all to an array first
      const allUsers = [];
      querySnapshot.forEach(doc => {
        if (doc.id === currentUserId) return; // Skip current user
        
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          ...userData,
          timestamp: userData.createdAt ? new Date(userData.createdAt).getTime() : 0
        });
      });
      
      // Sort by most recent first (Instagram-like behavior)
      allUsers.sort((a, b) => b.timestamp - a.timestamp);
      
      // Take only the first 20
      return allUsers.slice(0, 20);
    }
    
    // When search term is provided, perform advanced search
    const searchTermLower = searchTerm.toLowerCase();
    
    // First try specific query for username field for better performance
    let q = query(usersRef, where('username', '>=', searchTermLower), where('username', '<=', searchTermLower + '\uf8ff'));
    let querySnapshot = await getDocs(q);
    
    // If no results with the specific query, fall back to getting all users and filtering
    if (querySnapshot.empty) {
      querySnapshot = await getDocs(usersRef);
    }
    
    const results = [];
    
    querySnapshot.forEach(doc => {
      if (doc.id === currentUserId) return; // Skip current user
      
      const userData = doc.data();
      
      // Skip users that are explicitly set as not visible (unless they're in search results)
      if (userData.isVisible === false) return;
      
      // Calculate match score for ranking results (Instagram-like relevance)
      let matchScore = 0;
      
      // Check for matches in username, bio, role, or interests
      if (userData.username) {
        // Exact username match gets highest score
        if (userData.username.toLowerCase() === searchTermLower) {
          matchScore += 100;
        }
        // Username starts with search term gets high score
        else if (userData.username.toLowerCase().startsWith(searchTermLower)) {
          matchScore += 50;
        }
        // Username contains search term gets medium score
        else if (userData.username.toLowerCase().includes(searchTermLower)) {
          matchScore += 25;
        }
      }
      
      // Bio match
      if (userData.bio && userData.bio.toLowerCase().includes(searchTermLower)) {
        matchScore += 10;
      }
      
      // Role match
      if (userData.role && userData.role.toLowerCase().includes(searchTermLower)) {
        matchScore += 15;
      }
      
      // Interests match
      if (userData.interests && userData.interests.some(interest => 
        interest.toLowerCase().includes(searchTermLower)
      )) {
        matchScore += 20;
      }
      
      // Only include results with a match
      if (matchScore > 0) {
        results.push({
          id: doc.id,
          ...userData,
          matchScore // Include the match score for sorting
        });
      }
    });
    
    // Sort by match score (highest first)
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`✅ Search found ${results.length} users matching: ${searchTerm}`);
    return results;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    throw error;
  }
};

// Get or create a chat between two users
export const getOrCreateChat = async (user1Id, user2Id) => {
  try {
    console.log('🔄 Getting or creating chat between users:', user1Id, user2Id);
    
    // Create a unique chat ID (alphabetically ordered user IDs)
    const chatUsers = [user1Id, user2Id].sort();
    const chatId = `chat_${chatUsers[0]}_${chatUsers[1]}`;
    
    // Check if the chat already exists
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (!chatDoc.exists()) {
      console.log('➕ Creating new chat:', chatId);
      // Create new chat
      await setDoc(doc(db, 'chats', chatId), {
        users: chatUsers,
        participants: [user1Id, user2Id],
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null
      });
    } else {
      console.log('✅ Chat already exists:', chatId);
    }
    
    return chatId;
  } catch (error) {
    console.error('❌ Error getting or creating chat:', error);
    throw error;
  }
};

// Send a message to a chat
export const sendMessage = async (chatId, senderId, content) => {
  try {
    console.log('📤 Sending message to chat:', chatId);
    
    // Add message to the messages subcollection
    const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId,
      content,
      timestamp: serverTimestamp()
    });
    
    // Update the chat document with last message info
    await setDoc(doc(db, 'chats', chatId), {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId
    }, { merge: true });
    
    console.log('✅ Message sent:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};

// Get messages for a chat
export const getMessages = async (chatId) => {
  try {
    console.log('📩 Getting messages for chat:', chatId);
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
      });
    });
    
    console.log(`✅ Found ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    throw error;
  }
};

// Subscribe to messages for a chat (real-time updates)
export const subscribeToMessages = (chatId, callback) => {
  try {
    console.log('🔔 Setting up message subscription for chat:', chatId);
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    // Set up real-time listener
    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach(doc => {
        // Convert Firebase timestamp to a format that can be safely used
        let timestamp = doc.data().timestamp;
        if (timestamp && typeof timestamp.toDate === 'function') {
          timestamp = timestamp.toDate().toISOString();
        } else if (timestamp) {
          // Handle timestamp as seconds or milliseconds
          const timestampNum = typeof timestamp === 'number' ? timestamp : parseInt(timestamp);
          timestamp = new Date(timestampNum * (timestampNum < 1000000000 ? 1000 : 1)).toISOString();
        } else {
          timestamp = new Date().toISOString();
        }
        
        messages.push({
          id: doc.id,
          ...doc.data(),
          timestamp
        });
      });
      
      // Ensure messages are properly sorted by timestamp
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log(`📩 Real-time update: ${messages.length} messages`);
      callback(messages);
    }, error => {
      console.error("Error getting messages:", error);
      // Return empty array on error to avoid breaking the UI
      callback([]);
    });
  } catch (error) {
    console.error('❌ Error subscribing to messages:', error);
    // Return a function that does nothing on error to match the expected return type
    return () => {};
  }
};

// Get all chats for a user
export const getUserChats = async (userId) => {
  try {
    console.log('📋 Getting chats for user:', userId);
    
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    const chats = [];
    querySnapshot.forEach(doc => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Found ${chats.length} chats`);
    return chats;
  } catch (error) {
    console.error('❌ Error getting user chats:', error);
    throw error;
  }
}; 