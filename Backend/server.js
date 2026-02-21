import { createServer } from 'node:http';
import crypto from 'node:crypto';
import express from 'express';
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';

// Password hashing helpers using Node built-in crypto (no npm install needed)
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return verify === hash;
};

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  query,
  orderBy,
  limitToLast,
  serverTimestamp,
  where
} from "firebase/firestore";

dotenv.config();

// ── Firebase Client SDK Initialization ──────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const messagesCol = collection(db, 'messages');
const usersCol = collection(db, 'users');

// ── Express + Socket.IO ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// ── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const emailQuery = query(usersCol, where('email', '==', email));
    const existing = await getDocs(emailQuery);
    if (!existing.empty) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = hashPassword(password);

    // Create a unique ID using timestamp
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store user in Firestore
    await setDoc(doc(db, 'users', userId), {
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: serverTimestamp()
    });

    // Return user info (no password)
    res.status(201).json({
      user: { uid: userId, username: username.trim(), email: email.toLowerCase() }
    });
  } catch (error) {
    console.error('Signup error:', error);
    fs.appendFileSync('backend_error.log', `SIGNUP: ${new Date().toISOString()} - ${error.toString()}\n`);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const emailQuery = query(usersCol, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(emailQuery);

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Compare password
    const isValid = verifyPassword(password, userData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user info (no password)
    res.json({
      user: { uid: userDoc.id, username: userData.username, email: userData.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    fs.appendFileSync('backend_error.log', `LOGIN: ${new Date().toISOString()} - ${error.toString()}\n`);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/users - list all users (for the user list screen)
app.get('/api/users', async (req, res) => {
  try {
    const snapshot = await getDocs(usersCol);
    const users = snapshot.docs.map(d => ({
      id: d.id,
      username: d.data().username,
      email: d.data().email
    }));
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Group Chat Messages ──────────────────────────────────────────────────────

app.get('/api/messages', async (req, res) => {
  try {
    const q = query(messagesCol, orderBy('timestamp', 'asc'), limitToLast(50));
    const querySnapshot = await getDocs(q);

    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.().toISOString() ?? new Date().toISOString(),
    }));

    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Error fetching messages:', error);
    fs.appendFileSync('backend_error.log', `${new Date().toISOString()} - ${error.toString()}\n${error.stack}\n`);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── 1-on-1 Chat Messages ─────────────────────────────────────────────────────

app.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatMessagesCol = collection(db, 'chats', chatId, 'messages');
    const q = query(chatMessagesCol, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.().toISOString() ?? new Date().toISOString()
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

app.post('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, text, members } = req.body;

    // Ensure chat doc exists
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, { members, createdAt: serverTimestamp() });
    }

    const chatMessagesCol = collection(db, 'chats', chatId, 'messages');
    const newMsg = await addDoc(chatMessagesCol, {
      sender: senderId,
      text,
      timestamp: serverTimestamp()
    });

    // Update lastMessage
    await setDoc(chatRef, { lastMessage: text, lastMessageTimestamp: serverTimestamp() }, { merge: true });

    res.status(201).json({ id: newMsg.id, sender: senderId, text, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ── Socket.IO ────────────────────────────────────────────────────────────────

const ROOM = 'group';
const groupMembers = new Set();

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinRoom', async (data) => {
    const username = typeof data === 'string' ? data : data.username;
    console.log(username, 'is joining the room');

    await socket.join(ROOM);
    socket.username = username;
    groupMembers.add(username);

    io.to(ROOM).emit('membersList', Array.from(groupMembers));
    io.to(ROOM).emit("roomNotice", { username, action: 'joined' });
  });

  socket.on('chatMessage', async (data) => {
    const username = socket.username || data.username;
    const message = data.message;

    console.log(`Message from ${username}: ${message}`);

    io.to(ROOM).emit('chatMessage', { username, message });

    try {
      await addDoc(messagesCol, {
        username,
        message,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error saving message to Firestore:', err);
    }
  });

  socket.on('typing', (data) => {
    const username = socket.username || data.username;
    socket.broadcast.to(ROOM).emit('typing', { username });
  });

  // ── Private 1-on-1 Chat ────────────────────────────────────────────────────

  // Join a private room (chatId = sorted UIDs joined by '_')
  socket.on('joinPrivateRoom', ({ chatId, userId, username }) => {
    socket.join(chatId);
    socket.userId = userId;
    console.log(`${username} joined private room: ${chatId}`);
  });

  // Mark messages as read — emit to the room so sender sees blue ticks
  socket.on('markRead', ({ chatId, readerUserId }) => {
    // Notify everyone in the room (especially the sender)
    socket.to(chatId).emit('messagesRead', { chatId, readerUserId });
  });

  // Send a private message — broadcast instantly, save to Firestore
  socket.on('privateMessage', async ({ chatId, senderId, senderName, text, members }) => {
    const timestamp = new Date().toISOString();

    // Emit to everyone in the private room immediately
    io.to(chatId).emit('privateMessage', {
      sender: senderId,
      senderName,
      text,
      timestamp
    });

    // Persist to Firestore
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, { members, createdAt: serverTimestamp() });
      }
      const chatMessagesCol = collection(db, 'chats', chatId, 'messages');
      await addDoc(chatMessagesCol, {
        sender: senderId,
        text,
        timestamp: serverTimestamp()
      });
      await setDoc(chatRef, { lastMessage: text, lastMessageTimestamp: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Error saving private message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    if (socket.username) {
      groupMembers.delete(socket.username);
      io.to(ROOM).emit('membersList', Array.from(groupMembers));
      io.to(ROOM).emit('roomNotice', { username: socket.username, action: 'left' });
    }
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Server is running</h1>');
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
