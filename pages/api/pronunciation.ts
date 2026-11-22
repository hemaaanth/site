import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// Voice names map to data/audio/name-<voice>.mp3
const VOICES = [
  "nichalia",
  "george",
  "alice",
  "matilda",
  "river",
  "daniel",
  "bella",
  "charlie",
  "chris",
  "jessica",
  "liam",
  "lily",
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // ?exclude=<voice> skips the voice that just played, so repeat clicks never
  // hear the same voice back-to-back. Unknown values are ignored.
  const exclude = typeof req.query.exclude === "string" ? req.query.exclude : "";
  const candidates = VOICES.filter((voice) => voice !== exclude);
  const voice = candidates[Math.floor(Math.random() * candidates.length)];
  const filePath = path.join(process.cwd(), "data", "audio", `name-${voice}.mp3`);

  try {
    const audioBuffer = fs.readFileSync(filePath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    res.setHeader("X-Voice-Name", voice);
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to load audio" });
  }
}
