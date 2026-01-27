import React, { useRef, useState, useCallback } from "react";

// Pre-generated audio files with different ElevenLabs voices
const PRONUNCIATION_FILES = [
  "/audio/name-nichalia.mp3",
  "/audio/name-george.mp3",
  "/audio/name-alice.mp3",
  "/audio/name-matilda.mp3",
  "/audio/name-river.mp3",
  "/audio/name-daniel.mp3",
  "/audio/name-bella.mp3",
  "/audio/name-charlie.mp3",
  "/audio/name-chris.mp3",
  "/audio/name-jessica.mp3",
  "/audio/name-liam.mp3",
  "/audio/name-lily.mp3",
];

function SpeakerIcon({ size = 16, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
    >
      <path d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM144,207.64,84.91,161.69A7.94,7.94,0,0,0,80,160H32V96H80a7.94,7.94,0,0,0,4.91-1.69L144,48.36ZM208,128a39.93,39.93,0,0,1-10,26.46,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.72,8,8,0,1,1,12-10.58A40,40,0,0,1,208,128Z" />
    </svg>
  );
}

export default function NamePronunciation({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playPronunciation = useCallback(() => {
    // Pick a random audio file
    const randomFile = PRONUNCIATION_FILES[Math.floor(Math.random() * PRONUNCIATION_FILES.length)];
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Create and play new audio
    const audio = new Audio(randomFile);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    audio.play().catch(() => setIsPlaying(false));
  }, []);

  return (
    <span className="inline-flex items-center gap-2">
      {children}
      <button
        onClick={playPronunciation}
        className={`inline-flex items-center justify-center p-1 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
          isPlaying ? "text-blue-500" : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        }`}
        aria-label="Play name pronunciation"
        title="Click to hear pronunciation"
      >
        <SpeakerIcon size={18} />
      </button>
    </span>
  );
}
