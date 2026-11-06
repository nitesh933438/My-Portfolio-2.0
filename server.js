// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/academic/extract-marksheet", (_req, res) => {
  return res.status(503).json({
    success: false,
    error: "Academic extraction is temporarily disabled until server-side Firebase Admin authentication is configured."
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
    console.log(`Academic Management System running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
