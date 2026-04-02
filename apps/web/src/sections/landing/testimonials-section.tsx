"use client";

import { reviews } from "@/constants/landing";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import { SectionHeading } from "@/components/shared/section-heading";

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

function ReviewCard({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) {
  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4 shadow-lg transition-all duration-300",
        "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/[0.08]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-white/90">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm leading-relaxed text-white/70">
        {body}
      </blockquote>
    </figure>
  );
}

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      aria-label="What our customers are saying"
      className="overflow-hidden py-20 sm:py-32"
    >
      <SectionHeading
        title="Why Teams Trust Collability"
        description="Don't just take our word for it. Join thousands of teams who have found a better way to collaborate."
        className="mb-16 px-4 md:text-center"
      />

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="mt-4 [--duration:30s]">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/4 bg-gradient-to-r from-black" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-l from-black" />
      </div>
    </section>
  );
}
