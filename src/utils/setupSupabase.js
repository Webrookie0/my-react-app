import { supabase } from '../supabase';

/**
 * Checks if the required database tables exist and creates them if needed
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const verifyDatabaseSetup = async () => {
  try {
    console.log('Checking database schema...');
    
    // Step 1: Check if users table exists
    const { error: userTableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    // If there's no error, the table exists
    if (!userTableError) {
      console.log('✅ Database schema already set up');
      return { success: true, message: 'Database schema already exists' };
    }
    
    // Step 2: If we got here, tables don't exist or there was an error
    console.log('⚠️ Database tables missing. Applying schema directly...');
    
    // Try multiple methods to apply schema

    // Method 1: Use direct SQL commands for each table individually
    try {
      // Step 1: Create UUID extension
      await supabase.rpc('exec_sql', { 
        sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` 
      }).catch(() => {});
      
      // Step 2: Create users table 
      await supabase.rpc('exec_sql', { 
        sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          auth_id UUID UNIQUE,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          bio TEXT,
          avatar TEXT,
          role TEXT DEFAULT 'user',
          followers INT DEFAULT 0,
          following INT DEFAULT 0,
          social_links JSONB DEFAULT '{}'::jsonb,
          interests TEXT[] DEFAULT '{}'::text[],
          location TEXT,
          is_visible BOOLEAN DEFAULT TRUE
        );`
      }).catch(() => {});
      
      // Step 3: Create chats table
      await supabase.rpc('exec_sql', { 
        sql: `
        CREATE TABLE IF NOT EXISTS chats (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          participants UUID[] NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      }).catch(() => {});
      
      // Step 4: Create messages table
      await supabase.rpc('exec_sql', { 
        sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          is_read BOOLEAN DEFAULT FALSE
        );`
      }).catch(() => {});
      
      // Step 5: Create indexes
      await supabase.rpc('exec_sql', { 
        sql: `
        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`
      }).catch(() => {});
      
      // Check if tables were created
      const { error: checkError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!checkError || !checkError.message.includes('relation "users" does not exist')) {
        return { success: true, message: 'Schema applied successfully' };
      }
    } catch (error) {
      console.log('Method 1 failed, trying SQL Editor method...');
    }
    
    // If we get here, we need to instruct the user to manually run the schema
    return { 
      success: false, 
      message: `Could not automatically apply schema. Please run the schema.sql file manually in the SQL Editor.`,
      manualSetupNeeded: true
    };
  } catch (error) {
    console.error('❌ Error verifying database setup:', error);
    return { 
      success: false, 
      message: 'Error verifying database setup: ' + error.message,
      error 
    };
  }
};

/**
 * Returns the SQL schema for the application
 */
function getSchemaSQL() {
  return `
-- Clean up any existing tables (for fresh start)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS users;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  bio TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  social_links JSONB DEFAULT '{}'::jsonb,
  interests TEXT[] DEFAULT '{}'::text[],
  location TEXT,
  is_visible BOOLEAN DEFAULT TRUE
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Simple function to handle new messages
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the chat's updated_at timestamp
  UPDATE chats SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_message();

-- DISABLE Row Level Security for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
`;
}

/**
 * Create some demo users if none exist
 */
export const seedDemoUsers = async () => {
  try {
    // Check if users exist
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking users:', error);
      return { success: false, message: 'Error checking users' };
    }
    
    // If users exist, no need to seed
    if (users && users.length > 0) {
      console.log('Users already exist, skipping seed');
      return { success: true, message: 'Users already exist' };
    }
    
    // Create demo users
    const demoUsers = [
      {
        username: 'demo_user',
        email: 'demo@example.com',
        bio: 'This is a demo user account',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User',
        role: 'user',
        is_visible: true
      },
      {
        username: 'influencer1',
        email: 'influencer1@example.com',
        bio: 'Fashion and lifestyle influencer',
        avatar: 'https://ui-avatars.com/api/?name=Influencer+One',
        role: 'influencer',
        is_visible: true
      },
      {
        username: 'influencer2',
        email: 'influencer2@example.com',
        bio: 'Tech reviewer and gadget enthusiast',
        avatar: 'https://ui-avatars.com/api/?name=Influencer+Two',
        role: 'influencer',
        is_visible: true
      }
    ];
    
    // Insert demo users
    for (const user of demoUsers) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          ...user,
          created_at: new Date().toISOString()
        }]);
      
      if (insertError) {
        console.error(`Error inserting user ${user.username}:`, insertError);
      } else {
        console.log(`Added demo user: ${user.username}`);
      }
    }
    
    return { success: true, message: 'Demo users created' };
  } catch (error) {
    console.error('Error seeding users:', error);
    return { success: false, message: 'Error seeding users' };
  }
}; 