"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function ResizableUnderlineField({
  value,
  onChange,
  placeholder,
  className,
  minRows = 1,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.max(
      textareaRef.current.scrollHeight,
      minRows * 24,
    )}px`;
  }, [minRows, value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={minRows}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full resize-none overflow-hidden border-b border-white/12 bg-transparent px-0 py-0 text-left outline-none transition placeholder:text-[#6f6f6a] focus:border-white/25",
        className,
      )}
    />
  );
}
