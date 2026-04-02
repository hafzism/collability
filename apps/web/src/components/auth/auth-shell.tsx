import type { PropsWithChildren } from "react";

import { Container } from "@/components/shared/container";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <section className="relative min-h-dvh overflow-hidden bg-background">
      <AnimatedGridPattern
        numSquares={24}
        maxOpacity={0.1}
        height={48}
        width={48}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
          "absolute inset-x-0 inset-y-[-100%] h-[300%] skew-y-12",
        )}
      />

      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-white/6 blur-[140px]" />

      <Container className="relative z-10 flex min-h-dvh items-center justify-center py-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
          <div className="w-full">{children}</div>
        </div>
      </Container>
    </section>
  );
}
