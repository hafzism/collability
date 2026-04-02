"use client";

import type { PropsWithChildren } from "react";

import { SiteBrand } from "@/components/shared/site-brand";
import { cn } from "@/lib/utils";

export function AuthCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function AuthCardHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <div className="flex justify-center sm:justify-start">{eyebrow}</div>
      ) : null}
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-[15px]">
          {description}
        </p>
      </div>
    </div>
  );
}

export function AuthCardBrand() {
  return <SiteBrand href="/" textClassName="text-2xl font-semibold" />;
}

export function AuthCardBody({ children }: PropsWithChildren) {
  return <div className="mt-8 space-y-6">{children}</div>;
}

export function AuthCardFooter({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "mt-8 border-t border-white/10 pt-6 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
