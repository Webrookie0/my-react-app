import { supabase } from '../supabase';

// Search users in Supabase
export const searchUsers = async (searchTerm, currentUserId) => {
  try {
    console.log('🔍 Searching users with term:', searchTerm);
    
    let query = supabase
      .from('users')
      .select('*');
    
    if (currentUserId) {
      // Exclude current user
      query = query.neq('id', currentUserId);
    }
    
    // Only show visible users
    query = query.eq('is_visible', true);
    
    // If there's a search term, filter by it
    if (searchTerm && searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      
      // Supabase allows searching with ilike
      query = query.or(`username.ilike.%${searchTermLower}%, bio.ilike.%${searchTermLower}%, role.ilike.%${searchTermLower}%`);
    }
    
    // Execute the query
    const { data: users, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate match scores for better sorting
    if (searchTerm && searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      
      // Add match scores
      users.forEach(user => {
        let score = 0;
        
        // Exact username match
        if (user.username.toLowerCase() === searchTermLower) {
          score += 100;
        } 
        // Username starts with search term
        else if (user.username.toLowerCase().startsWith(searchTermLower)) {
          score += 50;
        }
        // Username contains search term
        else if (user.username.toLowerCase().includes(searchTermLower)) {
          score += 25;
        }
        
        // Bio match
        if (user.bio && user.bio.toLowerCase().includes(searchTermLower)) {
          score += 10;
        }
        
        // Role match
        if (user.role && user.role.toLowerCase().includes(searchTermLower)) {
          score += 15;
        }
        
        // For interests, we need to check if it's an array or string
        if (user.interests) {
          const interests = Array.isArray(user.interests) 
            ? user.interests 
            : typeof user.interests === 'string' 
              ? JSON.parse(user.interests) 
              : [];
          
          if (interests.some(interest => interest.toLowerCase().includes(searchTermLower))) {
            score += 20;
          }
        }
        
        user.matchScore = score;
      });
      
      // Sort by match score
      users.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // Sort by most recent first when no search term
      users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Limit to 20 results to avoid overwhelming the UI
    const limitedUsers = users.slice(0, 20);
    
    console.log(`✅ Search returned ${limitedUsers.length} users`);
    return limitedUsers;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    return [];
  }
};

// Get or create a chat between two users
export const getOrCreateChat = async (user1Id, user2Id) => {
  try {
    console.log('🔄 Getting or creating chat for users:', user1Id, user2Id);
    
    if (!user1Id || !user2Id) {
      console.error('❌ Missing user IDs for chat creation:', { user1Id, user2Id });
      throw new Error('Both user IDs are required to create a chat');
    }
    
    // Sort user IDs to ensure consistent chat IDs
    const participants = [user1Id, user2Id].sort();
    
    // Check if chat already exists
    const { data: existingChats, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', participants);
    
    if (chatError) {
      console.error('❌ Error checking for existing chats:', chatError);
      throw chatError;
    }
    
    let chatId;
    
    // If chat doesn't exist, create it
    if (!existingChats || existingChats.length === 0) {
      console.log('➕ Creating new chat between users');
      
      // Verify both users exist before creating chat
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .in('id', participants);
      
      if (usersError) {
        console.error('❌ Error verifying users exist:', usersError);
        throw usersError;
      }
      
      if (!users || users.length !== 2) {
        console.error('❌ One or both users do not exist:', { 
          expected: participants, 
          found: users?.map(u => u.id) 
        });
        
        // If at least one user exists, create the chat anyway
        if (users && users.length > 0) {
          console.warn('⚠️ Creating chat with only some users verified:', users.map(u => u.id));
        } else {
          throw new Error('Could not verify users exist');
        }
      }
      
      // Create the chat - only include columns that exist in the database schema
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([{
          participants: participants,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (createError) {
        console.error('❌ Error creating new chat:', createError);
        throw createError;
      }
      
      if (!newChat || newChat.length === 0) {
        console.error('❌ Chat created but no data returned');
        throw new Error('Failed to create chat');
      }
      
      chatId = newChat[0].id;
      console.log('✅ Created new chat with ID:', chatId);
    } else {
      chatId = existingChats[0].id;
      console.log('✅ Found existing chat with ID:', chatId);
    }
    
    return chatId;
  } catch (error) {
    console.error('❌ Error getting or creating chat:', error);
    // Return null instead of throwing to allow the UI to handle this gracefully
    return null;
  }
};

// Send a message to a chat
export const sendMessage = async (chatId, senderId, content) => {
  try {
    console.log('📤 Sending message to Supabase:', { chatId, senderId, content });
    
    if (!chatId || !senderId || !content.trim()) {
      console.error('❌ Invalid message data:', { chatId, senderId, content });
      return {
        success: false,
        error: 'Missing required message data (chatId, senderId, or content)'
      };
    }
    
    // Verify chat exists before sending
    const { data: chatData, error: chatCheckError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .single();
      
    if (chatCheckError || !chatData) {
      console.error('❌ Chat does not exist:', chatId, chatCheckError);
      return {
        success: false,
        error: `Chat with ID ${chatId} does not exist`
      };
    }
    
    // First, insert the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: senderId,
          content: content.trim(),
          is_read: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Error sending message:', messageError);
      return {
        success: false,
        error: messageError.message,
        details: messageError
      };
    }
    
    // Then, update the chat's timestamp only (since last_message columns don't exist)
    const { error: chatError } = await supabase
      .from('chats')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    if (chatError) {
      console.error('❌ Error updating chat timestamp:', chatError);
      // Don't return error here as the message was sent successfully
    }
    
    console.log('✅ Message sent successfully:', message);
    return {
      success: true,
      data: message
    };
  } catch (error) {
    console.error('❌ Unexpected error sending message:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

// Get messages for a chat
export const getMessages = async (chatId) => {
  try {
    console.log('🔍 Fetching messages for chat:', chatId);
    
    if (!chatId) {
      console.error('❌ Invalid chat ID for fetching messages');
      return [];
    }
    
    // First, get just the messages without the complex join
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
    
    // If we have messages, get the sender information separately for each unique sender
    if (messages && messages.length > 0) {
      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      
      // Get user info for all senders in one query
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar')
        .in('id', senderIds);
      
      if (usersError) {
        console.error('❌ Error fetching message senders:', usersError);
        // We'll still return messages without sender info
      }
      
      // Create a map of user info by ID for quick lookup
      const userMap = {};
      if (users) {
        users.forEach(user => {
          userMap[user.id] = user;
        });
      }
      
      // Format messages with sender info
      const formattedMessages = messages.map(message => {
        const sender = userMap[message.sender_id] || { 
          username: 'Unknown User',
          avatar: null
        };
        
        return {
          ...message,
          sender: {
            id: message.sender_id,
            username: sender.username,
            avatar: sender.avatar
          }
        };
      });
      
      console.log(`✅ Retrieved ${formattedMessages.length} messages with sender info`);
      return formattedMessages;
    }
    
    console.log(`✅ Retrieved ${messages.length} messages (no messages found)`);
    return messages || [];
  } catch (error) {
    console.error('❌ Error in getMessages:', error);
    return [];
  }
};

// Subscribe to messages for a chat (real-time)
export const subscribeToMessages = (chatId, callback) => {
  try {
    console.log('🔔 Setting up real-time subscription for chat:', chatId);
    
    if (!chatId) {
      console.error('❌ Invalid chat ID for subscription');
      return { unsubscribe: () => {} };
    }
    
    // First, get existing messages
    getMessages(chatId).then(messages => {
      // Send initial messages to the callback
      if (Array.isArray(messages)) {
        console.log(`🔔 Initial message load: ${messages.length} messages`);
        callback(messages);
      } else {
        console.error('⚠️ Retrieved messages is not an array:', messages);
        callback([]);
      }
    }).catch(error => {
      console.error('❌ Error fetching initial messages:', error);
      callback([]);
    });
    
    // Set up real-time subscription for new messages using a simpler approach
    const channel = supabase.channel(`chat-${chatId}`);
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        console.log('📩 New message received via real-time:', payload);
        
        // Refresh all messages to ensure we have the latest data with sender info
        getMessages(chatId).then(messages => {
          if (Array.isArray(messages)) {
            console.log(`📨 Refreshed ${messages.length} messages after new message`);
            callback(messages);
          }
        }).catch(error => {
          console.error('❌ Error refreshing messages after new message:', error);
        });
      })
      .subscribe((status) => {
        console.log(`🔔 Subscription status for chat ${chatId}:`, status);
      });
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        console.log('🔕 Unsubscribing from messages for chat:', chatId);
        supabase.removeChannel(channel);
      }
    };
  } catch (error) {
    console.error('❌ Error setting up message subscription:', error);
    return { unsubscribe: () => {} };
  }
};

// Get user chats
export const getUserChats = async (userId) => {
  try {
    console.log('📋 Getting chats for user:', userId);
    
    // Get chats where user is a participant
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*, messages(*)')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Extract other participants' info for each chat
    const enhancedChats = [];
    
    for (const chat of chats) {
      // Get the other participant's ID
      const otherParticipantId = chat.participants.find(id => id !== userId);
      
      // Get the other participant's user info
      const { data: otherUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', otherParticipantId)
        .single();
      
      if (userError) {
        console.error(`Error getting user ${otherParticipantId}:`, userError);
        continue;
      }
      
      enhancedChats.push({
        ...chat,
        otherUser
      });
    }
    
    console.log(`✅ Found ${enhancedChats.length} chats`);
    return enhancedChats;
  } catch (error) {
    console.error('❌ Error getting user chats:', error);
    return [];
  }
}; 