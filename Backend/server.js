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

  socket.on('joinRoom', async (username) => {
    console.log(username, 'is joining the room');

    await socket.join(ROOM);

    //send to all
    //io.to(ROOM).emit("roomNotice", username);
 
    //brodcast
    socket.broadcast.emit('roomNotice', username);
  })

  socket.on('chatMessage', (msg) => {
    socket.broadcast.emit('chatMessage', username);
  })
});

app.get('/', (req, res) => {
  res.send('<h1>Server is running</h1>');
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});