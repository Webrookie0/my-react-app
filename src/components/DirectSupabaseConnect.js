import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const DirectSupabaseConnect = ({ onConnected }) => {
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setConnecting(true);

    try {
      // Validate inputs
      if (!projectUrl.includes('supabase.co') || !anonKey.startsWith('eyJ')) {
        setError('Please enter valid Supabase credentials');
        setConnecting(false);
        return;
      }

      // Test connection with the provided credentials
      const testClient = createClient(projectUrl, anonKey);
      
      // Try to query
      const { error: queryError } = await testClient
        .from('users')
        .select('count')
        .limit(1)
        .maybeSingle();
      
      // Save working credentials to localStorage
      localStorage.setItem('SUPABASE_URL', projectUrl);
      localStorage.setItem('SUPABASE_KEY', anonKey);
      
      // If there's a query error about missing table, that's actually OK
      // It means the connection worked but the schema needs to be created
      if (queryError && 
          !queryError.message.includes('does not exist') && 
          !queryError.message.includes('not found')) {
        throw new Error(`Database error: ${queryError.message}`);
      }
      
      // Success!
      setSuccess(true);
      setTimeout(() => {
        if (onConnected) onConnected(projectUrl, anonKey);
      }, 1500);
      
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Error connecting to Supabase');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Connect to Supabase
        </h2>
        
        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
          <p className="font-medium mb-2">Important:</p>
          <p className="text-sm">
            Your Supabase URL and key are saved only in your browser's localStorage. 
            They are not sent to any server except Supabase itself.
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-green-600 mb-2">Connection Successful!</h3>
            <p>Reloading application...</p>
          </div>
        ) : (
          <form onSubmit={handleConnect}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://your-project.supabase.co"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Supabase dashboard under Project Settings → API
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supabase Anon Key
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Supabase dashboard under Project Settings → API → Project API Keys
              </p>
            </div>
            
            <button
              type="submit"
              disabled={connecting}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {connecting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : "Connect to Supabase"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DirectSupabaseConnect; 