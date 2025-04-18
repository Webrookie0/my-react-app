import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const SupabaseConnectionStatus = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [configIssue, setConfigIssue] = useState(false);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    try {
      setStatus('checking');
      
      // Check if the URL and key look like placeholders
      const supabaseUrl = supabase?.supabaseUrl || '';
      const supabaseKey = supabase?.supabaseKey || '';
      
      if (supabaseUrl.includes('your-project-id') || 
          supabaseKey.includes('your-anon-key')) {
        setConfigIssue(true);
        setStatus('error');
        setError('Supabase credentials contain placeholder values');
        return;
      }
      
      // Test actual connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        setStatus('error');
        setError(error.message);
        return;
      }
      
      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };
  
  if (status === 'connected') {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        <strong className="font-bold">✅ Connected!</strong>
        <span className="block sm:inline"> Supabase connection is working properly.</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">⚠️ Connection Error!</strong>
        <span className="block sm:inline"> {error}</span>
        
        {configIssue && (
          <div className="mt-2 text-sm">
            <p className="font-medium">Please update your Supabase configuration:</p>
            <ol className="list-decimal ml-5 mt-1">
              <li>Open <code className="bg-red-50 px-1">src/supabase.js</code></li>
              <li>Replace the placeholder values with your actual Supabase URL and anon key</li>
              <li>Save the file and refresh this page</li>
            </ol>
            <p className="mt-2">
              See the <a href="/SUPABASE_GUIDE.md" className="underline" target="_blank">Supabase Guide</a> for more details.
            </p>
          </div>
        )}
        
        <button
          onClick={checkConnection}
          className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
      <span className="block sm:inline">
        <svg className="inline-block animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Checking Supabase connection...
      </span>
    </div>
  );
};

export default SupabaseConnectionStatus; 