"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function AuthInput({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: AuthInputProps) {
  const hintId = id ? `${id}-hint` : undefined;
  const errorId = id ? `${id}-error` : undefined;
  const descriptionId = error ? errorId : hint ? hintId : undefined;

  return (
    <label className="block space-y-2.5" htmlFor={id}>
      <span className="text-sm font-medium tracking-tight text-white">
        {label}
      </span>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={cn(
          "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[15px] text-white outline-none transition-all placeholder:text-muted-foreground/90 focus:border-white/20 focus:ring-1 focus:ring-white/20",
          error &&
            "border-destructive/70 focus:border-destructive/80 focus:ring-destructive/40",
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium leading-5 text-red-300">
          {error}
        </p>
      ) : null}
    </label>
  );
}
