"use client";

import { useEffect, useRef } from "react";

export default function ReadTracker({ storyId }: { storyId: string }) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetch(`/api/stories/${storyId}/complete`, { method: "POST" }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 1 }
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, [storyId]);

  return <div ref={markerRef} style={{ height: 1 }} aria-hidden="true" />;
}
