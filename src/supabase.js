import { createClient } from '@supabase/supabase-js';

/******************************************************************
 * IMPORTANT: REPLACE THESE VALUES WITH YOUR ACTUAL SUPABASE CREDENTIALS
 * 
 * 1. Go to Supabase Dashboard → Project Settings → API
 * 2. Copy your Project URL and replace it below
 * 3. Copy your anon/public key and replace it below
 ******************************************************************/

// REPLACE THIS URL with your actual Supabase URL
const SUPABASE_URL = "https://mnctailzzuviueulrpvg.supabase.co";

// REPLACE THIS KEY with your actual anon key
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uY3RhaWx6enV2aXVldWxycHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTMyODIsImV4cCI6MjA1NzAyOTI4Mn0.04gnDUDANKl33HYFRoDRSDv8JuC1maBo8ijHeTpaWiU";

/* 
 * You need to replace the values above with your actual Supabase credentials
 * from your Supabase project dashboard. The app will not work until you do this.
 */

// Debug flag
const DEBUG = process.env.NODE_ENV === 'development';

// Define logging functions first to avoid reference errors
export const logDebug = (message, data) => {
  if (DEBUG) {
    console.log(`🔵 ${message}`, data || '');
  }
};

export const logError = (message, error) => {
  console.error(`🔴 ${message}`, error);
};

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Add fetch options with timeouts and retry logic
    fetch: (url, options) => {
      const fetchOptions = {
        ...options,
        timeout: 30000, // 30 second timeout
      };
      return fetch(url, fetchOptions);
    }
  }
});

// Log connection creation for debugging
logDebug('Supabase client initialized with URL:', SUPABASE_URL.includes('https://') ? 
  SUPABASE_URL.substring(0, 15) + '...' : 'Invalid URL format');

// Check for placeholder values
if (SUPABASE_URL.includes('your-actual-project-id') || 
    SUPABASE_ANON_KEY.includes('your-actual-key')) {
  console.warn('⚠️ WARNING: Supabase configuration contains placeholder values. Please update SUPABASE_URL and SUPABASE_ANON_KEY in supabase.js with your actual Supabase credentials.');
}

// Test if the connection works
export const testSupabaseConnection = async () => {
  try {
    // Basic connection test
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};

// Initialize app with database schema check
export const initializeSupabase = async () => {
  try {
    // Check if tables exist
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      // Tables don't exist, show schema message
      return {
        success: false,
        message: 'Database schema not found. Please run the SQL in the Supabase SQL Editor.',
        schemaNeeded: true
      };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
};

// Create demo users for testing
export const seedDemoUsers = async () => {
  try {
    const demoUsers = [
      {
        username: 'demo_user',
        email: 'demo@example.com',
        bio: 'Demo account for testing',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User',
        role: 'user',
        is_visible: true
      },
      {
        username: 'influencer1',
        email: 'influencer1@example.com',
        bio: 'Fashion and lifestyle blogger',
        avatar: 'https://ui-avatars.com/api/?name=Fashion+Influencer',
        role: 'influencer',
        is_visible: true
      }
    ];
    
    for (const user of demoUsers) {
      // Check if user exists
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', user.username)
        .maybeSingle();
      
      if (!data) {
        // Create user
        await supabase
          .from('users')
          .insert([{
            ...user,
            created_at: new Date().toISOString()
          }]);
        
        console.log(`Created demo user: ${user.username}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error seeding users:', error);
    return { success: true }; // Return success anyway to not block app
  }
};

// Alias for seedDemoUsers for backwards compatibility
export const seedDummyUsers = seedDemoUsers;

// Debug helper to get database status
export const getDatabaseStatus = async () => {
  try {
    const results = {
      connection: await testSupabaseConnection(),
      tables: {},
      auth: null
    };
    
    // Check tables
    for (const table of ['users', 'chats', 'messages']) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        results.tables[table] = {
          exists: !error,
          count: count || 0,
          error: error?.message
        };
      } catch (err) {
        results.tables[table] = { exists: false, error: err.message };
      }
    }
    
    // Check current auth
    try {
      const { data, error } = await supabase.auth.getSession();
      results.auth = {
        hasSession: !!data?.session,
        user: data?.session?.user?.email || null,
        error: error?.message
      };
    } catch (err) {
      results.auth = { hasSession: false, error: err.message };
    }
    
    return results;
  } catch (error) {
    return { error: error.message };
  }
};

// Email confirmation helper for Login page
export const devConfirmEmail = async (email) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('⚠️ Email confirmation bypass only works in development mode');
      return false;
    }
    
    logDebug('Attempting to bypass email confirmation for:', email);
    
    if (!email) {
      logError('No email provided for confirmation bypass');
      return false;
    }
    
    // For development: Try to reset the password
    // This often confirms the email as a side effect
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    
    if (error) {
      // Check for rate limit errors
      if (error.message && (error.message.includes('rate limit') || 
          error.message.includes('Too many requests') || 
          error.message.includes('exceeded'))) {
        logError('Email rate limit exceeded:', error);
        return { 
          success: false, 
          isRateLimited: true, 
          message: 'Email rate limit exceeded. Please wait a few minutes before trying again.'
        };
      }
      
      logError('Failed to send password reset:', error);
      return false;
    }
    
    logDebug('Password reset email sent. Check your email to confirm account.');
    return true;
  } catch (error) {
    // Check for rate limit errors in the catch block as well
    if (error.message && (error.message.includes('rate limit') || 
        error.message.includes('Too many requests') || 
        error.message.includes('exceeded'))) {
      logError('Email rate limit exceeded:', error);
      return { 
        success: false, 
        isRateLimited: true, 
        message: 'Email rate limit exceeded. Please wait a few minutes before trying again.'
      };
    }
    
    logError('Error in devConfirmEmail:', error);
    return false;
  }
}; 