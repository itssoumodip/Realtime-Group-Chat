import { createServer } from 'node:http';
import express from 'express';
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173'];

// Middleware
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

    //send to all
    io.to(ROOM).emit("roomNotice", { username, action: 'joined' });
  })

  socket.on('chatMessage', async (data) => {
    const username = socket.username || data.username;
    const message = data.message;

    console.log(`Message from ${username}: ${message}`);

    // Broadcast to all in the room including sender
    io.to(ROOM).emit('chatMessage', { username, message });
  })

  socket.on('typing', (data) => {
    const username = socket.username || data.username;
    socket.broadcast.to(ROOM).emit('typing', { username });
  })

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

