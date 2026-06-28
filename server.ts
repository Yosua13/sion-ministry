import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client if key is present
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API endpoints FIRST

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2. AI Assistant Endpoint
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!ai) {
        return res.json({ 
          text: "Sion AI Assistant sedang dalam Mode Simulasi (Kunci API Gemini tidak terkonfigurasi di Settings > Secrets). Silakan atur GEMINI_API_KEY Anda untuk mengaktifkan AI sepenuhnya!\n\nBerikut adalah respon simulasi pemuridan:\n\n*Amanat Agung (Matius 28:19-20)* adalah panggilan bagi kita semua pekerja Sion Ministry untuk memuridkan bangsa-bangsa. Dalam konteks pemuridan Anda saat ini, berfokuslah membangun kedekatan pribadi dengan jemaat dan mendampingi mereka mempelajari modul-modul dasar iman Kristen secara konsisten." 
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "Anda adalah Asisten Pemuridan Digital Sion Academy yang ramah, bijaksana, dan alkitabiah. Bantu para pekerja Sion Ministry menjawab pertanyaan teologi praktis, menyusun rencana pelajaran, merangkum berita acara pemuridan, dan memikirkan strategi pelayanan berdasarkan Matius 28:19-20.",
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with Sion AI Assistant" });
    }
  });

  // 3. API Proxy to Lambda
  app.post("/api/sion-proxy", async (req, res) => {
    try {
      const lambdaUrl = "https://uzepc6y2d76yrnmctvuc7j7mqe0xvbii.lambda-url.ap-southeast-3.on.aws/";
      const response = await fetch(lambdaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Lambda URL returned status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.warn("Lambda proxy request failed, falling back to client-side offline storage:", error.message);
      // We will return a simulated success or appropriate response so the client knows it should rely on its offline database
      res.status(502).json({ 
        error: "Gateway Timeout / Unreachable", 
        message: error.message,
        fallbackToOffline: true 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
