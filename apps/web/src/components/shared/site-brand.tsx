import Image from "next/image";
import Link from "next/link";

import { brandName } from "@/constants/site";

interface SiteBrandProps {
  textClassName?: string;
  href?: string;
}

export function SiteBrand({
  textClassName = "",
  href = "/",
}: SiteBrandProps) {
  return (
    <Link href={href} aria-label="Home" className="flex items-center gap-2">
      <Image
        src="/collability_outline_white.svg"
        alt={`${brandName} logo`}
        width={40}
        height={40}
        className="h-10 w-auto"
        priority
      />
      <span
        className={`font-display text-xl font-bold tracking-tight ${textClassName}`.trim()}
      >
        {brandName}
      </span>
    </Link>
  );
}
