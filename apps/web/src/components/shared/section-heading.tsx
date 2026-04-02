import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description: string;
  titleId?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeading({
  title,
  description,
  titleId,
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <h2
        id={titleId}
        className={cn(
          "font-display text-3xl tracking-tight text-white sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-4 text-lg tracking-tight text-muted-foreground",
          descriptionClassName,
        )}
      >
        {description}
      </p>
    </div>
  );
}
