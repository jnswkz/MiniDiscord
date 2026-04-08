"use client";

import { useRef, useEffect, useState } from "react";

interface SlidingPanelProps {
  show: boolean;
  children: React.ReactNode;
  width?: number;
  direction?: "left" | "right";
}

export function SlidingPanel({
  show,
  children,
  width = 240,
  direction = "right",
}: SlidingPanelProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200); // matches duration-200
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!shouldRender) return null;

  const translateClass = direction === "right"
    ? isVisible ? "translate-x-0" : "translate-x-full"
    : isVisible ? "translate-x-0" : "-translate-x-full";

  return (
    <div
      ref={panelRef}
      className={`shrink-0 transition-all duration-200 ease-in-out overflow-hidden ${translateClass}`}
      style={{
        width: isVisible ? width : 0,
        minWidth: isVisible ? width : 0,
      }}
    >
      <div style={{ width, minWidth: width }} className="h-full">
        {children}
      </div>
    </div>
  );
}
