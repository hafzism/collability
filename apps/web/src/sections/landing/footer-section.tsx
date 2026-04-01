import Link from "next/link";

import { Container } from "@/components/shared/container";
import { SiteBrand } from "@/components/shared/site-brand";
import { brandName, footerLinkGroups, socialLinks } from "@/constants/site";

function GithubIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.683-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.696 1.027 1.587 1.027 2.683 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function FooterSection() {
  return (
    <footer className="border-t border-white/5 bg-black pb-16 pt-24">
      <Container>
        <div className="flex flex-col items-center justify-between gap-y-12 lg:flex-row lg:items-start">
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <SiteBrand textClassName="text-white" />
            <p className="max-w-xs text-center text-sm text-muted-foreground lg:text-left">
              The unified, real-time workspace for boards, docs, and everything
              in between.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-10 sm:grid-cols-3">
            {footerLinkGroups.map((group, index) => (
              <div
                key={group.title}
                className={index === footerLinkGroups.length - 1 ? "col-span-2 sm:col-span-1" : undefined}
              >
                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                <ul className="mt-4 space-y-4">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-y-8 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {brandName} Inc. All rights
            reserved. Registered open-source project.
          </p>
          <div className="flex gap-x-6">
            {socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-white"
              >
                <span className="sr-only">{link.label}</span>
                <GithubIcon />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
