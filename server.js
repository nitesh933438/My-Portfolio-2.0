// server.ts
import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
dotenv.config();
var app = express();
var PORT = 3e3;
if (!getApps().length) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "sapient-spot-gfbwx"
  });
}
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var STORAGE_BUCKET = process.env.SUPABASE_BUCKET || "portfolio-assets";
var supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
  // 25MB
});
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
var verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const ADMIN_EMAIL = "nitesh933438@gmail.com";
    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
app.post("/api/storage/upload", verifyAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase storage is not configured" });
    const file = req.file;
    const folder = req.body.folder || "documents";
    if (!file) return res.status(400).json({ error: "No file provided" });
    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    res.json({
      path: data.path,
      url: publicUrl
    });
  } catch (error) {
    console.error("Upload proxy error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});
app.post("/api/storage/delete", verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase storage is not configured" });
    const { path: path2 } = req.body;
    if (!path2) return res.status(400).json({ error: "No path provided" });
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path2]);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Delete proxy error:", error);
    res.status(500).json({ error: error.message || "Delete failed" });
  }
});
app.get("/api/storage/signed-url", verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase storage is not configured" });
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: "No path provided" });
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(filePath, 3600);
    if (error) throw error;
    res.json({ url: data.signedUrl });
  } catch (error) {
    console.error("Signed URL proxy error:", error);
    res.status(500).json({ error: error.message || "Failed to generate signed URL" });
  }
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    storageConfigured: !!(supabaseUrl && supabaseServiceKey),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/academic/extract-marksheet", verifyAdmin, (_req, res) => {
  return res.status(503).json({
    success: false,
    error: "Academic extraction is not yet configured with Gemini on the backend."
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Portfolio CMS Backend running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
