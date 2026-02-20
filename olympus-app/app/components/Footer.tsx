"use client";

import Link from "next/link";
import {
  GitHubLogoIcon,
  GlobeIcon,
  LinkedInLogoIcon,
} from "@radix-ui/react-icons";

const GITHUB_URI = "https://github.com/binaryshrey/Nebula-AI-v1";
const LINKEDIN_URI = "https://in.linkedin.com/in/shreyanshsaurabh";
const BETTERSTACK_URI = "https://nebulaai.betteruptime.com/";
const NEBULA_AI_URI = "https://nebulaai.vercel.app";

const Footer = () => {
  return (
    <footer className="bg-[#B0D1E8] py-12 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Navigation Links */}
        <nav className="flex justify-center gap-8 mb-8">
          <Link
            href={GITHUB_URI}
            target="_blank"
            className="text-gray-800 hover:text-black text-sm font-medium transition-colors"
          >
            Github
          </Link>
          <Link
            href={BETTERSTACK_URI}
            target="_blank"
            className="text-gray-800 hover:text-black text-sm font-medium transition-colors"
          >
            Status
          </Link>
          <Link
            href="/#features"
            className="text-gray-800 hover:text-black text-sm font-medium transition-colors"
          >
            Features
          </Link>
          <Link
            href={LINKEDIN_URI}
            target="_blank"
            className="text-gray-800 hover:text-black text-sm font-medium transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mb-8">
          <Link
            href={GITHUB_URI}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition-colors"
            aria-label="GitHub"
          >
            <GitHubLogoIcon className="w-6 h-6" />
          </Link>
          <Link
            href={NEBULA_AI_URI}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition-colors"
            aria-label="Website"
          >
            <GlobeIcon className="w-6 h-6" />
          </Link>
          <Link
            href={LINKEDIN_URI}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition-colors"
            aria-label="LinkedIn"
          >
            <LinkedInLogoIcon className="w-6 h-6" />
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">© 2025 Nebula AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
