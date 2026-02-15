import { createServer } from 'node:http';
import express from 'express';
import { Server } from "socket.io";
import e from 'express';
import env from 'dotenv';

const PORT = env.PORT;

const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});