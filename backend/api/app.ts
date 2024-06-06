import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
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

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY as string);
let keepAlive: NodeJS.Timer | undefined;

const setupDeepgram = (socket: any) => {
  const deepgram = deepgramClient.listen.live({
    language: 'en',
    punctuate: true,
    smart_format: true,
    model: 'nova',
  });

  if (keepAlive) clearInterval(keepAlive as NodeJS.Timeout);
  keepAlive = setInterval(() => {
    console.log('deepgram: keepalive');
    deepgram.keepAlive();
  }, 10 * 1000);

  deepgram.addListener(LiveTranscriptionEvents.Open, async () => {
    let keepAlive: NodeJS.Timer | undefined;

    deepgram.addListener(LiveTranscriptionEvents.Warning, async (warning) => {
      console.log('deepgram: warning received');
      console.warn(warning);
    });

    deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      console.log('deepgram: packet received');
      console.log('deepgram: transcript received');
      const transcript = data.channel.alternatives[0].transcript ?? '';
      console.log('socket: transcript sent to client');
      socket.emit('transcript', transcript);
      console.log('socket: transcript data sent to client');
      socket.emit('data', data);
    });

    deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
      console.log('deepgram: packet received');
      console.log('deepgram: metadata received');
      console.log('socket: metadata sent to client');
      socket.emit('metadata', data);
    });
  });

  return deepgram;
};

io.on('connection', (socket) => {
  console.log('socket: client connected');
  let deepgram = setupDeepgram(socket);

  socket.on('packet-sent', (data: any) => {
    console.log('socket: client data received');

    if (deepgram.getReadyState() === 1 /* OPEN */) {
      console.log('socket: data sent to deepgram');
      deepgram.send(data);
    } else if (deepgram.getReadyState() >= 2 /* 2 = CLOSING, 3 = CLOSED */) {
      console.log("socket: data couldn't be sent to deepgram");
      console.log('socket: retrying connection to deepgram');
      deepgram.finish();
      deepgram.removeAllListeners();
      deepgram = setupDeepgram(socket);
    } else {
      console.log("socket: data couldn't be sent to deepgram");
    }
  });

  socket.on('disconnect', () => {
    console.log('socket: client disconnected');
    deepgram.finish();
    deepgram.removeAllListeners();
    // deepgram = null;
  });
});

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/public/index.html`);
});

server.listen(3000, () => {
  console.log('listening on localhost:3000 ddd');
});
