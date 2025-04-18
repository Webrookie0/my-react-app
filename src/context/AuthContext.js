import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { auth, db, ensureUserIsVisible } from '../firebase';

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsAuthenticated(true);
        setUser(data.user);

        // Ensure the user is visible in the chat system
        await ensureUserIsVisible(data.user.id, data.user);

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const signup = async (username, email, password) => {
    try {
      setLoading(true);
      console.log('🔄 Starting signup process for:', username, email);
      
      // Check if username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log('❌ Username already exists');
        return { success: false, message: 'Username already exists' };
      }
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      console.log('✅ User created in Firebase Auth:', firebaseUser.uid);
      
      // Create user document in Firestore with isVisible flag
      const userData = {
        username,
        email,
        createdAt: new Date().toISOString(),
        bio: '',
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
        role: 'influencer',
        followers: 0,
        following: 0,
        socialLinks: {
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: ''
        },
        interests: ['Social Media'],
        location: '',
        isVisible: true // Important flag to ensure user appears in search results
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ User document created in Firestore with isVisible flag');
      
      // Ensure the user is visible in the chat system
      await ensureUserIsVisible(firebaseUser.uid, userData);
      
      // Update state
      setUser({
        id: firebaseUser.uid,
        ...userData
      });
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'Email already in use' };
      }
      
      return { success: false, message: error.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 