import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 25MB limit for PDF / image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Academic extraction is disabled until server-side Firebase Admin verification is implemented.

// ---------------------------------------------------------------------------
// 1. Healthcheck Endpoint
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// 2. Academic extraction — fail closed until server-side auth is implemented
// ---------------------------------------------------------------------------
app.post('/api/academic/extract-marksheet', (_req, res) => {
  return res.status(503).json({
    success: false,
    error: 'Academic extraction is temporarily disabled until server-side Firebase Admin authentication is configured.'
  });
});

// ---------------------------------------------------------------------------
// 3. Mount Vite middlewares in development
// ---------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic Management System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
