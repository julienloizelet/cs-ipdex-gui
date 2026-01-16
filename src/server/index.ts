import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initIpdex, createReport } from './services/ipdex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

const isDev = process.env.NODE_ENV !== 'production';

const io = new Server(server, {
  cors: isDev
    ? {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
      }
    : undefined,
});

app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('init', async (apiKey: string) => {
    try {
      await initIpdex(apiKey, (output) => {
        socket.emit('output', output);
      });
    } catch (error) {
      socket.emit('output', {
        type: 'error',
        data: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  socket.on('createReport', async (data: { ips: string[]; isPovKey: boolean }) => {
    try {
      await createReport(data.ips, data.isPovKey, (output) => {
        socket.emit('output', output);
      });
    } catch (error) {
      socket.emit('output', {
        type: 'error',
        data: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static files in production
if (!isDev) {
  const clientPath = join(__dirname, '../client');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
