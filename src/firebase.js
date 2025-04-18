import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Your Firebase configuration
// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyD6jSs8vJtla9InfluencerConnect-key",
  authDomain: "influencer-connect-app.firebaseapp.com",
  projectId: "influencer-connect-app",
  storageBucket: "influencer-connect-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890",
  measurementId: "G-MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// Add a function to ensure a user is properly formatted for the chat system
export const ensureUserIsVisible = async (userId, userData) => {
  try {
    console.log('🔍 Checking if user is properly visible in chat:', userId);
    
    // Check if the user document exists and has all required fields
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User document does not exist, creating it');
      
      // If it doesn't exist, create it with proper format
      const defaultUserData = {
        username: userData.username || userData.email.split('@')[0],
        email: userData.email,
        bio: userData.bio || 'InfluencerConnect User',
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.username || userData.email.split('@')[0]}&background=random`,
        role: userData.role || 'user',
        followers: userData.followers || 0,
        following: userData.following || 0,
        socialLinks: userData.socialLinks || {},
        interests: userData.interests || [],
        createdAt: serverTimestamp(),
        isVisible: true // Important flag to ensure user appears in searches
      };
      
      await setDoc(userRef, defaultUserData);
      console.log('✅ Created properly formatted user document');
      
      return { success: true, message: 'User profile created and now visible in chat' };
    }
    
    // Make sure user has the isVisible flag
    const existingData = userDoc.data();
    if (existingData.isVisible !== true) {
      console.log('🔄 Updating user visibility flag');
      
      // Update the document to ensure visibility
      await updateDoc(userRef, {
        isVisible: true,
        // Ensure other required fields exist
        username: existingData.username || userData.email.split('@')[0],
        bio: existingData.bio || 'InfluencerConnect User',
        avatar: existingData.avatar || `https://ui-avatars.com/api/?name=${existingData.username || userData.email.split('@')[0]}&background=random`,
      });
      
      console.log('✅ Updated user visibility flag');
      return { success: true, message: 'User is now visible in chat' };
    }
    
    console.log('✅ User is already properly formatted and visible');
    return { success: true, message: 'User is already visible in chat' };
    
  } catch (error) {
    console.error('❌ Error ensuring user visibility:', error);
    return { success: false, message: error.message };
  }
};

export { auth, db }; 