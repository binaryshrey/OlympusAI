"use client";

import Link from "next/link";

export interface CTAProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export function CTA({
  title = "Boost your productivity today",
  description = "Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id veniam aliqua proident",
  primaryButtonText = "Get started",
  primaryButtonHref = "/sign-up",
  secondaryButtonText = "Learn more",
  secondaryButtonHref = "#",
}: CTAProps) {
  return (
    <section className="overflow-hidden bg-[#060E17] py-20 pt-40 pb-40">
      <div className="mx-auto max-w-8xl px-12 lg:px-20">
        <div className="text-center">
          <h2 className="text-3xxl lg:text-3xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-sm lg:text-sm text-gray-300 mb-10 max-w-3xl mx-auto">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={primaryButtonHref}>
              <button className="cursor-pointer rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-white/90 transition-colors">
                {primaryButtonText}
              </button>
            </Link>
            <a
              href={secondaryButtonHref}
              className="text-sm font-semibold leading-6 text-white"
            >
              {secondaryButtonText} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
