"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  WalletCards,
  Settings,
  ClipboardCheck,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  ListTodo,
} from "lucide-react";

// ── Slide data — replace src with your actual images ─────────────────────────
const SLIDES = [
  {
    src: "/slides/slide1.jpg",
    title: "Streamlined Institutions",
    caption:
      "A unified platform for private tertiary institutions to manage consent certificates, compliance fees, and annual renewals with full transparency.",
  },
  {
    src: "/slides/slide3.jpeg",
    title: "Real-Time Compliance Tracking",
    caption:
      "Monitor your institution's compliance standing, track fee payments, and access ministry-issued documents — all in one secure portal.",
  },
  {
    src: "/slides/slide2.jpg",
    title: "Powered by Kaduna State Ministry of Education",
    caption:
      "Backed by the Ministry of Education, Kaduna State. Ensuring standards, accountability, and excellence across all private tertiary institutions.",
  },
];

const ROLES = [
  {
    icon: Building2,
    label: "Institution",
    desc: "Manage your school profile, fees and compliance",
  },
  {
    icon: WalletCards,
    label: "Management",
    desc: "Oversee collections, transactions and revenue",
  },
  {
    icon: Settings,
    label: "Admin",
    desc: "Administer and Manage Institutions",
  },
  {
    icon: ListTodo,
    label: "Operator",
    desc: "Assessment and Demand Notices",
  },
  {
    icon: ClipboardCheck,
    label: "Inspector",
    desc: "Review and assess institutional compliance",
  },
];

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  function goTo(index: number) {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* ── LEFT — Image Slideshow ────────────────────────────────────────── */}
      <div className="relative w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
        {/* Slide images */}
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Fallback gradient background if image not available */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a5c2e] via-[#166534] to-[#052e16]" />
            {/* <Image
              src={slide.src}
              alt={slide.title}
              fill
              className="object-cover mix-blend-overlay opacity-30"
              onError={() => {}} // silently fail — gradient shows instead
            /> */}
            <img
              src={slide.src}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />

            {/* Geometric pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px),
                                  radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>
        ))}

        {/* Dark gradient overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Slide text */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-12 lg:pb-16">
          <div
            className={`transition-all duration-500 ${
              animating
                ? "opacity-0 translate-y-4"
                : "opacity-100 translate-y-0"
            }`}
          >
            <h2 className="text-2xl lg:text-3xl font-black text-white mb-3 leading-tight">
              {SLIDES[current].title}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed max-w-md">
              {SLIDES[current].caption}
            </p>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center gap-2 mt-6">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-8 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Top-left branding on mobile */}
        <div className="absolute top-6 left-6 lg:hidden">
          <span className="text-white font-black text-lg tracking-tight">
            KAPTEMS
          </span>
        </div>
      </div>

      {/* ── RIGHT — Content Panel ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-screen bg-gray-50 px-8 py-10 lg:px-12 lg:py-12">
        {/* Ministry badge — 40% height */}
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ minHeight: "40vh" }}
        >
          {/* Logo */}
          <div className="mb-5">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto overflow-hidden">
              <Image
                src="/KD_logo.png"
                alt="Kaduna State Ministry of Education"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700 mb-1">
            Kaduna State
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-2">
            Ministry of Education
          </h1>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-1">
            Private Tertiary Institutions Portal
          </p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            KAPTEMS
          </p>

          {/* CTA */}
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 bg-[#28a745] hover:bg-[#166534] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-green-900/20 hover:shadow-green-900/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Login to Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Roles list */}
        <div className="mt-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 text-center">
            Portal Access Roles
          </p>
          <Link href="/login">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.slice(0, 2).map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800">{label}</p>
                      <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLES.slice(2).map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800">{label}</p>
                      <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>

          {/* Verify licence link */}
          <div className="mt-4 flex justify-center">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 transition group"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify an Institution License
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Footer */}
          <p className="flex items-center justify-center text-[11px] text-gray-300 mt-6">
            © {new Date().getFullYear()} Kaduna State Ministry of Education. All
            rights reserved. Powered by {""}
            <Image
              src="/paypro.png"
              alt="Paypro"
              width={36}
              height={36}
              className="ml-1"
            />
          </p>
        </div>
      </div>
    </div>
  );
}
