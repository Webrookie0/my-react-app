import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SupabaseAuthContext } from '../context/SupabaseAuthContext';
import { 
  getOrCreateChat, 
  sendMessage as sendSupabaseMessage, 
  subscribeToMessages, 
  searchUsers
} from '../services/supabaseChatService';
import { seedDummyUsers } from '../supabase';

const Chat = () => {
  const { user, isAuthenticated, logout } = useContext(SupabaseAuthContext);
  const navigate = useNavigate();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesListener = useRef(null);
  const searchDebounceTimer = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch all users as soon as user logs in
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('🔍 Fetching all users for inbox display:', user.id);
        
        // Use an empty search term to get all users
        const allUsers = await searchUsers('', user.id);
        setContacts(allUsers);
        
        console.log(`✅ Fetched ${allUsers.length} users for inbox`);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching users for inbox:', error);
        setLoading(false);
        
        // Fallback dummy data
        setContacts([
          { id: 'dummy1', username: 'fashion_influencer', bio: 'Fashion and lifestyle blogger', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
          { id: 'dummy2', username: 'tech_reviewer', bio: 'Tech reviews and unboxing', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
        ]);
      }
    };

    fetchData();
  }, [user, refreshKey]);

  // Handle search input with debounce
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    if (!user) {
      setSearchResults([]);
      return;
    }
    
    // Only show loading indicator if actually searching
    if (searchTerm) {
      setSearchLoading(true);
    }
    
    searchDebounceTimer.current = setTimeout(async () => {
      try {
        console.log('🔍 Searching users with term:', searchTerm);
        const results = await searchUsers(searchTerm, user.id);
        setSearchResults(results);
        setSearchLoading(false);
      } catch (error) {
        console.error('❌ Error searching users:', error);
        setSearchResults([]);
        setSearchLoading(false);
      }
    }, 300);
    
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [searchTerm, user]);

  // Handle contact selection and chat setup
  const handleContactSelect = async (contact) => {
    try {
      setSelectedContact(contact);
      setSearchTerm('');
      setSearchResults([]);
      setLoadingMessages(true);
      
      if (!user) {
        console.error('❌ Cannot select contact: User is not logged in');
        setLoadingMessages(false);
        return;
      }
      
      console.log('👤 Selected contact:', contact.username, 'with ID:', contact.id);
      console.log('👤 Current user ID:', user.id);
      
      // Clean up previous listener
      if (messagesListener.current) {
        messagesListener.current.unsubscribe();
        messagesListener.current = null;
      }
      
      // Get or create chat between current user and selected contact
      console.log('🔄 Getting or creating chat for users:', user.id, contact.id);
      const newChatId = await getOrCreateChat(user.id, contact.id);
      
      if (!newChatId) {
        console.error('❌ Failed to get or create chat');
        
        // Try one more time with reversed order of IDs as a fallback
        console.log('🔄 Retrying chat creation with reversed IDs');
        const retryNewChatId = await getOrCreateChat(contact.id, user.id);
        
        if (!retryNewChatId) {
          console.error('❌ Failed to get or create chat on retry');
          alert('Unable to start chat with this user. Please try again later.');
          setLoadingMessages(false);
          return;
        }
        
        console.log('✅ Successfully created chat on retry with ID:', retryNewChatId);
        
        // Use a callback pattern to ensure chat ID is set before proceeding
        setChatId(retryNewChatId);
        // Clear existing messages
        setMessages([]);
        
        // Set up subscription with the new chat ID directly
        setUpMessageSubscription(retryNewChatId);
      } else {
        console.log('✅ Successfully got/created chat with ID:', newChatId);
        
        // Use a callback pattern to ensure chat ID is set before proceeding
        setChatId(newChatId);
        // Clear existing messages
        setMessages([]);
        
        // Set up subscription with the new chat ID directly
        setUpMessageSubscription(newChatId);
      }
    } catch (error) {
      console.error('❌ Error selecting contact:', error);
      alert('Error starting chat. Please try again.');
      setLoadingMessages(false);
    }
  };

  // Helper function to set up message subscription
  const setUpMessageSubscription = (chatIdToUse) => {
    console.log('🔔 Setting up subscription for chat:', chatIdToUse);
    
    messagesListener.current = subscribeToMessages(chatIdToUse, (chatMessages) => {
      console.log(`📩 Received ${chatMessages.length} messages from subscription`);
      setMessages(chatMessages);
      setLoadingMessages(false);
      
      // Scroll to bottom on new messages
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    
    // Store a reference to the selected contact's ID and chat ID
    const selectedContactId = selectedContact?.id;
    // Use the current state value of chatId directly
    const currentChatId = chatId;
    
    if (!trimmedMessage) {
      console.error('❌ Cannot send message: empty message');
      return;
    }
    
    if (!user) {
      console.error('❌ Cannot send message: not logged in');
      return;
    }
    
    if (!currentChatId) {
      console.error('❌ Cannot send message: no active chat', { 
        selectedContact: selectedContactId,
        userId: user.id
      });
      
      // Attempt to recover by reselecting the contact
      if (selectedContact) {
        console.log('🔄 Attempting to recover by reselecting contact');
        await handleContactSelect(selectedContact);
        
        // After contact selection, check if we have a chat ID now
        if (!chatId) {
          alert('Unable to send message. Please try selecting the contact again.');
          return;
        } else {
          // We have a chat ID now, so use it
          console.log('✅ Recovered chat ID:', chatId);
        }
      } else {
        alert('Please select a contact before sending a message.');
        return;
      }
    }
    
    // Use the most current chatId value for sending
    const finalChatId = chatId;
    
    if (!finalChatId) {
      console.error('❌ Still no chat ID after recovery attempt');
      alert('Unable to send message. Please try again later.');
      return;
    }
    
    // Create a unique ID for the temporary message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('📤 Preparing to send message:', trimmedMessage);
      console.log('📤 Active chat ID:', finalChatId);
      setIsSending(true);
      
      // Create temporary message object for immediate display
      const newMessage = {
        id: tempId,
        chat_id: finalChatId,
        sender_id: user.id,
        content: trimmedMessage,
        created_at: new Date().toISOString(),
        is_read: false,
        sender: {
          username: user.username,
          avatar: user.avatar
        }
      };
      
      // Clear input immediately for better UX
      setMessage('');
      
      // Add message to the list for immediate display
      setMessages(currentMessages => [...currentMessages, newMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      console.log('📤 Sending message to Supabase:', { chatId: finalChatId, senderId: user.id });
      
      // Send message using Supabase - use finalChatId to ensure we're using the most current value
      const result = await sendSupabaseMessage(finalChatId, user.id, trimmedMessage);
      
      if (!result.success) {
        console.error('❌ Failed to send message:', result.error, result.details);
        
        // Display a more specific error message if possible
        let errorMessage = result.error || 'Unknown error';
        
        // Handle specific error cases
        if (result.error && result.error.includes('does not exist')) {
          errorMessage = 'Unable to send message. The chat may have been deleted.';
        } else if (result.error && result.error.includes('Permission denied')) {
          errorMessage = 'You do not have permission to send messages in this chat.';
        }
        
        // Remove the temporary message if sending failed
        setMessages(currentMessages => 
          currentMessages.filter(msg => msg.id !== tempId)
        );
        
        alert(`Failed to send message: ${errorMessage}`);
        
        // If the chat doesn't exist or there's a permissions issue, try reselecting the contact
        if (errorMessage.includes('chat') && selectedContact) {
          console.log('🔄 Attempting to recreate chat after send error');
          await handleContactSelect(selectedContact);
        }
      } else {
        console.log('✅ Message sent successfully:', result.data);
        
        // If using real-time subscriptions, the message will be updated automatically
        // But we can also update the temporary message with the real one for redundancy
        setMessages(currentMessages => 
          currentMessages.map(msg => 
            msg.id === tempId ? {...result.data, sender: newMessage.sender} : msg
          )
        );
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove the temporary message if there was an error
      setMessages(currentMessages => 
        currentMessages.filter(msg => msg.id !== tempId)
      );
      
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Force refresh user list
  const refreshUserList = async () => {
    try {
      console.log('🔄 Refreshing user list...');
      await seedDummyUsers();
      // Increment refreshKey to force the useEffect to run again
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('❌ Error refreshing user list:', error);
    }
  };

  // Set up real-time subscription for messages
  useEffect(() => {
    if (chatId) {
      console.log('🔄 chatId changed in useEffect:', chatId);
      
      // Clear previous listener if any
      if (messagesListener.current) {
        console.log('🧹 Cleaning up previous subscription');
        messagesListener.current.unsubscribe();
      }
      
      console.log('🔔 Setting up message subscription for chat:', chatId);
      
      // Set up new listener
      messagesListener.current = subscribeToMessages(chatId, (chatMessages) => {
        console.log('📩 Received messages update:', chatMessages?.length || 0);
        
        if (Array.isArray(chatMessages)) {
          setMessages(chatMessages);
          
          // Scroll to bottom when messages update
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      });
      
      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up message subscription for chat:', chatId);
        if (messagesListener.current) {
          messagesListener.current.unsubscribe();
        }
      };
    } else {
      console.log('ℹ️ No chatId available in useEffect');
    }
  }, [chatId]);

  // Logout handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Add this debug helper function to the Chat component
  const debugSendMessage = async () => {
    console.log('🐞 Debug send message');
    console.log('User:', user);
    console.log('Chat ID:', chatId);
    console.log('Selected Contact:', selectedContact);
    console.log('Is sending state:', isSending);
    
    // Check if messages listener is working
    if (messagesListener.current) {
      console.log('Message listener exists:', !!messagesListener.current);
    } else {
      console.warn('No message listener found!');
    }
  };

  // Enhance the Message Input section
  const renderMessageInput = () => {
    return (
      <div className="p-4 border-t border-gray-300 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            // Add keyboard shortcut (Enter to send)
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) {
                  handleSendMessage(e);
                }
              }
            }}
          />
          <div className="flex space-x-2">
            {showDebug && (
              <button
                type="button"
                onClick={debugSendMessage}
                className="px-2 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none"
                title="Debug Send"
              >
                🐞
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none flex items-center justify-center min-w-[80px]"
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-600">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Debug Panel - hidden by default */}
      {showDebug && (
        <div className="fixed bottom-0 right-0 z-50 bg-gray-800 text-white p-4 w-1/3 h-1/2 overflow-auto rounded-tl-lg">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <button 
            onClick={() => setShowDebug(false)}
            className="absolute top-2 right-2 text-white"
          >
            ✕
          </button>
          <div className="space-y-2 text-xs font-mono">
            <div>
              <p className="font-bold">Auth:</p>
              <pre>{JSON.stringify({ isAuth: isAuthenticated, userId: user?.id }, null, 2)}</pre>
            </div>
            <div>
              <p className="font-bold">Current Chat:</p>
              <pre>{JSON.stringify({ chatId, hasListener: !!messagesListener.current }, null, 2)}</pre>
            </div>
            <div>
              <p className="font-bold">Messages:</p>
              <pre>{JSON.stringify({ count: messages.length, lastMsg: messages[messages.length - 1]?.content }, null, 2)}</pre>
            </div>
            <div>
              <p className="font-bold">Selected Contact:</p>
              <pre>{JSON.stringify(selectedContact, null, 2)}</pre>
            </div>
            <button 
              onClick={() => console.log('Full Messages:', messages)}
              className="bg-blue-600 text-white px-2 py-1 text-xs rounded mt-2"
            >
              Log Messages to Console
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="text-gray-500 hover:text-gray-700"
              title="Toggle Debug Panel"
            >
              🐞
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto my-4 flex overflow-hidden rounded-lg shadow-lg">
        {/* Contacts Sidebar */}
        <div className="w-1/4 bg-white border-r border-gray-300">
          <div className="p-4 border-b border-gray-300">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search users by name, role, interest..." 
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              {searchTerm && (
                <button 
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search Results */}
            {searchTerm && (
              <div className="mt-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Search Results</h3>
                
                {searchLoading ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map(result => (
                      <li 
                        key={result.id} 
                        className="p-2 hover:bg-indigo-50 cursor-pointer rounded transition-colors duration-150"
                        onClick={() => handleContactSelect(result)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <img 
                              src={result.avatar || `https://ui-avatars.com/api/?name=${result.username}&background=random`} 
                              alt={result.username} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="font-medium text-sm">{result.username}</p>
                            <p className="text-xs text-gray-500 truncate">{result.bio ? result.bio.substring(0, 25) + '...' : 'InfluencerConnect User'}</p>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <span className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                              {result.role || 'User'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : searchTerm.length > 0 ? (
                  <p className="text-sm text-gray-500 p-2">No users found. Try a different search term.</p>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-16rem)]">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">All Users</h3>
              <span className="text-xs text-gray-400">{contacts.length} users</span>
            </div>
            
            {contacts.length > 0 ? (
              contacts.map(contact => (
                <motion.div 
                  key={contact.id}
                  className={`p-3 border-b border-gray-200 flex items-center cursor-pointer ${selectedContact?.id === contact.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  onClick={() => handleContactSelect(contact)}
                  whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
                >
                  <div className="relative">
                    <img 
                      src={contact.avatar || `https://ui-avatars.com/api/?name=${contact.username}&background=random`} 
                      alt={contact.username} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500`}></div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{contact.username}</p>
                      <span className="text-xs text-gray-500">{contact.role}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{contact.bio ? contact.bio.substring(0, 20) + '...' : 'InfluencerConnect User'}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No contacts available.</p>
                <p className="text-sm mt-2">
                  Click "Refresh Users" below to add demo users or try searching for users above.
                </p>
              </div>
            )}
          </div>
          
          {/* Debug section */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Found {contacts.length} users in database</p>
              <button 
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded"
                onClick={refreshUserList}
              >
                Refresh Users
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-3/4 flex flex-col bg-gray-50">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-300 bg-white flex items-center">
                <img 
                  src={selectedContact.avatar || `https://ui-avatars.com/api/?name=${selectedContact.username}&background=random`} 
                  alt={selectedContact.username} 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="font-semibold">{selectedContact.username}</p>
                  <p className="text-sm text-gray-500">
                    {selectedContact.bio ? selectedContact.bio.substring(0, 30) + (selectedContact.bio.length > 30 ? '...' : '') : 'InfluencerConnect User'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto h-[calc(100vh-22rem)]">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                    <p className="ml-3 text-indigo-600">Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div 
                      key={msg.id || index}
                      className={`mb-4 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                          msg.sender_id === user?.id 
                            ? 'bg-indigo-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none shadow'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No messages yet.</p>
                    <p className="text-sm mt-2">Start the conversation with {selectedContact.username}!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - replaced with the enhanced version */}
              {renderMessageInput()}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to InfluencerConnect Chat</h3>
              <p className="text-gray-600 max-w-md">
                Select a contact from the list or search for users to start a conversation.
              </p>
              
              {contacts.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg max-w-md">
                  <p className="font-medium">No contacts found!</p>
                  <p className="text-sm mt-1">
                    Click the "Refresh Users" button in the sidebar to add demo users.
                  </p>
                  <button
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={refreshUserList}
                  >
                    Add Demo Users Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat; 