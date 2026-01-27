import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const AUDIO_FILES = [
  "name-nichalia.mp3",
  "name-george.mp3",
  "name-alice.mp3",
  "name-matilda.mp3",
  "name-river.mp3",
  "name-daniel.mp3",
  "name-bella.mp3",
  "name-charlie.mp3",
  "name-chris.mp3",
  "name-jessica.mp3",
  "name-liam.mp3",
  "name-lily.mp3",
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Pick a random audio file
  const randomFile = AUDIO_FILES[Math.floor(Math.random() * AUDIO_FILES.length)];
  const filePath = path.join(process.cwd(), "data", "audio", randomFile);

  try {
    const audioBuffer = fs.readFileSync(filePath);
    
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to load audio" });
  }
}
