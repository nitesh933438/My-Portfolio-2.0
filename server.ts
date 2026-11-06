import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'sapient-spot-gfbwx'
  });
}

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'portfolio-assets';

// Initialize Supabase Client (Bypasses RLS)
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;


// Multer for file handling in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Middleware to verify Firebase Admin
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);

    const ADMIN_EMAIL = 'nitesh933438@gmail.com';
    
    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// ---------------------------------------------------------------------------
// 1. Storage Proxy Routes
// ---------------------------------------------------------------------------

/**
 * Securely uploads a file to Supabase Storage
 */
app.post('/api/storage/upload', verifyAdmin, upload.single('file'), async (req: any, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase storage is not configured' });
    
    const file = req.file;
    const folder = req.body.folder || 'documents';
    
    if (!file) return res.status(400).json({ error: 'No file provided' });

    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    res.json({
      path: data.path,
      url: publicUrl
    });
  } catch (error: any) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

/**
 * Securely deletes a file from Supabase Storage
 */
app.post('/api/storage/delete', verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase storage is not configured' });
    
    const { path } = req.body;
    if (!path) return res.status(400).json({ error: 'No path provided' });

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete proxy error:', error);
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

/**
 * Generates a signed URL for private files
 */
app.get('/api/storage/signed-url', verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase storage is not configured' });
    
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'No path provided' });

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) throw error;

    res.json({ url: data.signedUrl });
  } catch (error: any) {
    console.error('Signed URL proxy error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
  }
});

// ---------------------------------------------------------------------------
// 2. Healthcheck & Legacy Routes
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storageConfigured: !!(supabaseUrl && supabaseServiceKey),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/academic/extract-marksheet', verifyAdmin, (_req, res) => {
  return res.status(503).json({
    success: false,
    error: 'Academic extraction is not yet configured with Gemini on the backend.'
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
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio CMS Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
