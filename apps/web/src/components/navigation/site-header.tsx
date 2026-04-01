"use client";

import { Popover, Transition } from "@headlessui/react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect } from "react";
import { createPortal } from "react-dom";

import { Container } from "@/components/shared/container";
import { SiteBrand } from "@/components/shared/site-brand";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { mobileFeatureLinks, primaryNavigationLinks } from "@/constants/site";
import { cn } from "@/lib/utils";

function MobileNavLink({
  href,
  children,
  target,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Popover.Button
      as={Link}
      href={href}
      target={target}
      className="block w-full p-2"
    >
      {children}
    </Popover.Button>
  );
}

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-muted-foreground"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={cn("origin-center transition", open && "scale-90 opacity-0")}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={cn("origin-center transition", !open && "scale-90 opacity-0")}
      />
    </svg>
  );
}

function BodyScrollLock({ lock }: { lock: boolean }) {
  useEffect(() => {
    document.body.style.overflow = lock ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [lock]);

  return null;
}

function MobileNavigation() {
  return (
    <Popover>
      {({ open, close }) => (
        <>
          <BodyScrollLock lock={open} />
          <Popover.Button
            className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
            aria-label="Toggle Navigation"
          >
            <MobileNavIcon open={open} />
          </Popover.Button>

          {open &&
            createPortal(
              <div
                className="fixed inset-0 z-40 bg-background/50"
                onClick={() => close()}
              />,
              document.body,
            )}

          <Transition.Root>
            <Transition.Child
              as={Fragment}
              enter="duration-150 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-100 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Popover.Panel
                as="div"
                className="absolute inset-x-0 top-full mt-4 flex max-h-[80vh] origin-top flex-col overflow-y-auto rounded-2xl border border-border bg-background p-4 text-lg tracking-tight text-primary shadow-xl ring-1 ring-border/5"
              >
                <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                  Features
                </p>

                {mobileFeatureLinks.map((link) => (
                  <MobileNavLink key={link.href} href={link.href}>
                    {link.label}
                  </MobileNavLink>
                ))}

                <hr className="m-2 border-border" />

                {primaryNavigationLinks
                  .filter((link) => link.label !== "Features")
                  .map((link) => (
                    <MobileNavLink key={link.href} href={link.href}>
                      {link.label}
                    </MobileNavLink>
                  ))}

                <hr className="m-2 border-border" />

                <MobileNavLink href="/login">Sign In</MobileNavLink>
                <MobileNavLink href="/register">
                  <Button className="w-full" asChild>
                    <div className="group relative mx-auto flex w-full max-w-fit flex-row items-center justify-center rounded-2xl text-sm font-medium">
                      <span>Get Started</span>
                      <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                    </div>
                  </Button>
                </MobileNavLink>
              </Popover.Panel>
            </Transition.Child>
          </Transition.Root>
        </>
      )}
    </Popover>
  );
}

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-[999] w-full border-b border-border/40 bg-background/95 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <nav className="relative z-[999] flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <SiteBrand />

            <div className="hidden md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {primaryNavigationLinks.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                      >
                        <Link href={link.href}>{link.label}</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          <div className="flex items-center gap-x-4 md:gap-x-5">
            <Button variant="secondary" className="hidden md:flex" asChild>
              <Link href="/login">Sign In</Link>
            </Button>

            <Button className="max-md:hidden" asChild>
              <Link href="/register" aria-label="Get Started">
                <div className="group relative mx-auto flex w-full max-w-fit flex-row items-center justify-center text-sm font-medium">
                  <span>Get Started</span>
                  <ChevronRight className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </div>
              </Link>
            </Button>

            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
