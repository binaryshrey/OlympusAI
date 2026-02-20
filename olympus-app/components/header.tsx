"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const GITHUB_URI = "https://github.com/";
const BETTERSTACK_URI = "#";
const CONTACT_URI = "#";

const navLinks = [
  { name: "Github", href: GITHUB_URI, external: true },
  { name: "Features", href: "#features-section", external: false },
  { name: "Status", href: BETTERSTACK_URI, external: true },
  { name: "Contact", href: CONTACT_URI, external: true },
];

export const HeroHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFeaturesScroll = () => {
    const element = document.getElementById("features-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="px-6 pt-6" style={{ backgroundColor: "#fff" }}>
      <nav className="flex items-center justify-between" aria-label="Global">
        <div className="flex lg:flex-1 items-center">
          <Link href="/" className="-m-1.5 p-1.5">
            <Logo />
          </Link>
        </div>

        {/* Mobile: Join button + hamburger */}
        <div className="flex lg:hidden gap-4">
          <div className="p-1 pr-3 pl-3 bg-black rounded-full cursor-pointer">
            <Link
              href="/sign-up"
              className="text-sm font-medium leading-6 text-white"
            >
              Join Olympus AI
            </Link>
          </div>
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Desktop nav links */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navLinks.map((link) =>
            link.name === "Features" ? (
              <a
                key={link.name}
                onClick={handleFeaturesScroll}
                className="text-sm font-medium leading-6 text-gray-900 cursor-pointer"
              >
                Features
              </a>
            ) : (
              <a
                key={link.name}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="text-sm font-medium leading-6 text-gray-900"
              >
                {link.name}
              </a>
            ),
          )}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <div className="flex gap-4 justify-center items-center">
            <Link
              href="/sign-in"
              className="text-sm font-medium leading-6 text-gray-900"
            >
              Log in
            </Link>
            <Link href="/sign-up">
              <div className="p-1 pr-3 pl-3 bg-black rounded-full cursor-pointer">
                <p className="text-sm font-medium leading-6 text-white">
                  Join Olympus AI
                </p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-white px-6 py-6 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <Logo />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navLinks.map((link) =>
                  link.name === "Features" ? (
                    <a
                      key={link.name}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleFeaturesScroll();
                      }}
                      className="-mx-3 block rounded-lg py-2 px-3 text-base font-normal leading-7 text-gray-900 hover:bg-gray-400/10 cursor-pointer"
                    >
                      Features
                    </a>
                  ) : (
                    <a
                      key={link.name}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="-mx-3 block rounded-lg py-2 px-3 text-base font-normal leading-7 text-gray-900 hover:bg-gray-400/10"
                    >
                      {link.name}
                    </a>
                  ),
                )}
              </div>
              <div className="py-6">
                <Link
                  href="/sign-in"
                  className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-normal leading-6 text-gray-900 hover:bg-gray-400/10"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-normal leading-6 text-gray-900 hover:bg-gray-400/10"
                >
                  Join Olympus AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
