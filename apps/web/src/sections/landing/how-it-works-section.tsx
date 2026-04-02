"use client";

import { motion } from "framer-motion";

import {
  howItWorksSteps,
  memberInviteEmail,
  memberInvites,
} from "@/constants/landing";
import { useTypewriter } from "@/hooks/use-typewriter";

function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative z-10">
      <div className="relative mb-6 h-[250px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]">
        {children}
      </div>
      <h3 className="mb-2 text-center text-xl font-semibold text-white">{title}</h3>
      <p className="px-4 text-center text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function WindowGlow({ className = "bg-white/5" }: { className?: string }) {
  return (
    <div className={`absolute -z-10 h-32 w-32 rounded-full blur-3xl ${className}`} />
  );
}

function WindowTrafficLights() {
  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-1.5 border-b border-white/5 bg-white/5 px-2">
      <div className="h-2 w-2 rounded-full bg-red-500/80" />
      <div className="h-2 w-2 rounded-full bg-amber-500/80" />
      <div className="h-2 w-2 rounded-full bg-green-500/80" />
    </div>
  );
}

function WorkspaceStepVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative flex h-44 w-60 flex-col overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl">
        <WindowTrafficLights />
        <div className="flex flex-1">
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 32, opacity: 1 }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              repeatDelay: 2,
            }}
            className="flex h-full flex-col items-center gap-2 border-r border-white/5 bg-white/5 pt-3"
          >
            <div className="h-2 w-4 rounded-sm bg-white/20" />
            <div className="h-2 w-4 rounded-sm bg-white/10" />
            <div className="h-2 w-4 rounded-sm bg-white/10" />
          </motion.div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                repeatDelay: 2,
              }}
              className="h-4 w-1/2 rounded bg-primary/20"
            />
            <div className="flex h-full gap-2">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.8,
                  duration: 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  repeatDelay: 2,
                }}
                className="flex-1 rounded-md bg-white/5"
              />
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 1.1,
                  duration: 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  repeatDelay: 2,
                }}
                className="flex-1 rounded-md bg-white/5"
              />
            </div>
          </div>
        </div>
      </div>
      <WindowGlow />
    </div>
  );
}

function AddMembersStepVisual() {
  const typed = useTypewriter({ text: memberInviteEmail });

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative flex h-44 w-60 flex-col overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl">
        <WindowTrafficLights />

        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden p-2">
          <div className="flex items-center gap-1.5 rounded border border-white/20 bg-white/5 px-2 py-1">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 3H3a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1z"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
              <path
                d="M2 4l6 5 6-5"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
            </svg>
            <span
              className="flex-1 text-[9px]"
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "monospace",
              }}
            >
              {typed}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  display: "inline-block",
                  width: 1,
                  height: 9,
                  background: "rgba(255,255,255,0.7)",
                  verticalAlign: "middle",
                  marginLeft: 1,
                }}
              />
            </span>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded px-1 py-0.5 text-[8px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              Invite
            </motion.div>
          </div>

          {memberInvites.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.15 }}
              className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 py-1"
            >
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                style={{
                  background: member.avatarBg,
                  color: member.avatarColor,
                }}
              >
                {member.initial}
              </div>
              <span className="flex-1 text-[9px] font-medium text-white/75">
                {member.name}
              </span>
              <span
                className="rounded px-1 py-0.5 text-[7px] font-semibold"
                style={{
                  background: member.badgeBg,
                  color: member.badgeColor,
                }}
              >
                {member.role}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <WindowGlow className="bg-primary/10" />
    </div>
  );
}

function ListsAndCardsStepVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative flex h-44 w-60 gap-2 rounded-xl border border-white/10 bg-black p-2">
        <div className="flex flex-1 flex-col gap-2 rounded-md bg-white/5 p-1.5">
          <div className="h-1.5 w-1/2 rounded bg-white/20" />
          <div className="h-6 w-full rounded border border-white/10 bg-white/10" />
          <motion.div
            initial={{ opacity: 1, x: 0, y: 0 }}
            animate={{
              x: [0, 0, 94, 94, 0],
              y: [0, -12, -12, 0, 0],
              rotate: [0, 4, -3, 0, 0],
              zIndex: [1, 20, 20, 20, 1],
            }}
            transition={{
              duration: 2.8,
              times: [0, 0.15, 0.55, 0.75, 1],
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1.2,
            }}
            className="flex h-6 w-full items-center rounded border border-white/20 bg-white px-1 shadow-lg"
          >
            <div className="h-1 w-1/2 rounded bg-black/20" />
          </motion.div>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-md bg-white/5 p-1.5">
          <div className="h-1.5 w-1/2 rounded bg-white/20" />
          <div className="h-6 w-full rounded border border-white/10 bg-white/10" />
          <div className="h-6 w-full rounded border border-white/10 bg-white/10" />
        </div>
      </div>
      <WindowGlow />
    </div>
  );
}

function CollaborateStepVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-44 w-60 overflow-hidden rounded-xl border border-white/10 bg-black p-4 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="h-2 w-3/4 rounded bg-white/20" />
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-5/6 rounded bg-white/10" />
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-1/2 rounded bg-white/10" />
        </div>
        <motion.div
          initial={{ x: 0, y: 0 }}
          animate={{
            x: [0, 40, 20, 60, 0],
            y: [0, 15, 30, 10, 0],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
          className="absolute left-6 top-8 z-20 flex flex-col items-start drop-shadow-lg"
        >
          <svg
            className="h-4 w-4 fill-cyan-400 stroke-white stroke-1"
            viewBox="0 0 24 24"
          >
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86h7.3c.41 0 .75-.34.75-.75v-.8c0-.2-.08-.39-.22-.53L5.5 3.21z" />
          </svg>
          <div className="ml-3 -mt-1 rounded bg-cyan-400 px-1 py-0.5 text-[6px] font-bold text-black shadow-sm">
            Alice
          </div>
        </motion.div>
        <motion.div
          initial={{ x: 80, y: 40 }}
          animate={{
            x: [80, 50, 90, 40, 80],
            y: [40, 20, 10, 30, 40],
          }}
          transition={{
            duration: 3.5,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            delay: 0.5,
          }}
          className="absolute left-6 top-8 z-20 flex flex-col items-start drop-shadow-lg"
        >
          <svg
            className="h-4 w-4 fill-rose-400 stroke-white stroke-1"
            viewBox="0 0 24 24"
          >
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86h7.3c.41 0 .75-.34.75-.75v-.8c0-.2-.08-.39-.22-.53L5.5 3.21z" />
          </svg>
          <div className="ml-3 -mt-1 rounded bg-rose-400 px-1 py-0.5 text-[6px] font-bold text-white shadow-sm">
            Bob
          </div>
        </motion.div>
      </div>
      <WindowGlow />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-black py-20 sm:pb-52 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get your team up and fully operational in minutes.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StepCard {...howItWorksSteps[0]}>
            <WorkspaceStepVisual />
          </StepCard>
          <StepCard {...howItWorksSteps[1]}>
            <AddMembersStepVisual />
          </StepCard>
          <StepCard {...howItWorksSteps[2]}>
            <ListsAndCardsStepVisual />
          </StepCard>
          <StepCard {...howItWorksSteps[3]}>
            <CollaborateStepVisual />
          </StepCard>
        </div>
      </div>
    </section>
  );
}
