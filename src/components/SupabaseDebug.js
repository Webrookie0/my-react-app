import React, { useState, useEffect } from 'react';
import { getDatabaseStatus, testSupabaseConnection, supabase } from '../supabase';

/**
 * Debugging component for Supabase issues
 * Only visible in development mode, helps diagnose connection problems
 */
const SupabaseDebug = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDatabaseStatus();
      setStatus(result);
    } catch (err) {
      setError(err.message || 'Unknown error checking status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only run status check initially if debug panel is visible
    if (isVisible) {
      checkStatus();
    }
  }, [isVisible]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Show Supabase Debug"
      >
        🔧
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 max-h-[80vh] bg-gray-800 text-white p-4 rounded-tl-lg shadow-lg z-50 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Supabase Debug</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <button
            onClick={checkStatus}
            className="bg-blue-600 text-white px-3 py-1 rounded mr-2"
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check Connection'}
          </button>
          
          <button
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                checkStatus();
              } catch (err) {
                setError('Sign out error: ' + err.message);
              }
            }}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="bg-red-700 p-2 rounded text-sm">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {status && (
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-bold border-b border-gray-600 pb-1">Connection</h3>
              <p>Status: {status.connection?.success ? '✅ Connected' : '❌ Failed'}</p>
              <p>URL: {status.connection?.url || 'N/A'}</p>
              {status.connection?.elapsed && <p>Response time: {status.connection.elapsed}ms</p>}
            </div>

            <div>
              <h3 className="font-bold border-b border-gray-600 pb-1">Tables</h3>
              {Object.entries(status.tables || {}).map(([name, info]) => (
                <div key={name} className="py-1">
                  <p>
                    {name}: {info.exists ? '✅' : '❌'} 
                    {info.exists && ` (${info.count} records)`}
                  </p>
                  {info.error && <p className="text-red-400 text-xs">{info.error}</p>}
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-bold border-b border-gray-600 pb-1">Auth</h3>
              <p>Session: {status.auth?.hasSession ? '✅ Active' : '❌ None'}</p>
              <p>User: {status.auth?.user || 'Not logged in'}</p>
              {status.auth?.error && <p className="text-red-400 text-xs">{status.auth.error}</p>}
            </div>
          </div>
        )}

        <div className="pt-2 text-xs text-gray-400">
          <p>
            Common issues:
          </p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Check .env file for correct Supabase URL and key</li>
            <li>Ensure tables are created in the database</li>
            <li>Check if RLS (Row Level Security) is disabled for dev</li>
            <li>Try disabling email confirmation in Supabase dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupabaseDebug; 