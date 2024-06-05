import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient, LiveTranscriptionEvents, Deepgram } from '@deepgram/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
  console.error('Deepgram API key is missing.');
  process.exit(1);
}

const deepgramClient = createClient(deepgramApiKey);

app.use(express.static('public'));
app.use(cors());

const setupDeepgram = (socket: any) => {
  const deepgram = deepgramClient.listen.live({
    language: 'en',
    punctuate: true,
    smart_format: true,
    model: 'nova',
  });

  let keepAlive = setInterval(() => deepgram.keepAlive(), 10000);

  deepgram.addListener(LiveTranscriptionEvents.Open, () => {
    console.log('Deepgram connection opened');
  });

  deepgram.addListener(LiveTranscriptionEvents.Close, () => {
    console.log('Deepgram connection closed');
    clearInterval(keepAlive);
  });

  deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel.alternatives[0].transcript ?? '';
    socket.emit('transcript', transcript);
  });

  deepgram.addListener(LiveTranscriptionEvents.Error, (error) => {
    console.error('Deepgram error:', error);
  });

  return deepgram;
};

io.on('connection', (socket) => {
  console.log('Client connected');
  const deepgram = setupDeepgram(socket);

  socket.on('packet-sent', (data) => {
    if (deepgram.getReadyState() === WebSocket.OPEN) {
      deepgram.send(data);
    } else {
      console.log('Deepgram not ready, reconnecting...');
      deepgram.finish();
      setupDeepgram(socket);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    deepgram.finish();
  });
});

server.listen(3000, () => {
  console.log('Server is listening on localhost:3000');
});
