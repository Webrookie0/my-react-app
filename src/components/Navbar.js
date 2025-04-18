import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);

  return (
    <motion.nav 
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">ChatApp</Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline">Welcome, {user?.username}</span>
              <Link to="/dashboard" className="hover:text-blue-200 transition-colors">Dashboard</Link>
              <button 
                onClick={logout} 
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hover:text-blue-200 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-white text-blue-500 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar; 