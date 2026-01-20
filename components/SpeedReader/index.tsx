import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { extractPlainText } from '../../lib/portableTextUtils';
import { SpeedReaderIcon } from '../Icons';
import type { PortableTextBlock } from '@portabletext/types';

interface SpeedReaderProps {
  content: PortableTextBlock[];
  children: React.ReactNode;
}

function getORPIndex(word: string): number {
  const len = word.length;
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 3;
}

function splitWordForDisplay(word: string) {
  const orpIndex = getORPIndex(word);
  return {
    before: word.slice(0, orpIndex),
    orp: word[orpIndex] || '',
    after: word.slice(orpIndex + 1)
  };
}

function endsWithSentencePunctuation(word: string): boolean {
  // Match .!? at end, or followed by quotes/brackets/punctuation
  return /[.!?]['"'"\)}\]\,]*$/.test(word);
}

function endsWithComma(word: string): boolean {
  // Match comma at end, or followed by quotes/brackets
  return /,['"'"\)}\]]*$/.test(word);
}

export function SpeedReader({ content, children }: SpeedReaderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const wordsRef = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract words on mount
  useEffect(() => {
    wordsRef.current = extractPlainText(content);
  }, [content]);

  // Create portal container
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.setAttribute('id', 'speedreader-portal');
      document.body.appendChild(container);
      setPortalContainer(container);

      return () => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      };
    }
  }, []);

  // Lock body scroll when active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  // Word cycling with sentence pause
  const scheduleNextWord = useCallback(() => {
    if (!isPlaying || !isActive) return;

    const currentWord = wordsRef.current[currentWordIndex] || '';
    const baseInterval = 60000 / wpm;

    // Determine pause multiplier based on punctuation
    let multiplier = 1;
    if (endsWithSentencePunctuation(currentWord)) {
      multiplier = 3; // Longer pause for sentence endings
    } else if (endsWithComma(currentWord)) {
      multiplier = 1.75; // Mild pause for commas
    }
    const interval = baseInterval * multiplier;

    timeoutRef.current = setTimeout(() => {
      setCurrentWordIndex(prev => {
        if (prev >= wordsRef.current.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);
  }, [isPlaying, isActive, wpm, currentWordIndex]);

  useEffect(() => {
    if (isPlaying && isActive) {
      scheduleNextWord();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, isActive, currentWordIndex, scheduleNextWord]);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setWpm(prev => Math.max(100, prev - 50));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setWpm(prev => Math.min(800, prev + 50));
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  const handleOpen = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setIsActive(true);
  };

  const handleClose = () => {
    setIsActive(false);
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const words = wordsRef.current;
  const currentWord = words[currentWordIndex] || '';
  const { before, orp, after } = splitWordForDisplay(currentWord);
  const totalWords = words.length;

  return (
    <>
      <div className="relative">
        <button className="link-share" onClick={handleOpen}>
          <SpeedReaderIcon size={16} />
          {children}
        </button>
      </div>

      {isActive && portalContainer && createPortal(
        <div className="speedreader-overlay">
          <div className="speedreader-wpm">{wpm} WPM</div>
          <div className="speedreader-progress">
            {currentWordIndex + 1} / {totalWords}
          </div>

          <div className="speedreader-word-container">
            <span className="speedreader-before">{before}</span>
            <span className="speedreader-orp">{orp}</span>
            <span className="speedreader-after">{after}</span>
          </div>

          <div className="speedreader-legend">
            <span>Space: {isPlaying ? 'Pause' : 'Play'}</span>
            <span>←/→: Speed</span>
            <span>Esc: Exit</span>
          </div>
        </div>,
        portalContainer
      )}
    </>
  );
}
