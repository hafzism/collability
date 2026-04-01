import { features } from "@/constants/landing";
import { cn } from "@/lib/utils";

function FeatureCard({
  title,
  description,
  icon: Icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  index: number;
}) {
  return (
    <div
      className={cn(
        "group/feature relative flex flex-col border-b border-white/5 py-10 lg:border-r lg:border-b-0",
        (index === 0 || index === 3 || index === 6) && "lg:border-l",
        index < 6 && "lg:border-b",
      )}
    >
      {index < 3 && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-white/5 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100" />
      )}
      {index >= 3 && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b from-white/5 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100" />
      )}

      <div className="relative z-10 mb-4 px-10 text-muted-foreground">
        <Icon />
      </div>
      <div className="relative z-10 mb-2 px-10 text-lg font-bold">
        <div className="absolute inset-y-0 left-0 h-6 w-1 origin-center rounded-br-full rounded-tr-full bg-white/10 transition-all duration-200 group-hover/feature:h-8 group-hover/feature:bg-primary" />
        <span className="inline-block text-white transition duration-200 group-hover/feature:translate-x-2">
          {title}
        </span>
      </div>
      <p className="relative z-10 px-10 text-sm text-muted-foreground lg:max-w-xs">
        {description}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="flex flex-col items-center justify-center px-4 pb-20 pt-10"
    >
      <h2 className="text-center font-display text-4xl font-medium tracking-tight text-white sm:text-5xl lg:leading-tight">
        Powerful Workflows Tailored to You
      </h2>
      <p className="mt-4 w-full max-w-2xl text-center text-lg tracking-tight text-muted-foreground">
        Unlock seamless real-time collaboration, advanced access control, and
        offline-first productivity—all with Collability’s team-focused features.
      </p>
      <div className="relative z-10 mx-auto mt-10 grid max-w-7xl grid-cols-1 py-10 max-sm:mx-0 max-sm:w-full max-sm:p-0 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}
