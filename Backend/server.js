import { createServer } from 'node:http';
import express from 'express';
import { Server } from "socket.io";
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const ROOM = 'group';

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinRoom', async (data) => {
    const username = typeof data === 'string' ? data : data.username;
    console.log(username, 'is joining the room');

    await socket.join(ROOM);

    // Store username with socket for later use
    socket.username = username;

    //send to all
    io.to(ROOM).emit("roomNotice", { username, action: 'joined' });
  })

  socket.on('chatMessage', (data) => {
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