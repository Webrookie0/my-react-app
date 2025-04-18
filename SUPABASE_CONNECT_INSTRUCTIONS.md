# Supabase Connection Instructions

## 1. Edit src/supabase.js

Open the file `src/supabase.js` and replace the placeholder values with your actual Supabase credentials:

```javascript
// REPLACE THIS URL with your actual Supabase URL
const SUPABASE_URL = "https://your-actual-project-id.supabase.co";

// REPLACE THIS KEY with your actual anon key
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here";
```

## 2. Where to Find Your Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Project Settings (gear icon ⚙️) → API
4. Copy the URL under "Project URL"
5. Copy the key under "Project API Keys" → "anon public"

It should look like this:

```javascript
const SUPABASE_URL = "https://abcdefghijklm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...";
```

## 3. Set Up Database Schema

After connecting to Supabase, you need to set up the database schema:

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste this SQL:

```sql
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
```

4. Click "Run" to execute the SQL

## 4. Disable Email Confirmation (Optional)

For easier testing:

1. Go to Authentication → Settings in your Supabase dashboard
2. Scroll down to "Email Auth"
3. Uncheck "Enable email confirmations"
4. Save changes

## 5. Restart Your App

Save all changes and restart your app:

```bash
npm start
```

## Demo Users

The app will automatically create these demo users:
- Username: `demo_user`, Email: `demo@example.com`
- Username: `influencer1`, Email: `influencer1@example.com`

## Still Having Issues?

If you're still encountering connection issues after following these steps:

1. Check your browser console for specific error messages
2. Ensure your Supabase project is active
3. Try using incognito mode to avoid browser cache issues
4. Verify that your network doesn't block connections to Supabase 