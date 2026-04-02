"use client";

import type { PropsWithChildren } from "react";

import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/navigation/site-header";

const headerlessRoutes = new Set(["/login", "/signup"]);

export function AppChrome({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const showHeader = pathname ? !headerlessRoutes.has(pathname) : true;

  return (
    <>
      {showHeader ? <SiteHeader /> : null}
      <main className="flex-1">{children}</main>
    </>
  );
}
