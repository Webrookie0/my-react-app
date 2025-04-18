import { 
  collection, 
  getDocs, 
  query, 
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// Seed dummy influencer users for testing
export const seedDummyUsers = async () => {
  console.log('🌱 Checking if we need to seed dummy users...');
  
  const dummyUsers = [
    {
      username: 'fashion_influencer',
      email: 'fashion@example.com',
      bio: 'Fashion and lifestyle blogger with over 100K followers on Instagram',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      role: 'influencer',
      followers: 105000,
      following: 820,
      socialLinks: {
        instagram: 'fashion_influencer',
        twitter: 'fashion_tweets',
        youtube: 'FashionChannel'
      },
      interests: ['Fashion', 'Beauty', 'Lifestyle'],
      location: 'New York, USA',
      isDummy: true
    },
    {
      username: 'tech_reviewer',
      email: 'tech@example.com',
      bio: 'In-depth tech reviews and unboxing videos',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      role: 'influencer',
      followers: 750000,
      following: 312,
      socialLinks: {
        instagram: 'tech_reviewer',
        twitter: 'tech_tweets',
        youtube: 'TechReviews'
      },
      interests: ['Technology', 'Gadgets', 'Gaming'],
      location: 'San Francisco, USA',
      isDummy: true
    },
    {
      username: 'travel_blogger',
      email: 'travel@example.com',
      bio: 'Full-time traveler documenting adventures around the world',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      role: 'influencer',
      followers: 320000,
      following: 567,
      socialLinks: {
        instagram: 'travel_blogger',
        twitter: 'travel_tweets',
        youtube: 'TravelVlogs'
      },
      interests: ['Travel', 'Adventure', 'Photography'],
      location: 'Nomadic',
      isDummy: true
    },
    {
      username: 'fitness_coach',
      email: 'fitness@example.com',
      bio: 'Certified personal trainer sharing workout tips and nutrition advice',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      role: 'influencer',
      followers: 420000,
      following: 378,
      socialLinks: {
        instagram: 'fitness_coach',
        twitter: 'fitness_tweets',
        youtube: 'FitnessWithMe'
      },
      interests: ['Fitness', 'Nutrition', 'Wellness'],
      location: 'Los Angeles, USA',
      isDummy: true
    },
    {
      username: 'food_critic',
      email: 'food@example.com',
      bio: 'Food enthusiast exploring the best restaurants and sharing recipes',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      role: 'influencer',
      followers: 250000,
      following: 683,
      socialLinks: {
        instagram: 'food_critic',
        twitter: 'food_tweets',
        youtube: 'FoodieChannel'
      },
      interests: ['Food', 'Cooking', 'Restaurants'],
      location: 'Chicago, USA',
      isDummy: true
    }
  ];

  // Check if dummy users exist
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isDummy', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.size < dummyUsers.length) {
      console.log(`🌱 Found ${querySnapshot.size} dummy users, adding more...`);
      
      // Get existing dummy usernames to avoid duplicates
      const existingUsernames = [];
      querySnapshot.forEach(doc => {
        existingUsernames.push(doc.data().username);
      });
      
      // Add users that don't exist yet
      for (const userData of dummyUsers) {
        if (!existingUsernames.includes(userData.username)) {
          // Create a document with auto-generated ID
          await addDoc(collection(db, 'users'), {
            ...userData,
            createdAt: serverTimestamp(),
            passwordHash: 'dummy-hash-for-password123' // Don't worry about real auth for dummy users
          });
          console.log(`✅ Added dummy user: ${userData.username}`);
        }
      }
    } else {
      console.log('✅ All dummy users already exist in the database');
    }
    
    return { success: true, message: `Database has ${querySnapshot.size} dummy users` };
  } catch (error) {
    console.error('❌ Error seeding dummy users:', error);
    return { success: false, message: error.message };
  }
};

// Search users with improved matching
export const searchUsers = async (searchTerm, currentUserId) => {
  try {
    if (!searchTerm) return [];
    
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const searchTermLower = searchTerm.toLowerCase();
    const results = [];
    
    querySnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Skip current user
      if (doc.id === currentUserId) return;
      
      // Check username match (case insensitive and partial matching)
      if (userData.username && userData.username.toLowerCase().includes(searchTermLower)) {
        results.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Test Firebase connection and functionality
export const testFirebaseConnection = async () => {
  console.log('🧪 Testing Firebase connection...');
  
  try {
    // Test Firestore connection
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    console.log(`✅ Connected to Firestore. Found ${querySnapshot.size} users.`);
    
    // Seed dummy users
    await seedDummyUsers();
    
    // Current user
    console.log('👤 Current user:', auth.currentUser ? auth.currentUser.uid : 'None');
    
    // Count dummy users
    const dummyUsersQuery = query(usersRef, where('isDummy', '==', true));
    const dummySnapshot = await getDocs(dummyUsersQuery);
    console.log(`👥 Found ${dummySnapshot.size} dummy users`);
    
    return { 
      success: true, 
      message: `Firebase connection successful. Found ${querySnapshot.size} total users and ${dummySnapshot.size} dummy users.` 
    };
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return { success: false, message: error.message };
  }
};

// Export this for global access in the browser's developer console
window.testFirebaseConnection = testFirebaseConnection;
window.seedDummyUsers = seedDummyUsers; 