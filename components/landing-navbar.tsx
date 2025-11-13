"use client";

import { useAuth } from "@clerk/nextjs";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

const font = Montserrat({ weight: "600", subsets: ["latin"] });

const navItems = [
  { label: "Features", href: "/#features" },
];

export const LandingNavbar = () => {
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-5 z-50 w-full backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-4 py-3 shadow-[0_10px_40px_-18px_rgba(79,70,229,0.55)] transition-colors duration-300 hover:border-white/20 hover:from-white/15 hover:via-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1 shadow-inner">
            <Image fill alt="Logo" src="/logo.png" className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-base uppercase tracking-[0.4em] text-xs text-muted-foreground/70")}>
              Aurora
            </span>
            <span className={cn("text-xl font-bold leading-none text-primary", font.className)}>
              AI Platform
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-transparent bg-white/0 p-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
            <Button
              variant="outline"
              className="rounded-full border-border bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-border hover:bg-accent hover:text-accent-foreground sm:text-sm"
            >
              {isSignedIn ? "Open Dashboard" : "Get Started"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
