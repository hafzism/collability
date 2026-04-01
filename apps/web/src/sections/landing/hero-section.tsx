"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

function HeroEmailCaptureForm() {
  return (
    <motion.form
      className="mb-20 mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-3 sm:flex-row"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = "/register";
      }}
    >
      <input
        type="email"
        placeholder="Enter your email"
        required
        className="h-12 w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-5 text-[16px] text-white outline-none transition-all placeholder:text-muted-foreground focus:border-white/20 focus:ring-1 focus:ring-white/20 backdrop-blur-sm"
      />
      <Button type="submit" size="lg" className="w-full shrink-0 px-5 sm:w-auto">
        <span className="group flex flex-row items-center gap-2">
          <span>Try for free</span>
          <ChevronRight className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
        </span>
      </Button>
    </motion.form>
  );
}

function HeroVisual() {
  return (
    <motion.div
      className="relative mx-auto mt-20 max-w-5xl px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: "1000px" }}
    >
      <div className="relative z-10 transform rounded-2xl border-[6px] border-black bg-black/50 p-1 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm transition-transform duration-500 hover:scale-[1.01]">
        <img
          src="/img/hero-image-desktop.webp"
          alt="Collability Desktop"
          className="w-full rounded-xl border border-white/5 bg-black"
        />
      </div>

      <div className="absolute -bottom-6 -right-2 z-20 w-[25%] min-w-[140px] max-w-[240px] md:-bottom-12 md:-right-12">
        <div className="origin-bottom-right transform overflow-hidden rounded-[1rem] border-[6px] border-black bg-black shadow-2xl ring-1 ring-white/20 transition-transform duration-500 hover:z-30 hover:scale-105 hover:rotate-0 md:rounded-[2rem] md:border-[10px] -rotate-6">
          <img
            src="/img/screenshot-phone-1.webp"
            alt="Collability Mobile"
            className="h-auto w-full rounded-[0.75rem] border border-white/10 bg-black opacity-90 md:rounded-[1.25rem]"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pb-32 pt-20 lg:pt-60">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        height={40}
        width={40}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
          "absolute inset-x-0 inset-y-[-100%] h-[300%] skew-y-12",
        )}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
        <motion.h1
          className="mx-auto mb-8 flex max-w-4xl flex-col items-center gap-4 font-display font-medium tracking-tight sm:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-5xl text-muted-foreground sm:text-7xl">
            Simplify
          </span>
          <span className="relative whitespace-normal text-5xl leading-tight text-primary sm:text-7xl lg:whitespace-nowrap">
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="absolute left-0 top-2/3 h-[0.58em] w-full fill-primary/20"
              preserveAspectRatio="none"
            >
              <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
            </svg>
            <span className="relative z-10">Collaborative Workflows</span>
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mb-10 mt-6 max-w-2xl text-xl tracking-tight text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          A real-time team workspace combining Kanban boards and collaborative
          documents.
        </motion.p>

        <HeroEmailCaptureForm />
        <HeroVisual />
      </div>
    </section>
  );
}
