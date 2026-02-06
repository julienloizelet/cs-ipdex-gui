import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createReport, generateDownload, type CTIObject, type ReportResult } from './services/cti/index.js';

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
  maxHttpBufferSize: 5e6, // 5MB – default 1MB is too small for large IP lists
});

app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Per-socket session state
interface SessionState {
  apiKey: string;
  report: ReportResult | null;
  rawResults: CTIObject[];
}

const sessions = new Map<string, SessionState>();

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('init', (apiKey: string) => {
    sessions.set(socket.id, { apiKey, report: null, rawResults: [] });
    socket.emit('output', { type: 'stdout', data: 'API key saved.\n' });
    socket.emit('output', { type: 'exit', data: 'Configuration complete', code: 0 });
  });

  socket.on('createReport', async (data: { ips: string[]; isPovKey: boolean }) => {
    const session = sessions.get(socket.id);
    if (!session) {
      socket.emit('output', { type: 'error', data: 'No API key configured. Please set up your API key first.' });
      return;
    }

    try {
      const { report, raw } = await createReport(session.apiKey, data.ips, data.isPovKey, (output) => {
        socket.emit('output', output);
      });
      session.report = report;
      session.rawResults = raw;
    } catch (error) {
      if (!(error instanceof Error && error.message === 'No IPs provided')) {
        socket.emit('output', { type: 'exit', data: 'Report creation failed', code: 1 });
      }
    }
  });

  socket.on('downloadReport', () => {
    const session = sessions.get(socket.id);
    if (!session || !session.report || session.rawResults.length === 0) {
      socket.emit('output', {
        type: 'error',
        data: 'No report data available for download.',
      });
      return;
    }

    try {
      const archive = generateDownload(session.report, session.rawResults);
      socket.emit('reportFile', { data: archive });
    } catch (error) {
      socket.emit('output', {
        type: 'error',
        data: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  });

  socket.on('disconnect', () => {
    sessions.delete(socket.id);
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
