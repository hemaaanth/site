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

// Clips are tiny (~20 KB each); keep them in memory after the first read so a
// warm function answers without touching the disk.
const cache = new Map<string, Buffer>();

function readVoice(voice: string): Buffer {
  let audio = cache.get(voice);
  if (!audio) {
    audio = fs.readFileSync(path.join(process.cwd(), "data", "audio", `name-${voice}.mp3`));
    cache.set(voice, audio);
  }
  return audio;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // ?exclude=<voice> skips the voice that just played, so repeat clicks never
  // hear the same voice back-to-back. Unknown values are ignored.
  const exclude = typeof req.query.exclude === "string" ? req.query.exclude : "";
  const candidates = VOICES.filter((voice) => voice !== exclude);
  const voice = candidates[Math.floor(Math.random() * candidates.length)];

  try {
    const audioBuffer = readVoice(voice);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    res.setHeader("X-Voice-Name", voice);
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to load audio" });
  }
}
