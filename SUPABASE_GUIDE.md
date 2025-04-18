# Supabase Integration Guide

This document explains how to easily connect your application to Supabase.

## 1. Get Your Supabase Credentials

1. Go to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to Project Settings → API
4. Find the following information:
   - **Project URL** (under "Project URL")
   - **anon/public** key (under "Project API keys")

## 2. Update Your Configuration

Open the file `src/supabase.js` and replace these values:

```javascript
// REPLACE THIS URL with your actual Supabase URL
const SUPABASE_URL = "https://your-project-id.supabase.co";

// REPLACE THIS KEY with your actual anon key
const SUPABASE_ANON_KEY = "your-anon-key";
```

## 3. Set Up Your Database Schema

Run these SQL commands in the Supabase SQL Editor (SQL → New query):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bio TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  social_links JSONB DEFAULT '{}'::jsonb,
  interests TEXT[] DEFAULT '{}',
  location TEXT,
  is_visible BOOLEAN DEFAULT TRUE
);

-- Create Chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  participants UUID[] NOT NULL,
  name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE
);

-- Create index for participants
CREATE INDEX IF NOT EXISTS chats_participants_idx ON chats USING GIN (participants);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

-- Create index for chat_id
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON messages;

-- Create policies for each table
CREATE POLICY "Public profiles are viewable by everyone" ON users
  FOR SELECT USING (is_visible = TRUE);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Users can view their own chats" ON chats
  FOR SELECT USING (auth.uid()::TEXT = ANY(SELECT auth_id::TEXT FROM users WHERE id = ANY(participants)));

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own chats" ON chats
  FOR UPDATE USING (auth.uid()::TEXT = ANY(SELECT auth_id::TEXT FROM users WHERE id = ANY(participants)));

CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (chat_id IN (SELECT id FROM chats WHERE auth.uid()::TEXT = ANY(SELECT auth_id::TEXT FROM users WHERE id = ANY(participants))));

CREATE POLICY "Users can insert messages to their chats" ON messages
  FOR INSERT WITH CHECK (chat_id IN (SELECT id FROM chats WHERE auth.uid()::TEXT = ANY(SELECT auth_id::TEXT FROM users WHERE id = ANY(participants))));

-- Set up a trigger to update the last_message and last_message_time in chats
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE OR REPLACE FUNCTION update_chat_on_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET last_message = NEW.content,
      last_message_time = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_on_message();
```

## 4. Enable Email Confirmations (Optional)

For easier development and testing:

1. Go to Authentication → Settings
2. Scroll to "Email Auth"
3. Uncheck "Enable email confirmations"
4. Save changes

## 5. Demo User Accounts

The app comes with built-in demo users:

- Username: `fashion_influencer`, Password: `password123`
- Username: `tech_reviewer`, Password: `password123`

## 6. Troubleshooting

If you encounter connection issues:

1. **Check your credentials**: Make sure SUPABASE_URL and SUPABASE_ANON_KEY are correct
2. **Check if tables exist**: Run the SQL script if tables don't exist
3. **Network issues**: Make sure you have internet connectivity
4. **CORS issues**: Make sure your Supabase project allows requests from your domain

For additional help, check the [Supabase documentation](https://supabase.com/docs). 