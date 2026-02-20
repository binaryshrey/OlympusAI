"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { Highlighter } from "@/components/ui/highlighter";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <div
      className="text-gray-900 min-h-screen"
      style={{ backgroundColor: "#060E17" }}
    >
      <HeroHeader />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div
            className="relative min-h-screen pt-24 md:pt-32"
            style={{
              backgroundImage: "url('/banner.png')",
              backgroundSize: "contain",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="https://luma.com/nychack?tk=ZTW1Re"
                    className="hover:bg-gray-100 bg-gray-200 group mx-auto flex w-fit items-center gap-4 rounded-full border border-gray-200 p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-gray-900 text-sm font-medium">
                      Self Improving Agents Hack - Feb '26
                    </span>
                    <span className="block h-4 w-0.5 border-l bg-gray-300"></span>

                    <div className="bg-white group-hover:bg-gray-100 size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>

                <div className="mx-auto max-w-5xl text-center mt-8 lg:mt-16">
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    The Fastest Way To Go From
                  </h1>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    <span className="relative inline-block px-2 sm:px-4 p-2 ">
                      <span className="absolute inset-0 bg-blue-200 rounded-lg sm:rounded-xl"></span>
                      <span className="relative font-semibold italic">
                        Requirements
                      </span>
                    </span>{" "}
                    <span font-semibold>To </span>
                    <span className="relative inline-block px-2 sm:px-4 p-2 ">
                      <span className="absolute inset-0 bg-blue-200 rounded-lg sm:rounded-xl"></span>
                      <span className="relative font-semibold italic">
                        Deployments
                      </span>
                    </span>{" "}
                  </h1>
                  <p className="mt-6 text-sm sm:text-lg leading-8 text-gray-700">
                    An enterprise AI platform orchestrating end-to-end software
                    delivery <br />
                    powered by{" "}
                    <Highlighter action="underline" color="#FF9800">
                      a pantheon of autonomous AI agents
                    </Highlighter>{" "}
                    with
                    <span className="font-semibold"> Airia</span> &{" "}
                    <span className="font-semibold">ElevenLabs</span>
                  </p>
                </div>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.1,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <Link href="/sign-up">
                        <span className="text-nowrap">Get Started</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-5 hover:bg-transparent"
                  >
                    <Link href="/sign-in">
                      <span className="text-nowrap">Log in →</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.4,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-12">
                <div className="bg-white/20 relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-gray-200 backdrop-blur-lg p-4 shadow-lg shadow-zinc-950/15">
                  <HeroVideoDialog
                    className=""
                    animationStyle="from-center"
                    videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                    thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
                    thumbnailAlt="Hero Video"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </div>
  );
}
