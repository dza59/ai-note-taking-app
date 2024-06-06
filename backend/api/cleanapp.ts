import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createClient, LiveTranscriptionEvents, Deepgram } from '@deepgram/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173', // This should match the port your React app is served on
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions)); // Use CORS with options

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  console.log('a user connected');
  console.log(socket.id);
});

server.listen(3000, () => {
  console.log('listening on localhost:3000 qqq');
});
