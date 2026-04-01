"use client";

import { useEffect, useState } from "react";

interface UseTypewriterOptions {
  text: string;
  initialDelay?: number;
  typingDelay?: number;
  deletingDelay?: number;
  pauseAtEnd?: number;
  pauseAtStart?: number;
}

export function useTypewriter({
  text,
  initialDelay = 800,
  typingDelay = 70,
  deletingDelay = 40,
  pauseAtEnd = 1800,
  pauseAtStart = 600,
}: UseTypewriterOptions) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let index = 0;
    let isForward = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (isForward) {
        index += 1;
        setTyped(text.slice(0, index));

        timeoutId = setTimeout(
          tick,
          index >= text.length ? pauseAtEnd : typingDelay,
        );

        if (index >= text.length) {
          isForward = false;
        }

        return;
      }

      index -= 1;
      setTyped(text.slice(0, index));

      timeoutId = setTimeout(tick, index <= 0 ? pauseAtStart : deletingDelay);

      if (index <= 0) {
        isForward = true;
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [deletingDelay, initialDelay, pauseAtEnd, pauseAtStart, text, typingDelay]);

  return typed;
}
