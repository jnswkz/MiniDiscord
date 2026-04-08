"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
  position?: "top" | "bottom";
}

export function EmojiPicker({
  onEmojiSelect,
  children,
  position = "top",
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Calculate position relative to viewport when opening
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const PICKER_WIDTH = 352;
    const PICKER_HEIGHT = 435;
    const GAP = 8;

    let top: number;
    let left: number;

    if (position === "top") {
      top = rect.top - PICKER_HEIGHT - GAP;
      // If would go off-screen top, flip to bottom
      if (top < 8) {
        top = rect.bottom + GAP;
      }
    } else {
      top = rect.bottom + GAP;
      // If would go off-screen bottom, flip to top
      if (top + PICKER_HEIGHT > window.innerHeight - 8) {
        top = rect.top - PICKER_HEIGHT - GAP;
      }
    }

    // Align right edge with trigger's right edge
    left = rect.right - PICKER_WIDTH;
    // If would go off-screen left, push right
    if (left < 8) {
      left = 8;
    }

    setCoords({ top, left });
  }, [isOpen, position]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        pickerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleSelect(emoji: { native: string }) {
    onEmojiSelect(emoji.native);
    setIsOpen(false);
  }

  return (
    <div ref={triggerRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>

      {isOpen &&
        createPortal(
          <div
            ref={pickerRef}
            className="fixed z-[9999]"
            style={{ top: coords.top, left: coords.left }}
          >
            <Picker
              data={data}
              onEmojiSelect={handleSelect}
              theme="dark"
              locale="vi"
              previewPosition="bottom"
              skinTonePosition="search"
              set="native"
              perLine={9}
              maxFrequentRows={2}
              navPosition="top"
              searchPosition="sticky"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
