import express from 'express';
import { fixtures } from './fixtures/cti-responses.js';

const app = express();

// API key validation middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey === 'invalid-key') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (!apiKey) {
    return res.status(403).json({ message: 'Missing API key' });
  }
  next();
});

// Batch endpoint — must be registered before /smoke/:ip
app.get('/smoke', (req, res) => {
  const ipsParam = req.query.ips as string;
  if (!ipsParam) {
    return res.status(400).json({ message: 'Missing ips parameter' });
  }
  const ips = ipsParam.split(',').map((ip) => decodeURIComponent(ip));
  const items = ips.map((ip) => fixtures[ip]).filter(Boolean);
  res.json({
    total: items.length,
    not_found: ips.length - items.length,
    items,
  });
});

// Single IP endpoint
app.get('/smoke/:ip', (req, res) => {
  const ip = decodeURIComponent(req.params.ip);
  const item = fixtures[ip];
  if (!item) {
    return res.status(404).json({ message: 'not found' });
  }
  res.json(item);
});

const PORT = 4444;
app.listen(PORT, () => {
  console.log(`Mock CTI server running on http://localhost:${PORT}`);
});
