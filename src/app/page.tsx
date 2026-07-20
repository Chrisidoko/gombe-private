"use client";

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
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* ── TOP — bright section ──────────────────────────────────── */}
      <div className="w-full flex flex-col items-center justify-center text-center px-8 pt-14 pb-14 lg:pt-20 lg:pb-8 bg-white">
        {/* Logo */}
        <div className="mb-5">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto overflow-hidden">
            <Image
              src="/gombe_logo.png"
              alt="Gombe State Ministry of Education"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700 mb-1">
          Gombe State
        </p>
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-2">
          Ministry of Education
        </h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-1">
          Higher Education Portal | GESMS
        </p>

        {/* CTA */}
        <Link
          href="/login"
          className="group mt-8 lg:mt-4 inline-flex items-center gap-2 bg-[#28a745] hover:bg-[#166534] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          Login to Portal
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
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
      </div>

      {/* ── BOTTOM — green overlay with image backdrop ───────────── */}
      <div className="relative w-full flex-1 overflow-hidden px-8 py-12 lg:py-10">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a5c2e] via-[#166534] to-[#052e16]" />

        {/* Static image backdrop */}
        <img
          src="/slides/slide1.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
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

        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-3 text-center">
            Portal Access Roles
          </p>
          <Link href="/login">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.slice(0, 2).map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 bg-white border border-white/20 rounded-xl px-4 py-3 shadow-sm"
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
                    className="flex items-start gap-3 bg-white border border-white/20 rounded-xl px-4 py-3 shadow-sm"
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

          {/* Footer */}
          <p className="text-center flex items-center justify-center text-[11px] text-white/50 mt-6">
            © {new Date().getFullYear()} Gombe State Ministry of Education. All
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
