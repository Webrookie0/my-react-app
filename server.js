const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('./models/User');
const ChatModel = require('./models/Chat');
const MessageModel = require('./models/Message');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Create a test user on server start
const createTestUser = async () => {
  try {
    // Check if test user already exists
    const existingUser = await UserModel.findOne({ username: 'testuser' });
    
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = new UserModel({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      await testUser.save();
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// JWT Secret
const JWT_SECRET = 'your-secret-key';

// API Routes
// Auth Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id }, 
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await UserModel.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// User Routes
app.get('/api/users', async (req, res) => {
  try {
    const { search } = req.query;
    const regex = new RegExp(search, 'i');
    
    const users = await UserModel.find({
      username: { $regex: regex }
    }).select('-password');
    
    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chat Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    // Check if chat already exists
    const existingChat = await ChatModel.findOne({
      participants: { $all: [userId1, userId2] }
    });
    
    if (existingChat) {
      return res.json(existingChat);
    }
    
    // Create new chat
    const newChat = new ChatModel({
      participants: [userId1, userId2]
    });
    
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const chats = await ChatModel.find({
      participants: userId
    }).populate('participants', '-password');
    
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Message Routes
app.post('/api/message', async (req, res) => {
  try {
    const { chatId, senderId, receiverId, message } = req.body;
    
    const newMessage = new MessageModel({
      chatId,
      senderId,
      receiverId,
      message
    });
    
    await newMessage.save();
    
    // Emit to socket
    io.to(chatId).emit('newMessage', newMessage);
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const messages = await MessageModel.find({ chatId });
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a chat room
  socket.on('joinRoom', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined room: ${chatId}`);
  });
  
  // Leave a chat room
  socket.on('leaveRoom', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left room: ${chatId}`);
  });
  
  // Send message
  socket.on('sendMessage', (messageData) => {
    io.to(messageData.chatId).emit('message', messageData);
    console.log('Message sent:', messageData);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createTestUser();
}); 