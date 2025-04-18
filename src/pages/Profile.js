import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaEdit, FaSave } from 'react-icons/fa';

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: '',
    role: '',
    followers: 0,
    following: 0,
    socialLinks: {
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: ''
    },
    interests: [],
    location: ''
  });
  
  const [formData, setFormData] = useState({
    bio: '',
    avatar: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: ''
    },
    interests: '',
    location: ''
  });
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch this from your API
        // For demo purposes, we'll use the user from context and add mock data
        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // If API call fails, use mock data
        const userData = response.data?.user || {
          ...user,
          bio: 'Lifestyle influencer passionate about travel and fashion.',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          role: 'influencer',
          followers: 1240,
          following: 420,
          socialLinks: {
            instagram: 'influencer_style',
            twitter: 'influencer_tweets',
            youtube: 'InfluencerChannel',
            tiktok: 'influencer_tiktok'
          },
          interests: ['Fashion', 'Travel', 'Lifestyle', 'Food'],
          location: 'New York, NY'
        };
        
        setProfile(userData);
        setFormData({
          bio: userData.bio || '',
          avatar: userData.avatar || '',
          socialLinks: {
            instagram: userData.socialLinks?.instagram || '',
            twitter: userData.socialLinks?.twitter || '',
            youtube: userData.socialLinks?.youtube || '',
            tiktok: userData.socialLinks?.tiktok || ''
          },
          interests: userData.interests?.join(', ') || '',
          location: userData.location || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, token]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // In a real app, you would send this to your API
      // For demo purposes, we'll just update the local state
      const updatedProfile = {
        ...profile,
        bio: formData.bio,
        avatar: formData.avatar,
        socialLinks: formData.socialLinks,
        interests: formData.interests.split(',').map(item => item.trim()).filter(item => item),
        location: formData.location
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(updatedProfile);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-8 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center">
              <motion.img 
                src={profile.avatar} 
                alt={profile.username}
                className="h-24 w-24 rounded-full border-4 border-white object-cover"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <motion.h1 
                  className="text-2xl font-bold text-white"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {profile.username}
                </motion.h1>
                <motion.p 
                  className="text-indigo-100"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </motion.p>
                <motion.p 
                  className="text-indigo-100 mt-1"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {profile.location}
                </motion.p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-auto">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-md shadow-sm hover:bg-indigo-50 transition-colors"
                >
                  {editMode ? (
                    <>
                      <FaSave className="mr-2" /> Cancel
                    </>
                  ) : (
                    <>
                      <FaEdit className="mr-2" /> Edit Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              <div className="px-4 py-5 sm:px-6 text-center">
                <dt className="text-sm font-medium text-gray-500">Followers</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{profile.followers.toLocaleString()}</dd>
              </div>
              <div className="px-4 py-5 sm:px-6 text-center">
                <dt className="text-sm font-medium text-gray-500">Following</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{profile.following.toLocaleString()}</dd>
              </div>
              <div className="px-4 py-5 sm:px-6 text-center">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900 capitalize">{profile.role}</dd>
              </div>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Social Media</h3>
            <div className="mt-4 flex flex-wrap gap-4">
              {profile.socialLinks.instagram && (
                <a 
                  href={`https://instagram.com/${profile.socialLinks.instagram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <FaInstagram className="mr-2" /> @{profile.socialLinks.instagram}
                </a>
              )}
              {profile.socialLinks.twitter && (
                <a 
                  href={`https://twitter.com/${profile.socialLinks.twitter}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors"
                >
                  <FaTwitter className="mr-2" /> @{profile.socialLinks.twitter}
                </a>
              )}
              {profile.socialLinks.youtube && (
                <a 
                  href={`https://youtube.com/${profile.socialLinks.youtube}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <FaYoutube className="mr-2" /> {profile.socialLinks.youtube}
                </a>
              )}
              {profile.socialLinks.tiktok && (
                <a 
                  href={`https://tiktok.com/@${profile.socialLinks.tiktok}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <FaTiktok className="mr-2" /> @{profile.socialLinks.tiktok}
                </a>
              )}
            </div>
          </div>
          
          {/* Profile Content */}
          {editMode ? (
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                  <span>{success}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="col-span-2">
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      name="avatar"
                      id="avatar"
                      value={formData.avatar}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                      Interests (comma separated)
                    </label>
                    <input
                      type="text"
                      name="interests"
                      id="interests"
                      value={formData.interests}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="socialLinks.instagram" className="block text-sm font-medium text-gray-700">
                      Instagram Username
                    </label>
                    <input
                      type="text"
                      name="socialLinks.instagram"
                      id="socialLinks.instagram"
                      value={formData.socialLinks.instagram}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="socialLinks.twitter" className="block text-sm font-medium text-gray-700">
                      Twitter Username
                    </label>
                    <input
                      type="text"
                      name="socialLinks.twitter"
                      id="socialLinks.twitter"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="socialLinks.youtube" className="block text-sm font-medium text-gray-700">
                      YouTube Channel
                    </label>
                    <input
                      type="text"
                      name="socialLinks.youtube"
                      id="socialLinks.youtube"
                      value={formData.socialLinks.youtube}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="socialLinks.tiktok" className="block text-sm font-medium text-gray-700">
                      TikTok Username
                    </label>
                    <input
                      type="text"
                      name="socialLinks.tiktok"
                      id="socialLinks.tiktok"
                      value={formData.socialLinks.tiktok}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6">
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                  <span>{success}</span>
                </div>
              )}
              
              <h3 className="text-lg font-medium text-gray-900">About</h3>
              <p className="mt-2 text-gray-600">{profile.bio}</p>
              
              <h3 className="text-lg font-medium text-gray-900 mt-6">Interests</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                  </span>
                ))}
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mt-6">Contact</h3>
              <p className="mt-2 text-gray-600">{profile.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 