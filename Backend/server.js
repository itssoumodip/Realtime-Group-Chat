import { createServer } from 'node:http';
import express from 'express';
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limitToLast,
  serverTimestamp
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

// ── Express + Socket.IO ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

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

    // Broadcast to everyone in the room (including sender)
    io.to(ROOM).emit('chatMessage', { username, message });

    // Persist to Firestore
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
