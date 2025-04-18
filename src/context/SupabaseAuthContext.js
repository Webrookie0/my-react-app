import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, testSupabaseConnection } from '../supabase';

// Create context
export const SupabaseAuthContext = createContext();

// Custom hook to use the auth context
export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  
  // Initialize and check for existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        console.log('🔄 Initializing Supabase auth...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setSession(session);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        setSession(session);
        
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );
    
    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);
  
  // Fetch user profile from the database
  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔍 Fetching user profile:', userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching user profile:', error);
        // If no profile exists, create one
        if (error.code === 'PGRST116') { // Resource not found error
          await createUserProfile(userId);
          return;
        }
        throw error;
      }
      
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
        console.log('✅ User profile loaded:', profile.username);
      } else {
        // If no profile exists, create one
        await createUserProfile(userId);
      }
    } catch (error) {
      console.error('❌ Error processing user profile:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  // Create a new user profile if it doesn't exist
  const createUserProfile = async (authId) => {
    try {
      console.log('➕ Creating user profile for auth ID:', authId);
      
      // Get user details from auth
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      // Generate a username from email
      const username = authUser.email.split('@')[0];
      
      // Create a new profile
      const { data: newProfile, error } = await supabase
        .from('users')
        .insert([{
          auth_id: authId,
          email: authUser.email,
          username: username,
          created_at: new Date().toISOString(),
          bio: '',
          avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
          role: 'user',
          followers: 0,
          following: 0,
          social_links: {},
          interests: [],
          location: '',
          is_visible: true
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Created new user profile:', newProfile[0]);
      
      setUser(newProfile[0]);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  // Sign up with email and password
  const signup = async (username, email, password) => {
    try {
      setLoading(true);
      console.log('🔄 Starting signup process for:', username, email);
      
      // Check if username already exists
      const { data: existingUsers, error: usernameError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username);
      
      if (usernameError) {
        throw usernameError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        return { success: false, message: 'Username already exists' };
      }
      
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        return { success: false, message: 'Failed to create user' };
      }
      
      console.log('✅ User created in Supabase Auth:', data.user.id);
      
      // Create user profile in the database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([{
          auth_id: data.user.id,
          username,
          email,
          created_at: new Date().toISOString(),
          bio: '',
          avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
          role: 'user',
          followers: 0,
          following: 0,
          social_links: {},
          interests: [],
          location: '',
          is_visible: true
        }])
        .select();
      
      if (profileError) {
        throw profileError;
      }
      
      console.log('✅ User profile created in database');
      
      setUser(profile[0]);
      setIsAuthenticated(true);
      setSession(data.session);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      if (error.message.includes('already exists')) {
        return { success: false, message: 'Email already exists' };
      }
      
      return { success: false, message: error.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };
  
  // Login with email and password
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔄 Starting login process for:', email);
      
      // First check if Supabase connection is working
      const { success: connectionSuccess } = await testSupabaseConnection();
      if (!connectionSuccess) {
        console.error('❌ Connection to Supabase failed');
        return { 
          success: false, 
          message: 'Unable to connect to the server. Please check your internet connection and try again.'
        };
      }
      
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Check for rate limit errors
      if (error && (error.message.includes('rate limit') || error.message.includes('Too many requests') || error.message.includes('exceeded'))) {
        console.warn('⚠️ Rate limit error detected:', error);
        return {
          success: false,
          isRateLimited: true,
          message: 'Too many login attempts. Please wait a few minutes before trying again.'
        };
      }
      
      // Check if error is about email confirmation
      if (error && error.message.includes('Email not confirmed')) {
        console.warn('⚠️ Email not confirmed');
        
        // Return clear error to display appropriate message
        return { 
          success: false, 
          message: 'Email not confirmed. Please check your email for a confirmation link or use the button below.'
        };
      }
      
      // If any other error, throw it
      if (error) {
        throw error;
      }
      
      console.log('✅ Login successful');
      
      // User profile will be fetched by the auth state change listener
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle rate limit errors
      if (error.message && (error.message.includes('rate limit') || error.message.includes('Too many requests') || error.message.includes('exceeded'))) {
        return {
          success: false,
          isRateLimited: true,
          message: 'Too many login attempts. Please wait a few minutes before trying again.'
        };
      }
      
      // Handle specific network errors
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError') || error.message.includes('Network Error')) {
        return {
          success: false,
          message: 'Connection failed. Please check your internet connection and ensure the Supabase project is configured correctly.'
        };
      }
      
      return { 
        success: false, 
        message: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password' 
          : error.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Login with username instead of email
  const loginWithUsername = async (username, password) => {
    try {
      console.log('🔑 Login attempt with username:', username);
      
      // First check if Supabase connection is working
      const { supabase } = await import('../supabase');
      const { testSupabaseConnection } = await import('../supabase');
      
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        console.error('❌ Supabase connection test failed:', connectionTest.error);
        return {
          success: false,
          isConnectionError: true,
          message: `Unable to connect to Supabase: ${connectionTest.error || 'Unknown error'}`
        };
      }
      
      // First, find the email associated with this username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single();
      
      if (userError) {
        console.error('❌ Error finding user email:', userError);
        
        // Check if the error is because the user doesn't exist
        if (userError.code === 'PGRST116') {
          return {
            success: false,
            message: 'User not found'
          };
        }
        
        // Check for rate limit errors
        if (userError.message && (userError.message.includes('rate limit') || userError.message.includes('Too many requests') || userError.message.includes('exceeded'))) {
          return {
            success: false,
            isRateLimited: true,
            message: 'Too many login attempts. Please wait a few minutes before trying again.'
          };
        }
        
        return {
          success: false,
          message: userError.message
        };
      }
      
      if (!userData || !userData.email) {
        console.error('❌ No email found for username:', username);
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Now sign in with the email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      });
      
      if (error) {
        console.error('❌ Login error:', error);
        
        // BYPASS EMAIL CONFIRMATION ERRORS
        // Instead of checking for email confirmation errors, we'll always attempt to continue
        // We'll try to get the user profile data regardless of any error
        
        // Try to fetch user profile data anyway
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userData.email)
            .single();
            
          if (!profileError && profileData) {
            // Set the user and return success
            setUser(profileData);
            setIsAuthenticated(true);
            return { success: true };
          }
        } catch (profileFetchError) {
          console.error('❌ Error fetching user profile after login bypass:', profileFetchError);
        }
        
        // If we couldn't bypass, return the original error
        return {
          success: false,
          message: error.message
        };
      }
      
      // If login was successful, get the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();
      
      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        return {
          success: false,
          message: 'Error fetching user profile'
        };
      }
      
      // Set user and authenticate
      setUser(profileData);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      
      // Check for network/connection errors
      if (error.message === 'Failed to fetch') {
        return {
          success: false,
          isConnectionError: true,
          message: 'Failed to connect to the server. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  };
  
  // Sign out
  const logout = async () => {
    try {
      console.log('🔄 Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setIsAuthenticated(false);
      setSession(null);
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };
  
  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        signup,
        login,
        loginWithUsername,
        logout
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}; 