import React, { useContext, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SupabaseAuthContext } from '../context/SupabaseAuthContext';
import { devConfirmEmail, supabase } from '../supabase';
import SupabaseConnectionStatus from '../components/SupabaseConnectionStatus';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  
  const { loginWithUsername, isAuthenticated } = useContext(SupabaseAuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowConnectionStatus(false);
    
    try {
      // Check if username is empty
      if (!username.trim()) {
        setError('Please enter your username');
        setLoading(false);
        return;
      }
      
      // Check if password is empty
      if (!password.trim()) {
        setError('Please enter your password');
        setLoading(false);
        return;
      }
      
      // Attempt login
      const result = await loginWithUsername(username, password);
      
      if (!result.success) {
        // Display the error message from the login attempt
        setError(result.message || 'Login failed');
        
        // Handle rate limit error specifically
        if (result.isRateLimited) {
          setError('Email rate limit exceeded. Please wait a few minutes before trying again.');
          return;
        }
        
        // If it's a connection error, show the connection status component
        if (result.isConnectionError || 
            (result.message && (
              result.message.includes('Connection failed') || 
              result.message.includes('Unable to connect') ||
              result.message.includes('Failed to fetch')
            ))) {
          setShowConnectionStatus(true);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if this is a rate limit error
      if (err.message && (
        err.message.includes('rate limit') || 
        err.message.includes('Too many requests') || 
        err.message.includes('exceeded')
      )) {
        setError('Email rate limit exceeded. Please wait a few minutes before trying again.');
        return;
      }
      
      setError('An error occurred during login. Please try again.');
      
      // Show connection status for any unexpected errors
      if (err.message === 'Failed to fetch') {
        setShowConnectionStatus(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Bypass email confirmation (development only)
  const handleBypassConfirmation = async () => {
    if (!username) {
      setError('Please enter your username first');
      return;
    }
    
    setIsConfirmingEmail(true);
    
    try {
      // First step - find the email for this username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single();
      
      if (userError || !userData?.email) {
        setError('Could not find email for this username');
        return;
      }
      
      // Now bypass confirmation for this email
      const result = await devConfirmEmail(userData.email);
      
      // Check if the result is a rate limit error object
      if (result && typeof result === 'object' && result.isRateLimited) {
        setError(result.message || 'Email rate limit exceeded. Please wait a few minutes before trying again.');
        return;
      }
      
      if (result) {
        setError('Email confirmed for development. Try logging in now.');
      } else {
        setError('Failed to bypass email confirmation. Check console for details.');
      }
    } catch (err) {
      console.error('Error bypassing confirmation:', err);
      
      // Check for rate limit errors
      if (err.message && (
        err.message.includes('rate limit') || 
        err.message.includes('Too many requests') || 
        err.message.includes('exceeded')
      )) {
        setError('Email rate limit exceeded. Please wait a few minutes before trying again.');
        return;
      }
      
      setError('Error bypassing confirmation');
      
      // Show connection status if this is a connection error
      if (err.message === 'Failed to fetch') {
        setShowConnectionStatus(true);
      }
    } finally {
      setIsConfirmingEmail(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl">
        <div>
          <motion.h1 
            className="text-center text-3xl font-extrabold text-gray-900"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            InfluencerConnect
          </motion.h1>
          <motion.h2 
            className="mt-6 text-center text-2xl font-bold text-gray-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Sign in to your account
          </motion.h2>
          <motion.p 
            className="mt-2 text-center text-sm text-gray-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Or{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </motion.p>
        </div>
        
        {showConnectionStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SupabaseConnectionStatus />
          </motion.div>
        )}
        
        <motion.form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {error && !showConnectionStatus && (
            <motion.div 
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" 
              role="alert"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="block sm:inline">{error}</span>
            </motion.div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer"
                onClick={() => alert('Password reset functionality would be added here')}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <motion.button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Sign in
                </>
              )}
            </motion.button>
          </div>
        </motion.form>

        {/* Demo accounts */}
        <motion.div 
          className="mt-4 text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-medium mb-2">Login with Demo Accounts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => {
                setUsername('fashion_influencer');
                setPassword('password123');
                // Submit form after a short delay to show the user what happened
                setTimeout(() => {
                  loginWithUsername('fashion_influencer', 'password123');
                }, 300);
              }}
              className="flex items-center justify-center space-x-2 p-2 border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <img src="https://randomuser.me/api/portraits/women/1.jpg" alt="Fashion Influencer" className="w-8 h-8 rounded-full" />
              <span className="text-xs">Fashion Influencer</span>
            </button>
            
            <button
              onClick={() => {
                setUsername('tech_reviewer');
                setPassword('password123');
                setTimeout(() => {
                  loginWithUsername('tech_reviewer', 'password123');
                }, 300);
              }}
              className="flex items-center justify-center space-x-2 p-2 border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <img src="https://randomuser.me/api/portraits/men/2.jpg" alt="Tech Reviewer" className="w-8 h-8 rounded-full" />
              <span className="text-xs">Tech Reviewer</span>
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500">All demo accounts use password: password123</p>
        </motion.div>

        {/* Add this after the login form */}
        {error && error.includes('Email not confirmed') && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <h3 className="font-medium text-yellow-800">Email Not Confirmed</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Your email hasn't been confirmed. You have these options:
            </p>
            <ol className="text-sm text-yellow-700 list-decimal pl-5 mb-3">
              <li>Check your email for a confirmation link</li>
              <li>Use the button below to get a password reset email (also confirms your account)</li>
              <li>Ask an administrator to confirm your email</li>
            </ol>
            <button
              onClick={handleBypassConfirmation}
              disabled={isConfirmingEmail || !username}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition duration-300"
            >
              {isConfirmingEmail ? 'Processing...' : 'Send Password Reset Email'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              This will send a password reset email, which will confirm your account.
            </p>
          </div>
        )}
        
        {/* Help link for Supabase setup */}
        <div className="mt-4 text-center">
          <a
            href="/SUPABASE_GUIDE.md"
            target="_blank"
            className="text-xs text-indigo-600 hover:text-indigo-500"
            onClick={(e) => {
              e.preventDefault();
              setShowConnectionStatus(true);
            }}
          >
            Having connection issues? Click here for help
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login; 