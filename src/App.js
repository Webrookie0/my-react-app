import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext';
import { initializeSupabase, testSupabaseConnection } from './supabase';
import { verifyDatabaseSetup, seedDemoUsers } from './utils/setupSupabase';

// Components
import SupabaseDebug from './components/SupabaseDebug';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route Component that uses the Supabase Auth Context
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSupabaseAuth();
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [setupStatus, setSetupStatus] = useState({ step: 'connecting', message: 'Connecting to Supabase...' });

  // Initialize Supabase when the app starts
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        setSetupStatus({ step: 'connecting', message: 'Connecting to Supabase...' });
        
        // Test connection first
        const connectionTest = await testSupabaseConnection();
        if (!connectionTest.success) {
          setInitError(connectionTest.message);
          setIsInitializing(false);
          return;
        }
        
        // Initialize app
        setSetupStatus({ step: 'initializing', message: 'Initializing Supabase...' });
        const result = await initializeSupabase();
        
        if (!result.success) {
          setInitError(result.message);
          setIsInitializing(false);
          return;
        }
        
        // Seed demo users if needed
        setSetupStatus({ step: 'seeding', message: 'Creating demo users...' });
        await seedDemoUsers();
        
        // Success!
        console.log('✅ Application initialized successfully');
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setInitError(`Error: ${error.message}`);
        setIsInitializing(false);
      }
    };
    
    init();
  }, []);
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">{setupStatus.message}</p>
      </div>
    );
  }
  
  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <div className="max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-800 mb-4">{initError}</p>
          
          <div className="bg-gray-100 p-4 rounded text-sm mb-4">
            <p className="font-bold mb-2">How to fix this error:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open the file <code className="bg-gray-200 px-1">src/supabase.js</code></li>
              <li>Replace the placeholder values with your actual Supabase credentials:
                <ul className="list-disc pl-5 mt-1">
                  <li>SUPABASE_URL - Your project URL</li>
                  <li>SUPABASE_ANON_KEY - Your anon/public key</li>
                </ul>
              </li>
              <li>Save the file</li>
              <li>Restart the application</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm mb-4">
            <p className="font-medium text-yellow-800 mb-2">Don't have Supabase credentials?</p>
            <ol className="list-decimal pl-5 text-yellow-700">
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a> and create an account</li>
              <li>Create a new project</li>
              <li>Go to Project Settings → API to get your credentials</li>
            </ol>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <SupabaseAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <SupabaseDebug />
        </div>
      </Router>
    </SupabaseAuthProvider>
  );
}

export default App;
