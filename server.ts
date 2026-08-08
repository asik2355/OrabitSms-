import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { getNumberFromApis, fetchOtpForNumber, fetchLiveConsoleHits } from "./server/smsService.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // SMS Routing Endpoints for Voltx, Stex, and Zenex APIs
  app.post("/api/sms/getnum", async (req, res) => {
    try {
      const { targetRange, isNational, noPlus } = req.body;
      const result = await getNumberFromApis(targetRange, isNational, noPlus);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("SMS getnum error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/sms/fetch-otp", async (req, res) => {
    try {
      const { number } = req.body;
      const result = await fetchOtpForNumber(number);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("SMS fetch-otp error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/sms/console-hits", async (req, res) => {
    try {
      const hits = await fetchLiveConsoleHits();
      res.json({ success: true, hits });
    } catch (error: any) {
      console.error("SMS console-hits error:", error);
      res.status(500).json({ success: false, error: error.message, hits: [] });
    }
  });

  // Initialize Gemini AI Client lazily or safely
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", geminiAvailable: !!process.env.GEMINI_API_KEY });
  });

  // AI Website Generator Endpoint
  app.post("/api/gemini/generate-site", async (req, res) => {
    try {
      const { domainName, brandName, niche, language, targetAudience, tone } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.status(400).json({
          error: "GEMINI_API_KEY available check failed",
          message: "No Gemini API Key provided. Default template loaded.",
        });
      }

      const isBengali = language === "bn" || language === "bilingual";

      const prompt = `
You are a world-class web designer, UI copywriter, and brand strategist.
Create a complete website configuration for the domain: "${domainName || "mybrand.com"}"
Brand Name: "${brandName || domainName || "My Brand"}"
Niche/Category: "${niche || "Business"}"
Tone: "${tone || "Professional, Modern, Friendly"}"
Language: ${isBengali ? "Bengali (বাংলা) with clean professional Bengali typography and copy. You can also include English subtitled terms where appropriate." : "English"}

Return ONLY a valid JSON object matching this schema:
{
  "tagline": "A catchy, powerful slogan for the brand",
  "metaTitle": "SEO Page Title",
  "metaDescription": "SEO meta description under 160 characters",
  "theme": {
    "primaryColor": "#2563eb",
    "accentColor": "#f59e0b",
    "bgColor": "#ffffff",
    "textColor": "#0f172a",
    "fontStyle": "sans"
  },
  "hero": {
    "badge": "Launching Soon / #1 Service Provider",
    "title": "Main Hero Headline",
    "subtitle": "Clear value proposition and description of what this domain offers",
    "ctaPrimary": "Get Started",
    "ctaSecondary": "Learn More",
    "heroImageQuery": "relevant keywords for Unsplash background"
  },
  "about": {
    "title": "About Us",
    "story": "Compelling story about why this brand exists and how it helps customers.",
    "stats": [
      { "label": "Happy Clients", "value": "1,000+" },
      { "label": "Projects Completed", "value": "250+" },
      { "label": "Satisfaction Rate", "value": "99%" },
      { "label": "Years Experience", "value": "5+" }
    ]
  },
  "features": [
    { "title": "Feature 1", "description": "Description of feature 1", "icon": "Zap" },
    { "title": "Feature 2", "description": "Description of feature 2", "icon": "ShieldCheck" },
    { "title": "Feature 3", "description": "Description of feature 3", "icon": "Sparkles" },
    { "title": "Feature 4", "description": "Description of feature 4", "icon": "Rocket" }
  ],
  "services": [
    { "title": "Service 1", "description": "Details of service 1", "price": "$99" },
    { "title": "Service 2", "description": "Details of service 2", "price": "$199" },
    { "title": "Service 3", "description": "Details of service 3", "price": "$299" }
  ],
  "testimonials": [
    { "name": "Abdur Rahman", "role": "CEO, Tech Ventures", "content": "Working with this platform transformed our online presence!", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { "name": "Sarah Ahmed", "role": "Founder, Style Studio", "content": "Super high quality service and impressive results.", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" }
  ],
  "pricing": [
    { "name": "Starter", "price": "$49", "period": "/month", "description": "Best for small projects", "features": ["Core Features", "Domain Support", "24/7 Support"], "popular": false },
    { "name": "Pro Business", "price": "$99", "period": "/month", "description": "For growing businesses", "features": ["All Starter Features", "Priority Server", "Custom Domain", "AI Assistant"], "popular": true }
  ],
  "faq": [
    { "question": "How do I contact support?", "answer": "You can reach us anytime via our contact form or support email." },
    { "question": "What is the domain launch timeline?", "answer": "Our full services go live within 24-48 hours of setup." }
  ],
  "contact": {
    "title": "Get in Touch",
    "subtitle": "Have questions about our domain services? Reach out to us today.",
    "email": "contact@${domainName || "mybrand.com"}",
    "phone": "+880 1700-000000",
    "address": "Dhaka, Bangladesh"
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const jsonText = response.text || "{}";
      const siteConfig = JSON.parse(jsonText);
      res.json(siteConfig);
    } catch (error: any) {
      console.error("Gemini site generation error:", error);
      res.status(500).json({
        error: "Generation Failed",
        message: error.message || "Failed to generate site content.",
      });
    }
  });

  // AI Copywriting Helper for specific sections
  app.post("/api/gemini/refine-section", async (req, res) => {
    try {
      const { section, currentContent, userPrompt, domainName, language } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.status(400).json({ error: "No Gemini API key available" });
      }

      const prompt = `
You are an expert website copywriter.
Refine and write updated copy for section "${section}" for the website of domain "${domainName}".
Language: ${language === "bn" ? "Bengali" : "English"}
Current Content: ${JSON.stringify(currentContent)}
User Instruction: "${userPrompt}"

Return JSON matching the structure of currentContent with improved wording, high conversion appeal, and clear formatting.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const jsonText = response.text || "{}";
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error("Gemini refine section error:", error);
      res.status(500).json({ error: error.message });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
