import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI, Type } from '@google/genai';

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

// Initialize Supabase Client
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Multer for file handling in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// Middleware
app.use(cors()); // CRITICAL: Handles OPTIONS preflight requests
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
// 1. AI Extraction Logic
// ---------------------------------------------------------------------------

const extractionSchemas: Record<string, any> = {
  project: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      shortDescription: { type: Type.STRING },
      detailedDescription: { type: Type.STRING },
      category: { type: Type.STRING },
      techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
      keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
      githubUrl: { type: Type.STRING },
      liveDemoUrl: { type: Type.STRING },
      status: { type: Type.STRING }
    },
    required: ["title", "shortDescription", "detailedDescription"]
  },
  certificate: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      issuer: { type: Type.STRING },
      issueDate: { type: Type.STRING },
      credentialId: { type: Type.STRING },
      credentialUrl: { type: Type.STRING },
      category: { type: Type.STRING },
      skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      description: { type: Type.STRING }
    },
    required: ["title", "issuer"]
  },
  education: {
    type: Type.OBJECT,
    properties: {
      institution: { type: Type.STRING },
      degree: { type: Type.STRING },
      branch: { type: Type.STRING },
      passingYear: { type: Type.STRING },
      percentage: { type: Type.NUMBER },
      sgpa: { type: Type.NUMBER },
      location: { type: Type.STRING },
      highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["institution", "degree"]
  },
  settings: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      title: { type: Type.STRING },
      bio: { type: Type.STRING },
      location: { type: Type.STRING },
      email: { type: Type.STRING },
      whatsapp: { type: Type.STRING },
      aboutQuote: { type: Type.STRING },
      experienceSummary: { type: Type.STRING }
    }
  }
};

app.post('/api/ai/extract', verifyAdmin, upload.single('file'), async (req: any, res) => {
  try {
    if (!ai) return res.status(503).json({ error: 'Gemini API is not configured' });

    const { module, text, url } = req.body;
    const file = req.file;

    if (!module || !extractionSchemas[module]) {
      return res.status(400).json({ error: `Invalid or missing module: ${module}` });
    }

    const schema = extractionSchemas[module];
    let promptText = `Extract ${module} information from the following content. If a field is not found, leave it empty or null. Do not invent information.`;
    
    if (text) promptText += `\n\nTEXT CONTENT:\n${text}`;
    if (url) promptText += `\n\nURL TO ANALYZE: ${url}`;

    const parts: any[] = [{ text: promptText }];
    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    res.json({
      success: true,
      data: JSON.parse(response.text || '{}')
    });
  } catch (error: any) {
    console.error('AI Extraction error:', error);
    res.status(500).json({ error: error.message || 'AI extraction failed' });
  }
});

// ---------------------------------------------------------------------------
// 2. Storage Proxy Routes
// ---------------------------------------------------------------------------

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
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    res.json({ path: data.path, url: publicUrl });
  } catch (error: any) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

app.post('/api/storage/delete', verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase storage is not configured' });
    const { path } = req.body;
    if (!path) return res.status(400).json({ error: 'No path provided' });

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete proxy error:', error);
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

app.get('/api/storage/signed-url', verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase storage is not configured' });
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'No path provided' });

    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(filePath, 3600);
    if (error) throw error;
    res.json({ url: data.signedUrl });
  } catch (error: any) {
    console.error('Signed URL proxy error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
  }
});

// ---------------------------------------------------------------------------
// 3. Health & Misc
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storageConfigured: !!supabase,
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/academic/extract-marksheet', verifyAdmin, (_req, res) => {
  res.status(308).json({ 
    success: false, 
    error: 'Please use the universal /api/ai/extract endpoint with module="education".' 
  });
});

// ---------------------------------------------------------------------------
// 4. Global Error Handler (Ensures JSON responses)
// ---------------------------------------------------------------------------

app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected internal error occurred'
  });
});

// Handle 404s for API routes specifically
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// ---------------------------------------------------------------------------
// 5. Start Server & Vite
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
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Portfolio CMS Backend running on http://0.0.0.0:${PORT}`);
    console.log(`🤖 Gemini AI: ${ai ? 'ENABLED' : 'DISABLED (Missing API Key)'}`);
    console.log(`📦 Supabase: ${supabase ? 'ENABLED' : 'DISABLED (Missing Config)'}\n`);
  });
}

startServer();
