import React, { useRef, useState, useCallback } from "react";
import { SpeakerIcon } from "../Icons";

export default function NamePronunciation({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playPronunciation = useCallback(() => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Fetch from API route (returns random voice, hides file paths)
    // Add cache-busting param to ensure we get a fresh random voice each time
    const audio = new Audio(`/api/pronunciation?t=${Date.now()}`);
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
