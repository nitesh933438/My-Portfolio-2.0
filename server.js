// server.ts
import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenAI, Type } from "@google/genai";
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT || 3e3);
if (!getApps().length) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "sapient-spot-gfbwx"
  });
}
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var STORAGE_BUCKET = process.env.SUPABASE_BUCKET || "portfolio-assets";
var supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
var ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
  // 25MB
});
var allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((value) => value.trim()).filter(Boolean);
var corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
if (allowedOrigins.length > 0) {
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
}
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
var verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  const ADMIN_EMAIL = "nitesh933438@gmail.com";
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error("Firebase ID token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired Firebase ID token" });
  }
};
async function fetchPublicGitHubRepositoryContext(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Please provide a valid HTTPS GitHub repository URL.");
  }
  if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "github.com") {
    throw new Error("URL analysis currently supports public GitHub repository URLs only.");
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) throw new Error("Please provide a GitHub repository URL in the format https://github.com/owner/repository.");
  const [owner, repository] = segments;
  const headers = { "Accept": "application/vnd.github+json", "User-Agent": "Portfolio-CMS-AI-Scanner" };
  const repoName = repository.replace(/\.git$/i, "");
  const requestOptions = { headers, signal: AbortSignal.timeout(12e3) };
  const repoResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`, requestOptions);
  if (!repoResponse.ok) throw new Error(`GitHub repository could not be read (HTTP ${repoResponse.status}). Make sure it is public and the URL is correct.`);
  const repo = await repoResponse.json();
  let readmeText = "";
  const readmeResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/readme`, requestOptions);
  if (readmeResponse.ok) {
    const readme = await readmeResponse.json();
    if (readme.encoding === "base64" && readme.content) {
      readmeText = Buffer.from(String(readme.content).replace(/\s/g, ""), "base64").toString("utf8").slice(0, 18e3);
    }
  }
  return [
    `Repository: ${repo.full_name || `${owner}/${repository}`}`,
    `Description: ${repo.description || "Not provided"}`,
    `Homepage: ${repo.homepage || "Not provided"}`,
    `Default branch: ${repo.default_branch || "Unknown"}`,
    `Primary language: ${repo.language || "Unknown"}`,
    `Topics: ${(repo.topics || []).join(", ") || "Not provided"}`,
    `Stars: ${repo.stargazers_count ?? 0}`,
    `README:
${readmeText || "No README available."}`
  ].join("\n\n");
}
var extractionSchemas = {
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
      totalMarks: { type: Type.NUMBER },
      obtainedMarks: { type: Type.NUMBER },
      sgpa: { type: Type.NUMBER },
      semesterNumber: { type: Type.NUMBER },
      resultDeclarationDate: { type: Type.STRING },
      qualificationTitle: { type: Type.STRING },
      standard: { type: Type.STRING },
      board: { type: Type.STRING },
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
  },
  experience: {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING },
      company: { type: Type.STRING },
      location: { type: Type.STRING },
      period: { type: Type.STRING },
      description: { type: Type.STRING },
      type: { type: Type.STRING },
      highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  },
  skills: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING },
      skills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, level: { type: Type.NUMBER } } } }
    }
  }
};
app.post("/api/ai/analyze-and-extract", verifyAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: "Gemini API is not configured. Add GEMINI_API_KEY to environment." });
    const { text, url } = req.body;
    const file = req.file;
    if (file && !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return res.status(415).json({ success: false, error: "Unsupported file type. Upload a PDF, JPG, PNG or WEBP file." });
    }
    const moduleFieldGuide = Object.fromEntries(Object.entries(extractionSchemas).map(([name, schema]) => [name, Object.keys(schema.properties || {})]));
    let promptText = `Analyze the provided content to:
1. Identify the document type (e.g., certificate, resume, marksheet, project screenshot).
2. Select exactly one supported Admin Module: project, certificate, education, settings, experience, skills, or unknown. Do not invent destinations.
3. Extract only fields supported by the selected module schema. Exact field names by module: ${JSON.stringify(moduleFieldGuide)}. Use these exact keys and do not invent new keys. For a resume, choose the single best destination based on its primary content (settings for profile/contact summary, experience for work history, skills for a skills-focused document); mention other relevant information in suggestion. If an image clearly shows a software product/project interface, use detectedModule=project and detectedType=project_screenshot. If it is a personal profile portrait or unrelated image, use detectedModule=unknown and explain the recommended handling in suggestion.

Return a JSON object in the following format:
{
  "detectedType": "string",
  "detectedModule": "string",
  "data": { ...extractedFields... },
  "confidence": number (0-1),
  "suggestion": "string"
}

If a field is not found, leave it empty or null. Do not invent information. detectedModule must be lowercase and must be one of: project, certificate, education, settings, experience, skills, unknown. confidence must be a number from 0 to 1.`;
    if (text && String(text).length > 1e5) return res.status(413).json({ success: false, error: "Pasted text exceeds the 100,000 character limit." });
    if (text) promptText += `

TEXT CONTENT:
${text}`;
    if (url) {
      const githubContext = await fetchPublicGitHubRepositoryContext(String(url));
      promptText += `

VERIFIED PUBLIC GITHUB REPOSITORY CONTENT:
${githubContext}`;
    }
    if (!file && !text && !url) return res.status(400).json({ success: false, error: "Upload a file, paste text, or provide a public GitHub repository URL." });
    const parts = [{ text: promptText }];
    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype
        }
      });
    }
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json"
      }
    });
    const rawText = response.text || "";
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error("Gemini returned non-JSON output:", rawText.slice(0, 500));
      return res.status(502).json({ success: false, error: "AI returned an invalid response. Please retry." });
    }
    const allowedModules = /* @__PURE__ */ new Set(["project", "certificate", "education", "settings", "experience", "skills", "unknown"]);
    const detectedModule = String(result.detectedModule || "unknown").trim().toLowerCase();
    if (!allowedModules.has(detectedModule) || !result.data || typeof result.data !== "object") {
      return res.status(502).json({ success: false, error: "AI response did not match the expected extraction format." });
    }
    res.json({
      success: true,
      data: {
        ...result,
        detectedModule,
        detectedType: String(result.detectedType || "unknown"),
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
        data: result.data
      }
    });
  } catch (error) {
    console.error("Universal AI analysis error:", error);
    res.status(500).json({ error: error.message || "AI analysis failed" });
  }
});
app.post("/api/ai/extract", verifyAdmin, (_req, res) => {
  res.status(410).json({ success: false, error: "This legacy endpoint is retired. Use /api/ai/analyze-and-extract." });
});
app.post("/api/ai/chat", verifyAdmin, async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: "Gemini API is not configured. Add GEMINI_API_KEY to environment." });
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    const systemInstruction = `You are the intelligent AI Assistant for Nitesh Kumar's Portfolio Admin CMS.
You help the administrator understand the CMS and draft or improve portfolio content. You do not have direct database or storage write access in this chat endpoint. Never claim that you have saved, edited, deleted, published, or inspected live Firestore records. Give clear instructions or draft content for the administrator to review and apply in the relevant manager. Be concise, helpful, professional, and knowledgeable about full-stack development, MERN, AI, and portfolio content management.`;
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `${systemInstruction}

User Question: ${message}` }] }]
    });
    res.json({
      success: true,
      reply: response.text || "I processed your request."
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({ error: error.message || "AI Chat failed" });
  }
});
app.post("/api/storage/upload", verifyAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase storage is not configured" });
    const file = req.file;
    const folder = req.body.folder || "documents";
    const allowedFolders = /* @__PURE__ */ new Set(["certificates", "projects", "profile", "resume", "documents"]);
    if (!allowedFolders.has(folder)) return res.status(400).json({ error: "Invalid storage folder" });
    if (!file) return res.status(400).json({ error: "No file provided" });
    if (file.size > 25 * 1024 * 1024) return res.status(413).json({ error: "File exceeds the 25MB upload limit" });
    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    res.json({ path: data.path, url: publicUrl });
  } catch (error) {
    console.error("Upload proxy error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});
app.post("/api/storage/delete", verifyAdmin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase storage is not configured" });
    const { path: path2 } = req.body;
    if (!path2 || typeof path2 !== "string" || path2.includes("..") || path2.startsWith("/") || path2.includes("\\")) return res.status(400).json({ error: "Invalid storage path" });
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
    if (!filePath || filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) return res.status(400).json({ error: "Invalid storage path" });
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
    storageConfigured: !!supabase,
    geminiConfigured: !!ai,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/academic/extract-marksheet", verifyAdmin, (_req, res) => {
  res.status(308).json({
    success: false,
    error: 'Please use the universal /api/ai/extract endpoint with module="education".'
  });
});
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || "Server Error",
    message: err.message || "An unexpected internal error occurred"
  });
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: "API route not found" });
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
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
\u{1F680} Portfolio CMS Backend running on http://0.0.0.0:${PORT}`);
    console.log(`\u{1F916} Gemini AI: ${ai ? "ENABLED" : "DISABLED (Missing API Key)"}`);
    console.log(`\u{1F4E6} Supabase: ${supabase ? "ENABLED" : "DISABLED (Missing Config)"}
`);
  });
}
startServer().catch((error) => {
  console.error("Failed to start portfolio server:", error);
  process.exit(1);
});
