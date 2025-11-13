"use client";

import { useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import TypewriterComponent from "typewriter-effect";

import { Button } from "@/components/ui/button";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const baseFeatures: Feature[] = [
  {
    title: "Conversational Genius",
    description: "Human-like dialogue with context awareness and instant recall.",
    icon: Sparkles,
  },
  {
    title: "Creative Studio",
    description: "Generate visuals, audio, and copy tailored to your brand voice.",
    icon: Wand2,
  },
  {
    title: "Secure Automation",
    description: "Enterprise-grade security with automated compliance workflows.",
    icon: ShieldCheck,
  },
];

export const LandingHero = () => {
  const { isSignedIn } = useAuth();

  const features = useMemo(() => baseFeatures, []);

  return (
    <section className="relative isolate overflow-hidden bg-background py-32 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
      <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600/20 via-fuchsia-500/15 to-rose-500/10 blur-3xl" />
      {/* <div className="absolute bottom-0 right-0 hidden h-72 w-72 rounded-full bg-gradient-to-tl from-purple-500/20 to-cyan-500/20 blur-3xl sm:block" /> */}

      <div className="container relative z-10 mx-auto max-w-6xl px-6 text-center md:px-12">
        <div className="mx-auto mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur">
          <Zap className="h-4 w-4 text-purple-400" />
          <span>Elevate your workflow. Unlock AI superpowers.</span>
        </div>

        <div className="space-y-6">
          <div className="text-4xl font-extrabold sm:text-5xl md:text-6xl lg:text-7xl">
            <h1 className="bg-gradient-to-br from-violet-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              The Best AI Platform for
            </h1>
            <div className="text-primary">
              <TypewriterComponent
                options={{
                  strings: [
                    "Aurora AI Chatbot.",
                    "Photo Generator.",
                    "Code Generator.",
                  ],
                  autoStart: true,
                  loop: true,
                }}
              />
            </div>
          </div>

          <p className="mx-auto max-w-2xl text-balance text-base font-light text-muted-foreground sm:text-lg md:text-xl">
            Create, iterate, and ship remarkable experiences 10x faster. Aurora
            leverages multimodal intelligence to help your team go from idea to
            reality in minutes-not weeks.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
              <Button
                variant="premium"
                className="group h-12 rounded-full px-8 text-sm font-semibold uppercase tracking-wide md:h-14 md:px-10 md:text-base"
              >
                Start Generating for Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#features">
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-white/5 px-6 text-sm font-semibold text-white/90 backdrop-blur transition hover:border-white/40 hover:bg-white/10 md:h-14 md:px-8 md:text-base"
              >
                See what's possible
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground/70 sm:text-sm">
            <span className="animate-pulse text-purple-300/80">No credit card required</span>
            <span className="hidden sm:inline">•</span>
            <span>Launch in under 60 seconds</span>
            <span className="hidden sm:inline">•</span>
            <span>Trusted by creators worldwide</span>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 text-left shadow-[0_20px_45px_-20px_rgba(124,58,237,0.45)] backdrop-blur transition-transform duration-500 animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(236,72,153,0.55)]"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 via-purple-500/40 to-pink-500/40 text-purple-200">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-primary">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground/80">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
        <div className="h-24 w-56 animate-pulse rounded-full bg-gradient-to-r from-purple-500/30 via-white/20 to-pink-500/30 blur-3xl" />
      </div>
    </section>
  );
};
