import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export function CallToActionSection() {
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden border-y border-white/5 bg-black py-20 sm:py-32"
    >
      <div className="absolute inset-0 z-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]">
        <svg
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full stroke-white/20"
        >
          <defs>
            <pattern
              id="cta-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl tracking-tight text-white sm:text-5xl">
            Unlock Your Team&apos;s Potential
          </h2>
          <p className="mt-6 text-lg leading-relaxed tracking-tight text-muted-foreground">
            Say goodbye to fragmented tools and messy threads. Manage boards,
            docs, and tasks in one unified, real-time workspace that works
            everywhere.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button className="w-full px-8 py-3 text-base sm:w-auto" asChild>
              <Link href="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </div>
      </Container>

      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
    </section>
  );
}
