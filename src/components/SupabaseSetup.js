import React, { useState } from 'react';
import { supabase, testSupabaseConnection } from '../supabase';

const SupabaseSetup = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const totalSteps = 4;

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Override supabase config temporarily
      const tempSupabase = {
        ...supabase,
        supabaseUrl: projectUrl
      };
      
      // Test connection
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const copySchema = () => {
    const schema = `
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
-- WARNING: Enable these in production with proper policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
    `;
    
    navigator.clipboard.writeText(schema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 1: Create a Supabase Account</h2>
            <p>First, you need a free Supabase account:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase.com</a> and sign up</li>
              <li>Click "New Project" to create a new project</li>
              <li>Name your project "InfluencerConnect" (or any name)</li>
              <li>Set a database password (save it somewhere secure)</li>
              <li>Choose a region close to you</li>
              <li>Click "Create new project"</li>
            </ol>
            <p className="text-sm text-gray-600">Wait for your project to be created (this takes about 1 minute)</p>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 2: Set Up Database Tables</h2>
            <p>Now, you need to set up the database schema:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>In your Supabase dashboard, go to the "SQL Editor" tab</li>
              <li>Click "New query"</li>
              <li>Click the button below to copy the schema SQL</li>
              <li>Paste it into the SQL Editor</li>
              <li>Click "Run" to execute the SQL and create your tables</li>
            </ol>
            <button
              onClick={copySchema}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors w-full"
            >
              {copied ? "✓ Copied!" : "Copy Schema SQL"}
            </button>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 3: Get Your API Keys</h2>
            <p>Now, get your API credentials:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>In Supabase dashboard, go to "Project Settings" (gear icon)</li>
              <li>Click on "API" in the sidebar</li>
              <li>Under "Project URL", copy the URL</li>
              <li>Under "Project API keys", copy the "anon public" key</li>
            </ol>
            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anon Public Key
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGci..."
                  className="w-full p-2 border border-gray-300 rounded"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 4: Update Your .env File</h2>
            <p>Update your .env file with the credentials:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Open the file <code className="bg-gray-100 p-1 rounded">my-react-app/.env</code></li>
              <li>Replace <code className="bg-gray-100 p-1 rounded">REACT_APP_SUPABASE_URL</code> with your Project URL</li>
              <li>Replace <code className="bg-gray-100 p-1 rounded">REACT_APP_SUPABASE_ANON_KEY</code> with your Anon Key</li>
              <li>Save the file</li>
              <li>Restart the application</li>
            </ol>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono whitespace-pre-wrap">
{`# Supabase Configuration
REACT_APP_SUPABASE_URL=${projectUrl || 'https://your-project-id.supabase.co'}
REACT_APP_SUPABASE_ANON_KEY=${anonKey || 'your-anon-key-here'}`}
            </div>
            <button
              onClick={testConnection}
              disabled={testing}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors w-full flex items-center justify-center"
            >
              {testing ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing Connection...
                </>
              ) : "Test Connection"}
            </button>
            {testResult && (
              <div className={`p-3 rounded text-sm ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResult.success ? (
                  <p>✅ Connection successful! You're ready to use the app.</p>
                ) : (
                  <p>❌ Connection failed: {testResult.message}</p>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Supabase Setup Wizard</h1>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div 
                  key={index}
                  className={`flex-1 h-2 rounded-full ${step > index ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Step {step} of {totalSteps}
            </div>
          </div>
          
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className={`px-4 py-2 rounded ${step === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
              disabled={step === totalSteps}
              className={`px-4 py-2 rounded ${step === totalSteps ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetup; 