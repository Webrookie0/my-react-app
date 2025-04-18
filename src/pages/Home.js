import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SupabaseAuthContext } from '../context/SupabaseAuthContext';
import { seedDummyUsers } from '../supabase';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(SupabaseAuthContext);
    const [seedingUsers, setSeedingUsers] = useState(false);
    const [seedResult, setSeedResult] = useState(null);

    const handleAddDummyUsers = async () => {
        try {
            setSeedingUsers(true);
            setSeedResult(null);
            console.log('🌱 Adding dummy users to Supabase...');
            const result = await seedDummyUsers();
            console.log('✅ Result:', result);
            setSeedResult(result);
            
            // Show success message for 3 seconds
            setTimeout(() => {
                setSeedResult(null);
            }, 3000);
        } catch (error) {
            console.error('❌ Error adding dummy users:', error);
            setSeedResult({
                success: false,
                message: error.message || 'Failed to add demo users'
            });
        } finally {
            setSeedingUsers(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
            {/* Background Image with Overlay */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center"
                style={{ 
                    backgroundImage: `url('/images/background-pattern.jpg')`,
                    opacity: 0.1
                }}
            ></div>
            
            <div className="container mx-auto px-6 py-16 relative z-10 flex flex-col md:flex-row items-center justify-between">
                <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-6xl font-bold text-white leading-tight">
                        InfluencerConnect
                    </motion.h1>
                    <motion.h2 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-3xl md:text-4xl font-semibold text-blue-300 mt-2">
                        Connect. Collaborate. Grow.
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg text-gray-200 mt-4 max-w-xl">
                        The ultimate platform for influencers and brands to collaborate effortlessly.
                    </motion.p>
                    <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ delay: 0.5, duration: 0.5 }}
                            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                            className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg shadow-lg hover:bg-blue-700 transition-all">
                            Get Started
                        </motion.button>
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ delay: 0.6, duration: 0.5 }}
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 bg-transparent border-2 border-white text-white text-lg rounded-lg shadow-lg hover:bg-white/10 transition-all">
                            Login
                        </motion.button>
                    </div>
                </div>
                <motion.div 
                    className="md:w-1/2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-2xl">
                        <img 
                            src="/images/Screenshot 2025-03-07 134827.png" 
                            alt="InfluencerConnect App Screenshot" 
                            className="rounded-xl shadow-lg w-full h-auto" 
                        />
                    </div>
                </motion.div>
            </div>
            
            {/* Featured Screenshots Section */}
            <motion.div 
                className="w-full py-16 bg-white/5 backdrop-blur-sm mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
            >
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-white mb-12">Experience InfluencerConnect</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div 
                            className="bg-white/10 p-4 rounded-xl shadow-lg"
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                        >
                            <img 
                                src="/images/Screenshot 2025-03-07 134827.png" 
                                alt="Dashboard Interface" 
                                className="w-full h-auto rounded-lg mb-4" 
                            />
                            <h3 className="text-xl font-semibold text-white">Intuitive Dashboard</h3>
                            <p className="text-gray-300 mt-2">Manage all your collaborations from one centralized hub.</p>
                        </motion.div>
                        
                        <motion.div 
                            className="bg-white/10 p-4 rounded-xl shadow-lg"
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                        >
                            <img 
                                src="/images/Screenshot 2025-03-07 134827.png" 
                                alt="Chat Interface" 
                                className="w-full h-auto rounded-lg mb-4" 
                            />
                            <h3 className="text-xl font-semibold text-white">Real-time Chat</h3>
                            <p className="text-gray-300 mt-2">Connect instantly with brands and influencers.</p>
                        </motion.div>
                        
                        <motion.div 
                            className="bg-white/10 p-4 rounded-xl shadow-lg"
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                        >
                            <img 
                                src="/images/Screenshot 2025-03-07 134827.png" 
                                alt="Profile Interface" 
                                className="w-full h-auto rounded-lg mb-4" 
                            />
                            <h3 className="text-xl font-semibold text-white">Professional Profiles</h3>
                            <p className="text-gray-300 mt-2">Showcase your work and metrics to attract the right partners.</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
            
            {/* Add Demo Users Button */}
            <div className="fixed bottom-4 right-4 z-20">
                <button
                    onClick={handleAddDummyUsers}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2"
                    disabled={seedingUsers}
                >
                    {seedingUsers ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                            <span>Adding Users...</span>
                        </>
                    ) : (
                        <span>Add Demo Users</span>
                    )}
                </button>
                
                {seedResult && (
                    <div 
                        className={`absolute right-0 bottom-16 p-4 rounded-lg text-sm shadow-lg max-w-sm ${
                            seedResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                    >
                        {seedResult.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
