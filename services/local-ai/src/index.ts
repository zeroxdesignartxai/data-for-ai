import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { z } from "zod";

const app = express();
app.disable("x-powered-by");

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
    callback(null, allowed);
  }
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(limiter);

const apiKeySchema = z.object({
  apiKey: z.string().min(1)
});

const metadataSchema = apiKeySchema.extend({
  artist: z.string().min(1),
  trackTitle: z.string().min(1),
  releaseTitle: z.string().min(1),
  genre: z.string().min(1),
  language: z.string().min(1),
  explicit: z.boolean(),
  notes: z.string().optional(),
  lyrics: z.string().optional()
});

const checklistSchema = apiKeySchema.extend({
  goal: z.enum(["SpotifySingle", "SpotifyAlbum", "ClientAd", "YouTubeMonetize", "BeatLicense"])
});

const riskScanSchema = apiKeySchema.extend({
  trackTitle: z.string().min(1),
  releaseTitle: z.string().min(1),
  notes: z.string().optional(),
  lyrics: z.string().optional()
});

const createClient = (apiKey: string) => new OpenAI({ apiKey });

const jsonResponse = <T>(res: express.Response, body: T) => res.json(body);

app.post("/health", (_req, res) => {
  jsonResponse(res, { ok: true });
});

app.post("/ai/test-key", async (req, res) => {
  const parsed = apiKeySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Missing API key" });
  }

  try {
    const client = createClient(parsed.data.apiKey);
    await client.responses.create({
      model: "gpt-4.1-mini",
      input: "ping",
      max_output_tokens: 5
    });
    return jsonResponse(res, { ok: true });
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Invalid API key" });
  }
});

app.post("/ai/metadata", async (req, res) => {
  const parsed = metadataSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { apiKey, ...payload } = parsed.data;

  try {
    const client = createClient(apiKey);
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Return JSON only with keys: titleIdeas (string[]), descriptionShort (string), descriptionLong (string), tags (string[]), genreSuggestions (string[])."
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ],
      max_output_tokens: 300
    });

    const parsedJson = parseJson(response.output_text ?? "{}");
    return jsonResponse(res, parsedJson);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate metadata" });
  }
});

app.post("/ai/checklist", async (req, res) => {
  const parsed = checklistSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { apiKey, goal } = parsed.data;

  try {
    const client = createClient(apiKey);
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Return JSON only with key steps (array of {id,text,required})."
        },
        {
          role: "user",
          content: JSON.stringify({ goal })
        }
      ],
      max_output_tokens: 300
    });

    const parsedJson = parseJson(response.output_text ?? "{}");
    return jsonResponse(res, parsedJson);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate checklist" });
  }
});

app.post("/ai/risk-scan", async (req, res) => {
  const parsed = riskScanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { apiKey, ...payload } = parsed.data;

  try {
    const client = createClient(apiKey);
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Return JSON only with keys: riskLevel (low|medium|high), flags (array of {code,message,severity}), suggestedEdits (object)."
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ],
      max_output_tokens: 300
    });

    const parsedJson = parseJson(response.output_text ?? "{}");
    return jsonResponse(res, parsedJson);
  } catch (error) {
    return res.status(500).json({ error: "Failed to run risk scan" });
  }
});

const parseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return { error: "AI response parsing failed" };
  }
};

const port = 8787;
app.listen(port, "127.0.0.1", () => {
  console.log(`ReleaseShield local-ai listening on http://127.0.0.1:${port}`);
});
